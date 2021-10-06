import Signal from "./Signal";
import lodash from "lodash";

export default class UiManager {
  constructor() {
    this.actionsStore = []; // action -> box
    this.pluginRegistry = [];
    this.eventContainer = document.querySelector("#eventContainer");
    this.controlContainer = document.querySelector("#actionsContainer");
    this.eventsList = [];
    this.signals = {
      init: Signal.create("ui.init"),
      eventCreated: Signal.create("ui.event.created")
    };
    this.reset();
  }
  reset() {
    this.eventContainer.innerHTML = "";
  }

  use(pluginClass) {
    if (typeof pluginClass !== "function") {
      return;
    }
    const instance = new pluginClass(this);
    instance.init();
    this.signals.init.emit(this.controlContainer); //use persistent
  }
  
  _createWrapper() {
    return document.createElement("div");
  }

  _createRow(data) {
    const { event } = data;
    const rowKey = lodash.chain(event.rowName).snakeCase();
    const previousRow = document.getElementById(`row_${rowKey}`);
    const rowName = lodash
      .chain(event.rowName)
      .upperFirst()
      .value();
    const wrapper = this._createWrapper();
    if (previousRow) {
      wrapper.appendChild(previousRow);
    } else {
      wrapper.innerHTML = `<div id="row_${rowKey}" class="row event-type">
                            <span class="row-name">${rowName}</span>
                        </div>`;
    }
    return wrapper;
  }
  _createItem(data) {
    
    const row = this._createRow(data).firstChild;
    const { event } = data;
   
    const itemTpl = `<span id='event_${event.rowName}_${event.start}' class='event-item color-1'>${event.label}</span>`;
    const itemWrapper = document.createElement("div");
    itemWrapper.innerHTML = itemTpl;
    const child = itemWrapper.firstChild;
    child.style.left = `${event.left}px`;
    child.style.width = `${event.width}px`;
    row.appendChild(child);
    this.eventContainer.appendChild(row);
    this.eventsList.push(child);
    this.signals.eventCreated.emit(child);
  }

  send(action) {
    this.actionsStore.push({ status: 0, action: action });
    this.checkActionBox();
  }

  checkActionBox() {
    const actions = this.actionsStore.filter(action => !action.status);
    actions.map(action => {
      this.dispatch(action);
    });
  }

  _selectItem(data) {
    const { event } = data;
    console.group(event)
    console.log(data)
    const eventID = `event_${event.rowId}_${event.start}`;
    const eventNode = document.getElementById(eventID);
    if (!eventNode) {
      return;
    }
    eventNode.classList.add("entered");
  }
  _unselectItem(data) {
    const { event } = data;
    const eventID = `event_${event.rowId}_${event.start}`;
    const eventNode = document.getElementById(eventID);
    if (!eventNode) {
      return;
    }
    eventNode.classList.remove("entered");
  }
  _createEvent(event) {
   
  }
  dispatch(payload) {
    const { action } = payload;
    switch (action.type) {
      case "START_EVENT":
        this._selectItem(action);
        break;
      case "END_EVENT":
        this._unselectItem(action);
        break;
      case "CREATE_EVENT":
        this._createEvent(action);
      case "NEW_EVENT":
        this._createItem(action);
        payload.action = 1;
        break;
      default:
        break;
    }
  }
}
