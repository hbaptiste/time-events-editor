
interface Iterable {
    hasNext(): boolean,
    next(): unknown,
    reset(): void
}

// Object
interface KVMap {
    [key: string]: unknown
}

// types declaration
type IteratorSource = KVMap | Array<unknown>;


interface Params {
  h: number;
  min: number;
  sec: number;
}

class ParsedTime {
  h: number;
  min: number;
  sec: number;

  constructor (params: Params) {
    this.h = params.h || 0 ;
    this.min = params.min || 0;
    this.sec = params.sec || 0;
  }

  toMilisec():number {
    return ((this.h * 60 * 60) + (this.min * 60) + this.sec) * 1000;
  }

  format(format: string): string | undefined {

    switch(format) {
     case "miliseconde":
       break;
     case "dotted":
       return `${this.h}:${this.min}:${this.sec}`;
     case "duration":
       const h = this.h != 0 ?`${this.h}h`: ""
       const min = this.min != 0 ?`${this.min}mn`: ""
       const sec = this.sec != 0 ?`${this.sec}s`: ""
      return `${h}${min}${sec}`;
     default:
        return "";
   }
  }

}


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
    let result: ParsedTime| null = null;
    const sec = { type: "sec", pattern: /^(\d{1,2})s$/ }; // 10s
    const min = { type: "mn", pattern: /^(\d{1,2})m(\d{1,2}s?)?/ }; // 1(h(10m(.11s
    const hour = { type: "hr", pattern: /^\d{1,2}h(\d{1,2}m(\d{1,2})s?)?/ }; // <revd>
    const available = [sec, min, hour];
    for (let i = 0; i < available.length; i++) {
      const { type, pattern } = available[i];
      if (pattern.test(time)) {
        const [, _m1, _m2, _m3] = time.match(pattern);
        const m1 = parseInt(_m1) || 0;
        const m2 = parseInt(_m2) || 0;
        const m3 = parseInt(_m3) || 0; // reset to 0
        switch (type) {
          case "sec":
            result = new ParsedTime({ sec: m1, min: 0, h: 0 });
            break;
          case "mn":
            result = new ParsedTime({ h: 0, min: m1, sec: m2 });
            break;
          case "hour":
            result = new ParsedTime({ h: m1, min: m2, sec: m3 });
            break;
          default: return result;
        }
        break;
      }
    }
    return result;
  }


  const toMillisec = function(time:string) :number {
    const parsedTime:ParsedTime | null = parseTime(time);
    let result = 0
    if (parsedTime !== null) {
      result = ((parsedTime.h * 60 * 60) + (parsedTime?.min * 60) + parsedTime.sec) * 1000
    }
    return result;
  } 

  const timeToDuration = function(time:string): string | undefined {
    
    const timepart:Array<string> = time.split(":");
    const [h, min, sec] = timepart;
    return new ParsedTime({h: parseInt(h), min: parseInt(min), sec: parseInt(sec)}).format("duration");
  }



const arrayNotEmpty = (data:Array<unknown>): boolean => {
  return Array.isArray(data) && data.length !== 0
}

type HTMLString = string;
type HTMLNode = ChildNode | null;
const htmlToElement = function (nodeString:HTMLString): HTMLNode {
  const template = document.createElement("template");
  template.innerHTML = nodeString;
  return template.content.firstChild;
};

export { createIterator, parseTime, toMillisec, timeToDuration, arrayNotEmpty, htmlToElement };