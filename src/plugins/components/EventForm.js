import CustomElement from "../../CustomElement";

CustomElement.register({
  is: "event-form",
  properties: ["event"],
  data: {
    startPosition: 1
  },

  onInit: function () {
    this.useProvider("eventCtx") // implementing alias
    console.log(this.$store.getState())
  },

  onStoreUpdated: function(key, value) {
    console.log("/* value */", key);
    console.log(value);
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.effectLoadEvent, ["event"]); // simplifier la notation
  /*  return [
      { "effectLoadEvent": ["event"] }, 
    ] */
  },

  createEmptyEvent: function () {
    return {};
  },

  effectLoadEvent: function (event) {
    if (!event) {
      return;
    }
    console.log("------- event-form -----");
    console.log(event);
  },
  
  events: {
    createEvent: function () {

      //console.log(this.event);
      //this.$injected.upda
      //this.$store.emit({type: "REGISTER_NEW_EVENT", payload: this.event})
      this.$injected.addNewEvent(this.event);
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
    }
  },

  getTemplate: function () {
    return `<template>
                <div class="event-form-control" style="border: 1px solid red">
                    <span class="clsBtn" @click="close">X</span>
                  <div class="fixed">
                    <label class="field-label">
                      Event name
                      <input @model="event.name" class="event-name" /> 
                    </label>
                    <label class="field-label steps">
                      Start at: <input @model="event.start" type="time" value="00:00:00" step="1" class="slider">
                    </label>
                    <label class="field-label steps">
                     / End at <input @model="event.end" type="time" value="00:00:00" step="1" "class="slider">
                    </label>
                    <div>
                      <textarea class="event-content" @model="event.detail">This is my content...</textarea>
                      <p><span>tag</span>: Harris, baptiste, strange</p>
                    </div>
                  </div>
                  <p><button @click="createEvent" id="createBtn">Créer</button></p>
               </div>
            </template>`;
  },
});
