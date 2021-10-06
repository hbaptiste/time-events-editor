import DomDataBinding from "./DomDataBinding";
import Provider from "./Provider";
import jss from "jss";
import preset from "jss-preset-default";

jss.setup(preset());

const _handleProps = function (component, params) {
  const { properties, target, _props_=[] } = params; //handle prop type of
  if (!target) {
    return false;
  }

  //why props can't be null
  params.props = {};
  properties.map((prop) => {
    if (Array.isArray(_props_)) {
        const propsInfos = _props_.find((current) => current.name === prop);
        if (propsInfos) {
        const { name, value } = propsInfos;
        params.props[name] = value;
      }
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
  wrapper.innerHTML = params.getTemplate(classes).trim();
  const template = wrapper.firstChild;
  if (template.tagName !== "TEMPLATE") {
    throw new Error(`TemplateTagMissing for ${params.is}!`);
  }
  /* deal with slot --> target content */
  target.innerHTML = "";
  const templateContent = template.content.cloneNode(true);
  target.appendChild(templateContent);
  params.root = target;
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
const _watchParents = function (component, props) {
};

class CustomElement {
  static elementsRegistry = new Map();
  static instanceRegistry = new Map();

  constructor(params) {
    this.mailBox = [];
    this.children = [];
    this.$injected = {};
    _handleProps(this, params);
    _handleStyle(this, params);
    _handleTarget(this, params);
    Object.assign(this, {}, params);
    this.$binding = DomDataBinding.applyMixin({ target: this, skipRoot: true });
    this.onInit();
    // _watchParents(this, params); //
    this.declareSideEffects();
    this.$binding.flush(); // call OnOnit on children
    // @tofix: empêcher conflict properties/data
  }

  sendMessage(message, payload) {
    /* check if message type exist */
    /* msg event when is complete */
    /* - . - . - . - . - */
  }
  receiveMessage(message) {
    switch (message.type) {
      case NEW_EVENT:
      case REMOVE_EVENT:
      default:
        break;
    }
  }
  onInit() {}

  onLinked() {} // @todo when the root is on the Dom

  unlinked() {} // @todo when the root is removed from the dom

  provide(name, data) {
    Provider.register(name, data, this);
  }

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
        const value = source[pathItem];
        return value;
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
    func = func.bind(this);
    console.log("--- d/e/ps ---");
    console.log(deps);
    this.$binding.signals.dataChanged.connect((key) => {
      if (deps.includes(key)) {
        const values = deps.map((dep) => this.data[dep]);
        func(...values);
      }
    });
    this.$binding.signals.propsChanged.connect((key) => {
      if (deps.includes(key)) {
        const values = deps.map((dep) => this[dep]); //?
        func(...values);
      }
    });
    /* -- first call -- */
    const dataValues = deps.map((dep) => this[dep]); //props values
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
    const conf = { ...componentConf, target, _props_: props };
    return new CustomElement(Object.assign({}, conf));
  }

  static createFromDirective(name, { ctx, node }) {
    const componentConf = CustomElement.elementsRegistry.get(name);
    if (!componentConf) {
      throw `Component ${name} not found!`;
    }
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
}

export default CustomElement;
