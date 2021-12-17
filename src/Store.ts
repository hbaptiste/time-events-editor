class Store {
    
    name: string;
    settings: unknown;
    state: Record<string, unknown>;
    listeners: Array<(action: unknown) => void>;
    stateListeners: Array<(key:string, value: unknown) => void>;

    constructor(name: string, settings: unknown) {
        this.name = name;
        this.settings = settings;
        this.state = {};
        this.listeners = [];
        this.stateListeners = [];
    }

    init(state: Record<string, unknown>): void {
        this.state = state;    
    }

    set(key: string, value: unknown): void {
        const previousValue = this.state[key];
        if (previousValue == value) { return }
        this.state[key] = value;     
        this.notify(key, value);
    }

    notify(key:string, value:unknown): void {
        this.stateListeners.map((func) => {
            func(key, value);
        });    
    }

    on(callback: (key:string, value:unknown) => void):void {
        this.stateListeners.push(callback); 
    }

    getState(): Record<string, unknown> {
        return this.state;
    }

    select(): string { 
        //const observedValue = observedValue;
        //observedValue.on(() => {}) 
        return "observableValue"
    }

    emit(message: unknown): void {
        const $commit = (newState) => {
            console.log("___radical___")
            console.log(newState);
        }
        const params = {...message, state: this.getState(), $commit };
        this.listeners.map((func) => {
            setTimeout(() => {
                console.log("-- params --");
                console.log(params);
                func(params); // si résultat update state 
            }, 0);
        });
    }

    register(callback: () => void ): void {
        this.listeners.push(callback);
    }
}

// deal with middlewhere

let store: Store;
export const createStore = function(name: string, settings: unknown): Store {
    if (store) {
        return store;
    }
    store = new Store(name, settings);
    return store;
}