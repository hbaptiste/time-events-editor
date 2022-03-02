import cloneDeep from "clone-deep";
import { v4 as uuidv4 } from "uuid";

type State = Record<string, unknown>;

type SelectorFunction = (state:State) => unknown

class Store {
    name: string;
    settings: unknown;
    state: State;
    listeners: Array<(action: unknown) => void>;
    stateListeners: Array<(key:string, value: unknown) => void>;
    selectorsList: Array<(state:State) => unknown>;

    constructor(name: string, settings: unknown) {
        this.name = name;
        this.settings = settings;
        this.state = {};
        this.listeners = [];
        this.stateListeners = [];
        this.selectorsList = []
    }

    init(state: State): void {
        this.state = state;    
    }

    set(key: string, value: unknown): void {
        const previousValue = this.state[key];
        if (previousValue == value) { return }
        this.state[key] = value;     
        // this.notify(key, value);
    }

    notify(): void {
        
        this.selectorsList.map((func) => {
            func(this.getState());
        });
      /* this.stateListeners.map((func) => {
            func(this.getState());
        }); */  
    }

    on(callback: (key:string, value:unknown) => void):void {
        this.stateListeners.push(callback); 
    }

    getState(): Record<string, unknown> {
        return this.state;
    }

    select(selectorDependances:Array <SelectorFunction>, selector: SelectorFunction): unknown {

        //une liste de selection
        // si ils changent

        const selectDecorator = () => {
            let previousValue:unknown = null
            const callbacks: unknown[] = []
            const dependenciesResult: Record<any, any> = {};

            const addCallbacks = (func: any) => {
                callbacks.push(func)
            }

            const select = (state:State) => {
                const currentState = {...state}
                const selectValue = selector(currentState)
                if (previousValue !== selectValue) {
                    previousValue = cloneDeep(selectValue)
                    callbacks.map(func => func(selectValue))
                }
                return null;
            }
            const handleDependency = (selector:SelectorFunction) => {
                    
                    const test = function(resultMap:Record<string, any>) {
                        const _previousResult = null;

                        return (state: State) => {
                            const currentState = {...state}; // deep copy
                            const _result = selector(currentState);
                            resultMap[selector.uuid] = _result;
                            if (_previousResult !== _result) {
                                const results = Object.values(resultMap); 
                                callbacks.map(func => func.call(null, ...results)) //use index
                                // executer la function avec toutes les diff -> changes
                            }
                        }
                    }
                    this.selectorsList.push(test(dependenciesResult));
            }

            return { addCallbacks, select, handleDependency };
        }
        const { addCallbacks, select, handleDependency } = selectDecorator();
        
        if (selectorDependances.length > 0) {
            selectorDependances.map(selectFunc => {
                selectFunc.uuid = uuidv4() // replace select func as a structure
                handleDependency(selectFunc);
            });
        } else {
            this.selectorsList.push(select);
        }

        return {
            watch: (callback:(value:unknown) => void) => {
                addCallbacks(callback);
            },
        }
    }
    
    selectwith():unknown { return }

    emit(message: unknown): void {
        const $commit = (newState:any) => {
            //this._previousState = {...{}, ...newState };
            this.state = cloneDeep(newState);
            this.notify();
        }

        const params = {...message, state: this.getState(), $commit };
        // -> listener{reducers|}
        this.listeners.map((func) => {
            setTimeout(() => {
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