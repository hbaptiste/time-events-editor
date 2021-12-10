import Signal from "./Signal";
import CustomElement from "./CustomElement";
import { createWalker, parseDirectives as _getDirectives, setNodeTemplate, parseComponentProps } from "./TemplateHelpers";
import { registerDirective } from "./DirectiveRegistry";
// Use the morphdom
// https://github.com/patrick-steele-idem/morphdom/tree/fe35db9adda1f22fe5856e8e0f78048f8f4b0f18/examples/lifecycle-events
const FOREACH_DIRECTIVE = "foreach";

class UITaskQueue {
  constructor() {
    this.queue = [];
    this.statusList = { TO_DO: 0, DONE: 1, RUNNING: 2, STOP: 3 };
    this.queueStatus = this.statusList.STOP;
  }

  add(uiTask, forceCommit = false) {
    this.queue.push({ task: uiTask, status: this.statusList.TO_DO });
    if (forceCommit) {
      if (this.queueStatus !== this.statusList.RUNNING) {
        this.commit();
      }
    }
  }

  commit() {
    /* notion de transaction */
    /* do nothing from now */
    this.queueStatus = this.statusList.RUNNING;
    while (this.queue.length) {
      const { task, status } = this.queue.pop();
      if (status === this.statusList.DONE || typeof task !== "function") {
        continue;
      }
      try {
        task();
      } catch (reason) {
        console.log(reason);
      } //for now perform
    }
    this.queueStatus = this.statusList.STOP;
  }

  start() {
    setTimeout(() => {
      this.commit();
    }, 0);
  }

  reset() {
    this.queue = [];
  }
}

export default class DomDataBinding {
  static directivesList = [];

  static applyMixin = function (params) {
    return DomDataBinding.create(params);
  };

  static create = function (params) {
    return new DomDataBinding(params).init();
  };

  constructor(params) {
    this.uiTaskQueue = new UITaskQueue();
    this.signals = {
      dataChanged: Signal.create("data.watcher"),
      propsChanged: Signal.create("props.watcher"),
      valueChanged: Signal.create("dataOrProps.watcher")
    };
    this.namespace = "km" || params.namespace;
    if (params && typeof params === "object") {
      const { target, skipRoot } = params;
      this.target = target || params;
      this.skipRoot = skipRoot || false;
    }
  }

  init() {
    this._parseAll();
    this._watchProps();
    this._watchData();
    this._watchChildren(); // notify
    this.uiTaskQueue.start();
    return this; // Expose proper api
  }

  //# useless
  addParts(parts, dataContext) {
    if (!parts) {
      return;
    }
    const rootWrapper = document.createElement("div");
    parts.map((item) => rootWrapper.appendChild(item));
    //this._parseAll(rootWrapper)
  }

  /* must return -> html */
  renderBlock(node, dataContext) {
    // use datacontext
    // handle,attribute,style
    const { directives } = node;
    const target = document.createElement(node.name);
    
    const component = CustomElement.createFromNode({
      componentName: node.name,
      props: [], // fix should work without props
      target,
    });

    this.target.children.push(component);
    directives.map((directive) => {
      // --> register child
      directive.component = component;
      directive.dataContext = dataContext; // useful to retrieve data
      this.applyDirective({ctx: this, directiveConfig: directive});
    });
     /* populate props from context */
    /* const { properties } = component;
     directives.filter( dir => dir.name == "props:watcher" ).forEach((dir) => {
       const { targetProp=null, sourceProp=null } = dir.value;
       if (properties.indexOf(targetProp) !== -1) {
         component[targetProp] = dataContext.lookup(sourceProp); // debug set value
       }
     });*/
     
    // apply directives
    return component.root;
  }

  _parseAll(root = null) {
    const { walker, skip } = createWalker({
      root: root || this.target.root,
      filter: NodeFilter.SHOW_ELEMENT,
    });

    walker((node) => {
      const fEachDirective = this._hasForeach(node, ["foreach"]);
      const hasForeach = fEachDirective.length
      if (hasForeach) {
        // handle component and stuff ?
        const directive  = fEachDirective.pop();
        directive.component = this.target;
        this._handleForEachDirective({ node, directive });
        skip();
      } else {
        const { type } = this._handleParts(node);
        if (type === 1) {
          skip();
        }
      }
    });
  }

  _hasForeach(node) {
    return this.getDirectives(node, ["foreach"]);
  }


  /* directives and components */
  _handleParts(node) {
    let type = 0;
    if (CustomElement.hasAcustomDefinition(node.tagName)) {
      const initComponentTask = () => {
        const childComponent = this.initComponent(node.tagName, node);
        this.target.children.push(childComponent);
        this.updateDirective(node, { component: childComponent });
      };
      this.uiTaskQueue.add(initComponentTask);
      type = 1;
    } else {
      this.updateDirective(node, { component: this.target });
    }
    return { type };
  }

  _watchData() {
    
    if (!this.target.data || typeof this.target.data != "object") {
      return;
    }
    const data = this.target.data;
    this.__observedData = {};
    const initialData = Object.assign({}, data);
    Object.keys(data).map((key) => {
      Object.defineProperty(data, key, {
        get: () => {
          return this.__observedData[key];
        },
        set: (value) => {
          // disable set force sendind message
          const prevValue = data[key];
          this.__observedData[key] = value;
          this.signals.dataChanged.emit(key, value, prevValue);
          this.signals.valueChanged.emit({type: "data", key, value, prevValue});
        },
      });
    });
    /* handle initial data */
    Object.keys(initialData).map((key) => {
      data[key] = initialData[key];
    });
  }
  _watchProps() {
    if (!this.target.props || typeof this.target.props !== "object") {
      return;
    }
    
    const props = this.target.props;
    const propsToWatch = this.target.properties;

    this.__observedProps = {};
    // garder map -> des observations
    const initialProps = Object.assign({}, props);

    propsToWatch.map((key) => {
      Reflect.defineProperty(this.target, key, {
        get: () => {
          if (initialProps.hasOwnProperty(key)) {
            return this.__observedProps[key]; //strange
          }
        },
        set: (value) => {
          if (initialProps.hasOwnProperty(key)) {
            const prevValue = this.__observedProps[key] || null ;
            this.__observedProps[key] = value;
            this.signals.propsChanged.emit(key, value, prevValue);
            this.signals.valueChanged.emit({type: "props", key, value, prevValue});
          }
        },
      });
    });
    /* data & props -> add to this */

    /*<-- init props props -->*/
    Object.keys(initialProps).map((key) => {
      this.target[key] = initialProps[key];
    });
  }

  _watchChildren() {
    const changedCallback = () => {};
    this.signals.propsChanged.connect();
  }
  /* N'est executé qu'une fois */
  /* comment prendre en compte des sous-documents -> sous domaine */

  _handleTemplateExpressions(node) {
    const textNodes = Array.from(node.childNodes)
      .filter((node) => node.nodeType === 3)
      .filter((textNode) => {
        return textNode.textContent.trim().length !== 0;
      });
    if (!textNodes.length) {
      return [];
    }
    const directives = [];

    textNodes.forEach((textSource) => {
      const textContent = textSource.textContent.trim();
      const execPattern = new RegExp("{.*?}", "g");
      let result;
      const strings = [];
      let nextStart = 0;
      while ((result = execPattern.exec(textContent)) !== null) {
        const [match] = result;
        const prevString = textContent.substring(nextStart, result.index);
        nextStart = result.index + match.length;
        strings.push(prevString);
        strings.push(match);
      }
      if (nextStart < textContent.length) {
        strings.push(textContent.substring(nextStart));
      }
      if (strings.length != 0) {
        const parentNode = node;
        strings.map((item) => {
          const content = item.startsWith("{") ? "" : item;
          const textNode = document.createTextNode(content);
          parentNode.insertBefore(textNode, textSource);
          if (item.startsWith("{")) {
            directives.push({
              name: "template:value",
              value: item,
              node: textNode,
            });
          }
        });
        parentNode.removeChild(textSource);
      }
    });
    return directives;
  }

  flush() {
    this.uiTaskQueue.commit();
  }

  initComponent(componentName, target) {
    /* Créer le composant, l'initialiser, le rendre */
    const attr = Array.from(target.attributes);
    const props = attr.map(this._parseAttrProps.bind(this)).filter((prop) => {
      return prop.name.startsWith("$");
    });

    // clean-props
    const cleanProps = props.map((prop) => {
      const cloneProp = { ...prop };
      cloneProp.name = cloneProp.name.replace("$", "");
      return cloneProp;
    });
    const component = CustomElement.createFromNode({
      componentName,
      target,
      props: cleanProps,
    });

    return component;
  }

  queued(computation) {
    this.uiTaskQueue.add(computation);
  }

  static registerDirective(name, api) {
    DomDataBinding.directivesList[name] = api;
    registerDirective(name, api);
  }

  applyDirective({ ctx, directiveConfig }) {
    const { name } = directiveConfig;
    const directive = DomDataBinding.directivesList[name] || null;
    if (!directive || typeof directive.init != "function") {
      throw `Directive [${name}] not Found!`;
    }
    try {
      directive.init(ctx, directiveConfig); 
    } catch (reason) {
      console.log(`Exception while applying ${name} directive !`);
      console.log(reason);
    }
  }

  getDirectives(node, keys = []) {
    return _getDirectives(node, keys).filter((directive) => {
      if (keys.length === 0) {
        return true;
      }
      return keys.includes(directive.name);
    });
  }

  updateModel(node) {
    const [directive] = this.getDirectives(node, ["model"]);
    const { value } = directive;

    if (!value) {
      return;
    }
    const oldValue = this.data[value];
    this.data[value] = null;
    setTimeout(() => {
      this.data[value] = oldValue;
    }, 0);
  }

  updateDirective(node, params = {}) {
    let { handleParent, drop, parentNode } = params;
    let allDirectives = [];
    let parentDirectives = [];
    let mainDirectives = [];
    drop = Array.isArray(drop) ? drop : [];

    // deal with node directive
    mainDirectives = this.getDirectives(node); // handle dropped directive
    
    if (handleParent && parentNode) {
      parentDirectives = this.getDirectives(parentNode);
    }

    let templateDirectives = this._handleTemplateExpressions(node);

    allDirectives = [...templateDirectives, ...mainDirectives, ...parentDirectives];
    if (allDirectives.length === 0) { return }
    allDirectives.map((directive) => {
      try {
        if (directive.name === FOREACH_DIRECTIVE) {
          setNodeTemplate(node);
        }
        directive.component = params.component;
        this.applyDirective({ ctx: this, directiveConfig: directive });
      } catch (reason) {
        console.log(`directive name [${directive.name}] --> ${reason} !`);
      }
    });
  }

  _handleForEachDirective({node, directive}) {
    if (directive.name !== FOREACH_DIRECTIVE) { return }
    setNodeTemplate(node);
    this.applyDirective({ctx: this, directiveConfig: directive});
  }

  _parseAttrProps(attr) {
    const { name, nodeValue } = attr;
    const props = {
      name: name,
      value: nodeValue,
    };
    /* we should deal with callbacks */
    /* child can know what to uses */
    if (name.startsWith("$")) {
      // const cleanedName = name.replace("$", "");
      const value = this.target.data[nodeValue] || this.target[nodeValue];
      props.value = value || this.target.events[nodeValue]; //handle type
    }
    return props;
  }
}
