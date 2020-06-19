

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
      const execPattern = new RegExp('{.*?}','g') // [a-zA-Z0-9_.]+ token, handle pipe
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

const renderTemplate = function(data, context) {
    const { tokens, node } = data
    const { ctx } = context
    console.group("token", tokens)
    tokens.map((token) => {
      const { pipes } = token
      const applyPipes = (value) => {
        return pipes.reduce((acc, pipe) => {
          if (typeof ctx.target.invoke === "function") {
            return ctx.target.invoke(pipe, acc)
          }
          return "patrov->" + acc
        }, value)
      }
      const val = eval("`${token.exp}`")
      const t = `(function() {
                    const { item } = context
                    const val = ${val}
                    return applyPipes(val)
                  }())`      
      token.textNode.textContent = eval(t)
    })
    return node.cloneNode(true)
}


const createWalker = function(params) {
  const {root, filter} = params
  const treeWalker =  document.createTreeWalker(root, filter)
  const skip = () => {
    const node = treeWalker.nextSibling()
    treeWalker.currentNode = node//etreeWalker.nextSibling()
    console.log("-- radical ---")
    console.log(treeWalker.lastChild)
  }
  const walker = (cb) => {
    while (treeWalker.nextNode()) {
      const { currentNode } = treeWalker
      console.log("--- currentNode ---")
      console.log(currentNode)
      if (typeof cb !== "function") {
        throw new Error("WrongParameterType: walker expect a function!")
      }
      try {
        cb(currentNode)
      } catch(reason) {
        console.log("WalkerError")
        console.log(reason)
      }
    }
  }
  return { walker, skip }
}

export { parse, renderTemplate, createWalker }