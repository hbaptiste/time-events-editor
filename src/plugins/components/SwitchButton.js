import CustomElement from "../../CustomElement";

CustomElement.register({
  is: "switch-button",

  properties: ["defaultChecked", "disabled", "label", "onChange"],

  onInit: function () {
    setTimeout(() => {
      console.log(this);
    }, 3000);
  },

  data: {
    checked: null,
  },

  events: {
    handleChange: function (evt) {
      this.data.checked = evt.target.checked;
      console.log("-- u better know --");
      console.log(this.data.checked);
      if (typeof this.onChange == "function") {
        this.onChange({ detail: this.data.checked });
      }
    },
  },

  getTemplate: () => {
    return `<template>
        <label class="switch">
            <input @event:change="handleChange" type="checkbox" checked>
            <span class="slider round"></span>
        </label>
    </template>
    `;
  },
});
