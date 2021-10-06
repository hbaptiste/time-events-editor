import DomDataBinding from "./DomDataBinding";
import CustomElement from "./CustomElement";
import Context from "./Context";
import { parse as templateParser, setRenderedItems, getRenderedItems, renderSection } from "./TemplateHelpers";
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

/* set value */
const setValue = (target, path, defaultValue) => {
  notify(); // root
};

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

    const eventParams = params.indexOf("@event") == -1 ? ["@event", ...params] : params;


    node.addEventListener("click", (event) => {
      const ctxParams = eventParams.map((param) => {
        if (param === "@event") {
          return event;
        } else {
          let data = ctx.target.getValue(param)
          if (data === null && dataContext) {
            data = dataContext.lookup(param);
          }
          return data;
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
          // getList
          const getRederedList = () => {
            return document.querySelectorAll(`[data-template-key='${templateKey}']`);
          };

          if (renderedData) {
            previousSection = renderedData.domSection;
            target = renderedData.placeHolder;
          }
          /** place holder */
          let placeHolder = target && target.parentNode ? target : node;
          const emptyPlaceHolder = document.createElement("template");

          let domSection = renderSection({
            ctx,
            data: dataList, // values
            node,
            localName,
            parentName,
          });
          const patches = DomDiff(previousSection, domSection);
          if (!patches) {
            return;
          }
          const [patch] = patches;
          if (patch && patch.type === "KEEP_NODE") {
            if (!patch.source.childNodes.length) {
              placeHolder.replaceWith(emptyPlaceHolder);
              setRenderedItems(templateKey, {
                placeHolder: emptyPlaceHolder,
                domSection: null,
              });
            } else {
              Array.from(patch.source.childNodes).forEach((_node) => {
                savedList.push(_node);
              });

              // why it can be null ?
              const parentnode = placeHolder.parentNode;
              placeHolder.parentNode.insertBefore(domSection, placeHolder); // fragment -> empty after insertion
              placeHolder.parentNode.removeChild(placeHolder);
              savedList = listToFragment(savedList);
              savedList.targetParentNode = parentnode;
              const data = {
                placeHolder,
                domSection: savedList,
              };
              setRenderedItems(templateKey, data);
            }
          } else {
            // Preseve the placeholder
            let listPlaceHolder;
            let previousList = getRederedList();
            if (previousList.length > 0) {
              // we add placeholder in case the list
              const [head] = previousList;
              listPlaceHolder = document.createElement("template");
              head.parentNode.insertBefore(listPlaceHolder, head);
            }
            applyPatches(patches);

            // get the new dom state
            const listAfter = getRederedList();
            if (listAfter.length > 0) {
              listPlaceHolder.parentNode.removeChild(listPlaceHolder); // not needed
            }
            // if list is null
            const savedList = listAfter.length ? listToFragment(listAfter) : null;

            if (savedList) {
              savedList.targetParentNode = listAfter[0].parentNode;
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

   
    // |--> handle value changed 
    ctx.signals.valueChanged.connect(({ key, value }) => {
      if (key !== parentName) { return false; }
      createListHandler({
        ctx,
        sourceKey: key,
        itemKey: localName,
        values: value,
      })();
    });

    try {
      const func = () => { return };
      ctx.queued(func);
    } catch (reason) {
      console.log("-- render reason --");
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
    switch (nodeType) {
      case "TEXTAREA":
        ctx.signals.dataChanged.connect((dataKey, keyValue) => {
          node.value = keyValue;
        });
        // handle changed
        node.addEventListener("keyup", (event) => {
          ctx.target.setValue(key, event.target.value);
        });
        break;
      case "SELECT":
        break;
      case "INPUT":
      default:
        const handleValue = (dataKey, dataValue) => {
          const [root] = key.split(".");
          if (dataKey !== root) {
            return false;
          }
          if (node.textContent === ctx.target.getValue(key)) {
            return;
          }
          console.log(`data-value ${dataValue}!`);
          node.textContent = ctx.target.getValue(key);
        };

        node.addEventListener("keyup", (event) => {
          ctx.target.setValue(key, event.target.textContent);
        });

        ctx.signals.dataChanged.connect(handleValue);
        ctx.signals.propsChanged.connect(handleValue);
    }
    /*if (nodeType === "SELECT") {
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
    } */
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

/* test geValue */
const getValue = (source, path) => {
  const value = path.reduce((acc, pathItem) => {
    const value = source[pathItem];
    return value;
  }, source);

  return value;
};

/* test a special kind of directive */
DomDataBinding.registerDirective("template:value", {
  init: function (ctx, { node, value }) {
    const valueHandler = (key, val) => {
      const path = value.replace("{", "").replace("}", "").split(".");
      const [root, ...rest] = path;
      if (key === root) {
        // Handle key with dots --> should read from context 
        const nodeVal = val && rest.length !== 0 ? getValue(val, rest) : val;
        node.textContent = nodeVal;
      }
    };
    // connect signals
    ctx.signals.dataChanged.connect(valueHandler);
    ctx.signals.propsChanged.connect(valueHandler);
  },
});

// is directive is a step toward custom elements
DomDataBinding.registerDirective("is", {
  init: function (ctx, { node, value: component }) {
    // CustomElement.createFromDirective(component, { ctx, node });
  },
});

// Props directive
DomDataBinding.registerDirective("props:watcher", {
  init: function (ctx, { node, value, component, dataContext }) {
    ctx.signals.dataChanged.connect((key, val) => {
      if (!component) {
        return null;
      }
      if (key === value.sourceProp) {
        component[value.targetProp] = val;
      }
    });
    ctx.signals.propsChanged.connect((key, val) => {
      if (key === value.sourceProp) {
        component[value.sourceProp] = val;
      }
    });
    // init data context
    if (dataContext) {
      const val = dataContext.lookup(value.sourceProp);
      setTimeout(() => {
        component[value.targetProp] = val; // we notify the change here
      }, 5000);
     
    }
  },
});

DomDataBinding.registerDirective("style", {
  
  init: function(ctx, { node, value, component, dataContext }) {
    const {type, name, params } = value;
      // when props changes -> call functions
      ctx.signals.valueChanged.connect(({ key, value }) => {
        if (key.indexOf(params) !== -1) {
          if (type !== 'callback') { return }
            const func = component[name];
            const _params = params.map((prop) => {
              return component.getValue(prop);
            });
            const styleObject = func.call(component, ..._params);
            if (styleObject) {
              Object.entries(styleObject).forEach(([k,v]) => {
                node.style[k]= v;
              });
            }
            console.log(styleObject);
        }
      });
  }

});

export {};
