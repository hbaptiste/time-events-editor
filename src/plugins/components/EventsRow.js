import CustomElement from "../../CustomElement";
import EventItem from "./EventItem";

CustomElement.register({
  is: "events-row",
  properties: ["eventsrow"],
  data: {},
  onInit: function() {
    console.log("-- on Init [eventsrow]--");
  },
  getTemplate: function () {
    return `<template>
              <div class="event-item-container">
                <event-item km:foreach="evt in eventsrow" $item="evt" @key="strange"></event-item>
              </div>
            </template>`;
  },
});
