import CustomElement from "../../CustomElement";
import EventItem from "./EventItem";

CustomElement.register({
  is: "events-row",

  properties: ["eventsrow"],

  data: {},

  onInit: function () {
    console.log("-- on init --", this.is);
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.handleEventRow, ["eventsrow"]); // simplifier la notation
  },

  handleEventRow: function (eventsrow) {
    console.log("-- handleEventRow --", arguments);
  },

  onLinked: function () {},

  getTemplate: function () {
    return `<template>
              <div class="event-item-container">
                <event-item km:foreach="evt in eventsrow" $item="evt"></event-item>
              </div>
            </template>`;
  },
});
