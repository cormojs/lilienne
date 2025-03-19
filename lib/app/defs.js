"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, "__esModule", { value: true });
const decorators_1 = require("../decorators");
const sanitizeHtml = require("sanitize-html");
let Registration = class Registration {
  constructor(obj) {}
};
Registration = __decorate(
  [
    decorators_1.Filled,
    decorators_1.Assigned,
    decorators_1.Sealed,
    __metadata("design:paramtypes", [Object]),
  ],
  Registration,
);
exports.Registration = Registration;
exports.Stream = null;
let REST = class REST {
  constructor(obj) {}
};
REST = __decorate(
  [
    decorators_1.Assigned,
    decorators_1.Sealed,
    __metadata("design:paramtypes", [Object]),
  ],
  REST,
);
exports.REST = REST;
exports.isREST = function (form) {
  return (
    form !== null &&
    form !== undefined &&
    "update_min" in form &&
    "auto_page" in form
  );
};
class API {}
exports.API = API;
exports.isRESTAPI = function (api) {
  return exports.isREST(api.form);
};
let Source = class Source {
  constructor(obj) {}
};
Source = __decorate(
  [
    decorators_1.Filled,
    decorators_1.Assigned,
    decorators_1.Sealed,
    __metadata("design:paramtypes", [Object]),
  ],
  Source,
);
exports.Source = Source;
let Account = class Account {
  constructor(obj) {}
  get host() {
    let m = this.acct.match(/@(.+)$/);
    return m ? m[1] : "";
  }
};
__decorate(
  [decorators_1.NotNull, __metadata("design:type", Number)],
  Account.prototype,
  "id",
  void 0,
);
__decorate(
  [decorators_1.NotNull, __metadata("design:type", String)],
  Account.prototype,
  "username",
  void 0,
);
__decorate(
  [decorators_1.NotNull, __metadata("design:type", String)],
  Account.prototype,
  "avatar",
  void 0,
);
__decorate(
  [decorators_1.NotNull, __metadata("design:type", String)],
  Account.prototype,
  "avatar_static",
  void 0,
);
Account = __decorate(
  [
    decorators_1.Asserted,
    decorators_1.Filled,
    decorators_1.Assigned,
    __metadata("design:paramtypes", [Object]),
  ],
  Account,
);
exports.Account = Account;
let Status = class Status {
  constructor(obj) {}
  get contentSanitized() {
    return sanitizeHtml(this.content, {
      allowedTags: [],
      allowedAttributes: {
        a: ["href", "v-on:click"],
      },
      transformTags: {
        a: (tagName, attrs) => {
          return {
            tagName: tagName,
            attribs: {
              "v-on:click": `openUrl(${attrs["href"]})`,
              href: "#",
            },
          };
        },
      },
    });
  }
  get actual() {
    return this.reblog || this;
  }
};
__decorate(
  [
    decorators_1.Constructive,
    decorators_1.NotNull,
    __metadata("design:type", Account),
  ],
  Status.prototype,
  "account",
  void 0,
);
__decorate(
  [decorators_1.NotNull, __metadata("design:type", Number)],
  Status.prototype,
  "id",
  void 0,
);
__decorate(
  [decorators_1.Recursive, __metadata("design:type", Object)],
  Status.prototype,
  "reblog",
  void 0,
);
__decorate(
  [decorators_1.NotNull, __metadata("design:type", String)],
  Status.prototype,
  "url",
  void 0,
);
__decorate(
  [decorators_1.NotNull, __metadata("design:type", String)],
  Status.prototype,
  "content",
  void 0,
);
__decorate(
  [
    decorators_1.PrimitiveValue,
    decorators_1.Constructive,
    __metadata("design:type", Boolean),
  ],
  Status.prototype,
  "favourited",
  void 0,
);
Status = __decorate(
  [
    decorators_1.Constructed,
    decorators_1.Asserted,
    decorators_1.Assigned,
    __metadata("design:paramtypes", [Object]),
  ],
  Status,
);
exports.Status = Status;
