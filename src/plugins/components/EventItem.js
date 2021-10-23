import CustomElement from "../../CustomElement";
import { toMillisec } from "../../Utils";

CustomElement.register({    
    
    "is": "event-item",
    
    getStyle:function() {
        return {
            root: {
                position: "relative",
            }
        }
    },

    properties: ["item"],

    data: {
        itemStyle: null
    },

    declareSideEffects: function () {
        this.registerSideEffects(this.handleItemSize, ["item"]); // simplifier la notation
    },

    handleItemSize: function(item) {
        if (!item) { return }
        const { duration } = item;
        const [ start, end ] = duration.map(time => toMillisec(time));
        const STEP = 0.00013538552477210128
        
        this.data.itemStyle = {
            position: "absoslute",
            left: (start * STEP) + 'px',
            width: ((end - start) * STEP) + 'px',
            height: '20px',
            backgroundColor: "lightgrey",
        }
    },

    onMessage: function({type, payload}) {
        switch(type) {
            case "NEW_TICK":
                const { rateInfos } = payload;
                //this.data.cursorPosition = payload.position * rateInfos.step;
                const { duration } = this.item;
                const parsedDuration = duration.map(time => parseTime(time));
                this.data.itemSize = this._getItemSize(rateInfos, parsedDuration);
                break;
        }
    },

    _getItemSize: function(rateInfos, parsedDuration) {
        console.log(rateInfos,parsedDuration)
    },

    getTemplate: function() {
        return `
            <template>
                <p @style="itemStyle">{item.data.type} </p>
            <template>
            `
    }

})