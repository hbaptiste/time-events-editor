import CustomElement from "../CustomElement";
import DomDataBinding from "../DomDataBinding";

export default class ControlPlugin {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this._bindEvents();
  }

  _bindEvents() {
    const cb = this._createControllers();
    this.uiManager.signals.init.connect(cb);
  }

  init() {}

  _createControllers(ctx) {
    const ctlContainer = document.querySelector(".controls-wrapper");
    ctlContainer.innerHTML = this.getTemplate();
    const uiManager = this.uiManager;
    const messages = [
      {
        type: "Livres",
        samples: ["Radical", "Event One"],
        duration: ["1m", "20m"],
        data: {
          type: "text",
          content: "1/ Le livre de Rolph Throuillot n'a pas été traduit en Français.",
        },
      },
      {
        type: "Livres",
        samples: ["Radical", "Event One"],
        duration: ["1m", "20m"],
        data: {
          type: "text",
          content: "2/ How to deal with that.",
        },
      },
      {
        type: "Livres",
        samples: ["Blaze", "Nothing"],
        duration: ["1m", "20m"],
        data: {
          type: "text",
          content: "3/ now I have two books.",
        },
      },
      {
        type: "Livres",
        samples: ["Blaze", "Nothing"],
        duration: ["1m", "20m"],
        data: {
          type: "text",
          content: "4/ now I have Seven books.",
        },
      },
      {
        type: "auteur",
        samples: ["Radical blaze", "Indeed"],
        duration: ["1m", "20m"],
        data: { type: "text", content: "2/ Il s'agit de Surveiller et Punir" },
      },
      {
        type: "Reference",
        samples: ["Sensible", "Temps"],
        duration: ["1m", "20m"],
        data: {
          type: "text",
          content: "3/ Le livre de Rolph Throuillot n'a pas été traduit en Français.",
        },
      },
    ];
    CustomElement.create({
      root: ctlContainer,
      data: {
        displayEventForm: false,
        displayRowForm: false,
        displayEventsList: true,
        rowTags: ["Author", "Harris", "radical"],
        messages: [...messages],
        title: "Blaze again title !",
        event: null,
        uiManager
      },

      observeTag: function (eventName, eventEnd) {
        console.log("--- radical ---");
      },

      onInit: function () {
        const messageUpdater = (message) => {
          const _message = {
            type: "Citation",
            duration: [message.start, message.end],
            data: {
              type: "text",
              content: message.detail,
            },
          };
          this.data.messages = [...this.data.messages, _message];
        };
        // test ticker
        console.log("-- ui manager --");
        const { uiManager } = this.data;
        /* you better know in tick */
        uiManager.eventsRegistry.tl.onTick((e) => {
          console.log("-- event Registry --");
          console.log(e);
          //this.dispacth({type:NEW_TICK, payload:{position:e}})
          // receive(type) 
        });

        // Provider APIs --> only provide for children
        this.provide("eventCtx", {
          messages: this.data.messages,
          title: this.data.title,
          updateMessage: messageUpdater,
          closeForm: () => {
            this.data.displayEventForm = false;
          },
        });
      },

      _createEmptyEvent: function () {
        return {
          name: "First Event",
          start: "10mn",
          end: "20mn",
          tags: ["livre", "idées"],
          detail: "En dehors de tout ! How they did it !",
        };
      },

      events: {
        showRowForm: function (data, e) {
          data.displayRowForm = true;
        },

        createNewRow: function ({ data }, e) {
          //prevent from adding the same name
          data.rowTags = [data.newRowName, ...data.rowTags];
          data.displayRowForm = false;
          data.selectedTag = data.newRowName; // handle domChange
        },

        _handleItemSelection: function (time) {
          console.log("current time is " + time);
        },

        showEventForm: function () {
          this.data.displayEventForm = true;
          this.data.event = this._createEmptyEvent();
        },

        createEvent: (event, second) => {
          const { eventContent, eventName, eventStart, eventEnd, selectedTag } = data;
          const eventRecord = Object.assign({}, { eventContent, eventName, eventStart, eventEnd });

          eventRecord.rowName = selectedTag;
          data.displayEventForm = false;
          this.uiManager.eventsRegistry.createEventFromData(eventRecord);
        },

        reset: function () {},

        close: function ({ data }, evt) {
          data.displayEventForm = false;
        },
      },
    });
  }

  getTemplate() {
    const eventTpl = `
              <div class="root">
                <button class="newEventBtn" @click="showEventForm">[+]Create Event</button>
                <events-viewer $events="messages"></events-viewer>
                <event-form @showIf="displayEventForm" $event="event">
                  <p>you better know</p>
                </event-form>
                <content-panel @showIf="displayEventsList" title="Radical blaze title!" $messages="messages" $on-select="_handleItemSelection"></content-panel>
               </div>
            `;
    return eventTpl;
  }
}
