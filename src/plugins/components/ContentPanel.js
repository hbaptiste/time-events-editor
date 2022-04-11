import CustomElement from "../../CustomElement";

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
      width: "500px",
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
  properties: ["title", "content"],
  getStyle: () => componentStyle(),
  data: {
    title: "Dernier cours!",
    contentList: [],
    init: false,
  },
  events: {
    onAdd: function (event) {
      const msg = this._createMessage();
    },

    onRemove: function (event, item) {
      const previousMessage = [...this.data.messagesList];
      const index = previousMessage.indexOf(item);
      previousMessage.splice(index, 1);
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
    this.useProvider("contentCtx");
  },

  onLinked: function () {
    // alert(`${this.is} - isLinked!`);
  },

  handleContent: function (newContent) {
    if (!newContent) {
      return;
    }
    this.data.contentList = [...this.data.contentList, newContent]; // ajouter $push,$remove
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.handleContent, ["content"]); // simplifier la notation
    this.registerSideEffects(this.loadData, ["messages", "init"]);
  },

  loadData: function (messages, init) {
    if (init) {
      return false;
    }
  },

  onMessage: function ({ type, payload }) {
    switch (type) {
      case "NEW_CONTENT":
        this.content = payload;
    }
  },

  getTemplate: function (classes) {
    return `<template>
              <div class='${classes.root}'>
                <ul class="main-list-wrapper">
                    <li class="${classes.list}" @click="onRemove($event, t)" km:foreach="t in contentList">
                        <p class="${classes.paragraph}">
                            mon titre->{title}
                        </p>
                        <p>duration { t.duration | handleDuration }</p>
                        <p><em>Type : {t.type}</em>!</p>
                        <span>{t.data.content}</span>
                    </li>
                </ul>
                <div class="${classes.btn}">
                    <p class='btn'><a @click="onAdd">Add</a></p>
                    <p class='btn'><a @click="onClear">Clear All</a></p>
                </div>
              </div>
            </template>
        `;
  },
});
