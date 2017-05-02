"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
;
function Monitored(ctor) {
    return class newClass extends ctor {
        constructor(obj) {
            console.log(`Creating ${ctor.name} from:`, obj);
            super(obj);
            console.log(`${ctor.name} was created:`, this);
        }
    };
}
exports.Monitored = Monitored;
;
function Sealed(ctor) {
    Object.seal(ctor);
    Object.seal(ctor.prototype);
}
exports.Sealed = Sealed;
;
function Filled(ctor) {
    return class FilledClass extends ctor {
        constructor(...args) {
            super(...args);
            for (let key in this) {
                let val = this[key];
                console.assert(typeof val !== 'undefined' && val !== null, `${key} is not filled`, this);
            }
        }
    };
}
exports.Filled = Filled;
function Assigned(ctor) {
    class AssignedClass extends ctor {
        constructor(obj) {
            super(obj);
            Object.assign(this, obj);
        }
    }
    return AssignedClass;
}
exports.Assigned = Assigned;
const assertionKey = Symbol('assertion');
function Asserted(ctor) {
    return class AssertedClass extends ctor {
        constructor(obj) {
            super(obj);
            for (let key in this) {
                let fn = Reflect.getMetadata(assertionKey, this, key);
                if (fn) {
                    console.assert(fn(this[key]), `${ctor.name} failed on ${key}`);
                }
            }
        }
    };
}
exports.Asserted = Asserted;
const constructionKey = Symbol('construction');
const recursiveKey = Symbol('recursion');
const primitiveKey = Symbol('primitive');
function Constructed(ctor) {
    return class ConstructedClass extends ctor {
        constructor(obj) {
            super(obj);
            for (let key in this) {
                let con = Reflect.getMetadata(constructionKey, this, key);
                let val = this[key];
                if (con) {
                    if (con === recursiveKey) {
                        if (val !== null) {
                            console.log(`${key} recusively constructed:`, con, val);
                            this[key] = new ConstructedClass(val);
                        }
                    }
                    else if (!(val instanceof con)) {
                        this[key] = new con(val);
                    }
                    if (Reflect.getMetadata(primitiveKey, this, key)) {
                        this[key] = this[key].valueOf();
                    }
                }
            }
        }
    };
}
exports.Constructed = Constructed;
function NotNull(target, key) {
    Reflect.defineMetadata(assertionKey, (v) => v, target, key);
}
exports.NotNull = NotNull;
function Constructive(target, key) {
    let ctor = Reflect.getMetadata("design:type", target, key);
    Reflect.defineMetadata(constructionKey, ctor, target, key);
}
exports.Constructive = Constructive;
function PrimitiveValue(target, key) {
    Reflect.defineMetadata(primitiveKey, true, target, key);
}
exports.PrimitiveValue = PrimitiveValue;
function Recursive(target, key) {
    Reflect.defineMetadata(constructionKey, recursiveKey, target, key);
    console.log(`Recursive ${key}`, target);
}
exports.Recursive = Recursive;
function CheckType(target, key) {
    let ctor = Reflect.getMetadata("design:type", target, key);
    console.log("Checking:", target);
    console.log(`Propterty ${key}:`, ctor);
}
exports.CheckType = CheckType;
function Debug(ctor) {
    console.log("Class is defined:", ctor.prototype);
    return ctor;
}
exports.Debug = Debug;
