import CustomElement from "../../CustomElement";

CustomElement.register({
  is: "event-form",
  properties: ["event"],
  data: {},

  onInit: function () {
    this.useProvider("eventCtx") //implementing alias
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
      this.$injected.updateMessage(this.event);
      this.$injected.closeForm();
    },

    close: function () {
      this.$injected.closeForm(); // injected
    },
  },

  getTemplate: function () {
    return `<template>
                <div class="event-form-control" style="border: 1px solid red">
                  <span class="clsBtn" @click="close">X</span>
                  <div>
                    <p>infos: {event.start}, {event.end} {event.name}!</p>
                    <div> My content: {event.detail}</div>              
                  </div>
                 <span>Tag</span>
                  <div @showIf="!displayRowForm">
                    <select @model="selectedTag">
                      <option km:foreach="item in rowTags" renderer="_handleOption">
                        Patrov {item} options!
                      </option>
                    </select>
                    <span class="addRowCls" @click="showRowForm">[+]</span>
                  </div>
                 <div  @showIf="displayRowForm">
                  <span km:model="newRowName" style="display: inline-block; width: 100px; border: 1px solid gray" class="" contenteditable></span>
                  <span class="addRowCls" @click="createNewRow">[+]</span>
                 </div>

                  <div class="fixed">
                    <p> 
                      <span>Create a new event started :</span>
                      <span @model="event.name" class="editable-content" contenteditable="true">Event Name</span> 
                        started at
                        <div style="border: 1px solid red">
                          <p>{event.name}</p>
                          <p>{event.name}</p>
                          <p>{event.detail}</p>
                        </div>
                      <span @model="event.start" class="editable-content" contenteditable="true">1.23</span>
                        end at
                      <span @model="event.end" class="editable-content" contenteditable="true">2.3</span>.
                    </p>
                    <div>
                      <textarea @model="event.detail">This is my content...</textarea>
                    </div>
                  </div>
                  <p><button @click="createEvent" id="createBtn">Créer</button></p>
               </div>
            </template>`;
  },
});
