import 'reflect-metadata';

interface Newable<T> {
    new (...args: any[]): T
};

export function monitored(ctor: Newable<object>) {
    class newClass extends ctor {
        constructor(obj: any) {
            console.log("from: ", obj);
            super(obj);
            console.log("created: ", JSON.stringify(this));
        }
    }
    return (<any>newClass);
};

export function sealed(ctor: Function) {
    Object.seal(ctor);
    Object.seal(ctor.prototype);
};

export function filled(ctor: Newable<object>) {
    return <any>class filledClass extends ctor {
        constructor(...args: any[]) {
            super(...args);
            for (let key in this) {
                console.assert(this[key], key);
            }
        }
    }
}

export function assigned(ctor: Newable<object>) {
    class assignedClass extends ctor {
        constructor(obj: object) {
            super(obj);
            Object.assign(this, obj);
        }
    }
    return (<any>assignedClass);
}
const assertionKey = Symbol('assertion');

export function Asserted(ctor: Newable<object>) {
    return <any>class AssertedClass extends ctor {
        constructor(obj: object) {
            super(obj);
            for (let key in this) {
                let fn = Reflect.getMetadata(assertionKey, this, key);
                if (fn) {
                    console.assert(fn(this[key]));
                }
            }
            console.log("Asserted", this);
        }
    }
}

const constructionKey = Symbol('construction');

export function Constructed(ctor: Newable<object>) {
    return <any>class ConstRuctedClass extends ctor {
        constructor(obj: object) {
            super(obj);
            for (let key in this) {
                let con = Reflect.getMetadata(constructionKey, this, key);
                if (con) {
                    this[key] = new con(this[key]);
                    console.log("Constructed for", key);
                }
            }
        }
    }
}

export function NotNull(target: any, key: string | symbol): void {
    Reflect.defineMetadata(assertionKey, (v): boolean => v, target, key);
    Object.defineProperty(target, key, {
        enumerable: true,
        writable: true
    });
}

export function Constructive(target: any, key: string | symbol): void {
    let ctor = Reflect.getMetadata("design:type", target, key);
    console.log("Constructive Type", ctor);
    Reflect.defineMetadata(constructionKey, ctor, target, key);
    Reflect.defineProperty(target, key, {
        enumerable: true,
        writable: true
    });
}