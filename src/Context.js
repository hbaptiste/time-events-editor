
class Context {

    /* */
    constructor(data, parent = null) {
        this.ctxParent = parent
        this.data = data
    }

    hasCtxParent() {
        let result = false
        if (this.ctxParent !== null) {
            result = true
        }
        return result
    }
    /**
     * Key exemple:  node, neke.kes.yes
     */
    lookup(key) {
        console.log(`Key ${key}!`)
        /** data->parent->parent... */
        const keyName = key.split(".")
        let localData = null
        while (keyName.length > 0) {
            const localKey = keyName.shift()
            const firstCall = !localData ? true : false
            if (firstCall && !this.data.hasOwnProperty(localKey) && this.ctxParent!==null) {
                return this.ctxParent.lookup(key)
            }
            localData = !localData ? this.data[localKey]: localData[localKey]
            if (!localData) { break; }
        }
        return localData
    }

    clear() {
        this.data = null
        this.ctxParent = null
    }

}
const parentData = {
    name: "harris", 
    address: "Parent address !",
    main: {
        user: {
            name: "Parent Chain!"
        }
    }
}
const childData = {
    realname: "Patrov", 
    adsdress: "Child address!",
    main: {
        user: { name: "Child Nested name!" }
    }
}
/* -- srange -- */
const parentCtx = new Context(parentData)
const childContext = new Context(childData, parentCtx)

//console.log(childContext.lookup("name"))
//console.log(childContext.lookup("realname"))
console.log(childContext.lookup("main.user.name"))
module.exports = Context;