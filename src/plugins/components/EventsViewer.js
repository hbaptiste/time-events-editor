import CustomElement from '../../CustomElement'


CustomElement.register({
    
    is: "events-viewer",
    properties: ["events"],
    data: {
        events: [],
    },

    onInit: function() {
        this.data.events = this.events
        console.log('-- radical ---')
        console.log(this.data.events)
        console.log("------")
    },

    getTemplate : function() {
        return `
            <template>
            <div class="component events-container">
                <div id="row_radical" km:foreach="event in events" class="row event-type">
                    <span class="row-name">{event.type}</span>
                    <div>
                        <span km:foreach="ev in event.samples">
                            this is my event -> {ev}!
                            <em>test</em>
                        </span>
                    </div>
                </div>
            </div>
            </template>`
    }
})