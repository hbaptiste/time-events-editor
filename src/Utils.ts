interface Iterable {
    hasNext(): boolean,
    next(): unknown,
    reset(): void
    //remove(): void
}

// Object
interface KVMap {
    [key: string]: unknown
}

// types declaration
type IteratorSource = KVMap | Array<unknown>;

class Iterator implements Iterable {
    cursor: number;
    current: unknown;
    source: IteratorSource;
    private _data: Array<unknown>;

    constructor(source: IteratorSource) {
        this.cursor = 0;
        this.current = null;
        this.source = source;
        this._data = ( source != null && Array.isArray(source)) ? source : Object.entries(source);
    }

    hasNext(): boolean {
        if (this._data.length == 0 || (this.cursor == this._data.length)) {
            return false;
        }
        return true;
    }
    
    next(): unknown {
        this.current = this._data[this.cursor];
        this.cursor++
        return this.current;        
    }

    reset(): void {
        this.cursor = 0;
        this.current = null;
    }
    static from(data: KVMap | Array<unknown> ): Iterable {
        return new Iterator(data);
    }  
}

const createIterator = function(source: KVMap | Array<unknown>): Iterable {
    return Iterator.from(source)
}

export { createIterator };