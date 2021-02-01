import MicroTask from "./MicroTask";


class DirectiveRegistry {
    constructor() {
        this.queue = new MicroTask();
        this.directivesMap = new Map();
    }
    
    registerDirective(name, directiveApi) {
        this.directivesMap.set(name, directiveApi);
    }

    getDirective(name) {
        return this.directivesMap.get(name)
    }

    applyDirective({ctx, data}) {
        const { name } = data;
        const directive = this.directivesMap.get(name) || null;
        if (!directive || typeof directive.init != "function") {
            throw "Directive not Found!";
        }
        try {
            directive.init(ctx, data);
        } catch(reason) {
            console.log(`Exception while applying ${name} directive !`)
            console.log(reason)
        }
    }
}

const directiveRegistry = new DirectiveRegistry();
const registerDirective = directiveRegistry.registerDirective.bind(directiveRegistry);
const getDirective = directiveRegistry.getDirective.bind(directiveRegistry);
const applyDirective = directiveRegistry.applyDirective.bind(directiveRegistry);
export { registerDirective, getDirective, applyDirective };