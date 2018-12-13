/*!
 * Paper.js v0.12.0 - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2016, Juerg Lehni & Jonathan Puckey
 * http://scratchdisk.com/ & https://puckey.studio/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 *
 * Date: Mon Dec 3 14:19:11 2018 +0100
 *
 ***
 *
 * Straps.js - Class inheritance library with support for bean-style accessors
 *
 * Copyright (c) 2006 - 2016 Juerg Lehni
 * http://scratchdisk.com/
 *
 * Distributed under the MIT license.
 *
 ***
 *
 * Acorn.js
 * https://marijnhaverbeke.nl/acorn/
 *
 * Acorn is a tiny, fast JavaScript parser written in JavaScript,
 * created by Marijn Haverbeke and released under an MIT license.
 *
 */


  var Base = new function() {
    var hidden = /^(statics|enumerable|beans|preserve)$/,
      array = [],
      slice = array.slice,
      create = Object.create,
      describe = Object.getOwnPropertyDescriptor,
      define = Object.defineProperty,

      forEach = array.forEach || function(iter, bind) {
        for (var i = 0, l = this.length; i < l; i++) {
          iter.call(bind, this[i], i, this);
        }
      },

      forIn = function(iter, bind) {
        for (var i in this) {
          if (this.hasOwnProperty(i))
            iter.call(bind, this[i], i, this);
        }
      },

      set = Object.assign || function(dst) {
        for (var i = 1, l = arguments.length; i < l; i++) {
          var src = arguments[i];
          for (var key in src) {
            if (src.hasOwnProperty(key))
              dst[key] = src[key];
          }
        }
        return dst;
      },

      each = function(obj, iter, bind) {
        if (obj) {
          var desc = describe(obj, 'length');
          (desc && typeof desc.value === 'number' ? forEach : forIn)
            .call(obj, iter, bind = bind || obj);
        }
        return bind;
      };

    function inject(dest, src, enumerable, beans, preserve) {
      var beansNames = {};

      function field(name, val) {
        val = val || (val = describe(src, name))
          && (val.get ? val : val.value);
        if (typeof val === 'string' && val[0] === '#')
          val = dest[val.substring(1)] || val;
        var isFunc = typeof val === 'function',
          res = val,
          prev = preserve || isFunc && !val.base
            ? (val && val.get ? name in dest : dest[name])
            : null,
          bean;
        if (!preserve || !prev) {
          if (isFunc && prev)
            val.base = prev;
          if (isFunc && beans !== false
            && (bean = name.match(/^([gs]et|is)(([A-Z])(.*))$/)))
            beansNames[bean[3].toLowerCase() + bean[4]] = bean[2];
          if (!res || isFunc || !res.get || typeof res.get !== 'function'
            || !Base.isPlainObject(res)) {
            res = { value: res, writable: true };
          }
          if ((describe(dest, name)
            || { configurable: true }).configurable) {
            res.configurable = true;
            res.enumerable = enumerable != null ? enumerable : !bean;
          }
          define(dest, name, res);
        }
      }
      if (src) {
        for (var name in src) {
          if (src.hasOwnProperty(name) && !hidden.test(name))
            field(name);
        }
        for (var name in beansNames) {
          var part = beansNames[name],
            set = dest['set' + part],
            get = dest['get' + part] || set && dest['is' + part];
          if (get && (beans === true || get.length === 0))
            field(name, { get: get, set: set });
        }
      }
      return dest;
    }

    function Base() {
      for (var i = 0, l = arguments.length; i < l; i++) {
        var src = arguments[i];
        if (src)
          set(this, src);
      }
      return this;
    }

    return inject(Base, {
      inject: function(src) {
        if (src) {
          var statics = src.statics === true ? src : src.statics,
            beans = src.beans,
            preserve = src.preserve;
          if (statics !== src)
            inject(this.prototype, src, src.enumerable, beans, preserve);
          inject(this, statics, null, beans, preserve);
        }
        for (var i = 1, l = arguments.length; i < l; i++)
          this.inject(arguments[i]);
        return this;
      },

      extend: function() {
        var base = this,
          ctor,
          proto;
        for (var i = 0, obj, l = arguments.length;
             i < l && !(ctor && proto); i++) {
          obj = arguments[i];
          ctor = ctor || obj.initialize;
          proto = proto || obj.prototype;
        }
        ctor = ctor || function() {
          base.apply(this, arguments);
        };
        proto = ctor.prototype = proto || create(this.prototype);
        define(proto, 'constructor',
          { value: ctor, writable: true, configurable: true });
        inject(ctor, this);
        if (arguments.length)
          this.inject.apply(ctor, arguments);
        ctor.base = base;
        return ctor;
      }
    }).inject({
      enumerable: false,

      initialize: Base,

      set: Base,

      inject: function() {
        for (var i = 0, l = arguments.length; i < l; i++) {
          var src = arguments[i];
          if (src) {
            inject(this, src, src.enumerable, src.beans, src.preserve);
          }
        }
        return this;
      },

      extend: function() {
        var res = create(this);
        return res.inject.apply(res, arguments);
      },

      each: function(iter, bind) {
        return each(this, iter, bind);
      },

      clone: function() {
        return new this.constructor(this);
      },

      statics: {
        set: set,
        each: each,
        create: create,
        define: define,
        describe: describe,

        clone: function(obj) {
          return set(new obj.constructor(), obj);
        },

        isPlainObject: function(obj) {
          var ctor = obj != null && obj.constructor;
          return ctor && (ctor === Object || ctor === Base
            || ctor.name === 'Object');
        },

        pick: function(a, b) {
          return a !== undefined ? a : b;
        },

        slice: function(list, begin, end) {
          return slice.call(list, begin, end);
        }
      }
    });
  };

  if (typeof module !== 'undefined')
    module.exports = Base;

  Base.inject({
    enumerable: false,

    toString: function() {
      return this._id != null
        ?  (this._class || 'Object') + (this._name
        ? " '" + this._name + "'"
        : ' @' + this._id)
        : '{ ' + Base.each(this, function(value, key) {
        if (!/^_/.test(key)) {
          var type = typeof value;
          this.push(key + ': ' + (type === 'number'
            ? Formatter.instance.number(value)
            : type === 'string' ? "'" + value + "'" : value));
        }
      }, []).join(', ') + ' }';
    },

    getClassName: function() {
      return this._class || '';
    },

    importJSON: function(json) {
      return Base.importJSON(json, this);
    },

    exportJSON: function(options) {
      return Base.exportJSON(this, options);
    },

    toJSON: function() {
      return Base.serialize(this);
    },

    set: function(props, exclude) {
      if (props)
        Base.filter(this, props, exclude, this._prioritize);
      return this;
    }
  }, {

    beans: false,
    statics: {
      exports: {},

      extend: function extend() {
        var res = extend.base.apply(this, arguments),
          name = res.prototype._class;
        if (name && !Base.exports[name])
          Base.exports[name] = res;
        return res;
      },

      equals: function(obj1, obj2) {
        if (obj1 === obj2)
          return true;
        if (obj1 && obj1.equals)
          return obj1.equals(obj2);
        if (obj2 && obj2.equals)
          return obj2.equals(obj1);
        if (obj1 && obj2
          && typeof obj1 === 'object' && typeof obj2 === 'object') {
          if (Array.isArray(obj1) && Array.isArray(obj2)) {
            var length = obj1.length;
            if (length !== obj2.length)
              return false;
            while (length--) {
              if (!Base.equals(obj1[length], obj2[length]))
                return false;
            }
          } else {
            var keys = Object.keys(obj1),
              length = keys.length;
            if (length !== Object.keys(obj2).length)
              return false;
            while (length--) {
              var key = keys[length];
              if (!(obj2.hasOwnProperty(key)
                && Base.equals(obj1[key], obj2[key])))
                return false;
            }
          }
          return true;
        }
        return false;
      },

      read: function(list, start, options, amount) {
        if (this === Base) {
          var value = this.peek(list, start);
          list.__index++;
          return value;
        }
        var proto = this.prototype,
          readIndex = proto._readIndex,
          begin = start || readIndex && list.__index || 0,
          length = list.length,
          obj = list[begin];
        amount = amount || length - begin;
        if (obj instanceof this
          || options && options.readNull && obj == null && amount <= 1) {
          if (readIndex)
            list.__index = begin + 1;
          return obj && options && options.clone ? obj.clone() : obj;
        }
        obj = Base.create(proto);
        if (readIndex)
          obj.__read = true;
        obj = obj.initialize.apply(obj, begin > 0 || begin + amount < length
          ? Base.slice(list, begin, begin + amount)
          : list) || obj;
        if (readIndex) {
          list.__index = begin + obj.__read;
          var filtered = obj.__filtered;
          if (filtered) {
            list.__filtered = filtered;
            obj.__filtered = undefined;
          }
          obj.__read = undefined;
        }
        return obj;
      },

      peek: function(list, start) {
        return list[list.__index = start || list.__index || 0];
      },

      remain: function(list) {
        return list.length - (list.__index || 0);
      },

      readList: function(list, start, options, amount) {
        var res = [],
          entry,
          begin = start || 0,
          end = amount ? begin + amount : list.length;
        for (var i = begin; i < end; i++) {
          res.push(Array.isArray(entry = list[i])
            ? this.read(entry, 0, options)
            : this.read(list, i, options, 1));
        }
        return res;
      },

      readNamed: function(list, name, start, options, amount) {
        var value = this.getNamed(list, name),
          hasObject = value !== undefined;
        if (hasObject) {
          var filtered = list.__filtered;
          if (!filtered) {
            filtered = list.__filtered = Base.create(list[0]);
            filtered.__unfiltered = list[0];
          }
          filtered[name] = undefined;
        }
        var l = hasObject ? [value] : list,
          res = this.read(l, start, options, amount);
        return res;
      },

      getNamed: function(list, name) {
        var arg = list[0];
        if (list._hasObject === undefined)
          list._hasObject = list.length === 1 && Base.isPlainObject(arg);
        if (list._hasObject)
          return name ? arg[name] : list.__filtered || arg;
      },

      hasNamed: function(list, name) {
        return !!this.getNamed(list, name);
      },

      filter: function(dest, source, exclude, prioritize) {
        var processed;

        function handleKey(key) {
          if (!(exclude && key in exclude) &&
            !(processed && key in processed)) {
            var value = source[key];
            if (value !== undefined)
              dest[key] = value;
          }
        }

        if (prioritize) {
          var keys = {};
          for (var i = 0, key, l = prioritize.length; i < l; i++) {
            if ((key = prioritize[i]) in source) {
              handleKey(key);
              keys[key] = true;
            }
          }
          processed = keys;
        }

        Object.keys(source.__unfiltered || source).forEach(handleKey);
        return dest;
      },

      isPlainValue: function(obj, asString) {
        return Base.isPlainObject(obj) || Array.isArray(obj)
          || asString && typeof obj === 'string';
      },

      serialize: function(obj, options, compact, dictionary) {
        options = options || {};

        var isRoot = !dictionary,
          res;
        if (isRoot) {
          options.formatter = new Formatter(options.precision);
          dictionary = {
            length: 0,
            definitions: {},
            references: {},
            add: function(item, create) {
              var id = '#' + item._id,
                ref = this.references[id];
              if (!ref) {
                this.length++;
                var res = create.call(item),
                  name = item._class;
                if (name && res[0] !== name)
                  res.unshift(name);
                this.definitions[id] = res;
                ref = this.references[id] = [id];
              }
              return ref;
            }
          };
        }
        if (obj && obj._serialize) {
          res = obj._serialize(options, dictionary);
          var name = obj._class;
          if (name && !obj._compactSerialize && (isRoot || !compact)
            && res[0] !== name) {
            res.unshift(name);
          }
        } else if (Array.isArray(obj)) {
          res = [];
          for (var i = 0, l = obj.length; i < l; i++)
            res[i] = Base.serialize(obj[i], options, compact, dictionary);
        } else if (Base.isPlainObject(obj)) {
          res = {};
          var keys = Object.keys(obj);
          for (var i = 0, l = keys.length; i < l; i++) {
            var key = keys[i];
            res[key] = Base.serialize(obj[key], options, compact,
              dictionary);
          }
        } else if (typeof obj === 'number') {
          res = options.formatter.number(obj, options.precision);
        } else {
          res = obj;
        }
        return isRoot && dictionary.length > 0
          ? [['dictionary', dictionary.definitions], res]
          : res;
      },

      deserialize: function(json, create, _data, _setDictionary, _isRoot) {
        var res = json,
          isFirst = !_data,
          hasDictionary = isFirst && json && json.length
            && json[0][0] === 'dictionary';
        _data = _data || {};
        if (Array.isArray(json)) {
          var type = json[0],
            isDictionary = type === 'dictionary';
          if (json.length == 1 && /^#/.test(type)) {
            return _data.dictionary[type];
          }
          type = Base.exports[type];
          res = [];
          for (var i = type ? 1 : 0, l = json.length; i < l; i++) {
            res.push(Base.deserialize(json[i], create, _data,
              isDictionary, hasDictionary));
          }
          if (type) {
            var args = res;
            if (create) {
              res = create(type, args, isFirst || _isRoot);
            } else {
              res = new type(args);
            }
          }
        } else if (Base.isPlainObject(json)) {
          res = {};
          if (_setDictionary)
            _data.dictionary = res;
          for (var key in json)
            res[key] = Base.deserialize(json[key], create, _data);
        }
        return hasDictionary ? res[1] : res;
      },

      exportJSON: function(obj, options) {
        var json = Base.serialize(obj, options);
        return options && options.asString == false
          ? json
          : JSON.stringify(json);
      },

      importJSON: function(json, target) {
        return Base.deserialize(
          typeof json === 'string' ? JSON.parse(json) : json,
          function(ctor, args, isRoot) {
            var useTarget = isRoot && target
              && target.constructor === ctor,
              obj = useTarget ? target
                : Base.create(ctor.prototype);
            if (args.length === 1 && obj instanceof Item
              && (useTarget || !(obj instanceof Layer))) {
              var arg = args[0];
              if (Base.isPlainObject(arg))
                arg.insert = false;
            }
            (useTarget ? obj.set : ctor).apply(obj, args);
            if (useTarget)
              target = null;
            return obj;
          });
      },

      push: function(list, items) {
        var itemsLength = items.length;
        if (itemsLength < 4096) {
          list.push.apply(list, items);
        } else {
          var startLength = list.length;
          list.length += itemsLength;
          for (var i = 0; i < itemsLength; i++) {
            list[startLength + i] = items[i];
          }
        }
        return list;
      },

      splice: function(list, items, index, remove) {
        var amount = items && items.length,
          append = index === undefined;
        index = append ? list.length : index;
        if (index > list.length)
          index = list.length;
        for (var i = 0; i < amount; i++)
          items[i]._index = index + i;
        if (append) {
          Base.push(list, items);
          return [];
        } else {
          var args = [index, remove];
          if (items)
            Base.push(args, items);
          var removed = list.splice.apply(list, args);
          for (var i = 0, l = removed.length; i < l; i++)
            removed[i]._index = undefined;
          for (var i = index + amount, l = list.length; i < l; i++)
            list[i]._index = i;
          return removed;
        }
      },

      capitalize: function(str) {
        return str.replace(/\b[a-z]/g, function(match) {
          return match.toUpperCase();
        });
      },

      camelize: function(str) {
        return str.replace(/-(.)/g, function(match, chr) {
          return chr.toUpperCase();
        });
      },

      hyphenate: function(str) {
        return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      }
    }});

  var Emitter = {
    on: function(type, func) {
      if (typeof type !== 'string') {
        Base.each(type, function(value, key) {
          this.on(key, value);
        }, this);
      } else {
        var types = this._eventTypes,
          entry = types && types[type],
          handlers = this._callbacks = this._callbacks || {};
        handlers = handlers[type] = handlers[type] || [];
        if (handlers.indexOf(func) === -1) {
          handlers.push(func);
          if (entry && entry.install && handlers.length === 1)
            entry.install.call(this, type);
        }
      }
      return this;
    },

    off: function(type, func) {
      if (typeof type !== 'string') {
        Base.each(type, function(value, key) {
          this.off(key, value);
        }, this);
        return;
      }
      var types = this._eventTypes,
        entry = types && types[type],
        handlers = this._callbacks && this._callbacks[type],
        index;
      if (handlers) {
        if (!func || (index = handlers.indexOf(func)) !== -1
          && handlers.length === 1) {
          if (entry && entry.uninstall)
            entry.uninstall.call(this, type);
          delete this._callbacks[type];
        } else if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
      return this;
    },

    once: function(type, func) {
      return this.on(type, function handler() {
        func.apply(this, arguments);
        this.off(type, handler);
      });
    },

    emit: function(type, event) {
      var handlers = this._callbacks && this._callbacks[type];
      if (!handlers)
        return false;
      var args = Base.slice(arguments, 1),
        setTarget = event && event.target && !event.currentTarget;
      handlers = handlers.slice();
      if (setTarget)
        event.currentTarget = this;
      for (var i = 0, l = handlers.length; i < l; i++) {
        if (handlers[i].apply(this, args) == false) {
          if (event && event.stop)
            event.stop();
          break;
        }
      }
      if (setTarget)
        delete event.currentTarget;
      return true;
    },

    responds: function(type) {
      return !!(this._callbacks && this._callbacks[type]);
    },

    attach: '#on',
    detach: '#off',
    fire: '#emit',

    _installEvents: function(install) {
      var types = this._eventTypes,
        handlers = this._callbacks,
        key = install ? 'install' : 'uninstall';
      if (types) {
        for (var type in handlers) {
          if (handlers[type].length > 0) {
            var entry = types[type],
              func = entry && entry[key];
            if (func)
              func.call(this, type);
          }
        }
      }
    },

    statics: {
      inject: function inject(src) {
        var events = src._events;
        if (events) {
          var types = {};
          Base.each(events, function(entry, key) {
            var isString = typeof entry === 'string',
              name = isString ? entry : key,
              part = Base.capitalize(name),
              type = name.substring(2).toLowerCase();
            types[type] = isString ? {} : entry;
            name = '_' + name;
            src['get' + part] = function() {
              return this[name];
            };
            src['set' + part] = function(func) {
              var prev = this[name];
              if (prev)
                this.off(type, prev);
              if (func)
                this.on(type, func);
              this[name] = func;
            };
          });
          src._eventTypes = types;
        }
        return inject.base.apply(this, arguments);
      }
    }
  };

  var PaperScope = Base.extend({
    _class: 'PaperScope',

    initialize: function PaperScope() {
      paper = this;
      this.settings = new Base({
        applyMatrix: true,
        insertItems: true,
        handleSize: 4,
        hitTolerance: 0
      });
      this.project = null;
      this.projects = [];
      this.tools = [];
      this._id = PaperScope._id++;
      PaperScope._scopes[this._id] = this;
      var proto = PaperScope.prototype;
      if (!this.support) {
        var ctx = CanvasProvider.getContext(1, 1) || {};
        proto.support = {
          nativeDash: 'setLineDash' in ctx || 'mozDash' in ctx,
          nativeBlendModes: BlendMode.nativeModes
        };
        CanvasProvider.release(ctx);
      }
      if (!this.agent) {
        var user = self.navigator.userAgent.toLowerCase(),
          os = (/(darwin|win|mac|linux|freebsd|sunos)/.exec(user)||[])[0],
          platform = os === 'darwin' ? 'mac' : os,
          agent = proto.agent = proto.browser = { platform: platform };
        if (platform)
          agent[platform] = true;
        user.replace(
          /(opera|chrome|safari|webkit|firefox|msie|trident|atom|node)\/?\s*([.\d]+)(?:.*version\/([.\d]+))?(?:.*rv\:v?([.\d]+))?/g,
          function(match, n, v1, v2, rv) {
            if (!agent.chrome) {
              var v = n === 'opera' ? v2 :
                /^(node|trident)$/.test(n) ? rv : v1;
              agent.version = v;
              agent.versionNumber = parseFloat(v);
              n = n === 'trident' ? 'msie' : n;
              agent.name = n;
              agent[n] = true;
            }
          }
        );
        if (agent.chrome)
          delete agent.webkit;
        if (agent.atom)
          delete agent.chrome;
      }
    },

    version: "0.12.0",

    getView: function() {
      var project = this.project;
      return project && project._view;
    },

    getPaper: function() {
      return this;
    },

    execute: function(code, options) {
    },

    install: function(scope) {
      var that = this;
      Base.each(['project', 'view', 'tool'], function(key) {
        Base.define(scope, key, {
          configurable: true,
          get: function() {
            return that[key];
          }
        });
      });
      for (var key in this)
        if (!/^_/.test(key) && this[key])
          scope[key] = this[key];
    },

    setup: function(element) {
      paper = this;
      this.project = new Project(element);
      return this;
    },

    createCanvas: function(width, height) {
      return CanvasProvider.getCanvas(width, height);
    },

    activate: function() {
      paper = this;
    },

    clear: function() {
      var projects = this.projects,
        tools = this.tools;
      for (var i = projects.length - 1; i >= 0; i--)
        projects[i].remove();
      for (var i = tools.length - 1; i >= 0; i--)
        tools[i].remove();
    },

    remove: function() {
      this.clear();
      delete PaperScope._scopes[this._id];
    },

    statics: new function() {
      function handleAttribute(name) {
        name += 'Attribute';
        return function(el, attr) {
          return el[name](attr) || el[name]('data-paper-' + attr);
        };
      }

      return {
        _scopes: {},
        _id: 0,

        get: function(id) {
          return this._scopes[id] || null;
        },

        getAttribute: handleAttribute('get'),
        hasAttribute: handleAttribute('has')
      };
    }
  });

  var PaperScopeItem = Base.extend(Emitter, {

    initialize: function(activate) {
      this._scope = paper;
      this._index = this._scope[this._list].push(this) - 1;
      if (activate || !this._scope[this._reference])
        this.activate();
    },

    activate: function() {
      if (!this._scope)
        return false;
      var prev = this._scope[this._reference];
      if (prev && prev !== this)
        prev.emit('deactivate');
      this._scope[this._reference] = this;
      this.emit('activate', prev);
      return true;
    },

    isActive: function() {
      return this._scope[this._reference] === this;
    },

    remove: function() {
      if (this._index == null)
        return false;
      Base.splice(this._scope[this._list], null, this._index, 1);
      if (this._scope[this._reference] == this)
        this._scope[this._reference] = null;
      this._scope = null;
      return true;
    },

    getView: function() {
      return this._scope.getView();
    }
  });

  var Formatter = Base.extend({
    initialize: function(precision) {
      this.precision = Base.pick(precision, 5);
      this.multiplier = Math.pow(10, this.precision);
    },

    number: function(val) {
      return this.precision < 16
        ? Math.round(val * this.multiplier) / this.multiplier : val;
    },

    pair: function(val1, val2, separator) {
      return this.number(val1) + (separator || ',') + this.number(val2);
    },

    point: function(val, separator) {
      return this.number(val.x) + (separator || ',') + this.number(val.y);
    },

    size: function(val, separator) {
      return this.number(val.width) + (separator || ',')
        + this.number(val.height);
    },

    rectangle: function(val, separator) {
      return this.point(val, separator) + (separator || ',')
        + this.size(val, separator);
    }
  });

  Formatter.instance = new Formatter();

  var Numerical = new function() {

    var abscissas = [
      [  0.5773502691896257645091488],
      [0,0.7745966692414833770358531],
      [  0.3399810435848562648026658,0.8611363115940525752239465],
      [0,0.5384693101056830910363144,0.9061798459386639927976269],
      [  0.2386191860831969086305017,0.6612093864662645136613996,0.9324695142031520278123016],
      [0,0.4058451513773971669066064,0.7415311855993944398638648,0.9491079123427585245261897],
      [  0.1834346424956498049394761,0.5255324099163289858177390,0.7966664774136267395915539,0.9602898564975362316835609],
      [0,0.3242534234038089290385380,0.6133714327005903973087020,0.8360311073266357942994298,0.9681602395076260898355762],
      [  0.1488743389816312108848260,0.4333953941292471907992659,0.6794095682990244062343274,0.8650633666889845107320967,0.9739065285171717200779640],
      [0,0.2695431559523449723315320,0.5190961292068118159257257,0.7301520055740493240934163,0.8870625997680952990751578,0.9782286581460569928039380],
      [  0.1252334085114689154724414,0.3678314989981801937526915,0.5873179542866174472967024,0.7699026741943046870368938,0.9041172563704748566784659,0.9815606342467192506905491],
      [0,0.2304583159551347940655281,0.4484927510364468528779129,0.6423493394403402206439846,0.8015780907333099127942065,0.9175983992229779652065478,0.9841830547185881494728294],
      [  0.1080549487073436620662447,0.3191123689278897604356718,0.5152486363581540919652907,0.6872929048116854701480198,0.8272013150697649931897947,0.9284348836635735173363911,0.9862838086968123388415973],
      [0,0.2011940939974345223006283,0.3941513470775633698972074,0.5709721726085388475372267,0.7244177313601700474161861,0.8482065834104272162006483,0.9372733924007059043077589,0.9879925180204854284895657],
      [  0.0950125098376374401853193,0.2816035507792589132304605,0.4580167776572273863424194,0.6178762444026437484466718,0.7554044083550030338951012,0.8656312023878317438804679,0.9445750230732325760779884,0.9894009349916499325961542]
    ];

    var weights = [
      [1],
      [0.8888888888888888888888889,0.5555555555555555555555556],
      [0.6521451548625461426269361,0.3478548451374538573730639],
      [0.5688888888888888888888889,0.4786286704993664680412915,0.2369268850561890875142640],
      [0.4679139345726910473898703,0.3607615730481386075698335,0.1713244923791703450402961],
      [0.4179591836734693877551020,0.3818300505051189449503698,0.2797053914892766679014678,0.1294849661688696932706114],
      [0.3626837833783619829651504,0.3137066458778872873379622,0.2223810344533744705443560,0.1012285362903762591525314],
      [0.3302393550012597631645251,0.3123470770400028400686304,0.2606106964029354623187429,0.1806481606948574040584720,0.0812743883615744119718922],
      [0.2955242247147528701738930,0.2692667193099963550912269,0.2190863625159820439955349,0.1494513491505805931457763,0.0666713443086881375935688],
      [0.2729250867779006307144835,0.2628045445102466621806889,0.2331937645919904799185237,0.1862902109277342514260976,0.1255803694649046246346943,0.0556685671161736664827537],
      [0.2491470458134027850005624,0.2334925365383548087608499,0.2031674267230659217490645,0.1600783285433462263346525,0.1069393259953184309602547,0.0471753363865118271946160],
      [0.2325515532308739101945895,0.2262831802628972384120902,0.2078160475368885023125232,0.1781459807619457382800467,0.1388735102197872384636018,0.0921214998377284479144218,0.0404840047653158795200216],
      [0.2152638534631577901958764,0.2051984637212956039659241,0.1855383974779378137417166,0.1572031671581935345696019,0.1215185706879031846894148,0.0801580871597602098056333,0.0351194603317518630318329],
      [0.2025782419255612728806202,0.1984314853271115764561183,0.1861610000155622110268006,0.1662692058169939335532009,0.1395706779261543144478048,0.1071592204671719350118695,0.0703660474881081247092674,0.0307532419961172683546284],
      [0.1894506104550684962853967,0.1826034150449235888667637,0.1691565193950025381893121,0.1495959888165767320815017,0.1246289712555338720524763,0.0951585116824927848099251,0.0622535239386478928628438,0.0271524594117540948517806]
    ];

    var abs = Math.abs,
      sqrt = Math.sqrt,
      pow = Math.pow,
      log2 = Math.log2 || function(x) {
        return Math.log(x) * Math.LOG2E;
      },
      EPSILON = 1e-12,
      MACHINE_EPSILON = 1.12e-16;

    function clamp(value, min, max) {
      return value < min ? min : value > max ? max : value;
    }

    function getDiscriminant(a, b, c) {
      function split(v) {
        var x = v * 134217729,
          y = v - x,
          hi = y + x,
          lo = v - hi;
        return [hi, lo];
      }

      var D = b * b - a * c,
        E = b * b + a * c;
      if (abs(D) * 3 < E) {
        var ad = split(a),
          bd = split(b),
          cd = split(c),
          p = b * b,
          dp = (bd[0] * bd[0] - p + 2 * bd[0] * bd[1]) + bd[1] * bd[1],
          q = a * c,
          dq = (ad[0] * cd[0] - q + ad[0] * cd[1] + ad[1] * cd[0])
            + ad[1] * cd[1];
        D = (p - q) + (dp - dq);
      }
      return D;
    }

    function getNormalizationFactor() {
      var norm = Math.max.apply(Math, arguments);
      return norm && (norm < 1e-8 || norm > 1e8)
        ? pow(2, -Math.round(log2(norm)))
        : 0;
    }

    return {
      EPSILON: EPSILON,
      MACHINE_EPSILON: MACHINE_EPSILON,
      CURVETIME_EPSILON: 1e-8,
      GEOMETRIC_EPSILON: 1e-7,
      TRIGONOMETRIC_EPSILON: 1e-8,
      KAPPA: 4 * (sqrt(2) - 1) / 3,

      isZero: function(val) {
        return val >= -EPSILON && val <= EPSILON;
      },

      clamp: clamp,

      integrate: function(f, a, b, n) {
        var x = abscissas[n - 2],
          w = weights[n - 2],
          A = (b - a) * 0.5,
          B = A + a,
          i = 0,
          m = (n + 1) >> 1,
          sum = n & 1 ? w[i++] * f(B) : 0;
        while (i < m) {
          var Ax = A * x[i];
          sum += w[i++] * (f(B + Ax) + f(B - Ax));
        }
        return A * sum;
      },

      findRoot: function(f, df, x, a, b, n, tolerance) {
        for (var i = 0; i < n; i++) {
          var fx = f(x),
            dx = fx / df(x),
            nx = x - dx;
          if (abs(dx) < tolerance) {
            x = nx;
            break;
          }
          if (fx > 0) {
            b = x;
            x = nx <= a ? (a + b) * 0.5 : nx;
          } else {
            a = x;
            x = nx >= b ? (a + b) * 0.5 : nx;
          }
        }
        return clamp(x, a, b);
      },

      solveQuadratic: function(a, b, c, roots, min, max) {
        var x1, x2 = Infinity;
        if (abs(a) < EPSILON) {
          if (abs(b) < EPSILON)
            return abs(c) < EPSILON ? -1 : 0;
          x1 = -c / b;
        } else {
          b *= -0.5;
          var D = getDiscriminant(a, b, c);
          if (D && abs(D) < MACHINE_EPSILON) {
            var f = getNormalizationFactor(abs(a), abs(b), abs(c));
            if (f) {
              a *= f;
              b *= f;
              c *= f;
              D = getDiscriminant(a, b, c);
            }
          }
          if (D >= -MACHINE_EPSILON) {
            var Q = D < 0 ? 0 : sqrt(D),
              R = b + (b < 0 ? -Q : Q);
            if (R === 0) {
              x1 = c / a;
              x2 = -x1;
            } else {
              x1 = R / a;
              x2 = c / R;
            }
          }
        }
        var count = 0,
          boundless = min == null,
          minB = min - EPSILON,
          maxB = max + EPSILON;
        if (isFinite(x1) && (boundless || x1 > minB && x1 < maxB))
          roots[count++] = boundless ? x1 : clamp(x1, min, max);
        if (x2 !== x1
          && isFinite(x2) && (boundless || x2 > minB && x2 < maxB))
          roots[count++] = boundless ? x2 : clamp(x2, min, max);
        return count;
      },

      solveCubic: function(a, b, c, d, roots, min, max) {
        var f = getNormalizationFactor(abs(a), abs(b), abs(c), abs(d)),
          x, b1, c2, qd, q;
        if (f) {
          a *= f;
          b *= f;
          c *= f;
          d *= f;
        }

        function evaluate(x0) {
          x = x0;
          var tmp = a * x;
          b1 = tmp + b;
          c2 = b1 * x + c;
          qd = (tmp + b1) * x + c2;
          q = c2 * x + d;
        }

        if (abs(a) < EPSILON) {
          a = b;
          b1 = c;
          c2 = d;
          x = Infinity;
        } else if (abs(d) < EPSILON) {
          b1 = b;
          c2 = c;
          x = 0;
        } else {
          evaluate(-(b / a) / 3);
          var t = q / a,
            r = pow(abs(t), 1/3),
            s = t < 0 ? -1 : 1,
            td = -qd / a,
            rd = td > 0 ? 1.324717957244746 * Math.max(r, sqrt(td)) : r,
            x0 = x - s * rd;
          if (x0 !== x) {
            do {
              evaluate(x0);
              x0 = qd === 0 ? x : x - q / qd / (1 + MACHINE_EPSILON);
            } while (s * x0 > s * x);
            if (abs(a) * x * x > abs(d / x)) {
              c2 = -d / x;
              b1 = (c2 - c) / x;
            }
          }
        }
        var count = Numerical.solveQuadratic(a, b1, c2, roots, min, max),
          boundless = min == null;
        if (isFinite(x) && (count === 0
          || count > 0 && x !== roots[0] && x !== roots[1])
          && (boundless || x > min - EPSILON && x < max + EPSILON))
          roots[count++] = boundless ? x : clamp(x, min, max);
        return count;
      }
    };
  };

  var UID = {
    _id: 1,
    _pools: {},

    get: function(name) {
      if (name) {
        var pool = this._pools[name];
        if (!pool)
          pool = this._pools[name] = { _id: 1 };
        return pool._id++;
      } else {
        return this._id++;
      }
    }
  };

  var Point = Base.extend({
    _class: 'Point',
    _readIndex: true,

    initialize: function Point(arg0, arg1) {
      var type = typeof arg0,
        reading = this.__read,
        read = 0;
      if (type === 'number') {
        var hasY = typeof arg1 === 'number';
        this._set(arg0, hasY ? arg1 : arg0);
        if (reading)
          read = hasY ? 2 : 1;
      } else if (type === 'undefined' || arg0 === null) {
        this._set(0, 0);
        if (reading)
          read = arg0 === null ? 1 : 0;
      } else {
        var obj = type === 'string' ? arg0.split(/[\s,]+/) || [] : arg0;
        read = 1;
        if (Array.isArray(obj)) {
          this._set(+obj[0], +(obj.length > 1 ? obj[1] : obj[0]));
        } else if ('x' in obj) {
          this._set(obj.x || 0, obj.y || 0);
        } else if ('width' in obj) {
          this._set(obj.width || 0, obj.height || 0);
        } else if ('angle' in obj) {
          this._set(obj.length || 0, 0);
          this.setAngle(obj.angle || 0);
        } else {
          this._set(0, 0);
          read = 0;
        }
      }
      if (reading)
        this.__read = read;
      return this;
    },

    set: '#initialize',

    _set: function(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },

    equals: function(point) {
      return this === point || point
        && (this.x === point.x && this.y === point.y
          || Array.isArray(point)
          && this.x === point[0] && this.y === point[1])
        || false;
    },

    clone: function() {
      return new Point(this.x, this.y);
    },

    toString: function() {
      var f = Formatter.instance;
      return '{ x: ' + f.number(this.x) + ', y: ' + f.number(this.y) + ' }';
    },

    _serialize: function(options) {
      var f = options.formatter;
      return [f.number(this.x), f.number(this.y)];
    },

    getLength: function() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    setLength: function(length) {
      if (this.isZero()) {
        var angle = this._angle || 0;
        this._set(
          Math.cos(angle) * length,
          Math.sin(angle) * length
        );
      } else {
        var scale = length / this.getLength();
        if (Numerical.isZero(scale))
          this.getAngle();
        this._set(
          this.x * scale,
          this.y * scale
        );
      }
    },
    getAngle: function() {
      return this.getAngleInRadians.apply(this, arguments) * 180 / Math.PI;
    },

    setAngle: function(angle) {
      this.setAngleInRadians.call(this, angle * Math.PI / 180);
    },

    getAngleInDegrees: '#getAngle',
    setAngleInDegrees: '#setAngle',

    getAngleInRadians: function() {
      if (!arguments.length) {
        return this.isZero()
          ? this._angle || 0
          : this._angle = Math.atan2(this.y, this.x);
      } else {
        var point = Point.read(arguments),
          div = this.getLength() * point.getLength();
        if (Numerical.isZero(div)) {
          return NaN;
        } else {
          var a = this.dot(point) / div;
          return Math.acos(a < -1 ? -1 : a > 1 ? 1 : a);
        }
      }
    },

    setAngleInRadians: function(angle) {
      this._angle = angle;
      if (!this.isZero()) {
        var length = this.getLength();
        this._set(
          Math.cos(angle) * length,
          Math.sin(angle) * length
        );
      }
    },

    getQuadrant: function() {
      return this.x >= 0 ? this.y >= 0 ? 1 : 4 : this.y >= 0 ? 2 : 3;
    }
  }, {
    beans: false,

    getDirectedAngle: function() {
      var point = Point.read(arguments);
      return Math.atan2(this.cross(point), this.dot(point)) * 180 / Math.PI;
    },

    getDistance: function() {
      var point = Point.read(arguments),
        x = point.x - this.x,
        y = point.y - this.y,
        d = x * x + y * y,
        squared = Base.read(arguments);
      return squared ? d : Math.sqrt(d);
    },

    normalize: function(length) {
      if (length === undefined)
        length = 1;
      var current = this.getLength(),
        scale = current !== 0 ? length / current : 0,
        point = new Point(this.x * scale, this.y * scale);
      if (scale >= 0)
        point._angle = this._angle;
      return point;
    },

    rotate: function(angle, center) {
      if (angle === 0)
        return this.clone();
      angle = angle * Math.PI / 180;
      var point = center ? this.subtract(center) : this,
        sin = Math.sin(angle),
        cos = Math.cos(angle);
      point = new Point(
        point.x * cos - point.y * sin,
        point.x * sin + point.y * cos
      );
      return center ? point.add(center) : point;
    },

    transform: function(matrix) {
      return matrix ? matrix._transformPoint(this) : this;
    },

    add: function() {
      var point = Point.read(arguments);
      return new Point(this.x + point.x, this.y + point.y);
    },

    subtract: function() {
      var point = Point.read(arguments);
      return new Point(this.x - point.x, this.y - point.y);
    },

    multiply: function() {
      var point = Point.read(arguments);
      return new Point(this.x * point.x, this.y * point.y);
    },

    divide: function() {
      var point = Point.read(arguments);
      return new Point(this.x / point.x, this.y / point.y);
    },

    modulo: function() {
      var point = Point.read(arguments);
      return new Point(this.x % point.x, this.y % point.y);
    },

    negate: function() {
      return new Point(-this.x, -this.y);
    },

    isInside: function() {
      return Rectangle.read(arguments).contains(this);
    },

    isClose: function() {
      var point = Point.read(arguments),
        tolerance = Base.read(arguments);
      return this.getDistance(point) <= tolerance;
    },

    isCollinear: function() {
      var point = Point.read(arguments);
      return Point.isCollinear(this.x, this.y, point.x, point.y);
    },

    isColinear: '#isCollinear',

    isOrthogonal: function() {
      var point = Point.read(arguments);
      return Point.isOrthogonal(this.x, this.y, point.x, point.y);
    },

    isZero: function() {
      var isZero = Numerical.isZero;
      return isZero(this.x) && isZero(this.y);
    },

    isNaN: function() {
      return isNaN(this.x) || isNaN(this.y);
    },

    isInQuadrant: function(q) {
      return this.x * (q > 1 && q < 4 ? -1 : 1) >= 0
        && this.y * (q > 2 ? -1 : 1) >= 0;
    },

    dot: function() {
      var point = Point.read(arguments);
      return this.x * point.x + this.y * point.y;
    },

    cross: function() {
      var point = Point.read(arguments);
      return this.x * point.y - this.y * point.x;
    },

    project: function() {
      var point = Point.read(arguments),
        scale = point.isZero() ? 0 : this.dot(point) / point.dot(point);
      return new Point(
        point.x * scale,
        point.y * scale
      );
    },

    statics: {
      min: function() {
        var point1 = Point.read(arguments),
          point2 = Point.read(arguments);
        return new Point(
          Math.min(point1.x, point2.x),
          Math.min(point1.y, point2.y)
        );
      },

      max: function() {
        var point1 = Point.read(arguments),
          point2 = Point.read(arguments);
        return new Point(
          Math.max(point1.x, point2.x),
          Math.max(point1.y, point2.y)
        );
      },

      random: function() {
        return new Point(Math.random(), Math.random());
      },

      isCollinear: function(x1, y1, x2, y2) {
        return Math.abs(x1 * y2 - y1 * x2)
          <= Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2))
          * 1e-8;
      },

      isOrthogonal: function(x1, y1, x2, y2) {
        return Math.abs(x1 * x2 + y1 * y2)
          <= Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2))
          * 1e-8;
      }
    }
  }, Base.each(['round', 'ceil', 'floor', 'abs'], function(key) {
    var op = Math[key];
    this[key] = function() {
      return new Point(op(this.x), op(this.y));
    };
  }, {}));

  var LinkedPoint = Point.extend({
    initialize: function Point(x, y, owner, setter) {
      this._x = x;
      this._y = y;
      this._owner = owner;
      this._setter = setter;
    },

    _set: function(x, y, _dontNotify) {
      this._x = x;
      this._y = y;
      if (!_dontNotify)
        this._owner[this._setter](this);
      return this;
    },

    getX: function() {
      return this._x;
    },

    setX: function(x) {
      this._x = x;
      this._owner[this._setter](this);
    },

    getY: function() {
      return this._y;
    },

    setY: function(y) {
      this._y = y;
      this._owner[this._setter](this);
    },

    isSelected: function() {
      return !!(this._owner._selection & this._getSelection());
    },

    setSelected: function(selected) {
      this._owner._changeSelection(this._getSelection(), selected);
    },

    _getSelection: function() {
      return this._setter === 'setPosition' ? 4 : 0;
    }
  });

  var Size = Base.extend({
    _class: 'Size',
    _readIndex: true,

    initialize: function Size(arg0, arg1) {
      var type = typeof arg0,
        reading = this.__read,
        read = 0;
      if (type === 'number') {
        var hasHeight = typeof arg1 === 'number';
        this._set(arg0, hasHeight ? arg1 : arg0);
        if (reading)
          read = hasHeight ? 2 : 1;
      } else if (type === 'undefined' || arg0 === null) {
        this._set(0, 0);
        if (reading)
          read = arg0 === null ? 1 : 0;
      } else {
        var obj = type === 'string' ? arg0.split(/[\s,]+/) || [] : arg0;
        read = 1;
        if (Array.isArray(obj)) {
          this._set(+obj[0], +(obj.length > 1 ? obj[1] : obj[0]));
        } else if ('width' in obj) {
          this._set(obj.width || 0, obj.height || 0);
        } else if ('x' in obj) {
          this._set(obj.x || 0, obj.y || 0);
        } else {
          this._set(0, 0);
          read = 0;
        }
      }
      if (reading)
        this.__read = read;
      return this;
    },

    set: '#initialize',

    _set: function(width, height) {
      this.width = width;
      this.height = height;
      return this;
    },

    equals: function(size) {
      return size === this || size && (this.width === size.width
        && this.height === size.height
        || Array.isArray(size) && this.width === size[0]
        && this.height === size[1]) || false;
    },

    clone: function() {
      return new Size(this.width, this.height);
    },

    toString: function() {
      var f = Formatter.instance;
      return '{ width: ' + f.number(this.width)
        + ', height: ' + f.number(this.height) + ' }';
    },

    _serialize: function(options) {
      var f = options.formatter;
      return [f.number(this.width),
        f.number(this.height)];
    },

    add: function() {
      var size = Size.read(arguments);
      return new Size(this.width + size.width, this.height + size.height);
    },

    subtract: function() {
      var size = Size.read(arguments);
      return new Size(this.width - size.width, this.height - size.height);
    },

    multiply: function() {
      var size = Size.read(arguments);
      return new Size(this.width * size.width, this.height * size.height);
    },

    divide: function() {
      var size = Size.read(arguments);
      return new Size(this.width / size.width, this.height / size.height);
    },

    modulo: function() {
      var size = Size.read(arguments);
      return new Size(this.width % size.width, this.height % size.height);
    },

    negate: function() {
      return new Size(-this.width, -this.height);
    },

    isZero: function() {
      var isZero = Numerical.isZero;
      return isZero(this.width) && isZero(this.height);
    },

    isNaN: function() {
      return isNaN(this.width) || isNaN(this.height);
    },

    statics: {
      min: function(size1, size2) {
        return new Size(
          Math.min(size1.width, size2.width),
          Math.min(size1.height, size2.height));
      },

      max: function(size1, size2) {
        return new Size(
          Math.max(size1.width, size2.width),
          Math.max(size1.height, size2.height));
      },

      random: function() {
        return new Size(Math.random(), Math.random());
      }
    }
  }, Base.each(['round', 'ceil', 'floor', 'abs'], function(key) {
    var op = Math[key];
    this[key] = function() {
      return new Size(op(this.width), op(this.height));
    };
  }, {}));

  var LinkedSize = Size.extend({
    initialize: function Size(width, height, owner, setter) {
      this._width = width;
      this._height = height;
      this._owner = owner;
      this._setter = setter;
    },

    _set: function(width, height, _dontNotify) {
      this._width = width;
      this._height = height;
      if (!_dontNotify)
        this._owner[this._setter](this);
      return this;
    },

    getWidth: function() {
      return this._width;
    },

    setWidth: function(width) {
      this._width = width;
      this._owner[this._setter](this);
    },

    getHeight: function() {
      return this._height;
    },

    setHeight: function(height) {
      this._height = height;
      this._owner[this._setter](this);
    }
  });

  var Rectangle = Base.extend({
    _class: 'Rectangle',
    _readIndex: true,
    beans: true,

    initialize: function Rectangle(arg0, arg1, arg2, arg3) {
      var type = typeof arg0,
        read;
      if (type === 'number') {
        this._set(arg0, arg1, arg2, arg3);
        read = 4;
      } else if (type === 'undefined' || arg0 === null) {
        this._set(0, 0, 0, 0);
        read = arg0 === null ? 1 : 0;
      } else if (arguments.length === 1) {
        if (Array.isArray(arg0)) {
          this._set.apply(this, arg0);
          read = 1;
        } else if (arg0.x !== undefined || arg0.width !== undefined) {
          this._set(arg0.x || 0, arg0.y || 0,
            arg0.width || 0, arg0.height || 0);
          read = 1;
        } else if (arg0.from === undefined && arg0.to === undefined) {
          this._set(0, 0, 0, 0);
          Base.filter(this, arg0);
          read = 1;
        }
      }
      if (read === undefined) {
        var frm = Point.readNamed(arguments, 'from'),
          next = Base.peek(arguments),
          x = frm.x,
          y = frm.y,
          width,
          height;
        if (next && next.x !== undefined
          || Base.hasNamed(arguments, 'to')) {
          var to = Point.readNamed(arguments, 'to');
          width = to.x - x;
          height = to.y - y;
          if (width < 0) {
            x = to.x;
            width = -width;
          }
          if (height < 0) {
            y = to.y;
            height = -height;
          }
        } else {
          var size = Size.read(arguments);
          width = size.width;
          height = size.height;
        }
        this._set(x, y, width, height);
        read = arguments.__index;
        var filtered = arguments.__filtered;
        if (filtered)
          this.__filtered = filtered;
      }
      if (this.__read)
        this.__read = read;
      return this;
    },

    set: '#initialize',

    _set: function(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      return this;
    },

    clone: function() {
      return new Rectangle(this.x, this.y, this.width, this.height);
    },

    equals: function(rect) {
      var rt = Base.isPlainValue(rect)
        ? Rectangle.read(arguments)
        : rect;
      return rt === this
        || rt && this.x === rt.x && this.y === rt.y
        && this.width === rt.width && this.height === rt.height
        || false;
    },

    toString: function() {
      var f = Formatter.instance;
      return '{ x: ' + f.number(this.x)
        + ', y: ' + f.number(this.y)
        + ', width: ' + f.number(this.width)
        + ', height: ' + f.number(this.height)
        + ' }';
    },

    _serialize: function(options) {
      var f = options.formatter;
      return [f.number(this.x),
        f.number(this.y),
        f.number(this.width),
        f.number(this.height)];
    },

    getPoint: function(_dontLink) {
      var ctor = _dontLink ? Point : LinkedPoint;
      return new ctor(this.x, this.y, this, 'setPoint');
    },

    setPoint: function() {
      var point = Point.read(arguments);
      this.x = point.x;
      this.y = point.y;
    },

    getSize: function(_dontLink) {
      var ctor = _dontLink ? Size : LinkedSize;
      return new ctor(this.width, this.height, this, 'setSize');
    },

    _fw: 1,
    _fh: 1,

    setSize: function() {
      var size = Size.read(arguments),
        sx = this._sx,
        sy = this._sy,
        w = size.width,
        h = size.height;
      if (sx) {
        this.x += (this.width - w) * sx;
      }
      if (sy) {
        this.y += (this.height - h) * sy;
      }
      this.width = w;
      this.height = h;
      this._fw = this._fh = 1;
    },

    getLeft: function() {
      return this.x;
    },

    setLeft: function(left) {
      if (!this._fw) {
        var amount = left - this.x;
        this.width -= this._sx === 0.5 ? amount * 2 : amount;
      }
      this.x = left;
      this._sx = this._fw = 0;
    },

    getTop: function() {
      return this.y;
    },

    setTop: function(top) {
      if (!this._fh) {
        var amount = top - this.y;
        this.height -= this._sy === 0.5 ? amount * 2 : amount;
      }
      this.y = top;
      this._sy = this._fh = 0;
    },

    getRight: function() {
      return this.x + this.width;
    },

    setRight: function(right) {
      if (!this._fw) {
        var amount = right - this.x;
        this.width = this._sx === 0.5 ? amount * 2 : amount;
      }
      this.x = right - this.width;
      this._sx = 1;
      this._fw = 0;
    },

    getBottom: function() {
      return this.y + this.height;
    },

    setBottom: function(bottom) {
      if (!this._fh) {
        var amount = bottom - this.y;
        this.height = this._sy === 0.5 ? amount * 2 : amount;
      }
      this.y = bottom - this.height;
      this._sy = 1;
      this._fh = 0;
    },

    getCenterX: function() {
      return this.x + this.width / 2;
    },

    setCenterX: function(x) {
      if (this._fw || this._sx === 0.5) {
        this.x = x - this.width / 2;
      } else {
        if (this._sx) {
          this.x += (x - this.x) * 2 * this._sx;
        }
        this.width = (x - this.x) * 2;
      }
      this._sx = 0.5;
      this._fw = 0;
    },

    getCenterY: function() {
      return this.y + this.height / 2;
    },

    setCenterY: function(y) {
      if (this._fh || this._sy === 0.5) {
        this.y = y - this.height / 2;
      } else {
        if (this._sy) {
          this.y += (y - this.y) * 2 * this._sy;
        }
        this.height = (y - this.y) * 2;
      }
      this._sy = 0.5;
      this._fh = 0;
    },

    getCenter: function(_dontLink) {
      var ctor = _dontLink ? Point : LinkedPoint;
      return new ctor(this.getCenterX(), this.getCenterY(), this, 'setCenter');
    },

    setCenter: function() {
      var point = Point.read(arguments);
      this.setCenterX(point.x);
      this.setCenterY(point.y);
      return this;
    },

    getArea: function() {
      return this.width * this.height;
    },

    isEmpty: function() {
      return this.width === 0 || this.height === 0;
    },

    contains: function(arg) {
      return arg && arg.width !== undefined
      || (Array.isArray(arg) ? arg : arguments).length === 4
        ? this._containsRectangle(Rectangle.read(arguments))
        : this._containsPoint(Point.read(arguments));
    },

    _containsPoint: function(point) {
      var x = point.x,
        y = point.y;
      return x >= this.x && y >= this.y
        && x <= this.x + this.width
        && y <= this.y + this.height;
    },

    _containsRectangle: function(rect) {
      var x = rect.x,
        y = rect.y;
      return x >= this.x && y >= this.y
        && x + rect.width <= this.x + this.width
        && y + rect.height <= this.y + this.height;
    },

    intersects: function() {
      var rect = Rectangle.read(arguments),
        epsilon = Base.read(arguments) || 0;
      return rect.x + rect.width > this.x - epsilon
        && rect.y + rect.height > this.y - epsilon
        && rect.x < this.x + this.width + epsilon
        && rect.y < this.y + this.height + epsilon;
    },

    intersect: function() {
      var rect = Rectangle.read(arguments),
        x1 = Math.max(this.x, rect.x),
        y1 = Math.max(this.y, rect.y),
        x2 = Math.min(this.x + this.width, rect.x + rect.width),
        y2 = Math.min(this.y + this.height, rect.y + rect.height);
      return new Rectangle(x1, y1, x2 - x1, y2 - y1);
    },

    unite: function() {
      var rect = Rectangle.read(arguments),
        x1 = Math.min(this.x, rect.x),
        y1 = Math.min(this.y, rect.y),
        x2 = Math.max(this.x + this.width, rect.x + rect.width),
        y2 = Math.max(this.y + this.height, rect.y + rect.height);
      return new Rectangle(x1, y1, x2 - x1, y2 - y1);
    },

    include: function() {
      var point = Point.read(arguments);
      var x1 = Math.min(this.x, point.x),
        y1 = Math.min(this.y, point.y),
        x2 = Math.max(this.x + this.width, point.x),
        y2 = Math.max(this.y + this.height, point.y);
      return new Rectangle(x1, y1, x2 - x1, y2 - y1);
    },

    expand: function() {
      var amount = Size.read(arguments),
        hor = amount.width,
        ver = amount.height;
      return new Rectangle(this.x - hor / 2, this.y - ver / 2,
        this.width + hor, this.height + ver);
    },

    scale: function(hor, ver) {
      return this.expand(this.width * hor - this.width,
        this.height * (ver === undefined ? hor : ver) - this.height);
    }
  }, Base.each([
      ['Top', 'Left'], ['Top', 'Right'],
      ['Bottom', 'Left'], ['Bottom', 'Right'],
      ['Left', 'Center'], ['Top', 'Center'],
      ['Right', 'Center'], ['Bottom', 'Center']
    ],
    function(parts, index) {
      var part = parts.join(''),
        xFirst = /^[RL]/.test(part);
      if (index >= 4)
        parts[1] += xFirst ? 'Y' : 'X';
      var x = parts[xFirst ? 0 : 1],
        y = parts[xFirst ? 1 : 0],
        getX = 'get' + x,
        getY = 'get' + y,
        setX = 'set' + x,
        setY = 'set' + y,
        get = 'get' + part,
        set = 'set' + part;
      this[get] = function(_dontLink) {
        var ctor = _dontLink ? Point : LinkedPoint;
        return new ctor(this[getX](), this[getY](), this, set);
      };
      this[set] = function() {
        var point = Point.read(arguments);
        this[setX](point.x);
        this[setY](point.y);
      };
    }, {
      beans: true
    }
  ));

  var LinkedRectangle = Rectangle.extend({
      initialize: function Rectangle(x, y, width, height, owner, setter) {
        this._set(x, y, width, height, true);
        this._owner = owner;
        this._setter = setter;
      },

      _set: function(x, y, width, height, _dontNotify) {
        this._x = x;
        this._y = y;
        this._width = width;
        this._height = height;
        if (!_dontNotify)
          this._owner[this._setter](this);
        return this;
      }
    },
    new function() {
      var proto = Rectangle.prototype;

      return Base.each(['x', 'y', 'width', 'height'], function(key) {
          var part = Base.capitalize(key),
            internal = '_' + key;
          this['get' + part] = function() {
            return this[internal];
          };

          this['set' + part] = function(value) {
            this[internal] = value;
            if (!this._dontNotify)
              this._owner[this._setter](this);
          };
        }, Base.each(['Point', 'Size', 'Center',
          'Left', 'Top', 'Right', 'Bottom', 'CenterX', 'CenterY',
          'TopLeft', 'TopRight', 'BottomLeft', 'BottomRight',
          'LeftCenter', 'TopCenter', 'RightCenter', 'BottomCenter'],
        function(key) {
          var name = 'set' + key;
          this[name] = function() {
            this._dontNotify = true;
            proto[name].apply(this, arguments);
            this._dontNotify = false;
            this._owner[this._setter](this);
          };
        }, {
          isSelected: function() {
            return !!(this._owner._selection & 2);
          },

          setSelected: function(selected) {
            var owner = this._owner;
            if (owner._changeSelection) {
              owner._changeSelection(2, selected);
            }
          }
        })
      );
    });

var Numerical = new function() {

  var abscissas = [
    [  0.5773502691896257645091488],
    [0,0.7745966692414833770358531],
    [  0.3399810435848562648026658,0.8611363115940525752239465],
    [0,0.5384693101056830910363144,0.9061798459386639927976269],
    [  0.2386191860831969086305017,0.6612093864662645136613996,0.9324695142031520278123016],
    [0,0.4058451513773971669066064,0.7415311855993944398638648,0.9491079123427585245261897],
    [  0.1834346424956498049394761,0.5255324099163289858177390,0.7966664774136267395915539,0.9602898564975362316835609],
    [0,0.3242534234038089290385380,0.6133714327005903973087020,0.8360311073266357942994298,0.9681602395076260898355762],
    [  0.1488743389816312108848260,0.4333953941292471907992659,0.6794095682990244062343274,0.8650633666889845107320967,0.9739065285171717200779640],
    [0,0.2695431559523449723315320,0.5190961292068118159257257,0.7301520055740493240934163,0.8870625997680952990751578,0.9782286581460569928039380],
    [  0.1252334085114689154724414,0.3678314989981801937526915,0.5873179542866174472967024,0.7699026741943046870368938,0.9041172563704748566784659,0.9815606342467192506905491],
    [0,0.2304583159551347940655281,0.4484927510364468528779129,0.6423493394403402206439846,0.8015780907333099127942065,0.9175983992229779652065478,0.9841830547185881494728294],
    [  0.1080549487073436620662447,0.3191123689278897604356718,0.5152486363581540919652907,0.6872929048116854701480198,0.8272013150697649931897947,0.9284348836635735173363911,0.9862838086968123388415973],
    [0,0.2011940939974345223006283,0.3941513470775633698972074,0.5709721726085388475372267,0.7244177313601700474161861,0.8482065834104272162006483,0.9372733924007059043077589,0.9879925180204854284895657],
    [  0.0950125098376374401853193,0.2816035507792589132304605,0.4580167776572273863424194,0.6178762444026437484466718,0.7554044083550030338951012,0.8656312023878317438804679,0.9445750230732325760779884,0.9894009349916499325961542]
  ];

  var weights = [
    [1],
    [0.8888888888888888888888889,0.5555555555555555555555556],
    [0.6521451548625461426269361,0.3478548451374538573730639],
    [0.5688888888888888888888889,0.4786286704993664680412915,0.2369268850561890875142640],
    [0.4679139345726910473898703,0.3607615730481386075698335,0.1713244923791703450402961],
    [0.4179591836734693877551020,0.3818300505051189449503698,0.2797053914892766679014678,0.1294849661688696932706114],
    [0.3626837833783619829651504,0.3137066458778872873379622,0.2223810344533744705443560,0.1012285362903762591525314],
    [0.3302393550012597631645251,0.3123470770400028400686304,0.2606106964029354623187429,0.1806481606948574040584720,0.0812743883615744119718922],
    [0.2955242247147528701738930,0.2692667193099963550912269,0.2190863625159820439955349,0.1494513491505805931457763,0.0666713443086881375935688],
    [0.2729250867779006307144835,0.2628045445102466621806889,0.2331937645919904799185237,0.1862902109277342514260976,0.1255803694649046246346943,0.0556685671161736664827537],
    [0.2491470458134027850005624,0.2334925365383548087608499,0.2031674267230659217490645,0.1600783285433462263346525,0.1069393259953184309602547,0.0471753363865118271946160],
    [0.2325515532308739101945895,0.2262831802628972384120902,0.2078160475368885023125232,0.1781459807619457382800467,0.1388735102197872384636018,0.0921214998377284479144218,0.0404840047653158795200216],
    [0.2152638534631577901958764,0.2051984637212956039659241,0.1855383974779378137417166,0.1572031671581935345696019,0.1215185706879031846894148,0.0801580871597602098056333,0.0351194603317518630318329],
    [0.2025782419255612728806202,0.1984314853271115764561183,0.1861610000155622110268006,0.1662692058169939335532009,0.1395706779261543144478048,0.1071592204671719350118695,0.0703660474881081247092674,0.0307532419961172683546284],
    [0.1894506104550684962853967,0.1826034150449235888667637,0.1691565193950025381893121,0.1495959888165767320815017,0.1246289712555338720524763,0.0951585116824927848099251,0.0622535239386478928628438,0.0271524594117540948517806]
  ];

  var abs = Math.abs,
    sqrt = Math.sqrt,
    pow = Math.pow,
    log2 = Math.log2 || function(x) {
      return Math.log(x) * Math.LOG2E;
    },
    EPSILON = 1e-12,
    MACHINE_EPSILON = 1.12e-16;

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  function getDiscriminant(a, b, c) {
    function split(v) {
      var x = v * 134217729,
        y = v - x,
        hi = y + x,
        lo = v - hi;
      return [hi, lo];
    }

    var D = b * b - a * c,
      E = b * b + a * c;
    if (abs(D) * 3 < E) {
      var ad = split(a),
        bd = split(b),
        cd = split(c),
        p = b * b,
        dp = (bd[0] * bd[0] - p + 2 * bd[0] * bd[1]) + bd[1] * bd[1],
        q = a * c,
        dq = (ad[0] * cd[0] - q + ad[0] * cd[1] + ad[1] * cd[0])
          + ad[1] * cd[1];
      D = (p - q) + (dp - dq);
    }
    return D;
  }

  function getNormalizationFactor() {
    var norm = Math.max.apply(Math, arguments);
    return norm && (norm < 1e-8 || norm > 1e8)
      ? pow(2, -Math.round(log2(norm)))
      : 0;
  }

  return {
    EPSILON: EPSILON,
    MACHINE_EPSILON: MACHINE_EPSILON,
    CURVETIME_EPSILON: 1e-8,
    GEOMETRIC_EPSILON: 1e-7,
    TRIGONOMETRIC_EPSILON: 1e-8,
    KAPPA: 4 * (sqrt(2) - 1) / 3,

    isZero: function(val) {
      return val >= -EPSILON && val <= EPSILON;
    },

    clamp: clamp,

    integrate: function(f, a, b, n) {
      var x = abscissas[n - 2],
        w = weights[n - 2],
        A = (b - a) * 0.5,
        B = A + a,
        i = 0,
        m = (n + 1) >> 1,
        sum = n & 1 ? w[i++] * f(B) : 0;
      while (i < m) {
        var Ax = A * x[i];
        sum += w[i++] * (f(B + Ax) + f(B - Ax));
      }
      return A * sum;
    },

    findRoot: function(f, df, x, a, b, n, tolerance) {
      for (var i = 0; i < n; i++) {
        var fx = f(x),
          dx = fx / df(x),
          nx = x - dx;
        if (abs(dx) < tolerance) {
          x = nx;
          break;
        }
        if (fx > 0) {
          b = x;
          x = nx <= a ? (a + b) * 0.5 : nx;
        } else {
          a = x;
          x = nx >= b ? (a + b) * 0.5 : nx;
        }
      }
      return clamp(x, a, b);
    },

    solveQuadratic: function(a, b, c, roots, min, max) {
      var x1, x2 = Infinity;
      if (abs(a) < EPSILON) {
        if (abs(b) < EPSILON)
          return abs(c) < EPSILON ? -1 : 0;
        x1 = -c / b;
      } else {
        b *= -0.5;
        var D = getDiscriminant(a, b, c);
        if (D && abs(D) < MACHINE_EPSILON) {
          var f = getNormalizationFactor(abs(a), abs(b), abs(c));
          if (f) {
            a *= f;
            b *= f;
            c *= f;
            D = getDiscriminant(a, b, c);
          }
        }
        if (D >= -MACHINE_EPSILON) {
          var Q = D < 0 ? 0 : sqrt(D),
            R = b + (b < 0 ? -Q : Q);
          if (R === 0) {
            x1 = c / a;
            x2 = -x1;
          } else {
            x1 = R / a;
            x2 = c / R;
          }
        }
      }
      var count = 0,
        boundless = min == null,
        minB = min - EPSILON,
        maxB = max + EPSILON;
      if (isFinite(x1) && (boundless || x1 > minB && x1 < maxB))
        roots[count++] = boundless ? x1 : clamp(x1, min, max);
      if (x2 !== x1
        && isFinite(x2) && (boundless || x2 > minB && x2 < maxB))
        roots[count++] = boundless ? x2 : clamp(x2, min, max);
      return count;
    },

    solveCubic: function(a, b, c, d, roots, min, max) {
      var f = getNormalizationFactor(abs(a), abs(b), abs(c), abs(d)),
        x, b1, c2, qd, q;
      if (f) {
        a *= f;
        b *= f;
        c *= f;
        d *= f;
      }

      function evaluate(x0) {
        x = x0;
        var tmp = a * x;
        b1 = tmp + b;
        c2 = b1 * x + c;
        qd = (tmp + b1) * x + c2;
        q = c2 * x + d;
      }

      if (abs(a) < EPSILON) {
        a = b;
        b1 = c;
        c2 = d;
        x = Infinity;
      } else if (abs(d) < EPSILON) {
        b1 = b;
        c2 = c;
        x = 0;
      } else {
        evaluate(-(b / a) / 3);
        var t = q / a,
          r = pow(abs(t), 1/3),
          s = t < 0 ? -1 : 1,
          td = -qd / a,
          rd = td > 0 ? 1.324717957244746 * Math.max(r, sqrt(td)) : r,
          x0 = x - s * rd;
        if (x0 !== x) {
          do {
            evaluate(x0);
            x0 = qd === 0 ? x : x - q / qd / (1 + MACHINE_EPSILON);
          } while (s * x0 > s * x);
          if (abs(a) * x * x > abs(d / x)) {
            c2 = -d / x;
            b1 = (c2 - c) / x;
          }
        }
      }
      var count = Numerical.solveQuadratic(a, b1, c2, roots, min, max),
        boundless = min == null;
      if (isFinite(x) && (count === 0
        || count > 0 && x !== roots[0] && x !== roots[1])
        && (boundless || x > min - EPSILON && x < max + EPSILON))
        roots[count++] = boundless ? x : clamp(x, min, max);
      return count;
    }
  };
};

export { Point, Rectangle, Line }
