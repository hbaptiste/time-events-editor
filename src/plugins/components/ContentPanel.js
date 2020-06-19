import CustomElement from '../../CustomElement'

CustomElement.register({
    is: "content-panel",

    properties: ["title", "messages"],
    events: {
        sayHello: () => {
            alert("-- radical --")
        }
    },
    data: {
        title: "Haïti!"
    },
    handleDuration: function(duration) {
        return `Patrovki ${duration}!`
    },

    onInit: function() {
        console.log(this.messages)
    },

    hello: () => {

    },

    test: () => {
        console.log("inside test!")
    },

    pipes: {
        handleFunction: (duration) => {
            console.log("blaz__")
        }
    },
    getTemplate: function() {
       return `<template>
                <style>
                    :host {
                        .radical-test {border: "1px solid red" }
                    }
                </style>
                <div style="border: 1px solid red">
                    <p @click="sayHello" class='radical-test'> My title: {title}!</p>
                    <ul class="main-list-wrapper">
                        <li km:foreach="item in messages">
                            <p>duration { item.duration | handleDuration }</p>
                            <p><em>Type : {item.type}</em>!</pw x>
                            <p @click="sayHello">content: {item.data.content}!</p> 
                            <span>{item.data.content}</span>
                        </li>
                    </ul>
                </div>
            </template>
        `
    }

})