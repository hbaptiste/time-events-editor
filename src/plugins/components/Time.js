import CustomElement from '../../CustomElement'

CustomElement.register({
    is: "time",
    properties:["current"],
    data: {
        now: "18h"
    },

    messages: [
        { action: "updateTime", payload: "currentTime" }
    ],

    events: {
        "sayTime": function(t) {
        },
        alert: function() {
            console.log("radical --> rest !")
        }
    },

    onInit() {
        this.root.style.border = "1px solid red"
        this.root.style.marginBottom = "5px"
        this.root.style.display = "block"
        const now = this.props.current === "now" ? new Date().getUTCDate() : this.props.current 
        this.data.now = now
    },

    onLink() {
        console.log("----/esS/--")
        console.log(this.props)
        /* should be call when the template  is appended to the dom */
        /* sender -> has an uniq id that the parent should now*/
        this.$send("updateTime", { now: "toto" })
    },
    messages({type, payload}) {
        switch (type) {
            case "toto": break
        }
    },
    /* When it is removed from the Dom */
    onUnlink() {
        console.log("--- unlink ---")
    },

    getTemplate() {
        return`
            <template>
                <style>
                    :host {
                        display : block;
                        border: 1px solid blue
                    }
                </style>
                <p>Put Template elsewhere!</p>
                this is the way is supposed to be!
                <p @click="alert">Click {now}!</p>
            </template>`
    }
})

/* alert */
export {}