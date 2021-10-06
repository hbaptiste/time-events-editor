import CustomElement from "../../CustomElement";

CustomElement.register({
  is: "events-row",
  properties: ["eventsrow"],
  data: {},

  onInit: function () {},

  declareSideEffects: function () {
    this.registerSideEffects(this.handleEvents, ["eventsrow"]); // simplifier la notation
  },
  
  handleEvents: function(rows) {
    console.log("/r|r/");
    console.log(rows);
    console.log("----");
  },

  // to fix
  handleDuration: function(duration) {
    console.log("-- dur/at/ion --");
    console.log(duration);
  },

  events: {
    sayHello: function(e, event) {
      console.log(e, event);
    }
  },

  getTemplate: function () {
    return `<template>
              <div style="display: flex;">
                <div km:foreach="evt in eventsrow" class="event-item">
                  <p> {evt.data.content} duration {evt.duration} </p>
                </div>           
              </div>
            </template>`;
  },
});
