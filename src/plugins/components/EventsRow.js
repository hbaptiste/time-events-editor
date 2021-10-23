import CustomElement from "../../CustomElement";
import EventItem from "./EventItem";

CustomElement.register({
  is: "events-row",
  properties: ["eventsrow"],
  data: {},
  getTemplate: function () {
    return `<template>
              <div style="display: flex;">
                <event-item km:foreach="evt in eventsrow" $item="evt" @key="strange"=></event-item>      
              </div>
            </template>`;
  },
});
