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
    class filledClass extends ctor {
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