var e = {
    d: (t, n) => {
      for (var r in n) e.o(n, r) && !e.o(t, r) && Object.defineProperty(t, r, { enumerable: !0, get: n[r] });
    },
    o: (e, t) => Object.prototype.hasOwnProperty.call(e, t),
    r: (e) => {
      "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(e, "__esModule", { value: !0 });
    },
  },
  t = {};
function n(e) {
  return (
    (n =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? function (e) {
            return typeof e;
          }
        : function (e) {
            return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
          }),
    n(e)
  );
}
function r(e) {
  var t = (function (e, t) {
    if ("object" !== n(e) || null === e) return e;
    var r = e[Symbol.toPrimitive];
    if (void 0 !== r) {
      var o = r.call(e, "string");
      if ("object" !== n(o)) return o;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return String(e);
  })(e);
  return "symbol" === n(t) ? t : String(t);
}
function o(e, t, n) {
  return (t = r(t)) in e ? Object.defineProperty(e, t, { value: n, enumerable: !0, configurable: !0, writable: !0 }) : (e[t] = n), e;
}
function i(e, t) {
  if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
}
function s(e, t) {
  for (var n = 0; n < t.length; n++) {
    var o = t[n];
    (o.enumerable = o.enumerable || !1), (o.configurable = !0), "value" in o && (o.writable = !0), Object.defineProperty(e, r(o.key), o);
  }
}
function a(e, t, n) {
  return t && s(e.prototype, t), n && s(e, n), Object.defineProperty(e, "prototype", { writable: !1 }), e;
}
e.r(t), e.d(t, { hasBrowserEnv: () => Ee, hasStandardBrowserEnv: () => Te, hasStandardBrowserWebWorkerEnv: () => Ce, origin: () => Ae });
const c = function (e) {
  var t = {};
  for (var n in e) e.hasOwnProperty(n) && void 0 !== e[n] && (t[n] = e[n]);
  return t;
};
var u = "https://js.finix.com/v/1/payment-fields/index.html?",
  f = { card: "PAYMENT_CARD", "bank-account": "BANK_ACCOUNT" };
function p(e) {
  return e.data && e.data.messageName;
}
var h = (function () {
  function e(t, n) {
    var r = this;
    i(this, e),
      (this.type = t),
      (this.id = "form-".concat(new Date().getTime(), "-").concat(Math.random())),
      (this.fields = []),
      (this.state = {}),
      (this.binInformation = {}),
      window.addEventListener("message", function (e) {
        if (e.data.formId === r.id)
          if ("field-updated" === p(e)) {
            var t = e.data.messageData;
            (r.state = Object.assign({}, r.state, o({}, t.name, t.state))), n(r.state, void 0);
          } else "form-submit" === p(e) && r.onSubmitHandler ? r.onSubmitHandler() : "bin-information-received" === p(e) && ((r.binInformation = e.data.messageData), n(void 0, r.binInformation));
      });
  }
  return (
    a(e, [
      {
        key: "submitWithData",
        value: function (e, t, n, r) {
          var o = "".concat(new Date().getTime(), "-").concat(Math.random());
          this.fields[0].contentWindow.postMessage({ messageId: o, messageName: "submit", messageData: { environment: e, applicationId: t, data: n } }, "*"),
            window.addEventListener("message", function e(t) {
              var n = t.data.messageData;
              t.data.messageId === o && ("response-received" === p(t) ? (r(null, n), window.removeEventListener("message", e)) : "response-error" === p(t) && (r({ status: n.status }, n), window.removeEventListener("message", e)));
            });
        },
      },
      {
        key: "submit",
        value: function (e, t, n) {
          e ? (t ? this.submitWithData(e, t, {}, n) : console.error("submit() - No applicationId was provided")) : console.error("submit() - No environment was provided");
        },
      },
      {
        key: "onSubmit",
        value: function (e) {
          this.onSubmitHandler = e;
        },
      },
      {
        key: "getIframeUrl",
        value: function (e) {
          return "".concat(u).concat(e);
        },
      },
      {
        key: "field",
        value: function (e, t) {
          console.group("🏗️ Creating Field: %c" + e, "color: #0B5DCD; font-weight: bold");

          // Log field configuration details
          console.log("%c Field Configuration:", "color: #5CB85C; font-weight: bold");
          console.table({
            "Field Type": e,
            "Form ID": this.id,
            "Payment Type": f[this.type],
            Validation: t.validations || "None",
            "Auto Complete": t.autoComplete || "None",
            "Default Option": t.defaultOption || "None",
            "Has Placeholder": !!t.placeholder,
            "Has Custom Styles": !!t.styles,
            "Has Fonts": !!(t.fonts && t.fonts.length),
            "Has Default Value": !!t.defaultValue,
          });

          // Create the detailed config for the iframe
          const fieldConfig = c({
            formId: this.id,
            type: e,
            paymentInstrumentType: f[this.type],
            styles: t.styles,
            placeholder: t.placeholder,
            validations: t.validations,
            autoComplete: t.autoComplete,
            options: t.options,
            defaultOption: t.defaultOption,
            errorMessage: t.errorMessage,
            fonts: t.fonts,
            defaultValue: t.defaultValue,
          });

          console.log("%c Full Configuration:", "color: #F0AD4E; font-weight: bold", fieldConfig);

          // Encode the config and create iframe URL
          var n = btoa(JSON.stringify(fieldConfig));
          var r = this.getIframeUrl(n);

          console.log("%c Config Size:", "color: #5BC0DE", n.length + " characters");
          console.log("%c IFrame URL:", "color: #5BC0DE", r);

          // Create the iframe element
          var o = document.createElement("iframe");
          o.src = r;
          o.style.border = "none";

          // Update the form state
          this.fields.push(o);
          this.state[e] = c({
            isFocused: false,
            isDirty: false,
            errorMessages: [],
            selected: t.defaultOption,
            country: "address.country" === e ? t.defaultOption : void 0,
          });

          console.log("%c Initial Field State:", "color: #D9534F", this.state[e]);
          console.log("%c Field %c" + e + "%c created successfully ✅", "color: #5CB85C", "color: #5CB85C; font-weight: bold", "color: #5CB85C");

          console.groupEnd();
          return o;
        },
      },
    ]),
    e
  );
})();
function m(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
const { toString: y } = Object.prototype,
  { getPrototypeOf: b } = Object,
  g =
    ((v = Object.create(null)),
    (e) => {
      const t = y.call(e);
      return v[t] || (v[t] = t.slice(8, -1).toLowerCase());
    });
var v;
const w = (e) => ((e = e.toLowerCase()), (t) => g(t) === e),
  O = (e) => (t) => typeof t === e,
  { isArray: _ } = Array,
  x = O("undefined"),
  E = w("ArrayBuffer"),
  T = O("string"),
  S = O("function"),
  C = O("number"),
  A = (e) => null !== e && "object" == typeof e,
  R = (e) => {
    if ("object" !== g(e)) return !1;
    const t = b(e);
    return !((null !== t && t !== Object.prototype && null !== Object.getPrototypeOf(t)) || Symbol.toStringTag in e || Symbol.iterator in e);
  },
  L = w("Date"),
  j = w("File"),
  k = w("Blob"),
  F = w("FileList"),
  P = w("URLSearchParams"),
  [N, I, D, B] = ["ReadableStream", "Request", "Response", "Headers"].map(w);
function U(e, t, { allOwnKeys: n = !1 } = {}) {
  if (null == e) return;
  let r, o;
  if (("object" != typeof e && (e = [e]), _(e))) for (r = 0, o = e.length; r < o; r++) t.call(null, e[r], r, e);
  else {
    const o = n ? Object.getOwnPropertyNames(e) : Object.keys(e),
      i = o.length;
    let s;
    for (r = 0; r < i; r++) (s = o[r]), t.call(null, e[s], s, e);
  }
}
function q(e, t) {
  t = t.toLowerCase();
  const n = Object.keys(e);
  let r,
    o = n.length;
  for (; o-- > 0; ) if (((r = n[o]), t === r.toLowerCase())) return r;
  return null;
}
const M = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : global,
  H = (e) => !x(e) && e !== M,
  z = ((V = "undefined" != typeof Uint8Array && b(Uint8Array)), (e) => V && e instanceof V);
var V;
const K = w("HTMLFormElement"),
  J = (
    ({ hasOwnProperty: e }) =>
    (t, n) =>
      e.call(t, n)
  )(Object.prototype),
  W = w("RegExp"),
  $ = (e, t) => {
    const n = Object.getOwnPropertyDescriptors(e),
      r = {};
    U(n, (n, o) => {
      let i;
      !1 !== (i = t(n, o, e)) && (r[o] = i || n);
    }),
      Object.defineProperties(e, r);
  },
  Y = "abcdefghijklmnopqrstuvwxyz",
  G = "0123456789",
  Z = { DIGIT: G, ALPHA: Y, ALPHA_DIGIT: Y + Y.toUpperCase() + G },
  X = w("AsyncFunction"),
  Q =
    ((ee = "function" == typeof setImmediate),
    (te = S(M.postMessage)),
    ee
      ? setImmediate
      : te
        ? ((ne = `axios@${Math.random()}`),
          (re = []),
          M.addEventListener(
            "message",
            ({ source: e, data: t }) => {
              e === M && t === ne && re.length && re.shift()();
            },
            !1,
          ),
          (e) => {
            re.push(e), M.postMessage(ne, "*");
          })
        : (e) => setTimeout(e));
var ee, te, ne, re;
const oe = "undefined" != typeof queueMicrotask ? queueMicrotask.bind(M) : ("undefined" != typeof process && process.nextTick) || Q,
  ie = {
    isArray: _,
    isArrayBuffer: E,
    isBuffer: function (e) {
      return null !== e && !x(e) && null !== e.constructor && !x(e.constructor) && S(e.constructor.isBuffer) && e.constructor.isBuffer(e);
    },
    isFormData: (e) => {
      let t;
      return e && (("function" == typeof FormData && e instanceof FormData) || (S(e.append) && ("formdata" === (t = g(e)) || ("object" === t && S(e.toString) && "[object FormData]" === e.toString()))));
    },
    isArrayBufferView: function (e) {
      let t;
      return (t = "undefined" != typeof ArrayBuffer && ArrayBuffer.isView ? ArrayBuffer.isView(e) : e && e.buffer && E(e.buffer)), t;
    },
    isString: T,
    isNumber: C,
    isBoolean: (e) => !0 === e || !1 === e,
    isObject: A,
    isPlainObject: R,
    isReadableStream: N,
    isRequest: I,
    isResponse: D,
    isHeaders: B,
    isUndefined: x,
    isDate: L,
    isFile: j,
    isBlob: k,
    isRegExp: W,
    isFunction: S,
    isStream: (e) => A(e) && S(e.pipe),
    isURLSearchParams: P,
    isTypedArray: z,
    isFileList: F,
    forEach: U,
    merge: function e() {
      const { caseless: t } = (H(this) && this) || {},
        n = {},
        r = (r, o) => {
          const i = (t && q(n, o)) || o;
          R(n[i]) && R(r) ? (n[i] = e(n[i], r)) : R(r) ? (n[i] = e({}, r)) : _(r) ? (n[i] = r.slice()) : (n[i] = r);
        };
      for (let e = 0, t = arguments.length; e < t; e++) arguments[e] && U(arguments[e], r);
      return n;
    },
    extend: (e, t, n, { allOwnKeys: r } = {}) => (
      U(
        t,
        (t, r) => {
          n && S(t) ? (e[r] = m(t, n)) : (e[r] = t);
        },
        { allOwnKeys: r },
      ),
      e
    ),
    trim: (e) => (e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "")),
    stripBOM: (e) => (65279 === e.charCodeAt(0) && (e = e.slice(1)), e),
    inherits: (e, t, n, r) => {
      (e.prototype = Object.create(t.prototype, r)), (e.prototype.constructor = e), Object.defineProperty(e, "super", { value: t.prototype }), n && Object.assign(e.prototype, n);
    },
    toFlatObject: (e, t, n, r) => {
      let o, i, s;
      const a = {};
      if (((t = t || {}), null == e)) return t;
      do {
        for (o = Object.getOwnPropertyNames(e), i = o.length; i-- > 0; ) (s = o[i]), (r && !r(s, e, t)) || a[s] || ((t[s] = e[s]), (a[s] = !0));
        e = !1 !== n && b(e);
      } while (e && (!n || n(e, t)) && e !== Object.prototype);
      return t;
    },
    kindOf: g,
    kindOfTest: w,
    endsWith: (e, t, n) => {
      (e = String(e)), (void 0 === n || n > e.length) && (n = e.length), (n -= t.length);
      const r = e.indexOf(t, n);
      return -1 !== r && r === n;
    },
    toArray: (e) => {
      if (!e) return null;
      if (_(e)) return e;
      let t = e.length;
      if (!C(t)) return null;
      const n = new Array(t);
      for (; t-- > 0; ) n[t] = e[t];
      return n;
    },
    forEachEntry: (e, t) => {
      const n = (e && e[Symbol.iterator]).call(e);
      let r;
      for (; (r = n.next()) && !r.done; ) {
        const n = r.value;
        t.call(e, n[0], n[1]);
      }
    },
    matchAll: (e, t) => {
      let n;
      const r = [];
      for (; null !== (n = e.exec(t)); ) r.push(n);
      return r;
    },
    isHTMLForm: K,
    hasOwnProperty: J,
    hasOwnProp: J,
    reduceDescriptors: $,
    freezeMethods: (e) => {
      $(e, (t, n) => {
        if (S(e) && -1 !== ["arguments", "caller", "callee"].indexOf(n)) return !1;
        const r = e[n];
        S(r) &&
          ((t.enumerable = !1),
          "writable" in t
            ? (t.writable = !1)
            : t.set ||
              (t.set = () => {
                throw Error("Can not rewrite read-only method '" + n + "'");
              }));
      });
    },
    toObjectSet: (e, t) => {
      const n = {},
        r = (e) => {
          e.forEach((e) => {
            n[e] = !0;
          });
        };
      return _(e) ? r(e) : r(String(e).split(t)), n;
    },
    toCamelCase: (e) =>
      e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (e, t, n) {
        return t.toUpperCase() + n;
      }),
    noop: () => {},
    toFiniteNumber: (e, t) => (null != e && Number.isFinite((e = +e)) ? e : t),
    findKey: q,
    global: M,
    isContextDefined: H,
    ALPHABET: Z,
    generateString: (e = 16, t = Z.ALPHA_DIGIT) => {
      let n = "";
      const { length: r } = t;
      for (; e--; ) n += t[(Math.random() * r) | 0];
      return n;
    },
    isSpecCompliantForm: function (e) {
      return !!(e && S(e.append) && "FormData" === e[Symbol.toStringTag] && e[Symbol.iterator]);
    },
    toJSONObject: (e) => {
      const t = new Array(10),
        n = (e, r) => {
          if (A(e)) {
            if (t.indexOf(e) >= 0) return;
            if (!("toJSON" in e)) {
              t[r] = e;
              const o = _(e) ? [] : {};
              return (
                U(e, (e, t) => {
                  const i = n(e, r + 1);
                  !x(i) && (o[t] = i);
                }),
                (t[r] = void 0),
                o
              );
            }
          }
          return e;
        };
      return n(e, 0);
    },
    isAsyncFn: X,
    isThenable: (e) => e && (A(e) || S(e)) && S(e.then) && S(e.catch),
    setImmediate: Q,
    asap: oe,
  };
function se(e, t, n, r, o) {
  Error.call(this), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : (this.stack = new Error().stack), (this.message = e), (this.name = "AxiosError"), t && (this.code = t), n && (this.config = n), r && (this.request = r), o && (this.response = o);
}
ie.inherits(se, Error, {
  toJSON: function () {
    return { message: this.message, name: this.name, description: this.description, number: this.number, fileName: this.fileName, lineNumber: this.lineNumber, columnNumber: this.columnNumber, stack: this.stack, config: ie.toJSONObject(this.config), code: this.code, status: this.response && this.response.status ? this.response.status : null };
  },
});
const ae = se.prototype,
  ce = {};
["ERR_BAD_OPTION_VALUE", "ERR_BAD_OPTION", "ECONNABORTED", "ETIMEDOUT", "ERR_NETWORK", "ERR_FR_TOO_MANY_REDIRECTS", "ERR_DEPRECATED", "ERR_BAD_RESPONSE", "ERR_BAD_REQUEST", "ERR_CANCELED", "ERR_NOT_SUPPORT", "ERR_INVALID_URL"].forEach((e) => {
  ce[e] = { value: e };
}),
  Object.defineProperties(se, ce),
  Object.defineProperty(ae, "isAxiosError", { value: !0 }),
  (se.from = (e, t, n, r, o, i) => {
    const s = Object.create(ae);
    return (
      ie.toFlatObject(
        e,
        s,
        function (e) {
          return e !== Error.prototype;
        },
        (e) => "isAxiosError" !== e,
      ),
      se.call(s, e.message, t, n, r, o),
      (s.cause = e),
      (s.name = e.name),
      i && Object.assign(s, i),
      s
    );
  });
const de = se;
function le(e) {
  return ie.isPlainObject(e) || ie.isArray(e);
}
function ue(e) {
  return ie.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function fe(e, t, n) {
  return e
    ? e
        .concat(t)
        .map(function (e, t) {
          return (e = ue(e)), !n && t ? "[" + e + "]" : e;
        })
        .join(n ? "." : "")
    : t;
}
const pe = ie.toFlatObject(ie, {}, null, function (e) {
    return /^is[A-Z]/.test(e);
  }),
  he = function (e, t, n) {
    if (!ie.isObject(e)) throw new TypeError("target must be an object");
    t = t || new FormData();
    const r = (n = ie.toFlatObject(n, { metaTokens: !0, dots: !1, indexes: !1 }, !1, function (e, t) {
        return !ie.isUndefined(t[e]);
      })).metaTokens,
      o = n.visitor || d,
      i = n.dots,
      s = n.indexes,
      a = (n.Blob || ("undefined" != typeof Blob && Blob)) && ie.isSpecCompliantForm(t);
    if (!ie.isFunction(o)) throw new TypeError("visitor must be a function");
    function c(e) {
      if (null === e) return "";
      if (ie.isDate(e)) return e.toISOString();
      if (!a && ie.isBlob(e)) throw new de("Blob is not supported. Use a Buffer instead.");
      return ie.isArrayBuffer(e) || ie.isTypedArray(e) ? (a && "function" == typeof Blob ? new Blob([e]) : Buffer.from(e)) : e;
    }
    function d(e, n, o) {
      let a = e;
      if (e && !o && "object" == typeof e)
        if (ie.endsWith(n, "{}")) (n = r ? n : n.slice(0, -2)), (e = JSON.stringify(e));
        else if (
          (ie.isArray(e) &&
            (function (e) {
              return ie.isArray(e) && !e.some(le);
            })(e)) ||
          ((ie.isFileList(e) || ie.endsWith(n, "[]")) && (a = ie.toArray(e)))
        )
          return (
            (n = ue(n)),
            a.forEach(function (e, r) {
              !ie.isUndefined(e) && null !== e && t.append(!0 === s ? fe([n], r, i) : null === s ? n : n + "[]", c(e));
            }),
            !1
          );
      return !!le(e) || (t.append(fe(o, n, i), c(e)), !1);
    }
    const l = [],
      u = Object.assign(pe, { defaultVisitor: d, convertValue: c, isVisitable: le });
    if (!ie.isObject(e)) throw new TypeError("data must be an object");
    return (
      (function e(n, r) {
        if (!ie.isUndefined(n)) {
          if (-1 !== l.indexOf(n)) throw Error("Circular reference detected in " + r.join("."));
          l.push(n),
            ie.forEach(n, function (n, i) {
              !0 === (!(ie.isUndefined(n) || null === n) && o.call(t, n, ie.isString(i) ? i.trim() : i, r, u)) && e(n, r ? r.concat(i) : [i]);
            }),
            l.pop();
        }
      })(e),
      t
    );
  };
function me(e) {
  const t = { "!": "%21", "'": "%27", "(": "%28", ")": "%29", "~": "%7E", "%20": "+", "%00": "\0" };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (e) {
    return t[e];
  });
}
function ye(e, t) {
  (this._pairs = []), e && he(e, this, t);
}
const be = ye.prototype;
(be.append = function (e, t) {
  this._pairs.push([e, t]);
}),
  (be.toString = function (e) {
    const t = e
      ? function (t) {
          return e.call(this, t, me);
        }
      : me;
    return this._pairs
      .map(function (e) {
        return t(e[0]) + "=" + t(e[1]);
      }, "")
      .join("&");
  });
const ge = ye;
function ve(e) {
  return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
function we(e, t, n) {
  if (!t) return e;
  const r = (n && n.encode) || ve,
    o = n && n.serialize;
  let i;
  if (((i = o ? o(t, n) : ie.isURLSearchParams(t) ? t.toString() : new ge(t, n).toString(r)), i)) {
    const t = e.indexOf("#");
    -1 !== t && (e = e.slice(0, t)), (e += (-1 === e.indexOf("?") ? "?" : "&") + i);
  }
  return e;
}
const Oe = class {
    constructor() {
      this.handlers = [];
    }
    use(e, t, n) {
      return this.handlers.push({ fulfilled: e, rejected: t, synchronous: !!n && n.synchronous, runWhen: n ? n.runWhen : null }), this.handlers.length - 1;
    }
    eject(e) {
      this.handlers[e] && (this.handlers[e] = null);
    }
    clear() {
      this.handlers && (this.handlers = []);
    }
    forEach(e) {
      ie.forEach(this.handlers, function (t) {
        null !== t && e(t);
      });
    }
  },
  _e = { silentJSONParsing: !0, forcedJSONParsing: !0, clarifyTimeoutError: !1 },
  xe = { isBrowser: !0, classes: { URLSearchParams: "undefined" != typeof URLSearchParams ? URLSearchParams : ge, FormData: "undefined" != typeof FormData ? FormData : null, Blob: "undefined" != typeof Blob ? Blob : null }, protocols: ["http", "https", "file", "blob", "url", "data"] },
  Ee = "undefined" != typeof window && "undefined" != typeof document,
  Te = ((Se = "undefined" != typeof navigator && navigator.product), Ee && ["ReactNative", "NativeScript", "NS"].indexOf(Se) < 0);
var Se;
const Ce = "undefined" != typeof WorkerGlobalScope && self instanceof WorkerGlobalScope && "function" == typeof self.importScripts,
  Ae = (Ee && window.location.href) || "http://localhost",
  Re = { ...t, ...xe },
  Le = function (e) {
    function t(e, n, r, o) {
      let i = e[o++];
      if ("__proto__" === i) return !0;
      const s = Number.isFinite(+i),
        a = o >= e.length;
      return (
        (i = !i && ie.isArray(r) ? r.length : i),
        a
          ? (ie.hasOwnProp(r, i) ? (r[i] = [r[i], n]) : (r[i] = n), !s)
          : ((r[i] && ie.isObject(r[i])) || (r[i] = []),
            t(e, n, r[i], o) &&
              ie.isArray(r[i]) &&
              (r[i] = (function (e) {
                const t = {},
                  n = Object.keys(e);
                let r;
                const o = n.length;
                let i;
                for (r = 0; r < o; r++) (i = n[r]), (t[i] = e[i]);
                return t;
              })(r[i])),
            !s)
      );
    }
    if (ie.isFormData(e) && ie.isFunction(e.entries)) {
      const n = {};
      return (
        ie.forEachEntry(e, (e, r) => {
          t(
            (function (e) {
              return ie.matchAll(/\w+|\[(\w*)]/g, e).map((e) => ("[]" === e[0] ? "" : e[1] || e[0]));
            })(e),
            r,
            n,
            0,
          );
        }),
        n
      );
    }
    return null;
  },
  je = {
    transitional: _e,
    adapter: ["xhr", "http", "fetch"],
    transformRequest: [
      function (e, t) {
        const n = t.getContentType() || "",
          r = n.indexOf("application/json") > -1,
          o = ie.isObject(e);
        if ((o && ie.isHTMLForm(e) && (e = new FormData(e)), ie.isFormData(e))) return r ? JSON.stringify(Le(e)) : e;
        if (ie.isArrayBuffer(e) || ie.isBuffer(e) || ie.isStream(e) || ie.isFile(e) || ie.isBlob(e) || ie.isReadableStream(e)) return e;
        if (ie.isArrayBufferView(e)) return e.buffer;
        if (ie.isURLSearchParams(e)) return t.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), e.toString();
        let i;
        if (o) {
          if (n.indexOf("application/x-www-form-urlencoded") > -1)
            return (function (e, t) {
              return he(
                e,
                new Re.classes.URLSearchParams(),
                Object.assign(
                  {
                    visitor: function (e, t, n, r) {
                      return Re.isNode && ie.isBuffer(e) ? (this.append(t, e.toString("base64")), !1) : r.defaultVisitor.apply(this, arguments);
                    },
                  },
                  t,
                ),
              );
            })(e, this.formSerializer).toString();
          if ((i = ie.isFileList(e)) || n.indexOf("multipart/form-data") > -1) {
            const t = this.env && this.env.FormData;
            return he(i ? { "files[]": e } : e, t && new t(), this.formSerializer);
          }
        }
        return o || r
          ? (t.setContentType("application/json", !1),
            (function (e, t, n) {
              if (ie.isString(e))
                try {
                  return (0, JSON.parse)(e), ie.trim(e);
                } catch (e) {
                  if ("SyntaxError" !== e.name) throw e;
                }
              return (0, JSON.stringify)(e);
            })(e))
          : e;
      },
    ],
    transformResponse: [
      function (e) {
        const t = this.transitional || je.transitional,
          n = t && t.forcedJSONParsing,
          r = "json" === this.responseType;
        if (ie.isResponse(e) || ie.isReadableStream(e)) return e;
        if (e && ie.isString(e) && ((n && !this.responseType) || r)) {
          const n = !(t && t.silentJSONParsing) && r;
          try {
            return JSON.parse(e);
          } catch (e) {
            if (n) {
              if ("SyntaxError" === e.name) throw de.from(e, de.ERR_BAD_RESPONSE, this, null, this.response);
              throw e;
            }
          }
        }
        return e;
      },
    ],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
    maxBodyLength: -1,
    env: { FormData: Re.classes.FormData, Blob: Re.classes.Blob },
    validateStatus: function (e) {
      return e >= 200 && e < 300;
    },
    headers: { common: { Accept: "application/json, text/plain, */*", "Content-Type": void 0 } },
  };
ie.forEach(["delete", "get", "head", "post", "put", "patch"], (e) => {
  je.headers[e] = {};
});
const ke = je,
  Fe = ie.toObjectSet(["age", "authorization", "content-length", "content-type", "etag", "expires", "from", "host", "if-modified-since", "if-unmodified-since", "last-modified", "location", "max-forwards", "proxy-authorization", "referer", "retry-after", "user-agent"]),
  Pe = Symbol("internals");
function Ne(e) {
  return e && String(e).trim().toLowerCase();
}
function Ie(e) {
  return !1 === e || null == e ? e : ie.isArray(e) ? e.map(Ie) : String(e);
}
function De(e, t, n, r, o) {
  return ie.isFunction(r) ? r.call(this, t, n) : (o && (t = n), ie.isString(t) ? (ie.isString(r) ? -1 !== t.indexOf(r) : ie.isRegExp(r) ? r.test(t) : void 0) : void 0);
}
class Be {
  constructor(e) {
    e && this.set(e);
  }
  set(e, t, n) {
    const r = this;
    function o(e, t, n) {
      const o = Ne(t);
      if (!o) throw new Error("header name must be a non-empty string");
      const i = ie.findKey(r, o);
      (!i || void 0 === r[i] || !0 === n || (void 0 === n && !1 !== r[i])) && (r[i || t] = Ie(e));
    }
    const i = (e, t) => ie.forEach(e, (e, n) => o(e, n, t));
    if (ie.isPlainObject(e) || e instanceof this.constructor) i(e, t);
    else if (ie.isString(e) && (e = e.trim()) && !/^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim()))
      i(
        ((e) => {
          const t = {};
          let n, r, o;
          return (
            e &&
              e.split("\n").forEach(function (e) {
                (o = e.indexOf(":")), (n = e.substring(0, o).trim().toLowerCase()), (r = e.substring(o + 1).trim()), !n || (t[n] && Fe[n]) || ("set-cookie" === n ? (t[n] ? t[n].push(r) : (t[n] = [r])) : (t[n] = t[n] ? t[n] + ", " + r : r));
              }),
            t
          );
        })(e),
        t,
      );
    else if (ie.isHeaders(e)) for (const [t, r] of e.entries()) o(r, t, n);
    else null != e && o(t, e, n);
    return this;
  }
  get(e, t) {
    if ((e = Ne(e))) {
      const n = ie.findKey(this, e);
      if (n) {
        const e = this[n];
        if (!t) return e;
        if (!0 === t)
          return (function (e) {
            const t = Object.create(null),
              n = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
            let r;
            for (; (r = n.exec(e)); ) t[r[1]] = r[2];
            return t;
          })(e);
        if (ie.isFunction(t)) return t.call(this, e, n);
        if (ie.isRegExp(t)) return t.exec(e);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(e, t) {
    if ((e = Ne(e))) {
      const n = ie.findKey(this, e);
      return !(!n || void 0 === this[n] || (t && !De(0, this[n], n, t)));
    }
    return !1;
  }
  delete(e, t) {
    const n = this;
    let r = !1;
    function o(e) {
      if ((e = Ne(e))) {
        const o = ie.findKey(n, e);
        !o || (t && !De(0, n[o], o, t)) || (delete n[o], (r = !0));
      }
    }
    return ie.isArray(e) ? e.forEach(o) : o(e), r;
  }
  clear(e) {
    const t = Object.keys(this);
    let n = t.length,
      r = !1;
    for (; n--; ) {
      const o = t[n];
      (e && !De(0, this[o], o, e, !0)) || (delete this[o], (r = !0));
    }
    return r;
  }
  normalize(e) {
    const t = this,
      n = {};
    return (
      ie.forEach(this, (r, o) => {
        const i = ie.findKey(n, o);
        if (i) return (t[i] = Ie(r)), void delete t[o];
        const s = e
          ? (function (e) {
              return e
                .trim()
                .toLowerCase()
                .replace(/([a-z\d])(\w*)/g, (e, t, n) => t.toUpperCase() + n);
            })(o)
          : String(o).trim();
        s !== o && delete t[o], (t[s] = Ie(r)), (n[s] = !0);
      }),
      this
    );
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    const t = Object.create(null);
    return (
      ie.forEach(this, (n, r) => {
        null != n && !1 !== n && (t[r] = e && ie.isArray(n) ? n.join(", ") : n);
      }),
      t
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON())
      .map(([e, t]) => e + ": " + t)
      .join("\n");
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...t) {
    const n = new this(e);
    return t.forEach((e) => n.set(e)), n;
  }
  static accessor(e) {
    const t = (this[Pe] = this[Pe] = { accessors: {} }).accessors,
      n = this.prototype;
    function r(e) {
      const r = Ne(e);
      t[r] ||
        ((function (e, t) {
          const n = ie.toCamelCase(" " + t);
          ["get", "set", "has"].forEach((r) => {
            Object.defineProperty(e, r + n, {
              value: function (e, n, o) {
                return this[r].call(this, t, e, n, o);
              },
              configurable: !0,
            });
          });
        })(n, e),
        (t[r] = !0));
    }
    return ie.isArray(e) ? e.forEach(r) : r(e), this;
  }
}
Be.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]),
  ie.reduceDescriptors(Be.prototype, ({ value: e }, t) => {
    let n = t[0].toUpperCase() + t.slice(1);
    return {
      get: () => e,
      set(e) {
        this[n] = e;
      },
    };
  }),
  ie.freezeMethods(Be);
const Ue = Be;
function qe(e, t) {
  const n = this || ke,
    r = t || n,
    o = Ue.from(r.headers);
  let i = r.data;
  return (
    ie.forEach(e, function (e) {
      i = e.call(n, i, o.normalize(), t ? t.status : void 0);
    }),
    o.normalize(),
    i
  );
}
function Me(e) {
  return !(!e || !e.__CANCEL__);
}
function He(e, t, n) {
  de.call(this, null == e ? "canceled" : e, de.ERR_CANCELED, t, n), (this.name = "CanceledError");
}
ie.inherits(He, de, { __CANCEL__: !0 });
const ze = He;
function Ve(e, t, n) {
  const r = n.config.validateStatus;
  n.status && r && !r(n.status) ? t(new de("Request failed with status code " + n.status, [de.ERR_BAD_REQUEST, de.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4], n.config, n.request, n)) : e(n);
}
const Ke = (e, t, n = 3) => {
    let r = 0;
    const o = (function (e, t) {
      e = e || 10;
      const n = new Array(e),
        r = new Array(e);
      let o,
        i = 0,
        s = 0;
      return (
        (t = void 0 !== t ? t : 1e3),
        function (a) {
          const c = Date.now(),
            d = r[s];
          o || (o = c), (n[i] = a), (r[i] = c);
          let l = s,
            u = 0;
          for (; l !== i; ) (u += n[l++]), (l %= e);
          if (((i = (i + 1) % e), i === s && (s = (s + 1) % e), c - o < t)) return;
          const f = d && c - d;
          return f ? Math.round((1e3 * u) / f) : void 0;
        }
      );
    })(50, 250);
    return (function (e, t) {
      let n,
        r,
        o = 0,
        i = 1e3 / t;
      const s = (t, i = Date.now()) => {
        (o = i), (n = null), r && (clearTimeout(r), (r = null)), e.apply(null, t);
      };
      return [
        (...e) => {
          const t = Date.now(),
            a = t - o;
          a >= i
            ? s(e, t)
            : ((n = e),
              r ||
                (r = setTimeout(() => {
                  (r = null), s(n);
                }, i - a)));
        },
        () => n && s(n),
      ];
    })((n) => {
      const i = n.loaded,
        s = n.lengthComputable ? n.total : void 0,
        a = i - r,
        c = o(a);
      (r = i), e({ loaded: i, total: s, progress: s ? i / s : void 0, bytes: a, rate: c || void 0, estimated: c && s && i <= s ? (s - i) / c : void 0, event: n, lengthComputable: null != s, [t ? "download" : "upload"]: !0 });
    }, n);
  },
  Je = (e, t) => {
    const n = null != e;
    return [(r) => t[0]({ lengthComputable: n, total: e, loaded: r }), t[1]];
  },
  We =
    (e) =>
    (...t) =>
      ie.asap(() => e(...t)),
  $e = Re.hasStandardBrowserEnv
    ? (function () {
        const e = /(msie|trident)/i.test(navigator.userAgent),
          t = document.createElement("a");
        let n;
        function r(n) {
          let r = n;
          return e && (t.setAttribute("href", r), (r = t.href)), t.setAttribute("href", r), { href: t.href, protocol: t.protocol ? t.protocol.replace(/:$/, "") : "", host: t.host, search: t.search ? t.search.replace(/^\?/, "") : "", hash: t.hash ? t.hash.replace(/^#/, "") : "", hostname: t.hostname, port: t.port, pathname: "/" === t.pathname.charAt(0) ? t.pathname : "/" + t.pathname };
        }
        return (
          (n = r(window.location.href)),
          function (e) {
            const t = ie.isString(e) ? r(e) : e;
            return t.protocol === n.protocol && t.host === n.host;
          }
        );
      })()
    : function () {
        return !0;
      },
  Ye = Re.hasStandardBrowserEnv
    ? {
        write(e, t, n, r, o, i) {
          const s = [e + "=" + encodeURIComponent(t)];
          ie.isNumber(n) && s.push("expires=" + new Date(n).toGMTString()), ie.isString(r) && s.push("path=" + r), ie.isString(o) && s.push("domain=" + o), !0 === i && s.push("secure"), (document.cookie = s.join("; "));
        },
        read(e) {
          const t = document.cookie.match(new RegExp("(^|;\\s*)(" + e + ")=([^;]*)"));
          return t ? decodeURIComponent(t[3]) : null;
        },
        remove(e) {
          this.write(e, "", Date.now() - 864e5);
        },
      }
    : { write() {}, read: () => null, remove() {} };
function Ge(e, t) {
  return e && !/^([a-z][a-z\d+\-.]*:)?\/\//i.test(t)
    ? (function (e, t) {
        return t ? e.replace(/\/?\/$/, "") + "/" + t.replace(/^\/+/, "") : e;
      })(e, t)
    : t;
}
const Ze = (e) => (e instanceof Ue ? { ...e } : e);
function Xe(e, t) {
  t = t || {};
  const n = {};
  function r(e, t, n) {
    return ie.isPlainObject(e) && ie.isPlainObject(t) ? ie.merge.call({ caseless: n }, e, t) : ie.isPlainObject(t) ? ie.merge({}, t) : ie.isArray(t) ? t.slice() : t;
  }
  function o(e, t, n) {
    return ie.isUndefined(t) ? (ie.isUndefined(e) ? void 0 : r(void 0, e, n)) : r(e, t, n);
  }
  function i(e, t) {
    if (!ie.isUndefined(t)) return r(void 0, t);
  }
  function s(e, t) {
    return ie.isUndefined(t) ? (ie.isUndefined(e) ? void 0 : r(void 0, e)) : r(void 0, t);
  }
  function a(n, o, i) {
    return i in t ? r(n, o) : i in e ? r(void 0, n) : void 0;
  }
  const c = { url: i, method: i, data: i, baseURL: s, transformRequest: s, transformResponse: s, paramsSerializer: s, timeout: s, timeoutMessage: s, withCredentials: s, withXSRFToken: s, adapter: s, responseType: s, xsrfCookieName: s, xsrfHeaderName: s, onUploadProgress: s, onDownloadProgress: s, decompress: s, maxContentLength: s, maxBodyLength: s, beforeRedirect: s, transport: s, httpAgent: s, httpsAgent: s, cancelToken: s, socketPath: s, responseEncoding: s, validateStatus: a, headers: (e, t) => o(Ze(e), Ze(t), !0) };
  return (
    ie.forEach(Object.keys(Object.assign({}, e, t)), function (r) {
      const i = c[r] || o,
        s = i(e[r], t[r], r);
      (ie.isUndefined(s) && i !== a) || (n[r] = s);
    }),
    n
  );
}
const Qe = (e) => {
    const t = Xe({}, e);
    let n,
      { data: r, withXSRFToken: o, xsrfHeaderName: i, xsrfCookieName: s, headers: a, auth: c } = t;
    if (((t.headers = a = Ue.from(a)), (t.url = we(Ge(t.baseURL, t.url), e.params, e.paramsSerializer)), c && a.set("Authorization", "Basic " + btoa((c.username || "") + ":" + (c.password ? unescape(encodeURIComponent(c.password)) : ""))), ie.isFormData(r)))
      if (Re.hasStandardBrowserEnv || Re.hasStandardBrowserWebWorkerEnv) a.setContentType(void 0);
      else if (!1 !== (n = a.getContentType())) {
        const [e, ...t] = n
          ? n
              .split(";")
              .map((e) => e.trim())
              .filter(Boolean)
          : [];
        a.setContentType([e || "multipart/form-data", ...t].join("; "));
      }
    if (Re.hasStandardBrowserEnv && (o && ie.isFunction(o) && (o = o(t)), o || (!1 !== o && $e(t.url)))) {
      const e = i && s && Ye.read(s);
      e && a.set(i, e);
    }
    return t;
  },
  et =
    "undefined" != typeof XMLHttpRequest &&
    function (e) {
      return new Promise(function (t, n) {
        const r = Qe(e);
        let o = r.data;
        const i = Ue.from(r.headers).normalize();
        let s,
          a,
          c,
          d,
          l,
          { responseType: u, onUploadProgress: f, onDownloadProgress: p } = r;
        function h() {
          d && d(), l && l(), r.cancelToken && r.cancelToken.unsubscribe(s), r.signal && r.signal.removeEventListener("abort", s);
        }
        let m = new XMLHttpRequest();
        function y() {
          if (!m) return;
          const r = Ue.from("getAllResponseHeaders" in m && m.getAllResponseHeaders());
          Ve(
            function (e) {
              t(e), h();
            },
            function (e) {
              n(e), h();
            },
            { data: u && "text" !== u && "json" !== u ? m.response : m.responseText, status: m.status, statusText: m.statusText, headers: r, config: e, request: m },
          ),
            (m = null);
        }
        m.open(r.method.toUpperCase(), r.url, !0),
          (m.timeout = r.timeout),
          "onloadend" in m
            ? (m.onloadend = y)
            : (m.onreadystatechange = function () {
                m && 4 === m.readyState && (0 !== m.status || (m.responseURL && 0 === m.responseURL.indexOf("file:"))) && setTimeout(y);
              }),
          (m.onabort = function () {
            m && (n(new de("Request aborted", de.ECONNABORTED, e, m)), (m = null));
          }),
          (m.onerror = function () {
            n(new de("Network Error", de.ERR_NETWORK, e, m)), (m = null);
          }),
          (m.ontimeout = function () {
            let t = r.timeout ? "timeout of " + r.timeout + "ms exceeded" : "timeout exceeded";
            const o = r.transitional || _e;
            r.timeoutErrorMessage && (t = r.timeoutErrorMessage), n(new de(t, o.clarifyTimeoutError ? de.ETIMEDOUT : de.ECONNABORTED, e, m)), (m = null);
          }),
          void 0 === o && i.setContentType(null),
          "setRequestHeader" in m &&
            ie.forEach(i.toJSON(), function (e, t) {
              m.setRequestHeader(t, e);
            }),
          ie.isUndefined(r.withCredentials) || (m.withCredentials = !!r.withCredentials),
          u && "json" !== u && (m.responseType = r.responseType),
          p && (([c, l] = Ke(p, !0)), m.addEventListener("progress", c)),
          f && m.upload && (([a, d] = Ke(f)), m.upload.addEventListener("progress", a), m.upload.addEventListener("loadend", d)),
          (r.cancelToken || r.signal) &&
            ((s = (t) => {
              m && (n(!t || t.type ? new ze(null, e, m) : t), m.abort(), (m = null));
            }),
            r.cancelToken && r.cancelToken.subscribe(s),
            r.signal && (r.signal.aborted ? s() : r.signal.addEventListener("abort", s)));
        const b = (function (e) {
          const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
          return (t && t[1]) || "";
        })(r.url);
        b && -1 === Re.protocols.indexOf(b) ? n(new de("Unsupported protocol " + b + ":", de.ERR_BAD_REQUEST, e)) : m.send(o || null);
      });
    },
  tt = (e, t) => {
    let n,
      r = new AbortController();
    const o = function (e) {
      if (!n) {
        (n = !0), s();
        const t = e instanceof Error ? e : this.reason;
        r.abort(t instanceof de ? t : new ze(t instanceof Error ? t.message : t));
      }
    };
    let i =
      t &&
      setTimeout(() => {
        o(new de(`timeout ${t} of ms exceeded`, de.ETIMEDOUT));
      }, t);
    const s = () => {
      e &&
        (i && clearTimeout(i),
        (i = null),
        e.forEach((e) => {
          e && (e.removeEventListener ? e.removeEventListener("abort", o) : e.unsubscribe(o));
        }),
        (e = null));
    };
    e.forEach((e) => e && e.addEventListener && e.addEventListener("abort", o));
    const { signal: a } = r;
    return (
      (a.unsubscribe = s),
      [
        a,
        () => {
          i && clearTimeout(i), (i = null);
        },
      ]
    );
  },
  nt = function* (e, t) {
    let n = e.byteLength;
    if (!t || n < t) return void (yield e);
    let r,
      o = 0;
    for (; o < n; ) (r = o + t), yield e.slice(o, r), (o = r);
  },
  rt = (e, t, n, r, o) => {
    const i = (async function* (e, t, n) {
      for await (const r of e) yield* nt(ArrayBuffer.isView(r) ? r : await n(String(r)), t);
    })(e, t, o);
    let s,
      a = 0,
      c = (e) => {
        s || ((s = !0), r && r(e));
      };
    return new ReadableStream(
      {
        async pull(e) {
          try {
            const { done: t, value: r } = await i.next();
            if (t) return c(), void e.close();
            let o = r.byteLength;
            if (n) {
              let e = (a += o);
              n(e);
            }
            e.enqueue(new Uint8Array(r));
          } catch (e) {
            throw (c(e), e);
          }
        },
        cancel: (e) => (c(e), i.return()),
      },
      { highWaterMark: 2 },
    );
  },
  ot = "function" == typeof fetch && "function" == typeof Request && "function" == typeof Response,
  it = ot && "function" == typeof ReadableStream,
  st = ot && ("function" == typeof TextEncoder ? ((at = new TextEncoder()), (e) => at.encode(e)) : async (e) => new Uint8Array(await new Response(e).arrayBuffer()));
var at;
const ct = (e, ...t) => {
    try {
      return !!e(...t);
    } catch (e) {
      return !1;
    }
  },
  dt =
    it &&
    ct(() => {
      let e = !1;
      const t = new Request(Re.origin, {
        body: new ReadableStream(),
        method: "POST",
        get duplex() {
          return (e = !0), "half";
        },
      }).headers.has("Content-Type");
      return e && !t;
    }),
  lt = it && ct(() => ie.isReadableStream(new Response("").body)),
  ut = { stream: lt && ((e) => e.body) };
var ft;
ot &&
  ((ft = new Response()),
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((e) => {
    !ut[e] &&
      (ut[e] = ie.isFunction(ft[e])
        ? (t) => t[e]()
        : (t, n) => {
            throw new de(`Response type '${e}' is not supported`, de.ERR_NOT_SUPPORT, n);
          });
  }));
const pt = {
  http: null,
  xhr: et,
  fetch:
    ot &&
    (async (e) => {
      let { url: t, method: n, data: r, signal: o, cancelToken: i, timeout: s, onDownloadProgress: a, onUploadProgress: c, responseType: d, headers: l, withCredentials: u = "same-origin", fetchOptions: f } = Qe(e);
      d = d ? (d + "").toLowerCase() : "text";
      let p,
        h,
        [m, y] = o || i || s ? tt([o, i], s) : [];
      const b = () => {
        !p &&
          setTimeout(() => {
            m && m.unsubscribe();
          }),
          (p = !0);
      };
      let g;
      try {
        if (
          c &&
          dt &&
          "get" !== n &&
          "head" !== n &&
          0 !==
            (g = await (async (e, t) => {
              const n = ie.toFiniteNumber(e.getContentLength());
              return null == n ? (async (e) => (null == e ? 0 : ie.isBlob(e) ? e.size : ie.isSpecCompliantForm(e) ? (await new Request(e).arrayBuffer()).byteLength : ie.isArrayBufferView(e) || ie.isArrayBuffer(e) ? e.byteLength : (ie.isURLSearchParams(e) && (e += ""), ie.isString(e) ? (await st(e)).byteLength : void 0)))(t) : n;
            })(l, r))
        ) {
          let e,
            n = new Request(t, { method: "POST", body: r, duplex: "half" });
          if ((ie.isFormData(r) && (e = n.headers.get("content-type")) && l.setContentType(e), n.body)) {
            const [e, t] = Je(g, Ke(We(c)));
            r = rt(n.body, 65536, e, t, st);
          }
        }
        ie.isString(u) || (u = u ? "include" : "omit"), (h = new Request(t, { ...f, signal: m, method: n.toUpperCase(), headers: l.normalize().toJSON(), body: r, duplex: "half", credentials: u }));
        let o = await fetch(h);
        const i = lt && ("stream" === d || "response" === d);
        if (lt && (a || i)) {
          const e = {};
          ["status", "statusText", "headers"].forEach((t) => {
            e[t] = o[t];
          });
          const t = ie.toFiniteNumber(o.headers.get("content-length")),
            [n, r] = (a && Je(t, Ke(We(a), !0))) || [];
          o = new Response(
            rt(
              o.body,
              65536,
              n,
              () => {
                r && r(), i && b();
              },
              st,
            ),
            e,
          );
        }
        d = d || "text";
        let s = await ut[ie.findKey(ut, d) || "text"](o, e);
        return (
          !i && b(),
          y && y(),
          await new Promise((t, n) => {
            Ve(t, n, { data: s, headers: Ue.from(o.headers), status: o.status, statusText: o.statusText, config: e, request: h });
          })
        );
      } catch (t) {
        if ((b(), t && "TypeError" === t.name && /fetch/i.test(t.message))) throw Object.assign(new de("Network Error", de.ERR_NETWORK, e, h), { cause: t.cause || t });
        throw de.from(t, t && t.code, e, h);
      }
    }),
};
ie.forEach(pt, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: t });
    } catch (e) {}
    Object.defineProperty(e, "adapterName", { value: t });
  }
});
const ht = (e) => `- ${e}`,
  mt = (e) => ie.isFunction(e) || null === e || !1 === e,
  yt = (e) => {
    e = ie.isArray(e) ? e : [e];
    const { length: t } = e;
    let n, r;
    const o = {};
    for (let i = 0; i < t; i++) {
      let t;
      if (((n = e[i]), (r = n), !mt(n) && ((r = pt[(t = String(n)).toLowerCase()]), void 0 === r))) throw new de(`Unknown adapter '${t}'`);
      if (r) break;
      o[t || "#" + i] = r;
    }
    if (!r) {
      const e = Object.entries(o).map(([e, t]) => `adapter ${e} ` + (!1 === t ? "is not supported by the environment" : "is not available in the build"));
      let n = t ? (e.length > 1 ? "since :\n" + e.map(ht).join("\n") : " " + ht(e[0])) : "as no adapter specified";
      throw new de("There is no suitable adapter to dispatch the request " + n, "ERR_NOT_SUPPORT");
    }
    return r;
  };
function bt(e) {
  if ((e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)) throw new ze(null, e);
}
function gt(e) {
  return (
    bt(e),
    (e.headers = Ue.from(e.headers)),
    (e.data = qe.call(e, e.transformRequest)),
    -1 !== ["post", "put", "patch"].indexOf(e.method) && e.headers.setContentType("application/x-www-form-urlencoded", !1),
    yt(e.adapter || ke.adapter)(e).then(
      function (t) {
        return bt(e), (t.data = qe.call(e, e.transformResponse, t)), (t.headers = Ue.from(t.headers)), t;
      },
      function (t) {
        return Me(t) || (bt(e), t && t.response && ((t.response.data = qe.call(e, e.transformResponse, t.response)), (t.response.headers = Ue.from(t.response.headers)))), Promise.reject(t);
      },
    )
  );
}
const vt = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((e, t) => {
  vt[e] = function (n) {
    return typeof n === e || "a" + (t < 1 ? "n " : " ") + e;
  };
});
const wt = {};
vt.transitional = function (e, t, n) {
  function r(e, t) {
    return "[Axios v1.7.4] Transitional option '" + e + "'" + t + (n ? ". " + n : "");
  }
  return (n, o, i) => {
    if (!1 === e) throw new de(r(o, " has been removed" + (t ? " in " + t : "")), de.ERR_DEPRECATED);
    return t && !wt[o] && ((wt[o] = !0), console.warn(r(o, " has been deprecated since v" + t + " and will be removed in the near future"))), !e || e(n, o, i);
  };
};
const Ot = {
    assertOptions: function (e, t, n) {
      if ("object" != typeof e) throw new de("options must be an object", de.ERR_BAD_OPTION_VALUE);
      const r = Object.keys(e);
      let o = r.length;
      for (; o-- > 0; ) {
        const i = r[o],
          s = t[i];
        if (s) {
          const t = e[i],
            n = void 0 === t || s(t, i, e);
          if (!0 !== n) throw new de("option " + i + " must be " + n, de.ERR_BAD_OPTION_VALUE);
        } else if (!0 !== n) throw new de("Unknown option " + i, de.ERR_BAD_OPTION);
      }
    },
    validators: vt,
  },
  _t = Ot.validators;
class xt {
  constructor(e) {
    (this.defaults = e), (this.interceptors = { request: new Oe(), response: new Oe() });
  }
  async request(e, t) {
    try {
      return await this._request(e, t);
    } catch (e) {
      if (e instanceof Error) {
        let t;
        Error.captureStackTrace ? Error.captureStackTrace((t = {})) : (t = new Error());
        const n = t.stack ? t.stack.replace(/^.+\n/, "") : "";
        try {
          e.stack ? n && !String(e.stack).endsWith(n.replace(/^.+\n.+\n/, "")) && (e.stack += "\n" + n) : (e.stack = n);
        } catch (e) {}
      }
      throw e;
    }
  }
  _request(e, t) {
    "string" == typeof e ? ((t = t || {}).url = e) : (t = e || {}), (t = Xe(this.defaults, t));
    const { transitional: n, paramsSerializer: r, headers: o } = t;
    void 0 !== n && Ot.assertOptions(n, { silentJSONParsing: _t.transitional(_t.boolean), forcedJSONParsing: _t.transitional(_t.boolean), clarifyTimeoutError: _t.transitional(_t.boolean) }, !1), null != r && (ie.isFunction(r) ? (t.paramsSerializer = { serialize: r }) : Ot.assertOptions(r, { encode: _t.function, serialize: _t.function }, !0)), (t.method = (t.method || this.defaults.method || "get").toLowerCase());
    let i = o && ie.merge(o.common, o[t.method]);
    o &&
      ie.forEach(["delete", "get", "head", "post", "put", "patch", "common"], (e) => {
        delete o[e];
      }),
      (t.headers = Ue.concat(i, o));
    const s = [];
    let a = !0;
    this.interceptors.request.forEach(function (e) {
      ("function" == typeof e.runWhen && !1 === e.runWhen(t)) || ((a = a && e.synchronous), s.unshift(e.fulfilled, e.rejected));
    });
    const c = [];
    let d;
    this.interceptors.response.forEach(function (e) {
      c.push(e.fulfilled, e.rejected);
    });
    let l,
      u = 0;
    if (!a) {
      const e = [gt.bind(this), void 0];
      for (e.unshift.apply(e, s), e.push.apply(e, c), l = e.length, d = Promise.resolve(t); u < l; ) d = d.then(e[u++], e[u++]);
      return d;
    }
    l = s.length;
    let f = t;
    for (u = 0; u < l; ) {
      const e = s[u++],
        t = s[u++];
      try {
        f = e(f);
      } catch (e) {
        t.call(this, e);
        break;
      }
    }
    try {
      d = gt.call(this, f);
    } catch (e) {
      return Promise.reject(e);
    }
    for (u = 0, l = c.length; u < l; ) d = d.then(c[u++], c[u++]);
    return d;
  }
  getUri(e) {
    return we(Ge((e = Xe(this.defaults, e)).baseURL, e.url), e.params, e.paramsSerializer);
  }
}
ie.forEach(["delete", "get", "head", "options"], function (e) {
  xt.prototype[e] = function (t, n) {
    return this.request(Xe(n || {}, { method: e, url: t, data: (n || {}).data }));
  };
}),
  ie.forEach(["post", "put", "patch"], function (e) {
    function t(t) {
      return function (n, r, o) {
        return this.request(Xe(o || {}, { method: e, headers: t ? { "Content-Type": "multipart/form-data" } : {}, url: n, data: r }));
      };
    }
    (xt.prototype[e] = t()), (xt.prototype[e + "Form"] = t(!0));
  });
const Et = xt;
class Tt {
  constructor(e) {
    if ("function" != typeof e) throw new TypeError("executor must be a function.");
    let t;
    this.promise = new Promise(function (e) {
      t = e;
    });
    const n = this;
    this.promise.then((e) => {
      if (!n._listeners) return;
      let t = n._listeners.length;
      for (; t-- > 0; ) n._listeners[t](e);
      n._listeners = null;
    }),
      (this.promise.then = (e) => {
        let t;
        const r = new Promise((e) => {
          n.subscribe(e), (t = e);
        }).then(e);
        return (
          (r.cancel = function () {
            n.unsubscribe(t);
          }),
          r
        );
      }),
      e(function (e, r, o) {
        n.reason || ((n.reason = new ze(e, r, o)), t(n.reason));
      });
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(e) {
    this.reason ? e(this.reason) : this._listeners ? this._listeners.push(e) : (this._listeners = [e]);
  }
  unsubscribe(e) {
    if (!this._listeners) return;
    const t = this._listeners.indexOf(e);
    -1 !== t && this._listeners.splice(t, 1);
  }
  static source() {
    let e;
    return {
      token: new Tt(function (t) {
        e = t;
      }),
      cancel: e,
    };
  }
}
const St = Tt,
  Ct = { Continue: 100, SwitchingProtocols: 101, Processing: 102, EarlyHints: 103, Ok: 200, Created: 201, Accepted: 202, NonAuthoritativeInformation: 203, NoContent: 204, ResetContent: 205, PartialContent: 206, MultiStatus: 207, AlreadyReported: 208, ImUsed: 226, MultipleChoices: 300, MovedPermanently: 301, Found: 302, SeeOther: 303, NotModified: 304, UseProxy: 305, Unused: 306, TemporaryRedirect: 307, PermanentRedirect: 308, BadRequest: 400, Unauthorized: 401, PaymentRequired: 402, Forbidden: 403, NotFound: 404, MethodNotAllowed: 405, NotAcceptable: 406, ProxyAuthenticationRequired: 407, RequestTimeout: 408, Conflict: 409, Gone: 410, LengthRequired: 411, PreconditionFailed: 412, PayloadTooLarge: 413, UriTooLong: 414, UnsupportedMediaType: 415, RangeNotSatisfiable: 416, ExpectationFailed: 417, ImATeapot: 418, MisdirectedRequest: 421, UnprocessableEntity: 422, Locked: 423, FailedDependency: 424, TooEarly: 425, UpgradeRequired: 426, PreconditionRequired: 428, TooManyRequests: 429, RequestHeaderFieldsTooLarge: 431, UnavailableForLegalReasons: 451, InternalServerError: 500, NotImplemented: 501, BadGateway: 502, ServiceUnavailable: 503, GatewayTimeout: 504, HttpVersionNotSupported: 505, VariantAlsoNegotiates: 506, InsufficientStorage: 507, LoopDetected: 508, NotExtended: 510, NetworkAuthenticationRequired: 511 };
Object.entries(Ct).forEach(([e, t]) => {
  Ct[t] = e;
});
const At = Ct,
  Rt = (function e(t) {
    const n = new Et(t),
      r = m(Et.prototype.request, n);
    return (
      ie.extend(r, Et.prototype, n, { allOwnKeys: !0 }),
      ie.extend(r, n, null, { allOwnKeys: !0 }),
      (r.create = function (n) {
        return e(Xe(t, n));
      }),
      r
    );
  })(ke);
(Rt.Axios = Et),
  (Rt.CanceledError = ze),
  (Rt.CancelToken = St),
  (Rt.isCancel = Me),
  (Rt.VERSION = "1.7.4"),
  (Rt.toFormData = he),
  (Rt.AxiosError = de),
  (Rt.Cancel = Rt.CanceledError),
  (Rt.all = function (e) {
    return Promise.all(e);
  }),
  (Rt.spread = function (e) {
    return function (t) {
      return e.apply(null, t);
    };
  }),
  (Rt.isAxiosError = function (e) {
    return ie.isObject(e) && !0 === e.isAxiosError;
  }),
  (Rt.mergeConfig = Xe),
  (Rt.AxiosHeaders = Ue),
  (Rt.formToJSON = (e) => Le(ie.isHTMLForm(e) ? new FormData(e) : e)),
  (Rt.getAdapter = yt),
  (Rt.HttpStatusCode = At),
  (Rt.default = Rt);
const Lt = Rt;
var jt = (function () {
  function e() {
    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "qa",
      n = arguments.length > 1 ? arguments[1] : void 0,
      r = arguments.length > 2 ? arguments[2] : void 0;
    i(this, e), o(this, "sessionKey", void 0), o(this, "libraryKey", void 0), o(this, "initialized", void 0), o(this, "environment", void 0), o(this, "defaultLibraryKeys", void 0), o(this, "api", void 0), n && "string" != typeof n && console.warn("Error: parameter merchant id must be a string"), r && "function" != typeof r && console.warn("Error: parameter callback must be a function"), (this.initialized = !1);
    var s = "string" == typeof t ? t.trim() : "qa";
    (this.environment = ["qa", "sandbox", "live", "prod"].includes(s) ? s : "qa"), (this.defaultLibraryKeys = { qa: "523dfab8f5", sandbox: "523dfab8f5", live: "4ceeab9947", prod: "4ceeab9947" }), (this.api = { qa: "https://finix.qa-payments-api.com", sandbox: "https://finix.sandbox-payments-api.com", live: "https://finix.live-payments-api.com", prod: "https://finix.live-payments-api.com" }[t]), n && "string" == typeof n && (r && "function" == typeof r ? this.connect(n, r) : this.connect(n));
  }
  return (
    a(e, [
      {
        key: "getSessionKey",
        value: function () {
          return this.sessionKey;
        },
      },
      {
        key: "initSiftLibrary",
        value: function (e, t, n) {
          var r = this,
            o = (window._sift = window._sift || []);
          function i() {
            var t = document.createElement("script");
            (t.src = "https://cdn.sift.com/s.js"), document.body.appendChild(t), (r.initialized = !0), "function" == typeof n && n(e);
          }
          o.push(["_setAccount", t]), o.push(["_setSessionId", e]), o.push(["_trackPageview"]), r.initialized ? "function" == typeof n && n(e) : "complete" === document.readyState ? i() : window.attachEvent ? window.attachEvent("onload", i) : window.addEventListener("load", i, !1);
        },
      },
      {
        key: "initAuthorizationLibrary",
        value: function (e, t, n) {
          (this.sessionKey = e), (this.libraryKey = t), this.initSiftLibrary(e, t, n);
        },
      },
      {
        key: "connect",
        value: function (e, t) {
          console.group("🔌 Connecting to Finix");
          console.log("%c Merchant ID:", "font-weight: bold; color: #31B0D5", e);
          console.log("%c API Endpoint:", "font-weight: bold; color: #31B0D5", this.api + "/fraud/sessions?merc");

          var n = this;
          if (e && "string" != typeof e) console.warn("Error: parameter merchant id must be a string");
          else {
            t && "function" != typeof t && console.warn("Error: parameter callback must be a function");
            var r = this,
              o = this.api + "/fraud/sessions?merchant_id=" + e;
            try {
              Lt.get(o)
                .then(function (e) {
                  var n = e.data,
                    o = n && n.session_id,
                    i = n && n.sift_beacon_key;

                  console.log("%c Session Created:", "font-weight: bold; color: #5CB85C", { sessionId: o, beaconKey: i });

                  if (!o || !i) throw "Error: no session key returned";
                  r.initAuthorizationLibrary(o, i, t);
                })
                .catch(function () {
                  console.warn("%c Connection Failed:", "font-weight: bold; color: #D9534F", error);
                  console.log("%c Using Fallback Session:", "font-weight: bold; color: #F0AD4E", "session-key-" + new Date().getTime() + "-" + Math.random());

                  r.initAuthorizationLibrary("session-key-".concat(new Date().getTime(), "-").concat(Math.random()), n.defaultLibraryKeys[n.environment], t);
                })
                .finally(function () {
                  console.groupEnd();
                });
            } catch (e) {
              r.initAuthorizationLibrary("session-key-".concat(new Date().getTime(), "-").concat(Math.random()), this.defaultLibraryKeys[this.environment], t);
            }
          }
        },
      },
    ]),
    e
  );
})();
function kt(e, t) {
  if (e && t) {
    var n = e.errorMessages || [],
      r = e.isDirty || !1;
    "true" === JSON.stringify(r) && (n.length > 0 && (t.innerHTML = n[0]), 0 === e.errorMessages.length && (t.innerHTML = ""));
  }
}
function Ft(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t &&
      (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })),
      n.push.apply(n, r);
  }
  return n;
}
function Pt(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = null != arguments[t] ? arguments[t] : {};
    t % 2
      ? Ft(Object(n), !0).forEach(function (t) {
          o(e, t, n[t]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n))
        : Ft(Object(n)).forEach(function (t) {
            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
          });
  }
  return e;
}
var Nt = "finix-form-container",
  It = "finix-button-container",
  Dt = "finix-submit-button",
  Bt = "finix-error-container",
  Ut = function (e, t) {
    var n = document.querySelector("#".concat(e, " ").concat(t));
    if (n) return n;
    console.warn("Element with selector ".concat(t, " not found in parent element #").concat(e));
    var r = function () {};
    return "undefined" != typeof Proxy
      ? new Proxy(
          {},
          {
            get: function (e, t) {
              switch (t) {
                case "style":
                  return {};
                case "classList":
                  return { add: r, remove: r, toggle: r };
                default:
                  return r;
              }
            },
          },
        )
      : {
          style: {},
          appendChild: r,
          addEventListener: r,
          removeEventListener: r,
          setAttribute: r,
          getAttribute: function () {
            return null;
          },
          classList: { add: r, remove: r, toggle: r },
        };
  },
  qt = function (e) {
    return document.querySelector("#".concat(e, " .").concat(Nt));
  },
  Mt = function (e) {
    return e && "string" == typeof e ? e.replace(/[^a-zA-Z0-9 .,!?]/g, "") : "";
  },
  Ht = function (e) {
    var t = qt(e);
    t && ((t.innerHTML = ""), t.classList.add("loading"));
  },
  zt = function (e, t) {
    var n = t.onLoad || function () {},
      r = t.submitLabel || "Submit";
    return Pt(
      Pt({}, t),
      {},
      {
        onLoad: function () {
          var o = qt(e);
          o && o.classList.remove("loading");
          var i = t.onSubmit;
          if (
            i &&
            !(function (e) {
              return document.querySelector("#".concat(e, " .").concat(Dt));
            })(e)
          ) {
            var s = document.createElement("button");
            s.setAttribute("type", "submit"),
              s.setAttribute("id", Dt),
              s.setAttribute("class", Dt),
              (s.innerHTML = r),
              (s.disabled = !0),
              s.addEventListener("click", function (e) {
                e.preventDefault(), i();
              }),
              o && o.appendChild(s);
          }
          n();
        },
      },
    );
  },
  Vt = function (e) {
    if (qt(e)) Ht(e);
    else {
      var t = document.createElement("div");
      t.setAttribute("id", Nt), t.setAttribute("class", Nt), t.classList.add("loading"), document.getElementById(e) && document.getElementById(e).appendChild(t);
    }
  },
  Kt = function (e) {
    if (!document.getElementById("finix-error-container")) {
      var t = document.createElement("div");
      t.setAttribute("id", Bt), t.setAttribute("class", Bt), document.getElementById(e) && document.getElementById(e).appendChild(t);
    }
  },
  Jt = function (e) {
    if (!document.getElementById("".concat(e, "-base-styles"))) {
      var t = document.createElement("style");
      t.setAttribute("id", "".concat(e, "-base-styles")),
        (t.textContent = "\n    #"
          .concat(e, " .")
          .concat(It, " {\n      display: flex;\n      border-bottom: 1px solid lightgray;\n      margin-bottom: 24px;\n      padding-bottom: 24px;\n    }\n    #")
          .concat(e, " .")
          .concat(It, " .finix-button {\n      display: flex;\n      flex-direction: column;\n      background-color: #FFF;\n      margin-right: 16px;\n      text-align: center;\n      height: 56px;\n      min-width: 104px;\n      max-width: 236px;\n      border-radius: 8px;\n      box-shadow: 0px 1px 4px 0px #CDD2DC;\n      border: 2px solid #FFF;\n      justify-content: space-evenly;\n      align-items: center;\n      font-size: 14px;\n    }\n    #")
          .concat(e, " .")
          .concat(It, " .finix-button.active {\n      border: 2px solid #0B5DCD;\n    }\n    #")
          .concat(e, " .")
          .concat(It, " .finix-button:hover {\n      cursor: pointer;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " {\n      opacity: 1;\n      transition: opacity 0.2s;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, ".loading {\n      opacity: 0;\n      visibility: hidden;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " .field-array {\n      display: flex;\n      gap: 16px;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " .field-holder {\n      width: 100%;\n      margin-top: 8px;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " .field { margin-top: 4px; }\n    #")
          .concat(e, " .")
          .concat(Nt, " iframe {\n      height: 45px;\n      width: 100%;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " .validation { color: #d9534f; }\n    #")
          .concat(e, " .")
          .concat(Nt, " .")
          .concat(Dt, " {\n      width: 100%;\n      height: 45px;\n      line-height: 45px;\n      text-align: center;\n      margin-top: 16px;\n      border: none;\n      border-radius: 8px;\n      color: #FFF;\n      background-color: #000;\n      font-size: 16px;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " .")
          .concat(Dt, ":disabled {\n      cursor: none;\n      background-color: lightgray;\n    }\n    #")
          .concat(e, " .")
          .concat(Nt, " .")
          .concat(Dt, ":hover { cursor: pointer; }\n  ")
          .replace(/\/\*(?:(?!\*\/)[\s\S])*\*\/|[\r\n\t]+/g, "")
          .replace(/\s*([:;,{}])\s*/g, "$1")),
        document && document.head && document.head.appendChild(t);
    }
  },
  Wt = function (e, t, n) {
    var r = document.createElement("div");
    if (((r.className = "field-holder " + e), t)) {
      var o = document.createElement("label");
      (o.textContent = n), r.appendChild(o);
    }
    var i = document.createElement("div");
    (i.id = e), (i.className = "".concat(e, " field")), r.appendChild(i);
    var s = document.createElement("span");
    return (s.id = e + "_validation"), (s.className = "".concat(e, "_validation validation")), r.appendChild(s), r;
  },
  $t = function (e) {
    var t = e.form,
      n = e.elementId,
      r = e.fieldType,
      o = e.fieldHolderId,
      i = e.showLabels,
      s = e.labelText,
      a = e.fieldOptions,
      c = qt(n),
      d = Wt(o, i, s);
    c && c.appendChild(d);
    var l = t.field(r, a);
    return Ut(n, "#".concat(o)).appendChild(l), l;
  },
  Yt = function (e, t, n) {
    var r = qt(t),
      o = document.createElement("div");
    (o.className = "field-array"),
      r && r.appendChild(o),
      n.forEach(function (n) {
        var r = n.fieldType,
          i = n.fieldHolderId,
          s = n.showLabels,
          a = n.labelText,
          c = n.fieldOptions,
          d = n.hidden;
        if (!d || "address_country" === i) {
          var l = Wt(i, s, a);
          o.appendChild(l);
          var u = e.field(r, c);
          Ut(t, "#".concat(i)).appendChild(u), "address_country" === i && d && Gt(Ut(t, ".address_country"), "display", "none");
        }
      });
  },
  Gt = function (e, t, n) {
    var r = "string" == typeof e ? document.querySelector("." + e) : e;
    r && r.style && r.style[t] !== n && (r.style[t] = n);
  };
function Zt(e, t) {
  var r =
    t ||
    function (e) {
      return e;
    };
  if (Array.isArray(e)) {
    for (var o = 0; o < e.length; o++) if (r(e[o], o, e)) return !0;
  } else if ("object" === n(e) && null !== e) for (var i in e) if (e.hasOwnProperty(i) && r(e[i], i, e)) return !0;
  return !1;
}
function Xt(e, t) {
  var n = {};
  for (var r in e) e.hasOwnProperty(r) && !t.includes(r) && (n[r] = e[r]);
  return n;
}
function Qt(e, t, n) {
  var r = (Array.isArray(t) ? t : t.split(".")).reduce(function (e, t) {
    return e && void 0 !== e[t] ? e[t] : void 0;
  }, e);
  return void 0 === r ? n : r;
}
var en = { USA: ["institution_number", "transit_number"], CAN: ["bank_code"] };
function tn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t &&
      (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })),
      n.push.apply(n, r);
  }
  return n;
}
function nn(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = null != arguments[t] ? arguments[t] : {};
    t % 2
      ? tn(Object(n), !0).forEach(function (t) {
          o(e, t, n[t]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n))
        : tn(Object(n)).forEach(function (t) {
            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
          });
  }
  return e;
}
function rn(e, t) {
  var n = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var r = Object.getOwnPropertySymbols(e);
    t &&
      (r = r.filter(function (t) {
        return Object.getOwnPropertyDescriptor(e, t).enumerable;
      })),
      n.push.apply(n, r);
  }
  return n;
}
function on(e) {
  for (var t = 1; t < arguments.length; t++) {
    var n = null != arguments[t] ? arguments[t] : {};
    t % 2
      ? rn(Object(n), !0).forEach(function (t) {
          o(e, t, n[t]);
        })
      : Object.getOwnPropertyDescriptors
        ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n))
        : rn(Object(n)).forEach(function (t) {
            Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
          });
  }
  return e;
}

(function () {
  console.group("🚀 Finix Payment Library Loaded");
  console.log("%c Version:", "font-weight: bold; color: #0275D8", "1.0.0"); // Add actual version if known
  console.log("%c Environment:", "font-weight: bold; color: #0275D8", window.location.hostname);
  console.log("%c Documentation:", "font-weight: bold; color: #0275D8", "https://docs.finix.com/");
  console.groupEnd();
})();

window.Finix = {
  Auth: function (e, t, n) {
    console.group("🔐 Finix Auth Initialized");
    console.log("%c Environment:", "font-weight: bold; color: #31B0D5", e);
    console.log("%c Merchant ID:", "font-weight: bold; color: #31B0D5", t);
    console.groupEnd();
    return new jt(e, t, n);
  },
  CardTokenForm: function (e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};

    console.group("💳 Initializing Card Form");
    console.log("%c Element ID:", "font-weight: bold; color: #0275D8", e);
    console.log("%c Options:", "font-weight: bold; color: #0275D8", t);
    console.log("%c Raw Options Object:", "font-weight: bold; color: #0275D8", JSON.parse(JSON.stringify(t)));

    if (!e) {
      console.error("%c ❌ Error: No elementId provided", "color: #D9534F; font-weight: bold");
      console.groupEnd();
      console.error("Finix.CardTokenForm() - No elementId was provided");
      return;
    }

    if ("[object Object]" !== Object.prototype.toString.call(t)) {
      console.error("%c ❌ Error: Options must be an object", "color: #D9534F; font-weight: bold");
      console.groupEnd();
      console.error("Finix.CardTokenForm() - options must be an object");
      return;
    }

    if (!document.getElementById(e)) {
      console.error("%c ❌ Error: Element not found", "color: #D9534F; font-weight: bold", e);
      console.groupEnd();
      console.error("Finix.CardTokenForm() - Could not find element with id: " + e);
      return;
    }

    console.log("%c ✅ Validation passed", "color: #5CB85C; font-weight: bold");

    // Processing element ID
    var n = e.replace(/[^a-zA-Z0-9-_:.]/g, "");
    console.log("%c Sanitized Element ID:", "color: #5BC0DE", n);

    console.group("🏗️ Setting up DOM");
    console.log("%c Creating form container", "color: #5BC0DE");
    Vt(n);
    console.log("%c Creating error container", "color: #5BC0DE");
    Kt(n);
    console.log("%c Adding base styles", "color: #5BC0DE");
    Jt(n);
    console.groupEnd();

    var r = t.onUpdate;
    if (r) {
      console.log("%c Custom update handler provided:", "color: #5BC0DE", r);
    }

    console.group("🔄 Creating form handler");
    var o = new h(
      "card",
      (function (e, t) {
        console.log("%c Form handler created for element:", "color: #0275D8", t);

        var n = function (e) {
          return document.querySelector("#".concat(t, " .").concat(e));
        };

        return function (t, r) {
          console.group("🔄 Form State Updated");

          if (r) {
            console.log("%c Card Brand:", "font-weight: bold; color: #7E57C2", r.cardBrand);
            console.log("%c BIN Information:", "font-weight: bold; color: #7E57C2", r);
          }

          if (t) {
            console.group("📋 Field States");
            console.table(
              Object.keys(t).reduce((acc, key) => {
                if (t[key] && typeof t[key] === "object") {
                  acc[key] = {
                    isDirty: !!t[key].isDirty,
                    isFocused: !!t[key].isFocused,
                    errorCount: (t[key].errorMessages || []).length,
                    errors: (t[key].errorMessages || []).join(", "),
                    value: t[key].value || t[key].selected || "(masked)",
                  };
                }
                return acc;
              }, {}),
            );

            // Apply validation UI
            if (t.name) kt(t.name, n("name_validation"));
            if (t.number) kt(t.number, n("number_validation"));
            if (t.expiration_date) kt(t.expiration_date, n("expiration_date_validation"));
            if (t.security_code) kt(t.security_code, n("security_code_validation"));
            if (t["address.line1"]) kt(t["address.line1"], n("address_line1_validation"));
            if (t["address.line2"]) kt(t["address.line2"], n("address_line2_validation"));
            if (t["address.city"]) kt(t["address.city"], n("address_city_validation"));
            if (t["address.postal_code"]) kt(t["address.postal_code"], n("address_postal_code_validation"));

            console.groupEnd(); // Field States
          }

          // Country specific handling
          var o = [],
            i = Qt(t, ["address.country", "selected"], "USA"),
            s = n("address_region"),
            a = n("address_state");

          console.log("%c Selected Country:", "color: #0275D8", i);

          // Region/state validation logic
          if ("USA" === i && null === a) {
            o.push("address.region");
            console.log("%c Missing USA state field", "color: #F0AD4E");
          }
          if ("USA" !== i && null === s) {
            o.push("address.region");
            console.log("%c Missing international region field", "color: #F0AD4E");
          }

          // Check for errors in all fields
          var c = Zt(Xt(t, o), function (e) {
            var t = e.errorMessages;
            return (void 0 === t ? [] : t).length > 0;
          });

          console.log("%c Form Valid:", "font-weight: bold; color: " + (c ? "#D9534F" : "#5CB85C"), !c);

          // Handle submit button state
          var d = n("finix-submit-button");
          if (d) {
            d.disabled = c;
            console.log("%c Submit Button:", "color: #5BC0DE", c ? "Disabled ❌" : "Enabled ✅");
          }

          // Country-specific field display
          if (t) {
            if ("USA" !== i) {
              console.log("%c Showing international region field", "color: #5BC0DE");
              Gt(s, "display", "block");
              Gt(a, "display", "none");
              kt(t["address.region"], n("address_region_validation"));
            } else {
              console.log("%c Showing US state field", "color: #5BC0DE");
              Gt(s, "display", "none");
              Gt(a, "display", "block");
              kt(t["address.region"], n("address_state_validation"));
            }
          }

          // Call user's update handler if provided
          if ("function" == typeof e) {
            console.log("%c Calling user update handler", "color: #5BC0DE");
            e(t, r, c);
          }

          console.groupEnd(); // Form State Updated
        };
      })(r, n),
    );
    console.groupEnd(); // Creating form handler

    console.log("%c Form Object Created:", "font-weight: bold; color: #5CB85C", {
      id: o.id,
      type: o.type,
      fields: o.fields.length,
    });

    // Process options for field creation
    console.group("🔧 Processing Form Configuration");

    var formConfig = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
    var processedConfig = zt(n, t);

    console.log("%c Raw Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(formConfig)));
    console.log("%c Processed Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(processedConfig)));

    var r = processedConfig.placeholders || {},
      i = processedConfig.showPlaceholders !== false,
      a = processedConfig.labels || {},
      l = processedConfig.showLabels !== false,
      p = processedConfig.showAddress === true,
      m = processedConfig.hideFields || [],
      b = processedConfig.requiredFields || [],
      v = processedConfig.styles || {},
      _ = processedConfig.hideErrorMessages === true,
      E = processedConfig.errorMessages || {},
      T = processedConfig.fonts,
      C = processedConfig.defaultValues || {},
      A = Mt(Qt(processedConfig, "defaultCountry") || Qt(processedConfig, "defaultValues.address_country") || "USA");

    console.log("%c Form Settings:", "color: #5BC0DE", {
      showLabels: l,
      showPlaceholders: i,
      showAddress: p,
      hideErrorMessages: _,
      defaultCountry: A,
      hideFields: m,
      requiredFields: b,
    });

    // Setup styles
    var R = {
      default: Qt(v, "default", {
        color: "#000",
        border: "1px solid #CCCDCF",
        borderRadius: "8px",
        padding: "8px 16px",
        fontFamily: "Helvetica",
        fontSize: "16px",
        boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.03), 0px 2px 4px rgba(0, 0, 0, 0.03)",
      }),
      success: Qt(v, "success", {}),
      error: Qt(v, "error", { color: "#d9534f" }),
    };

    console.log("%c Applied Styles:", "color: #5BC0DE", R);
    console.groupEnd(); // Processing Form Configuration

    var L = c({ styles: R, fonts: T });

    // Field Creation
    console.group("🏗️ Creating Form Fields");

    // Helper to log field options before creation
    function logFieldCreation(fieldType, fieldId, options) {
      console.group(`%c Creating field: ${fieldType}`, "color: #0275D8; font-weight: bold");
      console.log("%c Field ID:", "color: #5BC0DE", fieldId);
      console.log("%c Show Label:", "color: #5BC0DE", l);
      console.log("%c Label Text:", "color: #5BC0DE", options.labelText || fieldId);
      console.log("%c Validations:", "color: #5BC0DE", options.fieldOptions.validations || "none");
      console.log("%c Placeholder:", "color: #5BC0DE", options.fieldOptions.placeholder?.text || "none");
      console.log("%c Default Value:", "color: #5BC0DE", options.fieldOptions.defaultValue || options.fieldOptions.defaultOption || "none");
      console.log("%c Auto Complete:", "color: #5BC0DE", options.fieldOptions.autoComplete || "none");
      console.log("%c Error Message:", "color: #5BC0DE", options.fieldOptions.errorMessage || "none");
      console.log("%c Hidden:", "color: #5BC0DE", options.hidden || false);
      console.log("%c Complete Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(options)));
      console.groupEnd();
    }

    // Create name field if not hidden
    if (!m.includes("name")) {
      const nameOptions = {
        form: o,
        elementId: n,
        fieldType: "name",
        fieldHolderId: "name",
        showLabels: l,
        labelText: a.card_holder_name || a.name || "Name",
        fieldOptions: nn(
          {
            autoComplete: "cc-name",
            validations: "required",
            errorMessage: _ ? "" : E.card_holder_name || E.name || "Name is required",
            placeholder: i ? { text: r.card_holder_name || r.name || "Name", hideOnFocus: !0 } : void 0,
            defaultValue: Mt(C.card_holder_name || C.name),
          },
          L,
        ),
      };

      logFieldCreation("name", "name", nameOptions);
      $t(nameOptions);
    } else {
      console.log("%c Skipping name field (hidden)", "color: #F0AD4E");
    }

    // Create card number field
    const numberOptions = {
      form: o,
      elementId: n,
      fieldType: "number",
      fieldHolderId: "number",
      showLabels: l,
      labelText: a.number || "Card Number",
      fieldOptions: nn(
        {
          validations: "cardNumber",
          errorMessage: _ ? "" : E.number,
          autoComplete: "cc-number",
          placeholder: i ? { text: r.number || "4111 1111 1111 1111", hideOnFocus: !0 } : void 0,
        },
        L,
      ),
    };

    logFieldCreation("number", "number", numberOptions);
    var j = $t(numberOptions);

    // Create expiration date and security code fields
    if (m.includes("security_code")) {
      const expirationOptions = {
        form: o,
        elementId: n,
        fieldType: "expiration_date",
        fieldHolderId: "expiration_date",
        showLabels: l,
        labelText: a.expiration_date || "Expiration",
        fieldOptions: nn(
          {
            validations: "cardExpiry",
            errorMessage: _ ? "" : E.expiration_date,
            autoComplete: "cc-exp",
            placeholder: i ? { text: r.expiration_date || "MM/YYYY", hideOnFocus: !0 } : void 0,
          },
          L,
        ),
      };

      logFieldCreation("expiration_date", "expiration_date", expirationOptions);
      $t(expirationOptions);
    } else {
      console.group("%c Creating date and security code fields", "color: #0275D8; font-weight: bold");

      const expirationOptions = {
        fieldType: "expiration_date",
        fieldHolderId: "expiration_date",
        showLabels: l,
        labelText: a.expiration_date || "Expiration",
        fieldOptions: nn(
          {
            validations: "cardExpiry",
            errorMessage: _ ? "" : E.expiration_date,
            autoComplete: "cc-exp",
            placeholder: i ? { text: r.expiration_date || "MM/YYYY", hideOnFocus: !0 } : void 0,
          },
          L,
        ),
      };

      const cvcOptions = {
        fieldType: "security_code",
        fieldHolderId: "security_code",
        showLabels: l,
        labelText: a.security_code || "CVC",
        fieldOptions: nn(
          {
            validations: "cardCVC",
            errorMessage: _ ? "" : E.security_code,
            autoComplete: "cc-csc",
            placeholder: i ? { text: r.security_code || "CVC", hideOnFocus: !0 } : void 0,
          },
          L,
        ),
      };

      console.log("%c Expiration Date Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(expirationOptions)));
      console.log("%c Security Code Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(cvcOptions)));
      console.groupEnd();

      Yt(o, n, [expirationOptions, cvcOptions]);
    }

    // Create address fields if needed
    if (p) {
      console.group("🏠 Creating address fields");

      // Address line 1
      if (!m.includes("address_line1")) {
        const addressLine1Options = {
          form: o,
          elementId: n,
          fieldType: "address.line1",
          fieldHolderId: "address_line1",
          showLabels: l,
          labelText: a.address_line1 || "Address Line 1",
          fieldOptions: nn(
            {
              validations: b.includes("address_line1") ? "required" : void 0,
              errorMessage: _ ? "" : E.address_line1 || "Address is required",
              autoComplete: "address-line1",
              placeholder: i ? { text: r.address_line1 || "Address Line 1", hideOnFocus: !0 } : void 0,
              defaultValue: Mt(C.address_line1),
            },
            L,
          ),
        };

        logFieldCreation("address.line1", "address_line1", addressLine1Options);
        $t(addressLine1Options);
      } else {
        console.log("%c Skipping address line 1 (hidden)", "color: #F0AD4E");
      }

      // Address line 2
      if (!m.includes("address_line2")) {
        const addressLine2Options = {
          form: o,
          elementId: n,
          fieldType: "address.line2",
          fieldHolderId: "address_line2",
          showLabels: l,
          labelText: a.address_line2 || "Address Line 2",
          fieldOptions: nn(
            {
              validations: b.includes("address_line2") ? "required" : void 0,
              errorMessage: _ ? "" : E.address_line2 || "Address Line 2 is required",
              autoComplete: "address-line2",
              placeholder: i ? { text: r.address_line2 || "Address Line 2", hideOnFocus: !0 } : void 0,
              defaultValue: Mt(C.address_line2),
            },
            L,
          ),
        };

        logFieldCreation("address.line2", "address_line2", addressLine2Options);
        $t(addressLine2Options);
      } else {
        console.log("%c Skipping address line 2 (hidden)", "color: #F0AD4E");
      }

      // City, region, state fields
      console.group("%c Creating city, region, state fields", "color: #0275D8; font-weight: bold");

      const cityOptions = {
        fieldType: "address.city",
        fieldHolderId: "address_city",
        showLabels: l,
        labelText: a.address_city || "City",
        fieldOptions: nn(
          {
            validations: b.includes("address_city") ? "required" : void 0,
            errorMessage: _ ? "" : E.address_city || "City is required",
            autoComplete: "address-level2",
            placeholder: i ? { text: r.address_city || "City", hideOnFocus: !0 } : void 0,
            defaultValue: Mt(C.address_city),
          },
          L,
        ),
        hidden: m.includes("address_city"),
      };

      const regionOptions = {
        fieldType: "address.region",
        fieldHolderId: "address_region",
        showLabels: l,
        labelText: a.address_region || "Region",
        fieldOptions: nn(
          {
            validations: b.includes("address_region") ? "required" : void 0,
            errorMessage: _ ? "" : E.address_region || "Region is required",
            autoComplete: "address-level1",
            placeholder: i ? { text: r.address_region || "State", hideOnFocus: !0 } : void 0,
            defaultValue: Mt(C.address_region),
          },
          L,
        ),
        hidden: m.includes("address_region"),
      };

      const stateOptions = {
        fieldType: "address.region",
        fieldHolderId: "address_state",
        showLabels: l,
        labelText: a.address_state || "State",
        fieldOptions: nn(
          {
            validations: b.includes("address_state") ? "required" : void 0,
            autoComplete: "address-level1",
            placeholder: i ? { text: r.address_state || "State", hideOnFocus: !0 } : void 0,
            options: "state",
            defaultOption: Mt(C.address_state),
          },
          L,
        ),
        hidden: m.includes("address_state"),
      };

      console.log("%c City Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(cityOptions)));
      console.log("%c Region Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(regionOptions)));
      console.log("%c State Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(stateOptions)));
      console.groupEnd();

      Yt(o, n, [cityOptions, regionOptions, stateOptions]);

      console.groupEnd(); // Creating address fields
    }

    // Create postal code and country fields
    console.group("%c Creating postal/country fields", "color: #0275D8; font-weight: bold");

    if (p) {
      const postalOptions = {
        fieldType: "address.postal_code",
        fieldHolderId: "address_postal_code",
        showLabels: l,
        labelText: a.address_postal_code || "ZIP",
        fieldOptions: nn(
          {
            validations: b.includes("address_postal_code") ? "required" : void 0,
            errorMessage: _ ? "" : E.address_postal_code || "ZIP is required",
            autoComplete: "postal-code",
            placeholder: i ? { text: r.address_postal_code || "ZIP", hideOnFocus: !0 } : void 0,
            defaultValue: Mt(C.address_postal_code),
          },
          L,
        ),
        hidden: m.includes("address_postal_code"),
      };

      const countryOptions = {
        fieldType: "address.country",
        fieldHolderId: "address_country",
        showLabels: l,
        labelText: a.address_country || "Country",
        fieldOptions: nn(
          {
            autoComplete: "country",
            placeholder: i ? { text: r.address_country || "Country", hideOnFocus: !0 } : void 0,
            options: "country",
            defaultOption: A,
          },
          L,
        ),
        hidden: m.includes("address_country"),
      };

      console.log("%c Postal Code Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(postalOptions)));
      console.log("%c Country Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(countryOptions)));

      Yt(o, n, [postalOptions, countryOptions]);
    } else {
      const hiddenCountryOptions = {
        fieldType: "address.country",
        fieldHolderId: "address_country",
        showLabels: l,
        labelText: a.address_country || "Country",
        fieldOptions: nn(
          {
            autoComplete: "country",
            placeholder: i ? { text: r.address_country || "Country", hideOnFocus: !0 } : void 0,
            defaultOption: A,
            options: "country",
          },
          L,
        ),
        hidden: !0,
      };

      console.log("%c Hidden Country Field Config:", "color: #5BC0DE", JSON.parse(JSON.stringify(hiddenCountryOptions)));
      Yt(o, n, [hiddenCountryOptions]);
    }

    console.groupEnd(); // Creating postal/country fields

    // Setup load handler if provided
    if (processedConfig.onLoad && typeof processedConfig.onLoad === "function") {
      console.log("%c Setting up load handler", "color: #5BC0DE", processedConfig.onLoad);
      j.addEventListener("load", function () {
        console.log("%c Form loaded, calling onLoad callback", "color: #5CB85C; font-weight: bold");
        processedConfig.onLoad();
      });
    }

    console.groupEnd(); // Creating Form Fields

    console.log("%c 🎉 Form Successfully Initialized", "font-weight: bold; color: #5CB85C; font-size: 14px");
    console.groupEnd(); // Initializing Card Form

    return o;
  },
  BankTokenForm: function (e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (e)
      if ("[object Object]" === Object.prototype.toString.call(t)) {
        if (document.getElementById(e)) {
          var n = e.replace(/[^a-zA-Z0-9-_:.]/g, "");
          Vt(n), Kt(n), Jt(n);
          var r = t.onUpdate,
            o = new h(
              "bank-account",
              (function (e, t) {
                var n = function (e) {
                  return document.querySelector("#".concat(t, " .").concat(e));
                };
                return function (t, r) {
                  t && (kt(t.name, n("name_validation")), kt(t.account_number, n("account_number_validation")), kt(t.bank_code, n("bank_code_validation")), kt(t.transit_number, n("transit_number_validation")), kt(t.institution_number, n("institution_number_validation")), kt(t.account_type, n("account_type_validation")), kt(t["address.line1"], n("address_line1_validation")), kt(t["address.line2"], n("address_line2_validation")), kt(t["address.city"], n("address_city_validation")), kt(t["address.postal_code"], n("address_postal_code_validation")), kt(t["address.region"], n("address_state_validation") || n("address_region_validation")));
                  var o = Qt(t, ["address.country", "selected"], "USA"),
                    i = Zt(Xt(t, Qt(en, o, [])), function (e) {
                      var t = e.errorMessages;
                      return (void 0 === t ? [] : t).length > 0;
                    }),
                    s = n("finix-submit-button");
                  if ((s && (s.disabled = i), t)) {
                    var a = "USA" !== o,
                      c = n("bank_code"),
                      d = n("transit_number"),
                      l = n("institution_number");
                    a && "CAN" === o ? (Gt(c, "display", "none"), Gt(d, "display", "block"), Gt(l, "display", "block")) : (Gt(c, "display", "block"), Gt(d, "display", "none"), Gt(l, "display", "none"));
                  }
                  "function" == typeof e && e(t, r, i);
                };
              })(r, n),
            );
          return (
            (function (e, t) {
              var n = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {},
                r = n.placeholders,
                o = void 0 === r ? {} : r,
                i = n.showPlaceholders,
                s = void 0 === i || i,
                a = n.labels,
                d = void 0 === a ? {} : a,
                l = n.showLabels,
                u = void 0 === l || l,
                f = n.showAddress,
                p = void 0 !== f && f,
                h = n.hideFields,
                m = void 0 === h ? [] : h,
                y = n.styles,
                b = void 0 === y ? {} : y,
                g = n.onLoad,
                v = n.hideErrorMessages,
                w = void 0 !== v && v,
                O = n.errorMessages,
                _ = void 0 === O ? {} : O,
                x = n.fonts,
                E = n.defaultValues,
                T = void 0 === E ? {} : E,
                S = Mt(Qt(n, "defaultCountry") || Qt(n, "defaultValues.address_country") || "USA"),
                C = { default: Qt(b, "default", { color: "#000", border: "1px solid #CCCDCF", borderRadius: "8px", padding: "8px 16px", fontFamily: "Helvetica", fontSize: "16px", boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.03), 0px 2px 4px rgba(0, 0, 0, 0.03)" }), success: Qt(b, "success", {}), error: Qt(b, "error", { color: "#d9534f" }) },
                A = c({ styles: C, fonts: x });
              m.includes("name") || $t({ form: e, elementId: t, fieldType: "name", fieldHolderId: "name", showLabels: u, labelText: d.account_holder_name || d.name || "Name", fieldOptions: on({ autoComplete: "name", validations: "required", errorMessage: w ? "" : _.account_holder_name || _.name || "Name is required", placeholder: s ? { text: o.account_holder_name || o.name || "Name", hideOnFocus: !0 } : void 0, defaultValue: Mt(T.account_holder_name || T.name) }, A) }), $t({ form: e, elementId: t, fieldType: "transit_number", fieldHolderId: "transit_number", showLabels: u, labelText: d.transit_number || "Transit Number", fieldOptions: on({ validations: "transitNumber", errorMessage: w ? "" : _.transit_number, placeholder: s ? { text: o.transit_number || "12345", hideOnFocus: !0 } : void 0 }, A) }), $t({ form: e, elementId: t, fieldType: "institution_number", fieldHolderId: "institution_number", showLabels: u, labelText: d.institution_number || "Institution Number", fieldOptions: on({ validations: "institutionNumber", errorMessage: w ? "" : _.institution_number, placeholder: s ? { text: o.institution_number || "010", hideOnFocus: !0 } : void 0 }, A) }), $t({ form: e, elementId: t, fieldType: "account_number", fieldHolderId: "account_number", showLabels: u, labelText: d.account_number || "Account Number", fieldOptions: on({ validations: "required", errorMessage: w ? "" : _.account_number || "Account Number is required", placeholder: s ? { text: o.account_number || "1234123412341234", hideOnFocus: !0 } : void 0 }, A) }), $t({ form: e, elementId: t, fieldType: "bank_code", fieldHolderId: "bank_code", showLabels: u, labelText: d.bank_code || "Bank Code", fieldOptions: on({ validations: "required", errorMessage: w ? "" : _.bank_code || "Bank Code is required", placeholder: s ? { text: o.bank_code || "123456789", hideOnFocus: !0 } : void 0 }, A) });
              var R = $t({ form: e, elementId: t, fieldType: "account_type", fieldHolderId: "account_type", showLabels: u, labelText: d.account_type || "Account Type", fieldOptions: on({ validations: "required", errorMessage: w ? "" : _.account_type || "Account Type is required", placeholder: s ? { text: o.account_type || "State", hideOnFocus: !0 } : void 0, options: "account_type" }, A) });
              Yt(e, t, [{ fieldType: "address.country", fieldHolderId: "address_country", showLabels: u, labelText: d.address_country || "Country", fieldOptions: on({ autoComplete: "country", placeholder: s ? { text: o.address_country || "Country", hideOnFocus: !0 } : void 0, options: "country", defaultOption: S }, A), hidden: !p || m.includes("address_country") }]), "function" == typeof g && R.addEventListener("load", g);
            })(o, n, zt(n, t)),
            o
          );
        }
        console.error("Finix.BankTokenForm() - Could not find element with id: " + e);
      } else console.error("Finix.BankTokenForm() - options must be an object");
    else console.error("Finix.BankTokenForm() - No elementId was provided");
  },
  TokenForm: function (e) {
    var t = this,
      n = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    if (e) {
      if (document.getElementById(e)) {
        var r,
          o = e.replace(/[^a-zA-Z0-9-_:.]/g, "");
        return (
          (function (e) {
            var t = e.finix,
              n = e.elementId,
              r = e.options,
              o = void 0 === r ? {} : r,
              i = e.callback,
              s = void 0 === i ? function () {} : i,
              a = document.createElement("div");
            a.setAttribute("id", It), a.setAttribute("class", It);
            var c = document.createElement("div");
            c.setAttribute("id", "finix-card-button"),
              c.setAttribute("class", "finix-card-button finix-button active"),
              (c.innerHTML = '<img src="'.concat("https://payments-dashboard-assets.s3.us-west-2.amazonaws.com/finix-js/Card.svg", '" width="16"/><span>Card</span>')),
              c.addEventListener("click", function () {
                Ut(n, ".finix-button.active").classList.remove("active"), Ut(n, ".finix-card-button").classList.add("active"), Ht(n), s(t.CardTokenForm(n, o));
              }),
              a.appendChild(c);
            var d = document.createElement("div");
            d.setAttribute("id", "finix-bank-button"),
              d.setAttribute("class", "finix-button finix-bank-button"),
              (d.innerHTML = '<img src="'.concat("https://payments-dashboard-assets.s3.us-west-2.amazonaws.com/finix-js/BankAccount.svg", '" width="16"/><span>Bank Account</span>')),
              d.addEventListener("click", function () {
                Ut(n, ".finix-button.active").classList.remove("active"), Ut(n, ".finix-bank-button").classList.add("active"), Ht(n), s(t.BankTokenForm(n, o));
              }),
              a.appendChild(d),
              document.getElementById(n) && document.getElementById(n).appendChild(a);
          })({
            finix: this,
            elementId: o,
            options: n,
            callback: function (e) {
              r = e;
            },
          }),
          (r = this.CardTokenForm(o, n)),
          {
            loadCardTokenForm: function () {
              r = t.CardTokenForm(o, n);
            },
            loadBankTokenForm: function () {
              r = t.BankTokenForm(o, n);
            },
            submit: function () {
              var e;
              (e = r).submit.apply(e, arguments);
            },
          }
        );
      }
      console.error("Finix.TokenForm() - Could not find element with id: " + e);
    } else console.error("Finix.TokenForm() - No elementId was provided");
  },
  card: function (e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return console.error("Finix.card() has been deprecated. Please use Finix.CardTokenForm() instead."), this.CardTokenForm(e, t);
  },
  bankAccount: function (e) {
    var t = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
    return console.error("Finix.bankAccount() has been deprecated. Please use Finix.BankTokenForm() instead."), this.BankTokenForm(e, t);
  },
};

// custom form options https://finix.com/docs/guides/payments/online-payments/payment-details/payment-forms/
const options = {
  // show address fields in the form (default is false)
  showAddress: false,
  //show labels in the form (default is true)
  showLabels: true,
  // set custom labels for each field
  labels: {
    // Supported Fields: "name", "number", "expiration_date", "security_code", "account_number", "bank_code", "account_type", "address_line1", "address_line2", "address_city", "address_state","address_region", "address_country", "address_postal_code"
    name: "Full Name",
  },
  // turn on or off placeholder text in the fields (default is true)
  showPlaceholders: true,
  // set custom placeholders for each field, you can specify them here
  placeholders: {
    // Supported Fields: "name", "number", "expiration_date", "security_code", "account_number", "bank_code", "account_type", "address_line1", "address_line2", "address_city", "address_state","address_region", "address_country", "address_postal_code"
    name: "Full Name",
  },
  defaultValues: {
    // Supported Fields:  "name", "security_code", "bank_code", "account_type", "address_line1", "address_line2", "address_city", "address_state","address_region", "address_country", "address_postal_code"
    // name: "John Doe",
  },
  // hide specific fields that you do not need
  hideFields: [
    // Supported Fields: "name", "security_code", "address_line1", "address_line2", "address_city", "address_state","address_region", "address_country", "address_postal_code", "address_country"
    // "name",
    // "address_line1",
    // "address_line2",
    // "address_city",
    //"address_state",
    // "address_region",
    // "address_country",
  ],
  // require any specific fields that are not required by default, you can specify them here
  requiredFields: [
    // Supported Fields: "name", "address_line1", "address_line2", "address_city", "address_state","address_region", "address_country", "address_postal_code"
    "name",
    "address_line1",
    "address_city",
    "address_region",
    "address_state",
    "address_country",
    "address_postal_code",
  ],
  // if you want to require a field, but not hide input error messages (default is false)
  hideErrorMessages: false,
  // set custom error messages for each field if you are showing error messages
  errorMessages: {
    // Supported Fields: "name", "number", "expiration_date", "security_code", "account_number", "bank_code", "account_type", "address_line1", "address_line2", "address_city", "address_state","address_region", "address_country", "address_postal_code"
    name: "Please enter a valid name",
    address_city: "Please enter a valid city",
  },
  // custom styles for the form inputs (optional but recommended)
  styles: {
    // default styling for all fields
    default: {
      color: "#000",
      border: "1px solid #CCCDCF",
      borderRadius: "8px",
      padding: "8px 16px",
      fontFamily: "Noto Sans Thaana",
      fontSize: "16px",
      boxShadow: "0px 1px 1px rgba(0, 0, 0, 0.03), 0px 2px 4px rgba(0, 0, 0, 0.03)",
    },
    // specific styling if the field is valid
    success: {
      // color: "#5cb85c",
    },
    // specific styling if the field has errors
    error: {
      // color: "#d9534f",
      border: "1px solid rgba(255,0,0, 0.3)",
    },
  },

  // Define custom fonts for input text. This requires a hosted font file from a CDN and must use HTTPS.
  // To use custom fonts set the fontFamily in the style options above.
  fonts: [
    // Here you can define multiple fonts to use in the input fields.
    {
      fontFamily: "Noto Sans Thaana",
      url: "https://fonts.cdnfonts.com/s/107457/NotoSansThaana[wght].woff",
      format: "woff",
    },
  ],
  // optional callback function that will trigger when form state changes (can be called frequently)
  onUpdate: function (state, binInformation, formHasErrors) {
    console.log("STATE: ", state);
    console.log(binInformation);
    console.log(formHasErrors);
  },
  // optional callback function that will trigger after the form has loaded
  onLoad: function () {
    // custom code to run when the form has loaded
  },
  // optional callback function that will be called when the form is submitted
  // NOTE: adding this option will automatically create a submit button for you.
  // If you do not want to use the default button and create your own,
  // do not supply this function and instead create your own submit button
  // and attach the onSubmit function to it manually.
  onSubmit,
  // optional param to set the label for the submit button that is auto generated
  submitLabel: "Create Token",
};

// create Finix.js Token Form
const form = window.Finix.TokenForm("form-element", options);

// submit function that will be called when the form is submitted
function onSubmit() {
  form.submit("sandbox", "APgPDQrLD52TYvqazjHJJchM", function (err, res) {
    // get token ID from response
    const tokenData = res.data || {};
    const token = tokenData.id;
    alert("Your token ID is: " + token);
    console.log(tokenData);
  });
}
