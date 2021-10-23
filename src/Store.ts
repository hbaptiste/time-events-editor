class Store {
    
    name: string;
    settings: unknown;
    listeners: Array<(action: unknown) =>void>;

    constructor(name: string, settings: unknown) {
        this.name = name;
        this.settings = settings;
        this.listeners = [];
    }
    
    emit(action: unknown): void {
        this.listeners.map((func) => {
            setTimeout(() => {
                func(action);
            }, 0);
        });
    }

    register(callback: () => void ): void {
        this.listeners.push(callback);
    }
}

let store: Store;
export const createStore = function(name: string, settings: unknown): Store {
    if(store) {
        return store;
    }
    store = new Store(name, settings);
    return store;
}