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
  const itemReg = /(\w+)\sin\s(\w+)/gi
  const [_, localName, parentName] = itemReg.exec(value);
  return {localName, parentName}
}

const _parseAttrDirective = function(attr) {
  let directive;
  const attrString = `${attr.name}=${attr.value}`;
  const directivePatterns = {
    longPattern: /(\w+):(\w+)=([\"\w\s\"]+)/gi,
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
    .filter(dir => keys.indexOf(dir.name) !== -1)
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
  

  /* visitor */
  /* isText */
  /* isNode */
  /* isDirective */
  const visit = function(node, callback) {
    // Deal with skip ///
    const _visit = function(node, parent, index) {
      callback(node, parent, index)
      if (node.children) {
        node.children = node.children.map((child, index) => { return _visit(child, node, index) })
      }
      return node
    }
    callback(node)
    node.children = node.children.map((child, index) => {
      return _visit(child, node, index)
    })
    return node
  }
  
  const parseSection = function(node) {

    /** build tokens here */
    const { walker, skip } = createWalker({root: node})

    /* create Node */
    //dom toast
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
      }
      if (!previousParent) {
        root = createNode(element.parentNode)
        root.isRoot = true
        root.directives = parseDirectives(element.parentNode)
        root.children.push(currentNode)
        previousParent = root
        if (isASection(currentNode)) {
          root.type = "section"
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
   
    const renderSection = function(data) {

      /* build and construct dom */
      const doTransform = function(node, parent, index) {
        switch (node.type) {
          case "section": visitSection(node, parent, index)
        }
      }
      return visit(root, doTransform)
    }

    return { renderSection }
  }
  
  const visitSection = function(node, parent, index) {
    console.log("...visiting section ...")
    console.log(node, parent, index)
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

/* is a section */
const isASection = function(node) {
  const directives = node.directives || []
  if (!Array.isArray(directives)) { return false }
  return directives.filter( dir => dir.name === "foreach").length
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

/***
 * - template
 * <li km:foreach="ev in event.items">
 *      event {ev.name}!
 *      tags: <a km=foreach="name is ev.samples">
 *        {name}
 *      </a>
 * </li>
 * 
 * - render
 * <li>
 *  Livre! tags : <a>Comment</a>,<a>Happy</a>, <a>Matter</a>
 * </li>
 * - code
 *  document.createElement()
 * 
 */
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

// useful lookup nested value
const createDataContext = function(data, parent) {

  const lookup = { }
  return { lookup }
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
  parseDirectives
}