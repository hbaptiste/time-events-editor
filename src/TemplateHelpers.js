import Context from "./Context";
import { applyDirective } from "./DirectiveRegistry";
import CustomElement from "./CustomElement";
import { createIterator } from "./Utils";

const templateRecords = new Map();
const renderedItemsRecords = new Map();
const PROPS_DIRECTIVE = "props:watcher";
const getId = (function (prefix = "item") {
  let counter = 0;
  return function () {
    counter++;
    return `${prefix}_${counter}${counter++}${counter++}`;
  };
})();

const setNodeTemplate = function (node) {
  const key = getId();
  templateRecords.set(key, node);
  node.setAttribute("data-template-key", key);
  return { key };
};

// parse directive
const _parseDirectiveValue = function (value) {
  const itemReg = new RegExp(/(\w+)\sin\s([a-zA-Z0-9_]+(\.[a-zA-Z0-9_]*)*)/, "gm");
  const [_, localName, parentName] = itemReg.exec(value);
  return { localName, parentName };
};

// parse event handler
const _parseEventsValue = function (value) {
  const callbackReg = new RegExp(/(\w+)(\((.*?)\))/, "gm");
  const parsedValue = callbackReg.exec(value);
  try {
    const [_, callbackName, __, params] = parsedValue;
    return {
      callback: callbackName,
      params: params.split(",").map((item) => item.trim()),
    };
  } catch (e) {
    return { callback: value, params: [] };
  }
};

const LONG_DIRECTIVE_PATTERN = /(\w+):(\w+)=(.*)/i;
const SHORT_DIRECTIVE_PATTERN = /@(\w+)(:\w+)?=(.*)/i;
const PROPS_DIRECTIVE_PATTERN = /^\$(\w+)=(\w+)/i;

const isNormalAttribute = function (attr) {
  const { name, value } = attr;
  const attrString = `${attr.name}=${attr.value}`;
  if (LONG_DIRECTIVE_PATTERN.test(attrString) || SHORT_DIRECTIVE_PATTERN.test(attrString)) {
    return false;
  }
  if (name.startsWith("@") || name.startsWith("$")) {
    return false;
  }
  return true;
};
// _parseStyleValue
const _parseStyleValue = function (value) {
  // function / object
  const stylesPattern = {
    REACTIVE_CALLBACK: new RegExp(/(\w+)(\((.*?)\))?/, "gm"), // soit plus précis
  };
  const result = stylesPattern.REACTIVE_CALLBACK.exec(value);
  if (!result) {
    return false;
  }
  const [_, name, __, params] = result;
  const type = params ? "callback" : "props";
  return { name, type, params: params ? params.split(",") : null };
};

// parse value
const _parseValue = function (value, name) {
  const patterns = {
    click: _parseEventsValue,
    foreach: _parseDirectiveValue,
    style: _parseStyleValue,
  };
  const idFunction = (id) => id;
  const valueParser = patterns[name] || idFunction;
  return valueParser(value);
};

const _parseAttrDirective = function (attr) {
  let directive;
  const attrString = `${attr.name}=${attr.value}`;
  const directivePatterns = {
    longPattern: LONG_DIRECTIVE_PATTERN,
    shortPattern: SHORT_DIRECTIVE_PATTERN,
    propsPattern: PROPS_DIRECTIVE_PATTERN,
  };
  const infos = Object.keys(directivePatterns).map((key) => {
    const pattern = directivePatterns[key];
    const result = pattern.exec(attrString);
    let _,
      ns,
      name,
      modifier,
      value = null;
    if (!result) {
      return;
    }
    if (key === "longPattern") {
      [_, ns, name, value] = result;
    }
    if (key === "shortPattern") {
      [_, name, modifier, value] = result;
    }
    if (key === "propsPattern") {
      const [_, targetProp, sourceProp] = result;
      name = "props:watcher";
      value = {
        targetProp,
        sourceProp,
      };
    }
    value = _parseValue(value, name);
    /* directive */
    directive = {
      name: name,
      value,
      modifier,
      node: attr.ownerElement,
    };
  });
  return directive;
};

const parseDirectives = function (node = null, keys = []) {
  if (!node) {
    return;
  }
  if (!node.attributes) {
    return [];
  }
  let directives = [];
  const isUndefined = (dir) => dir !== undefined;
  directives = Array.from(node.attributes)
    .map((att) => _parseAttrDirective(att))
    .filter(isUndefined);
  //.filter(dir => keys.indexOf(dir.name) !== -1)
  return directives;
};
/* parseAttributes */
const parseAttributes = function (node) {
  const attributes = Array.from(node.attributes);
  const attrList = attributes.filter((attr) => isNormalAttribute(attr));
  return attrList.map((attr) => {
    const { name, value } = attr;
    return { name, value };
  });
};

const setRenderedItems = function (key, items) {
  renderedItemsRecords.set(key, items);
};

const getRenderedItems = function (key) {
  return renderedItemsRecords.get(key);
};

const getNodeTemplate = function (node) {
  const key = node.getAttribute("data-template-key");
  return templateRecords.get(key);
};

const parseTextNodeExpressions = function (textContent) {
  const pattern = new RegExp("{.*?}", "gm");
  const strings = [];
  let nextStart = 0;
  const tokens = [];
  let prevString = "";
  let token;
  while ((token = pattern.exec(textContent)) !== null) {
    const exp = parseTemplateExpr(token) || {};
    const [match] = token;
    prevString = textContent.substring(nextStart, token.index);
    nextStart = token.index + match.length;
    strings.push([prevString, exp]);
    strings.push([match, exp]);
  }
  if (nextStart < textContent.length) {
    strings.push([textContent.substring(nextStart), {}]);
  }

  if (strings.length !== 0) {
    strings.map(([item, exp]) => {
      const itemExp = item.startsWith("{") ? exp : {};
      tokens.push({ type: "element", name: "TEXT", value: item, ...itemExp });
    });
  }

  return { tokens };
};
/* parse  Template */
const parseExpressions = function (node) {
  const { walker } = createWalker({ root: node, nodeToShow: NodeFilter.SHOW_TEXT });
  const textNodes = [],
    tokens = [];

  walker((textNode) => {
    if (textNode.textContent.trim() !== "") {
      textNodes.push(textNode);
    }
  });

  if (!textNodes.length) return { node, tokens };
  // switch to --> classic for
  textNodes.forEach((textSource) => {
    const textContent = textSource.textContent;
    const execPattern = new RegExp("{.*?}", "g");
    const strings = [];
    let nextStart = 0;
    let token;
    while ((token = execPattern.exec(textContent)) !== null) {
      const exp = parseTemplateExpr(token) || {};
      const [match] = token;
      const prevString = textContent.substring(nextStart, token.index);
      nextStart = token.index + match.length;
      strings.push(prevString);
      strings.push(match);

      if (nextStart < textContent.length) {
        strings.push(textContent.substring(nextStart));
      }
      if (strings.length != 0) {
        const { parentNode } = textSource;
        strings.map((item) => {
          const content = item.startsWith("{") ? "" : item;
          const textNode = document.createTextNode(content);
          parentNode.insertBefore(textNode, textSource);
          if (item.startsWith("{")) {
            tokens.push({
              value: item,
              textNode,
              ...exp,
            });
          }
        });
        parentNode.removeChild(textSource);
      }
    }
  });
  return { node, tokens };
};

const parseTemplateExpr = function (token) {
  const [expression] = token;
  const cleanExp = cleanKey(expression);
  let result = {
    exp: cleanExp,
    pipes: [],
  };
  if (cleanExp.includes("|")) {
    const pipes = cleanExp.split("|").map((pipe) => pipe.trim());
    const [exp, ...allPipes] = pipes;
    return (result = {
      exp,
      pipes: allPipes,
    });
  }
  return result;
};

const visit = function (node, { enterVisitor, exitVisitor }) {
  // Deal with skip ///
  const _visit = function (node, parent, index) {
    enterVisitor(node, parent, index);

    if (Array.isArray(node.children) && node.children.length) {
      node.children.forEach((child, index) => {
        _visit(child, node, index);
      });
    }
    exitVisitor(node, parent, index);
  };

  _visit(node, null, null);

  return node;
};

/* create Node */
const createNode = function (node) {
  const nodeType = node.nodeType === 3 ? "TEXT" : node.nodeName;
  const isCustom = CustomElement.hasAcustomDefinition(node.nodeName) ? true : false;
  let _node;
  if (nodeType === "TEXT") {
    _node = {
      type: "element",
      name: nodeType,
      value: node.textContent,
    };
  } else {
    _node = {
      type: isCustom ? "custom-element" : "element",
      isCustomElement: isCustom,
      name: nodeType,
      children: [],
      directives: parseDirectives(node),
      attributes: parseAttributes(node),
      node,
    };
  }
  return _node;
};

const parseSection = function (node) {
  /** build tokens here */
  const textFilter = (node) => {
    if (node.nodeType == 3) {
      const textContent = node.nodeValue.trim();
      if (textContent == "") {
        return NodeFilter.FILTER_REJECT;
      }
    }
    return NodeFilter.FILTER_ACCEPT;
  };

  const { walker, skip } = createWalker({ root: node, filter: textFilter });

  /* -- find -- */
  let previousNode = null;
  let previousParent = null;
  let root = null;
  const previousParents = [];

  const getParent = function (node) {
    return previousParents.find((parent) => node == parent.node);
  };

  const saveParent = function (node) {
    const parent = getParent(node);
    if (!parent) {
      previousParents.push(node);
    }
  };
  walker((element) => {
    const currentNode = createNode(element);
    if (!previousParent) {
      root = currentNode; //createNode(element);
      root.isRoot = true;
      root.directives = parseDirectives(element);
      previousParent = root;
      saveParent(previousParent);
    } else if (element.parentNode == previousParent.node) {
      previousParent.children.push(currentNode);
    } else if (element.parentNode == previousNode.node) {
      previousNode.children.push(currentNode);
      previousParent = previousNode;
      saveParent(previousNode);
    } else {
      // siblings
      const parentNode = getParent(element.parentNode);
      if (parentNode) {
        parentNode.children.push(currentNode);
        previousParent = parentNode;
      }
    }
    /* -- maybe it's a section -- */
    if (isASection(currentNode)) {
      currentNode.type = "section";
      updateSectionInfos(currentNode);
    }
    previousNode = currentNode;
  });
  return root;
};

/* is a section */
const isASection = function (node) {
  const directives = node.directives || [];
  if (!Array.isArray(directives)) {
    return false;
  }
  return directives.filter((dir) => dir.name === "foreach").length;
};

const updateSectionInfos = function (node) {
  const directive = node.directives.find((dir) => dir.name === "foreach");
  node.directives.filter((dir) => dir.name !== "foreach");
  const { localName, parentName } = directive.value;
  node.sectionInfos = { localName, parentName };
  return node;
};

/* made recursive */
const renderSection = function ({ ctx, node, data }) {
  /*if (!data || Array.isArray(data) && data.length === 0) {
    return;
  }*/
  const rootCtx = new Context(ctx.target.getTemplateData());
  const ast = parseSection(node);
  if (!ast) {
    throw "ParsingError";
  }
  /* setting contexts */
  const enterVisitor = (node, parent) => {
    const parentCxt = parent ? parent.ctx : null;
    switch (node.type) {
      case "custom-element":
        node.ctx = node.ctx || parentCxt;
        break;
      case "element":
        node.ctx = node.ctx || parentCxt;
        break;
      case "section":
        const { localName, parentName } = node.sectionInfos;
        const [pName] = parentName.split(".");
        const { name, isCustomElement } = node;
        let data = [];
        const newChildren = [];
        if (!parent) {
          data = rootCtx.lookup(parentName) || [];
          node.ctx = rootCtx.createFrom({ [localName]: data });
        } else {
          const itemCtx = node.ctx || parent.ctx || rootCtx.createFrom({ [localName]: data });
          data = itemCtx ? itemCtx.lookup(parentName) : [];
          node.ctx = itemCtx.createFrom({ [localName]: data });
        }
        node.directives = [...node.directives.filter((dir) => dir.name !== "foreach")];

        /* populate */
        // eslint-disable-next-line no-case-declarations
        let di = 0;
        // eslint-disable-next-line no-case-declarations
        const iterable = createIterator(data);
        while (iterable.hasNext()) {
          const item = iterable.next();
          const $index = iterable.cursor;
          const currentItem = Array.isArray(item) ? item[1] : item;
          const $key = Array.isArray(item) ? item[0] : $index;

          const nodeFunc = (function (_item_) {
            return function (i) {
              const itemCtx = node.ctx.createFrom({ [localName]: _item_ });
              itemCtx.extends({ $key, $index });
              return {
                name,
                ctx: itemCtx,
                key: i,
                type: isCustomElement ? "custom-element" : "element",
                directives: [...node.directives],
                attributes: [...node.attributes],
                //children: [],
              };
            };
          })(currentItem);
          const newNode = nodeFunc(di);
          newChildren.push(newNode);
          di++;
        }

        /* transform */
        newChildren.map((parent) => {
          const childrenCopy = JSON.parse(JSON.stringify(node.children));
          parent.children = childrenCopy.map(function (_child_) {
            _child_.key = parent.key;
            _child_.ctx = parent.ctx;
            return _child_;
          });
        });
        node.type = "fragment";
        node.children = newChildren;

        break;
    }
  };

  /* perform modification */
  const exitVisitor = (node, parent, position) => {
    switch (node.type) {
      case "TEXT":
        const { tokens } = parseTextNodeExpressions(node.value);
        tokens.forEach((tNode) => (tNode.ctx = node.ctx));
        if (Array.isArray(tokens)) {
          parent.children.splice(...[position, 1].concat(tokens));
        }
        break;
    }
  };
  const domData = visit(ast, { enterVisitor, exitVisitor });
  const compiled = compile(domData, ctx);
  return compiled;
};

const parse = function (node) {
  const data = parseExpressions(node);
  return {
    render: (context) => {
      return renderTemplate(data, context);
    },
  };
};
const cleanKey = function (key) {
  return key.replace("{", "").replace("}", "");
};

const _parseAndToken = function (node) {
  const { walker } = createWalker({ root: node, filter: NodeFilter.SHOW_TEXT });
  const textsNode = [];
  walker((node) => {
    textsNode.push(node);
  });
};

const renderTemplate = function (tplContext, data) {
  const { tokens, node } = tplContext;
  const { ctx, itemKey } = data;
  const dataItem = { [itemKey]: data[itemKey] };

  tokens.map((token) => {
    const { pipes } = token;
    const applyPipes = (value) => {
      return pipes.reduce((acc, pipe) => {
        if (typeof ctx.target.invoke === "function") {
          return ctx.target.invoke(pipe, acc);
        }
        return acc;
      }, value);
    };

    const val = eval("`${token.exp}`");
    const t = `(function() {
                    try {
                        const { ${itemKey} } = dataItem
                        const val = ${token.exp}
                        if (token.pipes.length) {
                          return applyPipes(val)
                        }
                        return val
                      } catch(e) {
                      const data = ctx.target["${val}"] || null
                      if (data) {
                        return data
                      } else {
                        console.log("[${val}] can't be found!")
                      }
                    }
                  }())`;
    token.textNode.textContent = eval(t);
  });
  const t = document.createElement(node.tagName);
  t.innerHTML = node.innerHTML;
  return t;
};

const createWalker = function (params) {
  const { root, nodeToShow, rootIfEmpty = null } = params;
  const skippedList = [];

  const filterFunc = (node) => {
    let keep = NodeFilter.FILTER_ACCEPT;
    if (typeof params.filter === "function") {
      keep = params.filter(node);
    }
    if (keep == NodeFilter.FILTER_ACCEPT && skippedList.includes(node)) {
      return NodeFilter.FILTER_REJECT;
    }
    return keep;
  };

  filterFunc.acceptNode = filterFunc;
  const treeWalker = document.createTreeWalker(root, nodeToShow, filterFunc);

  const walker = (cb) => {
    let currentNode = treeWalker.currentNode;
    while (currentNode) {
      cb(currentNode, root);
      currentNode = treeWalker.nextNode();
    }
  };

  const skip = () => {
    const currentNode = treeWalker.currentNode;
    if (!skippedList.includes(currentNode)) {
      treeWalker.currentNode = treeWalker.previousNode() || root; // to test?
      skippedList.push(currentNode);
    }
  };

  return { walker, skip };
};

const getEval = function (ctx) {
  return function (stm) {
    return eval(stm);
  };
};

const _propsFromDirectives = function (node) {
  const { directives } = node;
  const props = directives.filter((directive) => directive.name == PROPS_DIRECTIVE).pop();
  return props;
};
/* */
const compile = function (ast, domBindingCtx) {
  const genCode = function (node) {
    const stm = [];
    switch (node.type) {
      case "custom-element":
        const props = _propsFromDirectives(node);
        const { ctx: dataContext } = node;

        return (function (cNode, cContext) {
          return () => {
            const renderedNode = domBindingCtx.renderBlock(cNode, cContext);
            return renderedNode;
          };
        })(node, dataContext);

      /** test directive */
      case "element":
        switch (node.name) {
          case "TEXT":
            const textStm = (function (_node_) {
              return function () {
                const element = document.createDocumentFragment(); // tochange
                const { tokens } = parseTextNodeExpressions(node.value);

                const { ctx } = node;
                let textCtn = "";
                tokens.map((token) => {
                  const { exp = null } = token;
                  let value = "";
                  if (exp) {
                    value = domBindingCtx.target.getValue(exp);

                    if (!value || typeof value !== "string") {
                      value = ctx.lookup(exp) || "";
                    }
                    textCtn += value;
                  } else {
                    textCtn += token.value;
                  }
                });
                return document.createTextNode(textCtn);
              };
            })(node);
            return textStm;
          default:
            const defaultStm = (function (_node_) {
              return function () {
                const element = document.createElement(_node_.name);
                const children = _node_.children.map(genCode) || [];
                children.map((childFnc) => {
                  const child = childFnc();
                  element.appendChild(child);
                });
                const { directives = [] } = node;
                _node_.attributes.forEach((attr) => {
                  if (attr.value) {
                    element.setAttribute(attr.name, attr.value);
                  }
                });
                /* directive */
                directives.forEach((directive) => {
                  directive.node = element;
                  const { ctx } = node;
                  directive.dataContext = ctx;
                  applyDirective({ ctx: domBindingCtx, data: directive });
                });
                return element;
              };
            })(node);
            return defaultStm;
        }
      case "fragment":
        let stmFrag = "";
        //if (node.isRoot) {
        stmFrag = (function (_node_) {
          return function (root) {
            const rootFrag = document.createDocumentFragment();
            const transformed = root.children.map(genCode) || [];
            transformed.map((childFnc) => {
              const child = childFnc();
              _node_.attributes.forEach((attr) => {
                if (attr.value) {
                  child.setAttribute(attr.name, attr.value);
                }
              });
              rootFrag.appendChild(child);
            });
            return rootFrag;
          };
        })(node);
        /*} else {
          stmFrag = (function (_node_) {
            return function (root) {
              const children = node.children;
              const frag = document.createDocumentFragment();
              const transformed = children.map(genCode) || [];
              transformed.map((childFnc) => {
                const child = childFnc();
                _node_.attributes.forEach((attr) => {
                  if (attr.value) {
                    child.setAttribute(attr.name, attr.value);
                  }
                });
                frag.appendChild(child);
              });
              return frag;
            };
          })(node); 

          return stmFrag;
        }*/
        stm.push(stmFrag);
        break;
      default:
        throw new Error("CodeGenerationError");
    }
    return stm.pop();
  };
  const code = genCode(ast);
  try {
    return code(ast);
  } catch (e) {
    console.log("--- error ---");
    console.log(e);
  }
};

/* template and code builder */
const tokenize = function (template) {
  if (!template || template.length) {
    return [];
  }
};

export {
  parse,
  renderTemplate,
  createWalker,
  getNodeTemplate,
  setNodeTemplate,
  setRenderedItems,
  getRenderedItems,
  parseSection,
  parseDirectives,
  renderSection,
};
