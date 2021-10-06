import CustomElement from "../../CustomElement";

/** @todo 
 * - ajouter le style
 * - ajouter décorator
*/
CustomElement.register({
  is: "events-viewer",
  properties: ["events"],
  getStyle: function () {
    return {
      root: {
        border: "1px solid red",
        background: "white",
      },
    };
  },
  data: {
    cleanEvents: [],
    cursorPosition: 0
  },

  onInit: function () {
    this.data.events = this.events;
    let cpt = 1;
    setInterval(() => {
      cpt = cpt + 1; // cumul sec 
      this.data.cursorPosition = cpt
    }, 70);
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.handleEvents, ["events"]); // simplifier la notation
  },
  
  onMessage({type, payload}) { 
    switch(type) {
      case "NEW_TICK":
    }
  },

  handleEvents: function(events) {
    if (!events) { return }
    this.data.cleanEvents = events.reduce((acc, event) => {
      const evLists = acc[event.type] || [];
      evLists.push(event)
      acc[event.type] = evLists;
      return acc;
    }, {});
  },
  
  // when cursorPosition changes -> update style
  indicatorStyle: function(cursorPosition) {
    return {
      left: Math.ceil(cursorPosition) + "px"
    }
  },

  getTemplate: function () {
    return `
            <template>
            <div class="main-wrapper" style="position: relative">
              <div class="main-time-indicator" @style="indicatorStyle(cursorPosition)"></div>
                  <div class="component events-container">
                      <div km:foreach="event in cleanEvents" class="event-row-wrapper">
                        <p class="row event-title">{$key}</p>
                        <events-row $eventsrow="event" class="event-row"></event-row>
                      </div>
                  </div>
              </div>
            </div>
            </template>`;
  },
});
