import DomDataBinding from "./DomDataBinding";
import Provider from "./Provider";
import jss from "jss";
import preset from "jss-preset-default";
import { createStore } from "./Store";
import cloneDeep from "clone-deep";

jss.setup(preset());

const _handleProps = function (component, params) {
  const { properties, target, _props_=[] } = params; //handle prop type of
  if (!target) {
    return false;
  }

  // why props can't be null ?
  params.props = {};
  properties.map((propName) => {
    if (Array.isArray(_props_)) {
        const propsInfos = _props_.find((current) => current.name === propName);
        if (propsInfos) {
        const { name, value } = propsInfos;
        params.props[name] = value;
      } else {
        params.props[propName] = null //init props
      }
    } else {
     throw "props should be an array"; 
    }
  });
  delete params._props_;
};

/* deal with target */
const _handleTarget = function (component, params) {
  const { target } = params;
  if (!target) {
    return;
  }
  const wrapper = document.createElement("div");
  const { classes = null } = params.__sheet__;
  wrapper.innerHTML = params.getTemplate(classes).trim().replace(/^(&nbsp;|\s)*/, '');
  const template = wrapper.firstChild;
  if (template.tagName !== "TEMPLATE") {
    throw new Error(`TemplateTagMissing for ${params.is}!`);
  }
  /* deal with slot --> target content */
  wrapper.innerHTML = template.innerHTML.trim();
  if (!wrapper.firstChild) {
    throw new Error(`Template is empty for component ${params.is}!`);
  }
  const templateContent = wrapper.firstChild.cloneNode(true);
  target.appendChild(templateContent); // deal with component style and props
  params.root = templateContent;
};

const _handleStyle = function (component, params) {
  const { getStyle = null } = params;
  params.__sheet__ = {};
  if (typeof getStyle === "function") {
    //return style, meta
    const componentStyle = getStyle();
    const sheet = jss.createStyleSheet(componentStyle, {
      meta: component.is,
    });
    sheet.attach();
    params.__sheet__ = sheet;
  }
};


class CustomElement {
  static elementsRegistry = new Map();
  static instanceRegistry = new Map();

  constructor(params) {
    // should we use mailBox instead 
    this.mailBox = [];
    this.children = [];
    this.$injected = {};
    this.$store = createStore("global"); // wrong inject as a params
    _handleProps(this, params);
    _handleStyle(this, params);
    _handleTarget(this, params);
    Object.assign(this, {}, params);
    // handle store variable
    this.$store.on(this.onStoreUpdated.bind(this));
    this.$store.register(this.onMessage.bind(this));
    this.$binding = DomDataBinding.applyMixin({ target: this, skipRoot: true });
    this.declareSideEffects();
    this.onInit();
    this.$binding.flush(); 
    // call OnOnit on children
    // @tofix: empêcher conflict properties/data
  }

  onMessage(message, payload) {
    /* check if message type exist */
    /* msg event when is complete */
    /* - . - . - . - . - */
  }

  onInit() {}

  onLinked() {} // @todo when the root is on the Dom

  unlinked() {} // @todo when the root is removed from the dom

  provide(name, data) {
    Provider.register(name, data, this);
  }
  
  onStoreUpdated(key, value) {}
  
  useProvider(name) {
    Provider.useProvider(name, this);
  }

  invoke(method, ...params) {
    if (typeof this[method] !== "function") {
      throw "invoke:wrong parameter type";
    }
    return this[method].apply(this, params);
  }

  // useful
  declareSideEffects() {}

  getValue(path) {
    const [root, ...rest] = path.split(".");
    const source = this[root] || this.data[root]; // -> root > data   
    if (source && Array.isArray(rest) && rest.length !== 0) {
      const value = rest.reduce((acc, pathItem) => {
        if (!acc) { return null }
        return acc[pathItem];
      }, source);
      return value;
    }
    return source;
  }

  setValue(path, value) {
    const [root, ...rest] = path.split(".");
    const source = this[root] || this.data[root]; // harmoniser
    const propsTarget = this.hasOwnProperty(root) ? "props" : "data"; // -> target props/data

    if (source) {
      rest.reduce((acc, pathItem, index) => {
        if (index === rest.length - 1) {
          acc[pathItem] = value;
          return acc;
        } else {
          return source[pathItem] || {};
        }
      }, source);
      if (propsTarget === "props") {
        this[root] = { ...source };
      } else {
        this.data[root] = { ...source };
      }
    }
  }
  // get all props data
  getTemplateData() {
    const props = {}
    this.properties.map((name) => {
      props[name] = this.getValue(name)
    });
    return {...this.data, ...props};
  }
  // Handle context
  registerSideEffects(func, deps) {
    
    if (typeof func !== "function") {
      throw `${func} must be a function!`;
    }
    func = func.bind(this);
    // use getTemplate Data;
    this.$binding.signals.valueChanged.connect(({_, key}) => {
      if (deps.includes(key)) {
        var values = deps.map((dep) => this.getValue(dep));
        func(...values);
      }
    });
    var dataValues = deps.map((dep) => this.getValue(dep));
    func(...dataValues);
  }

  static create(params) {
    return new CustomElement(params);
  }

  static createFromNode({ componentName, target, props }) {
    // render new element
    const componentConf = CustomElement.elementsRegistry.get(componentName.toLowerCase());
    if (!componentConf) {
      return;
    }
    const cloneConf = cloneDeep(componentConf); 
    const conf = { ...cloneConf, target, _props_: props };
    console.log(`creating a [${componentConf.is}] node!`);

    return new CustomElement(conf);
  }

  static createFromDirective(name, { ctx, node }) {
    const componentConf = CustomElement.elementsRegistry.get(name);
    if (!componentConf) {
      throw `Component ${name} not found!`;
    }
    console.log("inside createFromDirective");

    /* config -> root, parent */
    componentConf.root = node;
    componentConf.parentContext = ctx; // deal with parent livecycle
    const instance = new CustomElement(Object.assign({}, componentConf));
    const cpt = CustomElement.instanceRegistry.size + 1;
    CustomElement.elementsRegistry.set(`name_${cpt}_${cpt + 1}`, instance);
  }

  static register(definition) {
    const { is: name } = definition;
    if (typeof definition === "object") {
      CustomElement.elementsRegistry.set(name, definition);
    }
  }

  static hasAcustomDefinition(name) {
    if (typeof name !== "string") {
      return null;
    }
    return CustomElement.elementsRegistry.get(name.toLowerCase());
  }

  static render(name, target) {
    return CustomElement.createFromNode({
      componentName: name,
      props: [], // fix should work without props
      target
    });
  }
}

export default CustomElement;
