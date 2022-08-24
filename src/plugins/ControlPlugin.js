import CustomElement from "../CustomElement";
import DomDataBinding from "../DomDataBinding";
import { timeToDuration } from "../Utils";
import { selectMessages, selectSpecialPosition } from "./selectors";
import { cloneDeep } from "lodash";
import "../plugins/components/SwitchButton";

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
        title: "Blaze again title Harris !",
        event: null,
        uiManager,
      },

      observeTag: function (eventName, eventEnd) {
        console.log("--- radical ---");
      },

      onInit: function () {
        //new Message should be observed
        this.$store.select([selectMessages, selectSpecialPosition]).watch((messages) => {
          if (this.data.messages !== messages) {
            this.data.messages = messages; // @add guard
          }
        });
        // --> execute x => func, si selectMessage change
        const contentUpdater = (lastContent) => {
          // messages from --> deal with update after
          this.data.content = lastContent;
          this.$store.emit({ type: "NEW_SELECTED_CONTENT", payload: lastContent });
        };

        const registerEvent = (event) => {
          const [start, end] = event;

          uiManager.eventsRegistry.tl.onTick((event) => {
            this.$store.emit({ type: "START_EVENT", payload: event });
          }, start);

          uiManager.eventsRegistry.tl.onTick((event) => {
            this.$store.emit({ type: "END_EVENT", payload: event });
          }, end);
        };
        // test ticker
        const { uiManager } = this.data;
        const { messages, rateInfos } = this.$store.getState();
        // set the messages
        this.data.messages = cloneDeep(messages);

        uiManager.eventsRegistry.tl.onTick((e) => {
          const payload = { ...e, rateInfos };
          this.$store.emit({ type: "NEW_TICK", payload });
        });

        // @todo -> Provider API : only provide for children
        this.provide("eventCtx", {
          messages: [], //this.data.messages, //allow (func)
          title: this.data.title,
          registerEvent: registerEvent,

          closeForm: () => {
            this.data.displayEventForm = false;
          },

          addNewEvent: (event) => {
            // clean message
            const { start, end } = event;
            const newEvent = {
              type: event.type,
              duration: [timeToDuration(start), timeToDuration(end)],
              data: { type: "text", content: event.detail },
            };
            // console log indeed

            this.$store.emit({ type: "NEW_CREATED_EVENT", payload: newEvent });
          },
        });

        this.provide("eventActionsCtx", {
          registerEvent: registerEvent,
          updateContent: contentUpdater,
        });
      },

      //use selector => return a new function with selector?
      onMessage: function ({ state, type, payload, $commit }) {
        if (type !== "NEW_CREATED_EVENT") {
          return;
        }
        const { messages = [] } = state;
        const _messages = cloneDeep(messages);
        // messages
        _messages.push(payload);
        $commit({ ...state, messages: _messages });
      },

      _createEmptyEvent: function () {
        return {
          name: "",
          start: "",
          end: "",
          detail: "",
          type: "",
          tags: [],
        };
      },

      events: {
        showRowForm: function (data, e) {
          data.displayRowForm = true;
        },

        handleChange: function () {
          alert("radical blazeoo");
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
    return `
              <div class="root">
                <button class="newEventBtn" @click="showEventForm">[+]Create Event</button>
                <switch-button @event:onChange="handleChange" label="strange"></switch-button>
                <events-viewer @showIf="!displayEventForm" $events="messages"></events-viewer>
                <event-form style="display:none" @showIf="displayEventForm" $event="event"></event-form>
               </div>
            `;
  }
}
