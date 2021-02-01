import CustomElement from "../../CustomElement";

CustomElement.register({
  is: "events-viewer",
  properties: ["events"],
  getStyle: function () {
    return {
      root: {
        border: "1px solid red",
      },
    };
  },
  data: {
    events: [],
  },

  onInit: function () {
    this.data.events = this.events;
  },

  getTemplate: function () {
    return `
            <template>
            <div class="component events-container">
                <!--<div km:foreach="event in events" class="row event-type">
                    <span class="row-name">{event.type}</span>
                    <div>
                        <span km:foreach="evt in event.samples">
                            this is my event -> {evt}!
                            <em>test</em>
                        </span>
                    </div>
                </div>-->
            </div>
            </template>`;
  },
});
