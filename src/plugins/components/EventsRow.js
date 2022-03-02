import CustomElement from "../../CustomElement";
import EventItem from "./EventItem";

CustomElement.register({
  is: "events-row",
  
  properties: ["eventsrow"],
  
  data: {},
  
  onInit: function() {},
 
  onLinked: function() {
    // alert(`${this.is} - isLinked!`);
 },

  getTemplate: function () {
    return `<template>
              <div class="event-item-container">
                <event-item km:foreach="evt in eventsrow" $item="evt"></event-item>
              </div>
            </template>`;
  },
});
