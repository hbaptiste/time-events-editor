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
        console.log("radicak blaze")
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
            cb(currentNode)
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
  isEof(){}
  scanUntil(){}
}

export { 
  parse, 
  renderTemplate, 
  createWalker, 
  getNodeTemplate, 
  setNodeTemplate,
  setRenderedItems,
  getRenderedItems
}