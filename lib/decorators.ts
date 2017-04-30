import 'reflect-metadata';

interface Newable<T> {
    new (...args: any[]): T
};

export function Monitored(ctor: Newable<object>) {
    return <any>class newClass extends ctor {
        constructor(obj: any) {
            console.log(`Creating ${ctor.name} from:`, obj);
            super(obj);
            console.log(`${ctor.name} was created:`, this);
        }
    };
};

export function Sealed(ctor: Function) {
    Object.seal(ctor);
    Object.seal(ctor.prototype);
};

export function Filled(ctor: Newable<object>) {
    return <any>class FilledClass extends ctor {
        constructor(...args: any[]) {
            super(...args);
            for (let key in this) {
                let val = this[key];
                console.assert(typeof val !== 'undefined' && val !== null,
                               `${key} is not filled`, this);
            }
        }
    };
}

export function Assigned(ctor: Newable<object>) {
    class AssignedClass extends ctor {
        constructor(obj: object) {
            super(obj);
            Object.assign(this, obj);
        }
    }
    return (<any>AssignedClass);
}
const assertionKey = Symbol('assertion');

export function Asserted(ctor: Newable<object>) {
    return <any>class AssertedClass extends ctor {
        constructor(obj: object) {
            super(obj);
            for (let key in this) {
                let fn = Reflect.getMetadata(assertionKey, this, key);
                if (fn) {
                    console.assert(fn(this[key]), `${ctor.name} failed on ${key}`);
                }
            }
        }
    }
}

const constructionKey = Symbol('construction');

export function Constructed(ctor: Newable<object>) {
    return <any>class ConstructedClass extends ctor {
        constructor(obj: object) {
            super(obj);
            for (let key in this) {
                let con = Reflect.getMetadata(constructionKey, this, key);
                let val = this[key];
                if (con && val && !(val instanceof con)) {
                    this[key] = new con(val);
                }
            }
        }
    }
}

export function NotNull(target: any, key: string | symbol): void {
    Reflect.defineMetadata(assertionKey, (v): boolean => v, target, key);
}

export function Constructive(target: any, key: string | symbol): void {
    let ctor = Reflect.getMetadata("design:type", target, key);
    Reflect.defineMetadata(constructionKey, ctor, target, key);
}

export function CheckType(target: any, key: string | symbol) {
    let ctor = Reflect.getMetadata("design:type", target, key);
    console.log("Checking:", target);
    console.log(`Propterty ${key}:`, ctor);
}

export function Debug(ctor: Newable<object>) {
    console.log("Class is defined:", ctor.prototype);
    return <any>ctor;
}