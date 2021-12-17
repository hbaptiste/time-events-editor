import CustomElement from "../CustomElement";
import DomDataBinding from "../DomDataBinding";
import { timeToDuration } from "../Utils"

export default class ControlPlugin {
  
  constructor(uiManager) {
    this.uiManager = uiManager;
  }
  
  init() {
    const cb = this._createControllers();
    this.uiManager.signals.init.connect(cb);
  }

  _createControllers(ctx) {
    const ctlContainer = document.querySelector(".controls-wrapper");
    ctlContainer.innerHTML = this.getTemplate();
    const uiManager = this.uiManager;
   
    CustomElement.create({
      root: ctlContainer,
      data: {
        displayEventForm: false,
        displayRowForm: false,
        displayEventsList: false,
        displayContentViewer: true,
        rowTags: ["Author", "Harris", "radical"],
        messages: [],
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
          // messages from --> deal with update after
          this.$store.emit({type: "", payload: lastContent});
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
        const { messages, rateInfos } = this.$store.getState()
        // set the messages
        this.data.messages = messages;

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
          addNewEvent: (event) => {
            // clean message
            const {start, end} = event;
            event.duration = [timeToDuration(start), timeToDuration(end)]
            // console log indeed
            this.$store.emit({type: "NEW_CREATED_EVENT", payload: event})
          }
        });

        this.provide("eventActionsCtx", {
          registerEvent: registerEvent,
          updateContent: contentUpdater
        })
      },

      //use selector => return a new function with selector?
      onMessage: function({state, type, payload, $commit}) {
        if (type !== "NEW_CREATED_EVENT") { return }
        alert("--alert--")
        console.log("-- on message --");
        console.log("-- radical blaze --");
        console.log("-- type --")
        console.log(type, state);
        console.log(payload);
        const {messages=[]} = state;
        messages.push(payload)
        $commit({ ...state, messages});
      },

      _createEmptyEvent: function () {
        return {
          name: "First Event",
          start: "10mn",
          end: "20mn",
          tags: ["livre", "idées"],
          detail: "En dehors de tout ! How they did it !",
          type: "authors"
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
          console.log("-- nature --");
          console.log(this.data.event);
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
                <events-viewer @showIf="!displayEventForm" $events="messages"></events-viewer>
                <event-form style="display:none" @showIf="displayEventForm" $event="event"></event-form>
               </div>
            `;
    return eventTpl;
  }
}
