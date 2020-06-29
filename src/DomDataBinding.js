import Signal from "./Signal";
import CustomElement from "./CustomElement"
import {createWalker} from "./TemplateHelpers"

// https://github.com/patrick-steele-idem/morphdom/tree/fe35db9adda1f22fe5856e8e0f78048f8f4b0f18/examples/lifecycle-events

class UITaskQueue {
  constructor() {
    this.queue = []
    this.status = {TO_DO:0, DONE: 1}
  }
  add(uiTask) {
    this.queue.push({task: uiTask, status: this.status.TO_DO})
  }
  commit() {
    if (!this.queue.length) { return }
    /* notion de transaction */
    /* do nothing from now */
    while (this.queue.length) {
      const { task, status } = this.queue.pop()
      if (status === this.status.DONE || typeof task !== "function") { continue }
      try { task() } catch (reason) { console.log(reason) } //for now perform
    }
  }
  start() {
    setInterval(() => {
      this.commit()
    }, 100)
  }

  reset() {
    this.queue = []
  }
}

export default class DomDataBinding {
  static directivesList = [];

  static applyMixin = function(params) {
    
    return DomDataBinding.create(params)
  }

  static create = function(params) {
    return new DomDataBinding(params).init()
  }
  
  constructor(params) {
    this.uiTaskQueue = new UITaskQueue()
    this.signals = {
      dataChanged: Signal.create("data.watcher"),
      propsChanged: Signal.create("props.watcher")
    };
    this.context = "km";
    if (params && typeof params === "object") {
      const { target, skipRoot } = params
      this.target = target || params
      this.skipRoot = skipRoot || false
    }
  }

  init() {
    this._parseAll();
    this._watchProps()
    this._watchData();
    this.uiTaskQueue.start()
  }

  addParts(root) {
    console.log("-- radical --")
    console.log(root)
  }

  _parseAll() {
    console.log("inside _parseAll_")

    const { walker, skip } = createWalker({ 
      root: this.target.root, 
      filter: NodeFilter.SHOW_ELEMENT 
    })
   
    walker((node) => {
        const { type } = this._handleParts(node)
        if (type === 1) { skip() }
    })
  }
  /* directives and components */
  _handleParts(node) {
    let type = 0
    if (CustomElement.hasAcustomDefinition(node.tagName)) {
      this.initComponent(node.tagName, node)
      type = 1
    } else {
      this.updateDirective(node)
    }
    return { type }
  }

  _watchData() {
    if (!this.target.data || typeof this.target.data === 'Object') { return }
    const data = this.target.data
    this.__observedData = {};
    const initialData = Object.assign({}, data);
    Object.keys(data).map(key => {
      Object.defineProperty(data, key, {
        get: () => {
          return this.__observedData[key];
        },
        set: value => { // disable set force sendind message
          const prevValue = data[key];
          this.__observedData[key] = value;
          this.signals.dataChanged.emit(key, value, prevValue); 
          /* onDataChanged -> refreshUI() -> handleDirectives() */
        }
      });
    });
    /* handle initial data */
      Object.keys(initialData).map(key => {
        data[key] = initialData[key];
      });
  }
  _watchProps() {
    
    if (!this.target.props || typeof this.target.props !== 'object') { return }
    const props = this.target.props
    this.__observedProps = {}
    const initialProps = Object.assign({}, props)
    Object.keys(props).map(key => {
      Reflect.defineProperty(this.target, key, {
        get: (value) => {
          if (initialProps.hasOwnProperty(key)) {
            return this.__observedProps[key]
          }
        },
        set: (value) => {
          if (initialProps.hasOwnProperty(key)) {
            const prevValue = this.__observedProps[key];
            this.__observedProps[key] = value;
            /* no need */
            //this.signals.propsChanged.emit(key, value, prevValue);
            this.signals.dataChanged.emit(key, value, prevValue);
          }
        }
      })
    })
    /* data & props -> add to this */

    /*<-- init props -->*/
    Object.keys(initialProps).map(key => {
      this.target[key] = initialProps[key];
    });
  }

  /* N'est executé qu'une fois */
  /* comment prendre en compte des sous-documents -> sous domaine*/ 
  
  _handleTemplateExpressions(node) {
    const textNodes = Array.from(node.childNodes).filter((node) => node.nodeType === 3)
    if (!textNodes.length) { return [] }
    const directives = []

    textNodes.forEach((textSource) => {
      const textContent = textSource.textContent.trim()
      const execPattern = new RegExp('{.*?}','g')
      let result
      const strings = []
      let nextStart = 0
      while ((result = execPattern.exec(textContent)) !== null) {
        const [match] = result
        const prevString = textContent.substring(nextStart, result.index)
        nextStart = result.index + match.length
        strings.push(prevString)
        strings.push(match)
      }
      if (nextStart < textContent.length) {
        strings.push(textContent.substring(nextStart))
     }
     if(strings.length != 0) {
      const parentNode = node
      strings.map((item) => {
        const content = item.startsWith("{") ? "" : item 
        const textNode = document.createTextNode(content)
        parentNode.insertBefore(textNode, textSource)
       if (item.startsWith("{")) {
        directives.push({
           name: "template:value",
           value: item,
           node: textNode
         }) 
       }
     })
    parentNode.removeChild(textSource)
    }
   
      
    })
    return directives
  }

  initComponent(componentName, target) {
    /* 1. watch props */
    /* créer le composant, l'initialiser, le rendre */
    const attr = Array.from(target.attributes)
    const props = attr.map(this._parseAttrProps.bind(this))
    const component = CustomElement.createFromNode({componentName, target, props})
    /* handle directive */
  }
  queued(computation) {
    this.uiTaskQueue.add(computation)
  }

  static registerDirective(name, api) {
    DomDataBinding.directivesList[name] = api;
  }

  applyDirective({ ctx, directiveConfig}) {
    const { name } = directiveConfig;
    const directive = DomDataBinding.directivesList[name] || null;
    if (!directive || typeof directive.init != "function") {
      throw "Directive not Found!";
    }
    
    directive.init(ctx, directiveConfig);
  }

  getDirectives(node, keys = []) {
    let directives = []
    const isUndefined = (dir) => dir !== undefined
    const dparser = this._parseAttrDirective.bind(this)
    directives = Array.from(node.attributes)
      .map(att => dparser(att))
      .filter(isUndefined)
      .filter(dir => keys.indexOf(dir.name) !== -1)
    return directives
  }

  updateModel(node) {
   
    const [ directive ] = this.getDirectives(node, ["model"])
    const { value } = directive
    
    if (!value) { return }
    const oldValue = this.data[value]
    this.data[value] = null
    setTimeout(() => {
      this.data[value] = oldValue
      console.log(`inside time-out ${value}-->value`)
    }, 0)
  }

  updateDirective(node, params = {}) {
    let { handleParent, drop, parentNode } = params
    let allDirectives = []
    let parentDirectives = []
    let mainDirectives = []
    drop = Array.isArray(drop) ? drop : []
    const attributes = node.attributes
    /* experiments */
    const templateDirectives = this._handleTemplateExpressions(node)
    
    /* deal with node directive */
    const isUndefined = (dir) => dir !== undefined
    const dparser = this._parseAttrDirective.bind(this)
    mainDirectives = Array.from(attributes)
          .map(attr => dparser(attr))
          .filter(isUndefined)
          .filter(dir => drop.indexOf(dir.name) == -1)

    if (handleParent && parentNode) {
      const parentAttr = parentNode.attributes
      parentDirectives = Array.from(parentAttr)
        .map(attr => dparser(attr))
        .filter(isUndefined)
      }      
    allDirectives = [...templateDirectives, ...mainDirectives, ...parentDirectives]
    //console.log("--- radical ---")
    //console.log(allDirectives)
    allDirectives.map((directive) => {
      try {
          this.applyDirective({ ctx: this, directiveConfig: directive })
      } catch(reason) {
        console.log("------- / directive error / ------")
        console.log(reason)
      }
    })
  }
  
  _parseAttrProps(attr) {
    const { name, nodeValue } = attr
    const props = { 
      name : name,
      value:nodeValue 
    }
    /* we should deal with callbacks */
    /* child can know what to uses */
    if (name.startsWith("$")) {
      const cleanedName = name.replace('$', '')
      props.name = cleanedName

      const value = this.target.data[nodeValue] || this.target.events[nodeValue]
      props.value = value
    }
    return props 
  }
  _parseAttrDirective(attr) {
    let directive;
    const attrString = `${attr.name}=${attr.value}`;
    const directivePatterns = {
      longPattern: /(\w+):(\w+)=([\"\w\s\"]+)/gi,
      shortPattern: /@(\w+)(:\w+)?=(!?\w+)/gi //add .. more boolean,functionpatterns
    };
    const infos = Object.keys(directivePatterns).map(key => {
      const pattern = directivePatterns[key];
      const result = pattern.exec(attrString);
      let _, ns, name, modifier, value = null;

      if (!result) {
        return;
      }
      if (key === "longPattern") {
        [_, ns, name, value] = result;
      }
      if (key === "shortPattern") {
        [_, name, modifier, value] = result;
      }
      directive = {
        name: name,
        value: value,
        modifier: modifier,
        node: attr.ownerElement
      };
    });
    return directive;
  }
}
