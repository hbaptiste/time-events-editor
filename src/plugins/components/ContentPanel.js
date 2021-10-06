import { template } from "lodash";
import CustomElement from "../../CustomElement";

const myStyle = {
  root: {
    border: "1px solid gray",
    "& .main-list-wrapper": {
      "list-style": "none",
      "border-bottom": "1px solid light-gray",
    },
  },
};

const componentStyle = function (theme) {
  return {
    root: {
      position: "relative",
      border: "1px solid gray",
      "& .main-list-wrapper": {
        "list-style": "none",
        "border-bottom": "1px solid light-gray",
        padding: "5px",
      },
      "max-height": "500px",
      overflow: "hidden",
    },
    btn: {
      display: "flex",
      "flex-direction": "row",
      position: "absolute",
      top: 0,
      right: "5px",
      background: "white",
      color: "black",
    },
    list: {
      "border-bottom": "1px solid gray",
      "margin-bottom": "5px",
    },
  };
};

CustomElement.register({
  is: "content-panel",
  properties: ["title", "messages"],
  getStyle: () => componentStyle(),
  data: {
    title: "Haïti!",
    messagesList: [],
    init: false,
  },
  events: {
    onAdd: function (event) {
      const msg = this._createMessage();
      this.data.title = "Title radical!";
      this.data.messagesList = [...this.data.messagesList, msg]; //use a dispatcher
    },

    onRemove: function (event, item) {
      const previousMessage = [...this.data.messagesList];
      const index = previousMessage.indexOf(item);
      previousMessage.splice(index, 1);
      this.data.messagesList = [...previousMessage];
    },

    sayHello: function () {
      alert("you better know!");
    },

    onClear: function (ctx) {
      ctx.data.messagesList = [];
    },
  },
  _createMessage: function () {
    return {
      type: "New type",
      duration: ["12m", "30m"],
      data: { type: "text", content: "This is it/You better know!" },
    };
  },

  handleDuration: function (duration) {
    const [start, end] = duration;
    return `Start at <strong>${start}</strong>end at <strong>${end}</strong>!`;
  },

  onInit: function () {
    this.data.messagesList = this.messages;
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.loadData, ["messages", "init"]);
  },

  loadData: function (messages, init) {
    if (init) {
      return false;
    }

    setTimeout(() => {
      this.data.init = true;
    }, 2000);
  },

  getTemplate: function (classes) {
    return `<template></template>;`;
    /*return `<template>
              <div class='${classes.root}'>
                    <ul class="main-list-wrapper">
                        <li class="${classes.list}" @click="onRemove($event, item)" km:foreach="item in messagesList">
                            <p class="${classes.paragraph}">
                                mon titre->{title}
                            </p>
                            <p>duration { item.duration | handleDuration }</p>
                            <p><em>Type : {item.type}</em>!</pw x>
                            <p>content: {item.data.content}!</p> 
                            <span>{item.data.content}</span>
                        </li>
                    </ul>
                    <div class="${classes.btn}">
                        <p class='btn'><a @click="onAdd">Add</a></p>
                        <p class='btn'><a @click="onClear">Clear All</a></p>
                    </div>
                </div>
            </template>
        `;*/
  },
});
