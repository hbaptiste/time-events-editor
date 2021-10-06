export default class TimelineFactory {
  
  constructor() {
    this.callbacksRegistry = { "*": [] };
    this.TIMELINE_STEP = 5;
    this.TIMELINE_UNIT = 1000;
    this._intervalId = null;
    this.params = null;
    this.repeat = false;
    this.state = { position: 0, step: 0, playing: false };
  }

  create(params) {
    this.params = params; // do check
    const { duration, repeat } = params;
    this.repeat = repeat;
    this._init(duration);
  }

  onStart(callback) {
    if (typeof callback === "function") {
      return;
    }
    this.callbacksRegistry["start"] = callback;
  }

  start() {
    this.state = {...this.state, playing: true };
    this._init();
    
  }

  stop() {
    this.state.playing = false;
  }

  goto(step) {
    this.state.step = Math.floor(step) - this.TIMELINE_STEP;
    this.state = { ...this.state };
    if (!this._isPlaying()) {
      this.start();
    }
  }

  onStep(callback) {
    if (typeof callback === "function") {

      this.callbacksRegistry["step"] = callback;
    }
  }

  _isPlaying() {
    return this.state.playing;
  }

  _init(duration) {
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
    this._intervalId = setInterval(() => {
      if (this._isPlaying() === false) return false;
      /* time never flies and stops */
      this.state.step += this.TIMELINE_STEP;
      if (this.state.step % this.TIMELINE_UNIT === 0) {
        const previousState = { ...this.state };
        this.state.position = previousState.position + 1;
        
        this._handleEvents({ ...this.state });
        
        if (this.state.position === duration) {
          if (!this.repeat) {
            clearInterval(this._intervalId);
          } else {
            this._reset();
          }
        }
      }
      /* -- handle callback -- */
      this._notifyStepEvent();
    }, this.TIMELINE_STEP);
  }
  // should be -> * <-
  _notifyStepEvent() {
    const cbList = this.callbacksRegistry["*"];
    if (Array.isArray(cbList)) {
      cbList.map((cb) => {
        try {
          cb({ position: this.state.step });
        } catch(e) {
          console.log("-- error --");
          console.log(e);
        }
      });
    }
  }
  _reset() {
    this.state.position = 0;
    this.state.step = 0;
    this.state = { ...this.state, position: 0, stop: 0}
  }

  _handleEvents({ position: currentPosition }) {
    /*  we notify everyone */
    Object.entries(this.callbacksRegistry).map(([position, cbList]) => {
      if (position === "*" || `position_${currentPosition}` === position) {
        this._executeAll(cbList, currentPosition);
      }
    });
  }

  _executeAll(list, position) {
    list.map(cb => {
      try {
        cb({ position: position });
      } catch (e) {
        console.log(e);
      }
    });
  }

  onTick(callback, position) {
    if (typeof callback !== "function") {
      return;
    }
    if (typeof position === "number") {
      /* handle position 1.2, 3.2 */
      const cbsList = this.callbacksRegistry[`position_${position}`] || [];
      cbsList.push(callback);
      this.callbacksRegistry[`position_${position}`] = cbsList;
    } else {
      this.callbacksRegistry["*"].push(callback);
    }
  }
}
