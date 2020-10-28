
export default class Context {

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

    createFrom(data) {
        return new Context(data, this)
    }
}