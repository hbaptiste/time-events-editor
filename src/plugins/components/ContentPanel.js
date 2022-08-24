import CustomElement from "../../CustomElement";

import fakeContent from "./fake";
import getKVStore from "../../KVStore";
/**
 *
 * handle past node
 *
 *
 */

const componentStyle = function (theme) {
  return {
    root: {
      position: "relative",
      "& .main-list-wrapper": {
        "list-style": "none",
        padding: "15px",
        border: "light-gray",
        minHeight: "400px;",
        maxHeight: "600px;",
      },
      width: "500px",

      overflow: "hidden",
    },
    btn: {
      display: "flex",
      "flex-direction": "row-inverse",
      top: 0,
      right: "5px",
      background: "white",
      color: "black",
      "border-bottom": "1px solid lightgray",
      "& .btn": {
        border: "1px solid gray",
      },
    },
    list: {
      "margin-bottom": "10px",
    },
    type: {
      background: "#dddddd",
      color: "#666666",
      display: "inline-block",
      "border-radius": "5px",
      padding: "1px 3px 1px 3px",
      "margin-left": "5px",
    },
  };
};

CustomElement.register({
  is: "content-panel",
  properties: ["title", "content", "onselect"],
  getStyle: () => componentStyle(),
  data: {
    title: "Dernier cours!",
    contentList: [],
    init: false,
  },
  events: {
    onAdd: function (event) {
      const msg = this._createMessage();
      this.data.contentList = [msg, ...this.data.contentList];
      console.log("---Radical blaze ---");
      //console.log(this.onselect("sss"));
      console.log(this.onselect());
      console.log("-- -replace- --");
    },

    onRemove: function (event, item) {
      const previousMessage = [...this.data.contentList];
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
    console.log("fakeData-->", fakeContent);
    return {
      type: "Livre",
      duration: ["12m", "30m"],
      tags: ["litterature", "retour", "Katia"],
      data: { type: "text", content: fakeContent },
    };
  },

  handleDuration: function (duration) {
    const [start, end] = duration;
    alert("radical blaze");
    return `Start at <strong>${start}</strong>end at <strong>${end}</strong>!`;
  },

  onInit: function () {
    this.useProvider("contentCtx");
  },

  onLinked: function () {
    //alert(`${this.is} - isLinked!`);
  },

  handleContent: function (newContent) {
    if (!newContent) {
      return;
    }
    this.data.contentList = [...this.data.contentList, newContent]; // ajouter $push,$remove
  },
  handleTag: (tags) => {
    console.log("-- srange --");
    console.log(tags);
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
      case "NEW_SELECTED_CONTENT":
        this.content = payload;
    }
  },

  getTemplate: function (classes) {
    return `<template>
              <div class='${classes.root} content-panel'>
              <div class="${classes.btn}">
                <p class='btn'><a @click="onAdd">Add</a></p>
                <p class='btn'><a @click="onClear">Clear All</a></p>
              </div>
              <ul class="main-list-wrapper">
                  <li class="${classes.list} content-item" @click="onRemove($event, t)" km:foreach="t in contentList">
                      <p><span>{ t.duration | handleDuration }</span><span class="${classes.type}">{t.type}</span></p>
                      <p>{t.data.content}</p>
                      <span km:foreach="tag in t.tags" class="category">{tag}</span>
                  </li>
              </ul>
              </div>
            </template>
        `;
  },
});
