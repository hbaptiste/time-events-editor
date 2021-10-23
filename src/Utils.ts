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

type ParsedTime = { 
    h: number; 
    min: number; 
    sec: number
};

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

const parseTime = function(time:string): ParsedTime | null {
    let result:ParsedTime;
    const sec = { type: "sec", pattern: /^(\d{1,2})s$/ }; // 10s
    const min = { type: "mn", pattern: /^(\d{1,2})m(\d{1,2}s?)?/ }; // 1(h(10m(.11s
    const hour = { type: "hr", pattern: /^\d{1,2}h(\d{1,2}m(\d{1,2})s?)?/ }; // <revd>
    const available = [sec, min, hour];
    for (let i = 0; i < available.length; i++) {
      const { type, pattern } = available[i];
      if (pattern.test(time)) {
        let [, m1, m2, m3] = time.match(pattern);
        m1 = parseInt(m1) || 0,
        m2 = parseInt(m2) || 0,
        m3 = parseInt(m3) || 0; // reset to 0
        switch (type) {
          case "sec":
            result = { sec: m1, min: 0, h: 0 };
            break;
          case "mn":
            result = { h: 0, min: m1, sec: m2 };
            break;
          case "hour":
            result = { h: m1, min: m2, sec: m3 };
            break;
        }
        break;
      }
    }
    return result;
  }


  const toMillisec = function(time:string) :number {
    const parsedTime:ParsedTime = parseTime(time);
    let result = 0
    if (time !== null) {
      result = ((parsedTime.h * 60 * 60) + (parsedTime.min * 60) + parsedTime.sec) * 1000
    }
    return result;
  } 

export { createIterator, parseTime, toMillisec };