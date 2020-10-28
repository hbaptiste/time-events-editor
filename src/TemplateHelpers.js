import { assign, forEach } from 'lodash'
import Context from './Context' 
const templateRecords = new Map()
const renderedItemsRecords = new Map()

const getId = (function(prefix='item') {
  let counter = 0
  return function() {
    counter++
    return `${prefix}_${counter}${counter + 1}`
  }
}())

/* Radical blaze */
const setNodeTemplate = function(node) {
  const key = getId()
  templateRecords.set(key, node)
  node.setAttribute('data-template-key', key)
  return { key }
}

const _parseDirectiveValue = function(value) {
  const itemReg = new RegExp(/(\w+)\sin\s([a-zA-Z0-9_]+(\.[a-zA-Z0-9_]*)*)/,'gm')
  const [_,localName, parentName] = itemReg.exec(value);
  return { localName, parentName }
}

const _parseAttrDirective = function(attr) {
  let directive;
  const attrString = `${attr.name}=${attr.value}`;
  const directivePatterns = {
    longPattern: /(\w+):(\w+)=([\"\w\s\.\"]+)/gi,
    shortPattern: /@(\w+)(:\w+)?=(!?\w+)/gi
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
    value = (name === "foreach") ? _parseDirectiveValue(value) : value
    /* directive */
    directive = {
      name: name,
      value,
      modifier,
      node: attr.ownerElement
    };
  });

  return directive;
}

const parseDirectives = function(node, keys = []) {
  if (!node.attributes) { return [] }
  let directives = []
  const isUndefined = (dir) => dir !== undefined
  directives = Array.from(node.attributes)
    .map(att => _parseAttrDirective(att))
    .filter(isUndefined)
    //.filter(dir => keys.indexOf(dir.name) !== -1)
  return directives
}

const setRenderedItems = function(key, items) {
  if (Array.isArray(items)) {
    renderedItemsRecords.set(key, items)  
  }
}

const getRenderedItems = function(key) {
  return renderedItemsRecords.get(key) || []
}

const getNodeTemplate = function(node) {
  const key = node.getAttribute('data-template-key')
  return templateRecords.get(key)
}

const parseTextNodeExpressions = function(textContent) {

    const execPattern = new RegExp('{.*?}','g')
    const strings = []
    let nextStart = 0
    let tokens = []
    let token
    while ((token = execPattern.exec(textContent)) !== null) {
      const exp = parseTemplateExpr(token) || {}
      const [match] = token
      const prevString = textContent.substring(nextStart, token.index)
      nextStart = token.index + match.length
      strings.push([prevString, exp])
      strings.push([match, exp])
      if (nextStart < textContent.length) {
        strings.push([textContent.substring(nextStart), exp])
      }
    }
    if (strings.length !== 0) {
      strings.map(([item, exp]) => {
          const itemExp = item.startsWith("{") ? exp: {}
          tokens.push({type: 'element', name: 'TEXT', value: item, ...itemExp})            
      })
    }

  return { tokens }
}
/* parse  Template */
const parseExpressions = function(node) {
    const { walker } = createWalker({ root: node, filter: NodeFilter.SHOW_TEXT })
    const textNodes = [], tokens = []
    
    walker((textNode) => {
      if (textNode.textContent.trim() !== "") {
        textNodes.push(textNode)
      }
    })

    if (!textNodes.length) return { node, tokens } 
      // switch to --> classic for
      textNodes.forEach((textSource) => {
        const textContent = textSource.textContent
        const execPattern = new RegExp('{.*?}','g')
        const strings = []
        let nextStart = 0
        let token
        while ((token = execPattern.exec(textContent)) !== null) {
          const exp = parseTemplateExpr(token) || {}
          const [match] = token
          const prevString = textContent.substring(nextStart, token.index)
          nextStart = token.index + match.length
          strings.push(prevString)
          strings.push(match)
  
          if (nextStart < textContent.length) {
            strings.push(textContent.substring(nextStart))
          }
          if (strings.length != 0) {
            const { parentNode } = textSource
            strings.map((item) => {
                const content = item.startsWith("{") ? "" : item 
                const textNode = document.createTextNode(content)
                parentNode.insertBefore(textNode, textSource)
                if (item.startsWith("{")) {
                    tokens.push({
                        value: item,
                        textNode,
                        ...exp
                    }) 
                }
            })
            parentNode.removeChild(textSource)
          }
        }
      })
    return { node, tokens }
  }
  
  const parseTemplateExpr = function(token) {
    const [expression] = token
    const cleanExp = cleanKey(expression)
    let result = {
      exp: cleanExp,
      pipes: []
    }
    if (cleanExp.includes('|')) {
      const pipes = cleanExp.split('|').map(pipe => pipe.trim())
      const [exp,...allPipes] = pipes
      return result = {
        exp,
        pipes: allPipes,
      }
    }
    return result
  }
  
  const visit = function(node, {enterVisitor, exitVisitor}) {
    // Deal with skip ///
    const _visit = function(node, parent, index) {
      enterVisitor(node, parent, index)
      if (Array.isArray(node.children) && node.children.length) {
        node.children.forEach((child, index) => {
          _visit(child, node, index) 
        })
      }
      exitVisitor(node, parent, index)
    }

    _visit(node, null, null)

    return node
  }
  
  const parseSection = function(node) {

    /** build tokens here */
    const { walker, skip } = createWalker({root: node})

    /* create Node */
    const createNode = function(node) {
      const nodeType = node.nodeType === 3 ? "TEXT" : node.nodeName
      
      if (nodeType === "TEXT") {
        return {
          type: "element",
          name: nodeType,
          value: node.textContent
        }
      } else {
          return {
            type: "element",
            name: nodeType,
            children: [],
            directives: parseDirectives(node),
            attributes:[],
            node
          }
      }
    }
    /* -- find -- */
    let previousNode = null
    let previousParent = null
    let root = null
    const previousParents = []

    const getParent = function(node) {
      return previousParents.find(parent => node == parent.node)
    }

    const saveParent = function(node) {
      const parent = getParent(node)
      if (!parent) { previousParents.push(node) }
    }
    walker((element) => {
      let currentNode = createNode(element)
      /* deal with section / directive */
      if (isASection(currentNode)) {
        currentNode.type = "section"
        updateSectionInfos(currentNode)
      }
      if (!previousParent) {
        root = createNode(element.parentNode)
        root.isRoot = true
        root.directives = parseDirectives(element.parentNode)
        root.children.push(currentNode)
        previousParent = root
        if (isASection(root)) {
          root.type = "section"
          updateSectionInfos(root)
        }
        saveParent(previousParent)
      } else if (element.parentNode == previousParent.node) {
        previousParent.children.push(currentNode)
      } else if (element.parentNode == previousNode.node) {
        previousNode.children.push(currentNode)
        previousParent = previousNode
        saveParent(previousNode)
      } else { // siblings
        const parentNode = getParent(element.parentNode)
        if (parentNode) {
          parentNode.children.push(currentNode)
          previousParent = parentNode
        }
      }
      /* -- check that -- */
      previousNode = currentNode
    })
   return root
  }
  
  /* is a section */
  const isASection = function(node) {
    const directives = node.directives || []
    if (!Array.isArray(directives)) { return false }
    return directives.filter( dir => dir.name === "foreach").length
  }

  const updateSectionInfos = function(node) {
    const directive = node.directives.find(dir => dir.name === "foreach")
    const { localName, parentName } = directive.value
    node.sectionInfos = {localName, parentName}
    return node
  }

  /* made recursive */
  const renderSection = function({ctx, node, data}) {

    const rootCtx = new Context(ctx.target.data)
    if (Array.isArray(data) && data.length === 0) { return }
    const ast = parseSection(node)
    
    /* setting contexts */
    const enterVisitor = (node, parent) => {
      switch(node.type) {
        case "element":
            node.ctx = node.ctx || parent.ctx
            break;
        case "section":
          let { localName, parentName } = node.sectionInfos
          const [ pName ] = parentName.split(".")
          const { name } = node
          let data = []
          const newChildren = []

          const cleanChildren = function(parentCtx, children) {
            return children.map(function(child) {
              console.log("-- param --")
              console.log(parentCtx.data)
              return child
            })
          }
          if (!parent) {
            data = rootCtx.lookup(parentName)
            node.ctx = rootCtx.createFrom({ [localName] : data })
          } else if (node.ctx !== null || parent.ctx) {
            const itemCtx = node.ctx || parent.ctx
            data = itemCtx.lookup(parentName) || []
            node.ctx = itemCtx.createFrom({ [localName]: data })
          }
          /* populate */
          data.forEach((item) => {
            let itemCtx = node.ctx.createFrom({ [localName]: item })
            const newNode = {
              name,
              ctx: itemCtx,
              type: "element",
              children: cleanChildren(itemCtx, node.children)
            }
            newChildren.push(newNode)
          })
          node.type = "fragment"
          node.children = newChildren
          break;
      }
    }
    
    /* perform modification */
    const exitVisitor = (node, parent, position) => {
      switch(node.name) {
        case 'TEXT':
         const {tokens} = parseTextNodeExpressions(node.value)
          tokens.forEach((tNode) => tNode.ctx = node.ctx)
          if (Array.isArray(tokens)) {
            parent.children.splice(...[position,1].concat(tokens))
          }
      }
    }
    const domData = visit(ast, { enterVisitor, exitVisitor })
    console.log(ast)
    return compile(domData)
  }

  const parse = function(node) {
    const data = parseExpressions(node)
    return {
              render : (context) => {
                return renderTemplate(data, context) 
          }
    }
  }
  const cleanKey = function(key) {
    return key.replace("{","").replace("}","")
  }

const _parseAndToken = function(node) {
    const { walker } = createWalker({root:node, filter: NodeFilter.SHOW_TEXT})
    const textsNode = []
    walker((node) => {
        textsNode.push(node)
    })
}
const renderTemplate = function(tplContext, data) {
    const { tokens, node } = tplContext
    const { ctx, itemKey } = data
    const dataItem = {[itemKey] : data[itemKey] }

    tokens.map((token) => {
      const { pipes } = token
      const applyPipes = (value) => {
        return pipes.reduce((acc, pipe) => {
          if (typeof ctx.target.invoke === "function") {
            return ctx.target.invoke(pipe, acc)
          }
          return acc
        }, value)
      }

      const val = eval("`${token.exp}`")
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
                  }())`
      token.textNode.textContent = eval(t)
    })
    const  t = document.createElement(node.tagName)
    t.innerHTML = node.innerHTML
    return t
}

const createWalker = function(params) {
    const { root, filter } = params
    const skippedList = []
    const filterFunc = (node) => {
        if (skippedList.includes(node)) {
            return NodeFilter.FILTER_REJECT
        }
        return NodeFilter.FILTER_ACCEPT
    }
    filterFunc.acceptNode = filterFunc
    const treeWalker = document.createTreeWalker(root, filter, filterFunc)
    
    const walker = (cb) => {
        while(treeWalker.nextNode()) {
            const currentNode = treeWalker.currentNode
            cb(currentNode,root)
        }
    }

    const skip = () => {
        const currentNode = treeWalker.currentNode
        if (!skippedList.includes(currentNode)) {
            treeWalker.currentNode = treeWalker.previousNode() || root // to test?
            skippedList.push(currentNode)
        }
      
    }

    return { walker, skip }
}

/* */
const compile = function(ast) {
  
  const applyFilter = function(ctx) {
    console.log(ctx)
  }

  const genCode = function(node) {
    const stm = []
    switch(node.type) {
      case "element":
        switch(node.name) {
          case "TEXT":
            const textStm = `(function() {
              return function() {
                const element = document.createTextNode("${node.name}");
                const {exp = null, ctx } = node
                const value = exp ? ctx.lookup(exp) : node.value
                element.textContent = value
                return element;
              }
            }(node))
            `
            return eval(textStm)
          default:
            const defaultStm = `(function() {
              return function() {
                const element = document.createElement("${node.name}");
                const children = node.children.map(genCode) || [];
                children.map((childFnc) => {
                  element.appendChild(childFnc())
                })
                return element;
              }
            }(node))
           `
           return eval(defaultStm)
          }
        break;
      case "fragment":
          let stmFrag = ''
          if (node.isRoot) {
            stmFrag = `(function() {
              return function(root) {
                const rootFrag = document.createDocumentFragment()
                const transformed = root.children.map(genCode) || []
                transformed.map(childFnc => {
                  rootFrag.appendChild(childFnc())
                })
                return rootFrag;
              }
            }())`
          } else {
            stmFrag = `(function() {
              return function(root) {
                const children = node.children
                const frag = document.createDocumentFragment()
                const transformed = children.map(genCode) || []
                transformed.map((childFnc) => {
                  frag.appendChild(childFnc())
                })
                return frag;
              }
            }(node))
            `
            return eval(stmFrag)  
          }
          stm.push(stmFrag)
          break;
      default:
        throw `const stm = new Error()`
    }
    return stm.join("\n")
  }
  const str = genCode(ast)
  try {
    return eval(str)(ast)
  } catch(e) {
    console.log("--- error ---")
    console.log(e)
  }
  
}


/* template and code builder */
const tokenize = function(template) {
  if (!template || template.length) { return [] }
}

/* scan the template string */
class Scanner {
  
  constructor(string) {
    this.string = string
    this.tail = string
    this.pos = 0
  }
  scan(){}
  isEos() {
    return this.pos === this.string.length - 1
  }
  scanUntil(){}
}

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
  renderSection
}