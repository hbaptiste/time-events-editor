import DomDataBinding from "./DomDataBinding";
import CustomElement from "./CustomElement";
import {
  parse as templateParser,
  setRenderedItems,
  getRenderedItems,
  renderSection,
} from "./TemplateHelpers";
import { indexOf, isBuffer, lowerFirst } from "lodash";
import { DomDiff, applyPatches, listToFragment } from "./DomDiff";

/* counter */
const getCounter = (function () {
  let prefix = "counter";
  let counter = 0;
  return function () {
    counter++;
    return `${prefix}_${counter}`;
  };
})();

/**
 * renderIf
 * */

DomDataBinding.registerDirective("event", {
  init: (ctx, { node, value, modifier }) => {
    const eventName = modifier.replace(":", "");
    const callback = ctx.target.events[value];
    if (typeof callback !== "function") {
      throw `@event:${eventName} -> callback must be a function!`;
    }
    node.addEventListener(eventName, callback.bind(ctx, ctx.target.data));
  },
});

DomDataBinding.registerDirective("click", {
  init: function (ctx, { node, value, dataContext }) {
    const { callback: callbackName, params } = value;
    const callback = ctx.target.events[callbackName];
    if (typeof callback !== "function") {
      throw `@click [${value}] -> callback must be a function!`;
    }
    const eventParams =
      params.indexOf("$event") == -1 ? ["$event", ...params] : params;

    node.addEventListener("click", (event) => {
      const ctxParams = eventParams.map((param) => {
        if (param === "$event") {
          return event;
        } else {
          return dataContext.lookup(param);
        }
      });
      callback.call(ctx.target, ...ctxParams);
    });
  },
});

DomDataBinding.registerDirective("showif", {
  init: function (ctx, { node, value }) {
    const keyValue = value.replace("!", "");
    const ifExpr = `(function() {
        const expr = value.replace("${keyValue}", ctx.target.data["${keyValue}"])
        return Boolean(eval(expr))
      })`;
    const funct = eval(ifExpr);
    /* use a generic parser to handle expression boolean | variable | expression */
    const getCallback = function (node, fieldKey, expFunc) {
      return function (key, value) {
        if (fieldKey !== key) {
          return false;
        }
        const displayValue = expFunc() === false ? "none" : "";

        node.style.display = displayValue;
      };
    };
    const callback = getCallback(node, keyValue, funct);

    ctx.signals.dataChanged.connect(callback);
  },
});

/* foreach */
DomDataBinding.registerDirective("foreach", {
  init: function (ctx, { node, value }) {
    const { localName, parentName } = value;
    const nodeType = node.tagName;

    let parentNode = node.parentNode;
    const templateKey = node.dataset.templateKey;

    const createListHandler = function (params) {
      return function () {
        const { ctx, values, sourceVariable, itemKey } = params;
        let dataList = [],
          target,
          savedList = [],
          previousSection;
        dataList = ctx.target.data[parentName] || values;
        if (!dataList) {
          return;
        }
        if (nodeType === "OPTION") {
          parentNode.innerHTML = "";
          node.innerHTML = "";
          dataList.map((value) => {
            const option = document.createElement(nodeType);
            option.innerHTML = value;
            parentNode.appendChild(option);
          });
        } else {
          const renderedData = getRenderedItems(templateKey);
          if (renderedData) {
            previousSection = renderedData.domSection;
            target = renderedData.placeHolder;
            console.log("-- rendered-data --");
            console.log(renderedData);
          }
          /** place holder */
          let placeHolder = target || node;
          const emptyPlaceHolder = document.createElement("template");

          let domSection = renderSection({
            ctx,
            data: values,
            node,
            localName,
            parentName,
          });

          const patches = DomDiff(previousSection, domSection);
          console.log("---radicalpatches---");
          console.log(patches);

          if (!patches) {
            return;
          }
          const [patch] = patches;
          if (patch && patch.type === "KEEP_NODE") {
            if (!patch.source.childNodes.length) {
              placeHolder.replaceWith(emptyPlaceHolder);
              savedList.push(emptyPlaceHolder);
              const fragment = listToFragment(savedList);
              setRenderedItems(templateKey, {
                placeHolder: emptyPlaceHolder,
                domSection: fragment,
              });
            } else {
              Array.from(patch.source.childNodes).forEach((_node) => {
                //_node.classList.add(templateKey);
                savedList.push(_node);
              });
              //if (placeHolder.parentNode) {
              // why it can be  null ?
              const parentnode = placeHolder.parentNode;
              placeHolder.parentNode.insertBefore(domSection, placeHolder); //fragment -> empty after insertion
              placeHolder.parentNode.removeChild(placeHolder);
              savedList = listToFragment(savedList);
              savedList.targetParentNode = parentnode;
              const data = {
                placeHolder,
                domSection: savedList,
              };
              setRenderedItems(templateKey, data);
              // }
            }
          } else {
            // Preseve the placeholder
            let listPlaceHolder;
            let list = document.querySelectorAll(
              `[data-template-key='${templateKey}']`
            );
            if (list.length > 0) {
              // we add placeholder in case the list use position
              const [head] = list;
              listPlaceHolder = document.createElement("template");
              head.parentNode.insertBefore(listPlaceHolder, head);
            }
            applyPatches(patches);

            // get the new dom state
            list = document.querySelectorAll(
              `[data-template-key='${templateKey}']`
            );
            if (list.length > 0) {
              listPlaceHolder.parentNode.removeChild(listPlaceHolder);
            }
            // if list is null
            const savedList = list.length ? listToFragment(list) : null;

            if (savedList) {
              savedList.targetParentNode = list[0].parentNode;
            }

            const data = {
              placeHolder: listPlaceHolder,
              domSection: savedList,
            };
            setRenderedItems(templateKey, data);
          }
        }
      };
    };

    /* handle list changes */
    ctx.signals.dataChanged.connect((key, value) => {
      if (key !== parentName) {
        return false;
      }
      createListHandler({
        ctx,
        sourceKey: key,
        itemKey: localName,
        values: value,
      })();
    });
    try {
      const func = () => {};
      ctx.queued(
        func /*createListHandler({context:ctx, sourceVariable, itemKey})*/
      );
    } catch (reason) {
      console.log("-- reason --");
      console.log(reason);
    }
  },
});

DomDataBinding.registerDirective("model", {
  init: function (ctx, params) {
    const key = params.value;
    const { node } = params;

    // deal with reverse binding
    const nodeType = node.tagName;
    if (nodeType === "SELECT") {
      ctx.signals.dataChanged.connect((dataKey, keyValue) => {
        if (dataKey !== key) return false;
        const computation = function () {
          const options = Array.from(node.options).map(
            (option) => option.value
          );
          const index = options.indexOf(keyValue);
          if (index !== -1) {
            node.selectedIndex = index;
          }
        };
        ctx.queued(computation);
      });
      node.addEventListener("change", (e) => {
        ctx.target.data[key] = e.target.value;
      });
    } else {
      node.addEventListener(
        "input",
        (function (key) {
          return function (e) {
            const isEditable = e.target.isContentEditable;
            const valueKey =
              isEditable & (e.target.tagName !== "TEXTAREA")
                ? "innerHTML"
                : "value";
            ctx.target.data[key] = e.target[valueKey];
          };
        })(key)
      );
    } //handle radio
  },
});
/* directive show produce a change promise */
/**
 * target -> node
 * computation -> [exp]
 * */
DomDataBinding.registerDirective("value", {
  init: function (ctx, { node, value }) {
    const nodeKey = value;
    ctx.signals.dataChanged.connect((key, value, oldValue) => {
      if (nodeKey === key) {
        node.innerHTML = value; //use template to replace more than one variable
      }
    });
  },
});

/* test a special kind of directive */
DomDataBinding.registerDirective("template:value", {
  init: function (ctx, { node, value }) {
    const target = value; //value can be an expression
    ctx.signals.dataChanged.connect((key, value) => {
      if (target === `{${key}}`) {
        ///handle key with dot
        node.textContent = value;
      }
    });
  },
});

// is directive is a step toward custom elements
DomDataBinding.registerDirective("is", {
  init: function (ctx, { node, value: component }) {
    CustomElement.createFromDirective(component, { ctx, node });
  },
});

export {};
