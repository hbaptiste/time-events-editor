export default class EventsRegistry {
  constructor({ timelineMng, uiManager, rateInfos }) {
    this.tl = timelineMng;
    this.uiManager = uiManager;
    this.rateInfos = rateInfos;
    this.eventsList = [];
  }

  _checkEvent(event) {}

  createEventFromData(data) {
    const { eventStart, eventEnd, eventName: label, rowName } = data;
    const pt = this._parseTime.bind(this);
    const [start, end] = [pt(eventStart), pt(eventEnd)];
    const startSec = start.sec + start.mn * 60 + start.h * 60 * 60; // * 1000;
    const endStart = end.sec + end.mn * 60 + end.h * 60 * 60; //* 1000;
  
    this.add({
      label,
      rowName,
      start: startSec,
      end: endStart
    });
  }
  _parseTime(time) {
    let result;
    const sec = { type: "sec", pattern: /^(\d{1,2})s$/ }; // 10s
    const mn = { type: "mn", pattern: /^(\d{1,2})m(\d{1,2}s?)?/ }; // 1(h(10m(.11s
    const hour = { type: "hr", pattern: /^\d{1,2}h(\d{1,2}m(\d{1,2})s?)?/ }; // <revd>
    const available = [sec, mn, hour];
    for (let i = 0; i < available.length; i++) {
      const { type, pattern } = available[i];
      if (pattern.test(time)) {
        let [, m1, m2, m3] = time.match(pattern);
        (m1 = parseInt(m1) || 0),
          (m2 = parseInt(m2) || 0),
          (m3 = parseInt(m3) || 0); // reset to 0
        switch (type) {
          case "sec":
            result = { sec: m1, mn: 0, h: 0 };
            break;
          case "mn":
            result = { h: 0, mn: m1, sec: m2 };
            break;
          case "hour":
            result = { h: m1, mn: m2, sec: m3 };
            break;
        }
        break;
      }
    }
    return result;
  }

  add(event,callback) {
    
    let [start, end] = event;
    
    if (!start || !end) {
      throw "Missing Parameters: start time, end time must be provided!";
    }

    console.log("start-->", start);
    console.log("end --->", end);
    this.tl.onTick(this._onStart.bind(this, event), start);
    this.tl.onTick(this._onEnd.bind(this, event), end);
   
    this.uiManager.send({ type: "NEW_EVENT", event });
    this.eventsList.push(event);
  }
  
  _onStart(event) {
    /* notify store */
    this.uiManager.dispatch({ type: "START_EVENT", event });
    alert("--- on start ---");
  }
  _onEnd(event) {
    /* notify ui manager */
    this.uiManager.dispatch({ type: "END_EVENT", event });
    alert("--- on stop ---");
  }
}
