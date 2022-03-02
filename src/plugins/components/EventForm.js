import CustomElement from "../../CustomElement";
import "./TagEditor";

CustomElement.register({
  is: "event-form",
  properties: ["event"],
  data: {
    startPosition: 1
  },

  providers: ["eventCtx"], // @todo

  onInit: function () {
    this.useProvider("eventCtx")// use provider
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.effectLoadEvent, ["event"]); // simplifier la notation
  },

  createEmptyEvent: function () {
    return {};
  },

  effectLoadEvent: function (event) {
    if (!event) {
      return;
    }
    this.data.evt = event;
    //sthis.event = event;
  },
  
  onLinked: function() {
    // alert(`${this.is} - isLinked!`);
 },
  
  events: {
    createEvent: function () {

      //this.$store.emit({type: "REGISTER_NEW_EVENT", payload: this.data.evt})
      // console.log("----..-------");
      // console.log(this.data.evt);
      this.$injected.addNewEvent(this.data.evt);
      this.$injected.closeForm();
    },

    close: function () {
      this.$injected.closeForm(); // injected
    },

    _handleStartChange: function(event) {
      this.data.startPosition = event.target.value;
    },

    _handleEndChange: function(event) {
      this.data.end
    },

    _handleType: function(event) {

      const value = event.target.value.trim();
      this.data.evt = { ...this.data.evt, type: value };
    }
  },

  getTemplate: function () {
    return `<template>
                <div class="event-form-control" style="border: 1px solid red">
                    <span class="clsBtn" @click="close">X</span>
                  <div class="fixed">
                    <tag-editor $title="Event Type" @event:change="_handleType"></tag-editor>
                    <label class="field-label">
                      Event name
                      <input @model="evt.name" class="event-name" /> 
                    </label>
                    <label class="field-label steps">
                      Start at: <input @model="evt.start" type="time" value="00:00:00" step="1" class="slider">
                    </label>
                    <label class="field-label steps">
                     / End at <input @model="evt.end" type="time" value="00:00:00" step="1" "class="slider">
                    </label>
                    <div>
                      <textarea class="event-content" @model="evt.detail">This is my content...</textarea>
                    </div>
                  </div>
                  <p><button @click="createEvent" id="createBtn">Créer</button></p>
               </div>
            </template>`;
  },
});
