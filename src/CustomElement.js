import DomDataBinding from "./DomDataBinding"


const _handleProps = function(component, params) {
        const {properties, target, _props_} = params //handle prop type of
        if(!target) { return false }
        
        params.props = {}
        properties.map((prop) => {
            const propsInfos = _props_.find( current => current.name === prop )
            if (propsInfos) {
                const { name, value } = propsInfos
                params.props[name] = value
            }            
        })
        delete params._props_;
}

/* deal with target */
const _handleTarget = function(component, params) {
    
    const { target } = params
    if (!target) { return }
    const wrapper = document.createElement("div")
    wrapper.innerHTML = params.getTemplate().trim()
    const template = wrapper.firstChild
    if (template.tagName !== "TEMPLATE") {
        return false 
    }
    /* deal with slot --> target content */
    target.innerHTML = ""
    const templateContent = template.content.cloneNode(true);
    target.appendChild(templateContent)
    params.root = target
}   

class CustomElement {
    
    static elementsRegistry = new Map()
    static instanceRegistry = new Map()

    constructor(params) {
        this.mailBox = []
        _handleTarget(this, params)
        _handleProps(this, params)
        Object.assign(this, {}, params)
        DomDataBinding.applyMixin({target: this, skipRoot: true})
        this.onInit()
    }
   
    sendMessage(message, payload) {
        /* check if message type exist */ 
        /* msg -> async */
        /* msg event when is complete */
        /* - . - . - . - . - */
    }
    onInit() {}
    
    onLinked() {} // when the root is on the Dom

    onOnlink() {} // when the root is removed from the dom

    invoke(method, ...params) {
        if (this[method] !== "function") {
            throw "invoke:wrong parameter type"
        }
        return this[method].apply(this, params)
    }

    static create(params) {
        return new CustomElement(params)
    }
    
    static createFromNode({componentName, target, props}) {
        // render new element
        const componentConf = CustomElement.elementsRegistry.get(componentName.toLowerCase())
        if (!componentConf) { return }
        const conf = {...componentConf, target, _props_:props}
        return new CustomElement(Object.assign({}, conf)) 
    }

    static createFromDirective(name, { ctx, node }) {
        const componentConf = CustomElement.elementsRegistry.get(name)
        if (!componentConf) {
            throw `Component ${name} not found!`
        }
        /* config -> root, parent */
        componentConf.root = node
        componentConf.parentContext = ctx // deal with parent livecycle
        const instance = new CustomElement(Object.assign({},componentConf))
        const cpt = CustomElement.instanceRegistry.size + 1
        CustomElement.elementsRegistry.set(`name_${cpt}_${cpt+1}`, instance)
    }

    static register(definition) {
        const {is:name} = definition
        if (typeof definition === "object") {
            CustomElement.elementsRegistry.set(name, definition)
        }
    }

    static hasAcustomDefinition(name) {
        if (typeof name !== "string") { return null }
        return CustomElement.elementsRegistry.get(name.toLowerCase())
    }
}


export default CustomElement;