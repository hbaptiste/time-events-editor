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

}
