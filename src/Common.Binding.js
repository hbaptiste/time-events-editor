import DomDataBinding from "./DomDataBinding";
import CustomElement from "./CustomElement";
import Context from "./Context";
import { setRenderedItems, getRenderedItems, renderSection } from "./TemplateHelpers";
import { DomDiff, applyPatches, listToFragment } from "./DomDiff";
import html from "html";

/* counter */
const getCounter = (function () {
  let prefix = "counter";
  let counter = 0;
  return function () {
    counter++;
    return `${prefix}_${counter}`;
  };
})();

DomDataBinding.registerDirective("event", {
  init: (ctx, { node, value, modifier }) => {
    const eventName = modifier.replace(":", "");
    const callback = ctx.target.events[value];
    if (typeof callback !== "function") {
      throw `@event:${eventName} -> callback must be a function!`;
    }
    node.addEventListener(eventName, callback.bind(ctx.target));
  },
});

DomDataBinding.registerDirective("ref", {
  init: (ctx, { node, value }) => {
    /*ctx.queued(() => {
      
    });*/
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
          let data = ctx.target.getValue(param);
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
        const { ctx, values, preserveTag } = params;
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
          /* const renderedData = getRenderedItems(templateKey);
          // getList
          const getRederedList = () => {
            return document.querySelectorAll(`[data-template-key='${templateKey}']`);
          };
          if (renderedData) {
            previousSection = renderedData.domSection;
            target = renderedData.placeHolder; // où placer le nouveau noeud
          }
        
          let placeHolder = target && target.parentNode ? target : node;
          const emptyPlaceHolder = document.createElement("template");

          let domSection = renderSection({
            ctx,
            data: dataList, // values
            node,
            localName,
            parentName,
            preserveTag,
          });
          const patches = DomDiff(previousSection, domSection);
          if (!patches) {
            return;
          }
          const [patch] = patches;
          if (patch && patch.type === "KEEP_NODE") {
            if (!patch.target.childNodes.length) {
              placeHolder.replaceWith(emptyPlaceHolder);
              setRenderedItems(templateKey, {
                placeHolder: emptyPlaceHolder,
                domSection: null,
              });
            } else {
              Array.from(patch.target.childNodes).forEach((_node) => {
                savedList.push(_node);
              });
              // why it can be null ?
              const parentnode = placeHolder.parentNode;
              parentnode.insertBefore(domSection, placeHolder); // fragment -> empty after insertion
              parentnode.removeChild(placeHolder);
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
              // we add placeholder in the list
              const [head] = previousList;
              listPlaceHolder = document.createElement("template");
              head.parentNode.insertBefore(listPlaceHolder, head);
            }
            applyPatches(patches);
            //console.log("-- apply patches --");
            console.log("[PATCH]", patches);
            //console.log("-----------");

            // get the new dom state
            const listAfter = getRederedList();
            if (listAfter.length > 0) {
              listPlaceHolder.parentNode.removeChild(listPlaceHolder); // not needed
            }
            // if list is null
            const savedList = listAfter.length ? listToFragment(listAfter) : [];

            if (Array.isArray(savedList) > 0) {
              savedList.targetParentNode = listAfter[0].parentNode;
            }
            const data = {
              placeHolder: listPlaceHolder,
              domSection: savedList,
            };

            setRenderedItems(templateKey, data);
          }*/
        }
      };
    };

    // |--> handle value changed
    ctx.signals.valueChanged.connect(({ key, value }) => {
      if (key !== parentName) {
        return false;
      }

      createListHandler({
        ctx,
        sourceKey: key,
        itemKey: localName,
        values: value,
        preserveTag: false,
      })();
    });

    try {
      const func = () => {
        return;
      };
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
        ctx.signals.valueChanged.connect(({ key: _key, value: keyValue }) => {
          if (_key === key) {
            node.value = keyValue;
          }
        });
        // handle changed
        node.addEventListener("keyup", (event) => {
          ctx.target.setValue(key, event.target.value);
        });
        break;
      case "SELECT":
        ctx.signals.valueChanged.connect(({ key, value: dataValue }) => {
          if (key !== params.value || dataValue === null) {
            return;
          }

          const options = Array.from(node.options).map((option) => option.value);
          const selectedIndex = options.indexOf(dataValue.trim());
          if (selectedIndex !== -1) {
            node.selectedIndex = selectedIndex;
            node.dispatchEvent(new Event("change", { bubbles: true }));
          }
          // handle change, prevent loop
          node.addEventListener("change", (e) => {
            const prevValue = ctx.target.getValue(key);
            console.log(`[${e.target.value.trim()} - ${prevValue}]`);
            if (e.target.value.trim() !== prevValue.trim()) {
              ctx.target.setValue(key, e.target.value);
            }
          });
        });
        // handle change

        break;
      case "INPUT":
        node.addEventListener(
          "input",
          (function (key) {
            return function (event) {
              ctx.target.setValue(key, event.target["value"]); //
            };
          })(key)
        );
        break;
      default:
        const handleValue = ({ key, value: dataValue }) => {
          if (node.textContent === ctx.target.getValue(key)) {
            return;
          }
          node.textContent = ctx.target.getValue(key);
        };

        node.addEventListener("keyup", (event) => {
          ctx.target.setValue(key, event.target.textContent);
        });

        ctx.signals.valueChanged.connect(handleValue);
    }
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
  init: function (ctx, { node, value: txtTpl }) {
    const valueHandler = (key, value) => {
      const path = txtTpl.replace("{", "").replace("}", "").split(".");
      const [root] = path;
      if (key === root) {
        node.textContent = ctx.target.getValue(path.join("."));
      }
    };
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
  init: function (ctx, { value, component, dataContext }) {
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
      component[value.targetProp] = val; // we notify the change here
    }
  },
});

DomDataBinding.registerDirective("style", {
  /**
   * handle data in context
   * handle regexp
   * handle css as props/data
   */
  init: function (ctx, { node, value, component }) {
    const { type, name, params } = value;
    // when props change -> call functions

    const getStyleHandler = function (directiveValue, node) {
      return function (key, val) {
        let styleObject = {};
        if (directiveValue.type !== "callback") {
          styleObject = val || {};
        } else if (key.indexOf(params) != -1) {
          const func = component[name];
          const _params = params.map((prop) => {
            return component.getValue(prop);
          });
          styleObject = func.call(component, ..._params);
        }
        if (styleObject) {
          Object.entries(styleObject).forEach(([k, v]) => {
            node.style[k] = v;
          });
        }
      };
    };

    const styleHandler = getStyleHandler(value, node);
    ctx.signals.valueChanged.connect(({ key, value: val }) => {
      styleHandler(key, val);
    });
  },
});

DomDataBinding.registerDirective("value", {
  init: function (ctx, { node, value: directiveName }) {
    console.log(" -- radical / mémoire --");
    console.log(ctx, directiveName, node);

    // events
    ctx.signals.valueChanged.connect(({ key, value: val }) => {
      if (key !== directiveName) {
        return;
      }
      // set value
      alert("-- radical blaze --");
      console.log(key, val);
    });
  },
});

export {};
