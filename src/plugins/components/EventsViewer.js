import CustomElement from '../../CustomElement'


CustomElement.register({
    
    is: "events-viewer",
    properties: ["events"],
    data: {
        events: [],
    },

    onInit: function() {
        this.data.events = this.events
        console.log("-- event viewer --")
        console.log(this.data)
    },

    getTemplate : function() {
        return `
            <template>
            <div class="component events-container">
                <div id="row_radical" km:foreach="event in events" class="row event-type">
                    <span class="row-name">{event.type}</span>
                    <div>
                        <span km:foreach="evt in event.samples">
                            this is my event -> {evt}!
                            <em>test</em>
                        </span>
                    </div>
                </div>
            </div>
            </template>`
    }
})