import DomDataBinding from "./DomDataBinding";
import CustomElement from "./CustomElement"
import { parse as templateParser} from "./TemplateHelper"

DomDataBinding.registerDirective("event", {
  init: (ctx, { node, value, modifier }) => {
    const eventName = modifier.replace(":", "");
    const callback = ctx.target.events[value];
    if (typeof callback !== "function") {
      throw `@event:${eventName} -> callback must be a function!`;
    }
    node.addEventListener(eventName, callback.bind(this, ctx.target.data));
  }
});

DomDataBinding.registerDirective("click", {
  init: function(ctx, { node, value }) {
    const callback = ctx.target.events[value];
    if (typeof callback !== "function") {
      throw "@click -> callback must be a function!";
    }
    node.addEventListener("click", callback.bind(this, ctx.target.data));
  }
});

DomDataBinding.registerDirective("showif", {
  init: function(ctx, { node, value }) {
    const keyValue = value.replace("!", "");
    const ifExpr = `(function() {
        const expr = value.replace("${keyValue}", ctx.target.data["${keyValue}"])
        return Boolean(eval(expr))
      })`;
    const funct = eval(ifExpr);
    /* use a generic parser to handle expression boolean | variable | expression */
    const getCallback = function(node, fieldKey, expFunc) {
      return function(key, value) {
        if (fieldKey !== key) {
          return false;
        }
        const displayValue = expFunc() === false ? "none" : "";
        node.style.display = displayValue;
      };
    };
    const callback = getCallback(node, keyValue, funct);
    ctx.signals.dataChanged.connect(callback);
  }
});

/* foreach */
DomDataBinding.registerDirective("foreach", {
  
  init: function(ctx, { node, value  }) {
    
    const itemReg = /(\w+)\sin\s(\w+)/gi;
    const rst = itemReg.exec(value);
    
    const [_, itemKey, sourceVariable] = rst;
    const parentNode = node.parentNode;
    
    /** handle list -> handle template node */
    const listHandler = function() {
      const itemList = ctx.target.data[sourceVariable];
      const fragment = document.createDocumentFragment()
      const clonedNode = node.cloneNode(true)
      const { render } = templateParser(clonedNode)
      itemList.map(item => { 
        const node = render({ [itemKey]: item, clone: true, ctx})
        fragment.appendChild(node)
      })
      node.replaceWith(fragment)
      //ctx.addParts(fragment)
     } 

    ctx.signals.dataChanged.connect((key, value, oldValue) => {
      if (key !== sourceVariable) {
        return false;
      }
      const itemList = ctx.target.data[sourceVariable];
      /* render computation --> promesse de changement */
      const [ modelDir ] = ctx.getDirectives(parentNode, ["model"]) 
      const computation = (function() {
        return (params) => {

        }
      }, ctx)

      /* do later */
      ctx.queued(computation)
    });
  }
});

DomDataBinding.registerDirective("model", {
  init: function(ctx, params) {
    const key = params.value;
    const { node } = params;

    // deal with reverse binding
    const nodeType = node.tagName;
    if (nodeType === "SELECT") {

      ctx.signals.dataChanged.connect((dataKey, keyValue) => {
        if (dataKey !== key) return false
        const computation = function() {
          const options = Array.from(node.options).map(option => option.value)
          const index = options.indexOf(keyValue)
          if (index !=-1) {
            node.selectedIndex = index
          }
        }
        ctx.queued(computation)
      })
      node.addEventListener("change", e => {
        ctx.target.data[key] = e.target.value;
      });
    } else {
      node.addEventListener(
        "input",
        (function(key) {
          return function(e) {
            const isEditable = e.target.isContentEditable           
            const valueKey = (isEditable & e.target.tagName !== "TEXTAREA") ? "innerHTML" : "value"
            ctx.target.data[key] = e.target[valueKey]
          };
        })(key)
      );
    }//handle radio
  }
});
/* directive show produce a change promise */
/**
 * target -> node
 * computation -> [exp] 
 * */
DomDataBinding.registerDirective("value", {
  init: function(ctx, { node, value }) {
    const nodeKey = value;
    ctx.signals.dataChanged.connect((key, value, oldValue) => {
      if (nodeKey === key) {
        node.innerHTML = value; //use template to replace more than one variable
      }
    });
  }
});

/* test a special kind of directive */
DomDataBinding.registerDirective('template:value', {
  init: function(ctx, {node, value}) {
    const target = value //value can be an expression
    ctx.signals.dataChanged.connect((key,value) => {
      if (target ===`{${key}}`) {///handle key with dot
        node.textContent = value
      }
    })
  }
})


// is directive is a step toward custom elements
DomDataBinding.registerDirective("is", {
  init: function(ctx, {node, value:component}) {
    CustomElement.createFromDirective( component, { ctx, node })
  }
})

export {};
