const TreeHelper = {

    traverse: function(ast, visitors) {

        function traverseArray(list, parent) {
            list.forEach(child => {
                traverseNode(child, parent);
            });
        };

        function traverseNode(node, parent) {
            const actions = visitors['type']
            const {enter, exit} = actions
            if (enter & typeof exit === "function") {
                enter(node, parent)
            }
            if (Array.isArray(node.children) && node.children.length) {
                traverseArray(node.children, node)
            }
            /* -- exit -- */
            if (exit & typeof exit === "function") {
                exit(node, parent)
            }
        }
        traverseNode(ast, null)
    },

    transform: function(ast) {

     }
};


/* generate code */
const CodeGenerator = function(ast, ctx) {
    const statements = ""
    while(ast) {
        //case element
    }
}


export  default TreeHelper;