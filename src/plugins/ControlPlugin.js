import DomDataBinding from "../DomDataBinding";

export default class ControlPlugin {

  constructor(uiManager) {
    this.uiManager = uiManager;
    this._bindEvents();
  }

  _bindEvents() {
    const cb = this._createControllers.bind(this);
    this.uiManager.signals.init.connect(cb);
  } 

  init() {
    const events = this.uiManager.eventsList;
    events.map(eventNode => {
      eventNode.addEventListener("click", e => {
        console.log("--- event ---");
        console.log(eventNode);
      });
    });
  }

  _createControllers() {
    const ctlContainer = document.querySelector(".controls-wrapper");
    ctlContainer.innerHTML = this._newEventTemplate();
    console.log(this.uiManager.eventsRegistry._parseTime("2m34"));
    console.log(this.uiManager.eventsRegistry._parseTime("34s"));
    console.log(this.uiManager.eventsRegistry._parseTime("55m"));
    console.log(this.uiManager.eventsRegistry._parseTime("1m"));
    console.log(this.uiManager.eventsRegistry._parseTime("1h21"));
    const messages = [
      { type: "Livres", duration:["1m","20m"], data: {type: "text", content: "1/ Le livre de Rolph Throuillot n'a pas été traduit en Français." } },
      { type: "auteur", duration:["1m","20m"], data: {type: "text", content: "2/ Il s'agit de Surveiller et Punir" } },
      { type: "Reference", duration:["1m","20m"], data: {type: "text", content: "3/ Le livre de Rolph Throuillot n'a pas été traduit en Français." } }
      ]
   DomDataBinding.create({
      root: ctlContainer,
      data: {
        displayEventForm: false,
        displayRowForm: false,
        newRowName: "",
        eventName: "",
        eventStart: "",
        eventEnd: "",
        eventContent: "",
        rowTags: ["Author", "Harris", "radical"],
        selectedTag: "radical",
        now: "wrong data",
        messages: messages,
        title: "Radical!"
      },

      messages: [{ action: "sayHello", payloads: [] }], // Intégrer passage de message

      observeTag: function(eventName, eventEnd) {
        console.log("--- radical ---");
      },
      
      events: {
        showRowForm: function(data, e) {
          data.displayRowForm = true;
        },

        createNewRow: function(data, e) {
          //prevent from adding the same name
          data.rowTags = [data.newRowName, ...data.rowTags];
          data.displayRowForm = false;
          data.selectedTag = data.newRowName //handle domChange
          /* add new messages */
          const message = this._createMessage()
          console.log(message)
        },
        _createMessage: function() {
          return Object.create({
            type: "test",
            duration: [],
            data: {type:"audio", "content":"/sd/sd/sd.mp3"}
          })
        },

        _handleTagChange: function(data, e) {
          // dispath({message: "new_tag", payload: ""}) -->
        },

        _handleItemSelection: function(time) {
          console.log("current time is " + time )
        },

        showEventForm: (data, e) => {
          data.displayEventForm = true;
        },

        createEvent: (data) => {
          const { eventContent, eventName, eventStart, eventEnd, selectedTag } = data;
          const eventRecord = Object.assign({}, { eventContent, eventName, eventStart, eventEnd });
          
          eventRecord.rowName = selectedTag;
          data.displayEventForm = false;
          console.log(eventRecord)
          this.uiManager.eventsRegistry.createEventFromData(eventRecord);
        },
        reset: function() {},
        close: function(data, evt) {
          data.displayEventForm = false;
        }
      
      
      },

    });
  }

  _newEventTemplate() {
    const eventTpl =`
              <div>
                <button class="newEventBtn" @click="showEventForm">[+]Create Event</button>
                <div class="event-form-control" @showIf="displayEventForm">
                  <span class="clsBtn" @click="close">X</span>
                  <p km:value="display"></p>
                  <div>
                    <p>infos: {selectedTag}, {eventStart}, {eventEnd} {eventName}!</p>
                    <p>My content:</p>
                    <div>{eventContent}</div>              
                  </div>
                 <span>Tag</span>
                  <div @showIf="!displayRowForm">
                    <select km:model="selectedTag">
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
                      <span km:model="eventName" class="editable-content" contenteditable="true">Event Name</span> 
                        started at
                      <span km:model="eventStart" type="" class="editable-content" contenteditable="true">1.23</span>
                        end at
                      <span km:model="eventEnd" type="" class="editable-content" contenteditable="true">2.3</span>.
                    </p>
                    <div>
                      <textarea km:model="eventContent">This is my content...</textarea>
                    </div>
                 </div>
                 <p><button @click="createEvent" id="createBtn">Créer</button></p>
               </div>
               <content-panel title="Radical blaze title!" $messages="messages" $on-select="_handleItemSelection"></content-panel>
           </div>
            `;
    return eventTpl;
  }
}
