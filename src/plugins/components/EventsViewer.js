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

  onInit: function () {},

  declareSideEffects: function () {
    this.registerSideEffects(this.handleEvents, ["events"]); // simplifier la notation
  },

  onMessage({type, state, payload, $commit}) { 
    switch(type) {
      case "NEW_TICK":
        const { rateInfos } = payload;
        const STEP = rateInfos.tlSize / (rateInfos.duration * 1000);
        this.data.cursorPosition = payload.position * STEP;
        const newState = {...state,...payload, currentPosition: payload.position}
        //$commit(newState);
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
      transform: `translate(${cursorPosition}px)`// good
    }
  },
  
  onLinked: function() {
    //alert(`${this.is} - isLinked!`);
 },

  getTemplate: function () {
    return `
            <template>
              <div class="main-wrapper" style="position: relative">
                <div class="main-time-indicator" @style="indicatorStyle(cursorPosition)"></div>
                    <div class="component events-container">
                        <div km:foreach="event in cleanEvents" class="event-row-wrapper">
                          <p class="row event-title">{$key}</p>
                          <events-row $eventsrow="event" class="event-row"></events-row>
                        </div>
                    </div>
                </div>
              </div>
            </template>`;
  },
});
