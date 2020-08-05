export default class Signal {
  constructor(name) {
    this.name = name || "generic";
    this.callbacks = [];
  }
  static create(name) {
    return new Signal(name);
  }
  connect(func) {
    if (typeof func !== "function") {
      return;
    }
    this.callbacks.push(func);
  }

  off(func) {
    this.callbacks = this.callbacks.filter(iFunc => func !== iFunc);
  }

  emit() {
    this.callbacks.map(func => {
      try {
        var args = Array.from(arguments);
        func.apply(this, [...args]);
      } catch (reason) {
        throw reason; //catch
      }
    });
  }
}
