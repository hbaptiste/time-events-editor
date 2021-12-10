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
        duration: ["2s", "4s"],
        data: {
          type: "text",
          content: "1/ Le livre de Rolph Throuillot n'a pas été traduit en Français.",
        },
      },
      {
        type: "Livres",
        duration: ["20s", "50s"],
        data: {
          type: "text",
          content: "Différence structure.",
        },
      },
      {
        type: "Livres",
        samples: ["Radical", "Event One"],
        duration: ["30m", "35m"],
        data: {
          type: "text",
          content: "2/ How to deal with that.",
        },
      },
      {
        type: "Livres",
        samples: ["Blaze", "Nothing"],
        duration: ["6s", "2m"],
        data: {
          type: "text",
          content: "3/ now I have two books.",
        },
      },
      {
        type: "Livres",
        samples: ["Blaze", "Nothing"],
        duration: ["4m", "10m"],
        data: {
          type: "text",
          content: "4/ now I have Seven books.",
        },
      },
      {
        type: "auteur",
        samples: ["Radical blaze", "Indeed"],
        duration: ["2m", "10m"],
        data: { type: "text", content: "2/ Il s'agit de Surveiller et Punir" },
      },
      {
        type: "Reference",
        samples: ["Sensible", "Temps"],
        duration: ["5m", "15m"],
        data: {
          type: "text",
          content: "3/ Le livre de Rolph Throuillot n'a pas été traduit en Français.",
        },
      },
      {
        type: "Reference",
        samples: ["Sensible", "Temps"],
        duration: ["40m", "45m"],
        data: {
          type: "text",
          content: "3/ Le livre de Rolph Throuillot <silencing the past> n'a pas encore été traduit en Français.",
        },
      },
    ];
    CustomElement.create({
      root: ctlContainer,
      data: {
        displayEventForm: false,
        displayRowForm: false,
        displayEventsList: false,
        displayContentViewer: true,
        rowTags: ["Author", "Harris", "radical"],
        messages: [...messages],
        content: null,
        title: "Blaze again title !",
        event: null,
        uiManager
      },

      observeTag: function (eventName, eventEnd) {
        console.log("--- radical ---");
      },

      onInit: function () {
        const contentUpdater = (lastContent) => {
        this.data.content = lastContent;
        this.$store.emit({type: "NEW_CONTENT", payload: lastContent});
        };

        const registerEvent = (event) => {
          const [start, end] = event;
          uiManager.eventsRegistry.tl.onTick((event) => {
            this.$store.emit({ type: "START_EVENT", payload: event }) 
          }, start);
          uiManager.eventsRegistry.tl.onTick((event) => {
            this.$store.emit({ type: "END_EVENT", payload: event }) 
          }, end);
        }
        // test ticker
        const { uiManager } = this.data;
        
        const rateInfos = uiManager.eventsRegistry.rateInfos;
        uiManager.eventsRegistry.tl.onTick((e) => {
          const payload = {...e, rateInfos};
          this.$store.emit({ type: "NEW_TICK", payload }) 
        });

        // @todo -> Provider API : only provide for children
        this.provide("eventCtx", {
          messages: this.data.messages, //allow (func)
          title: this.data.title,
          registerEvent: registerEvent,
          closeForm: () => {
            this.data.displayEventForm = false;
          },
        });

        this.provide("eventActionsCtx", {
          registerEvent: registerEvent,
          updateContent: contentUpdater
        })
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
          const { eventContent, eventName, eventStart, eventEnd, selectedTag } = this.data;
          const eventRecord = Object.assign({}, { eventContent, eventName, eventStart, eventEnd });

          eventRecord.rowName = selectedTag;
          this.data.displayEventForm = false;
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
                <event-form style="display:none" @showIf="displayEventForm" $event="event">
                  <p>you better know strange</p>
                </event-form>
               </div>
            `;
    return eventTpl;
  }
}
