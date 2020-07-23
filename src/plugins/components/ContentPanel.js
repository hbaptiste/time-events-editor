import CustomElement from '../../CustomElement'

CustomElement.register({
    is: "content-panel",
    properties: ["title", "messages"],
    data: {
        title: "Haïti!",
        messagesList: []
    },
    events: {
        
        onAdd: (ctx) => {
            console.log("-- radical --")
            const msg = ctx._createMessage()
            ctx.data.title = " Title radical! "
            ctx.data.messagesList = [...ctx.data.messagesList,msg]
           
        },
        
        onRemove: function() {
            console.log("== radical ==")
            console.log(this)
        },

        sayHello: () => {
            alert("you better know!")
        }
    },
    _createMessage: function() {
        return {
            type: "Auteur",
            duration: ["12m","30m"],
            data: {type: "text", content: "You better know!"}
        }
    },
    handleDuration: function(duration) {
        const [start, end] = duration
        return `Start at ${start} end at ${end}!`
    },

    onInit: function() {
        this.data.messagesList = this.messages
        
    },
    test: () => {
        console.log("inside test!")
    },

    getTemplate: function() {
       return html`<template>
                    <style>
                        :host {
                            .radical-test { border: "1px solid red" }
                        }
                        .list { border: 1px solid red }
                    </style>
                    <div class="list">
                        <ul class="main-list-wrapper">
                            <li @click="sayHello" km:foreach="item in messagesList">
                                <p>mon titre->{title}</p>
                                <p>duration { item.duration | handleDuration }</p>
                                <p><em>Type : {item.type}</em>!</pw x>
                                <p @click="sayHello">content: {item.data.content}!</p> 
                                <span>{item.data.content}</span>
                            </li>
                        </ul>
                    <p>Add one element:<a @click="onAdd">Add</a></p> |
                    <p>Remove one element:<a @click="onRemove">Remove</a></p>
                    </div>
                </template>
        `
    }

})