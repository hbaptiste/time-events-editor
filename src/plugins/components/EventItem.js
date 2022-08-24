import CustomElement from "../../CustomElement";
import { toMillisec } from "../../Utils";

CustomElement.register({
  is: "event-item",

  getStyle: function () {
    return {
      root: {
        position: "relative",
      },
    };
  },

  properties: ["item"],

  data: {
    itemStyle: null, // -- > STRANGE < --
    selected: null,
    messages: null,
  },

  onInit: function () {
    this.useProvider("eventActionsCtx"); // as(...) implementing alias
    this.eventRegistered = false;
    this.itemDuration = null;
    this.event = null;
    this.styleSetted = false;
  },

  onLinked: function () {
    console.log(`${this.is} - isLinked!`);
  },

  declareSideEffects: function () {
    this.registerSideEffects(this.handleItemSize, ["item", "itemStyle"]); // simplifier la notation
    this.registerSideEffects(this.handleItemSelection, ["selected"]); // simplifier la notation
  },

  handleItemSelection: function (selected) {
    if (selected == null || selected == undefined) {
      return false;
    }
    this.data.itemStyle = {
      ...this.data.itemStyle,
      backgroundColor: selected ? "orange" : "lightgrey",
    };
  },

  handleItemSize: function (item, itemStyle) {
    if (!item) {
      return;
    }
    if (itemStyle !== null) {
      return false;
    }

    const { duration } = item;
    const event = duration.map((time) => toMillisec(time));
    const STEP = 0.00013538552477210128;
    const [start, end] = event;

    // register events
    if (this.eventRegistered == false) {
      if (typeof this.$injected.registerEvent === "function") {
        this.$injected.registerEvent(event);
      }
      this.eventRegistered = true;
      this.event = event;
    }
    // item size
    // make date itself immutable
    this.data.itemStyle = {
      position: "absolute",
      left: start * STEP + "px",
      //width: ((end - start) * STEP) + 'px',
      height: "10px",
      width: "10px",
      borderRadius: "50%",
      backgroundColor: "lightgrey",
      bottom: "50%",
      margin: 0,
      //overflow: "hidden",
      textOverflow: "ellipsis",
    };
    this.styleSetted = true;
  },

  onMessage: function ({ type, payload }) {
    switch (type) {
      case "START_EVENT":
        const [start] = this.event;
        if (start === payload.position) {
          this.data.selected = true;
          this.$injected.updateContent(this.item); // publish content updated ?
        }
        break;
      case "END_EVENT":
        const [_, end] = this.event;
        if (end === payload.position) {
          this.data.selected = false;
          // possibilité d'enlever certains message peuvent être enlevés?
        }
    }
  },

  _getItemSize: function (rateInfos, parsedDuration) {
    console.log(rateInfos, parsedDuration);
    return 0;
  },

  getTemplate: function () {
    return `
            <template>
                <p class="event-item" @style="itemStyle"></p>
            </template>
        `;
  },
});
