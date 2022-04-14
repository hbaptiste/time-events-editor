import CustomElement from "../../CustomElement";
import "./TagEditor";

CustomElement.register({
  is: "event-form",
  properties: ["event"],
  data: {
    startPosition: 1,
  },

  providers: ["eventCtx"], // @todo

  onInit: function () {
    this.useProvider("eventCtx"); // use provider
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.effectLoadEvent, ["event"]); // simplifier la notation
  },

  createEmptyEvent: function () {
    return {};
  },

  effectLoadEvent: function (event) {
    console.log(" > effect load event <");
    console.log(event);
    console.log("-------------");
    if (!event) {
      return;
    }
    this.data.evt = event;
  },

  onLinked: function () {
    // alert(`${this.is} - isLinked!`);
  },
  _validateEvent: function (event) {
    const errors = [];
    if (event.type.trim().length == 0) {
      errors.push("A type must me provided");
    }
    console.log("duration");
    console.log(event);
    /*if (!Array.isArray(tags) && tags.length == 0) {
      errors.push("A tag must me provided");
    }*/
    return errors;
  },

  events: {
    createEvent: function () {
      const errors = this._validateEvent(this.data.evt);

      if (errors.length !== 0) {
        alert(errors.join(", "));
        return;
      }
      this.$injected.addNewEvent(this.data.evt);
      this.$injected.closeForm();
    },

    close: function () {
      this.$injected.closeForm(); // injected
    },

    reset: function () {},

    _handleStartChange: function (event) {
      this.data.startPosition = event.target.value;
    },

    _handleEndChange: function (event) {
      this.data.end;
    },

    _handleType: function (event) {
      const value = event.target.value.trim();
      this.data.evt = { ...this.data.evt, type: value };
    },
  },

  getTemplate: function () {
    return `<template>
                <div class="event-form-control" style="border: 1px solid red">
                    <span class="clsBtn" @click="close">X</span>
                  <div class="fixed">
                    <tag-editor $title="Event Type" @event:change="_handleType" $item=""></tag-editor>
                    <label class="field-label">
                      Event name
                      <input role="event-name" @model="evt.name" class="event-name" /> 
                    </label>
                    <label class="field-label steps">
                      Start at: <input role="event-start" @model="evt.start" type="time" value="00:00:00" step="1" class="slider">
                    </label>
                    <label class="field-label steps">
                     / End at <input role="event-end" @model="evt.end" type="time" value="00:00:00" step="1" "class="slider">
                    </label>
                    <div>
                      <textarea role="event-detail" class="event-content" @model="evt.detail"></textarea>
                    </div>
                  </div>
                  <p><button role="event-create" @click="createEvent" id="createBtn">Créer</button></p>
               </div>
            </template>`;
  },
});
