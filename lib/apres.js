// Apres (DEVELOPMENT) Copyright (c) 2012 Casey Duncan, all rights reserved
// Apres is distributed freely under the MIT license
// See http://apres.github.com/ for details

/* global requirejs, document */

// Setup default Apres require config
requirejs.config({
  enforceDefine: true,
  paths: {
    // Default paths to find core app and core widget modules
    app: '../app',
    widget: '../widget',
    // Core libs
    //jquery: '//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min',
    underscore: 'underscore-1.3.3',
    require: 'require-1.0.8',
    pubsub: 'pubsub-1.2.0',
    store: 'store-1.3.3',
    showdown: 'showdown-0.1.0',
    CoffeeScript: 'coffeescript-1.3.3',
    querystring: 'querystring-0.5.0',
    handlebars: 'handlebars-1.0.0.beta.6',
    jade: 'jade-0.26.1',
    highlight: 'highlight-7.0',
    chai: 'chai-1.0.4',
    sinon: 'sinon-1.3.4',
    bootstrap: 'bootstrap-2.0.4',
    // Requirejs plugins
    text: 'require-plugins/text-1.0.8',
    cs: 'require-plugins/cs-0.4.0',
    domReady: 'require-plugins/domReady-1.0.0',
    async: 'require-plugins/async-0.1.1',
    depend: 'require-plugins/depend-0.1.0',
    font: 'require-plugins/font-0.2.0',
    google: 'require-plugins/goog-0.2.0',
    image: 'require-plugins/image-0.2.1',
    json: 'require-plugins/json-0.2.1',
    noext: 'require-plugins/noext-0.3.1',
    markdown: 'require-plugins/mdown-0.1.1',
    propertyParser: 'require-plugins/propertyParser-0.1.0',
    component: 'require-plugins/component-0.0.0',
  }
});

define('apres',
  ['require', 'module', 'querystring', 'jquery', 'pubsub'],
  function(require, module, querystring, $, pubsub) {
    var apres  = {};
    apres.VERSION = 'dev';

    // Unit test dependency injection points
    apres.$ = $;
    apres.pubsub = pubsub;
    apres.require = require;

    var error = function(){};
    if (console) {
      error = console.error ? console.error.bind(console) : console.log.bind(console);
    }
    // PubSub Event topics
    var topic = apres.topic = {
      all: 'apres',
      widget: 'apres.widget',
      replaceWidget: 'apres.widget.replace',
      controller: 'apres.controller',
      replaceController: 'apres.controller.replace'
    }

    var eventSplitter = /^(\S+)\s*(.*)$/;
    var guid = 0;

    // Backbone-style event delegation
    // Sets up event delegation for document elements to application code.
    //
    // @delegate is an object with an attribute events containing event
    // name/element selector pairs to handler functions. The events attribute
    // may also be a function that will be called to derive the mapping so
    // that it can be created dynamically. Example:
    //
    // delegate.events = {
    //    'click button#ok': function(event) {...},
    //    'change #entry-form input': 'validate'
    // }
    //
    // If the handler function is specified as a string, it is assumed to be a
    // method name of delegate.
    //
    // @elem is the element queried to find the events to bind to.
    // If not specified it is assumed to be `delegate.$el`.
    //
    apres.delegate = function(delegate, elem) {
      if (!delegate._apresGuid) delegate._apresGuid = guid++;
      if (!elem) {
        var elem = delegate.$el;
      } else {
        elem = apres.$(elem);
      }
      var events = delegate.events;
      if (typeof events === 'function') events = events();
      if (events) {
        for (var key in events) {
          var method = events[key];
          if (typeof method !== 'function') method = delegate[method];
          if (typeof method !== 'function') error('No delegate method named "' + events[key] + '"');
          var match = key.match(eventSplitter);
          var eventName = match[1], selector = match[2];
          if (selector) {
            elem.on(eventName + '.apres.delegate' + delegate._apresGuid, selector, method.bind(delegate));
          } else {
            elem.on(eventName + '.apres.delegate' + delegate._apresGuid, method.bind(delegate));
          }
        }
      }
      return this;
    }

    // Remove event bindings of the delegate to elem
    apres.undelegate = function(delegate, elem) {
      if (delegate._apresGuid) {
        if (!elem) {
          var elem = delegate.$el;
        } else {
          elem = apres.$(elem);
        }
        elem.off('.apres.delegate' + delegate._apresGuid);
      }
      return this;
    }

    // Create a jQuery deferred promise object to load and access a named
    // resource, optionally using a requirejs plugin.
    apres.srcPromise = function(name, plugin) {
      if (plugin) name = plugin + '!' + name;
      var deferred = apres.$.Deferred();
      apres.require([name],
        function(res) {deferred.resolve(res)},
        function(err) {deferred.reject(err)}
      );
      return deferred.promise();
    }

    var illegalValue = function(type, name, value) {
      error('Apres - Illegal ' + type + ' value "' + value + '" for widget param "' + name + '"');
    }
    // Type converters for widget parameters passed via tag attributes
    var widgetParamConvs = {
      'string': null,
      'bool': function(name, value) {
        var lc = value && value.toLowerCase();
        if (lc === 'true' || lc === 'yes' || lc === '1' || lc === true) return true;
        if (lc === 'false' || lc === 'no' || lc === '0' || lc === false) return false;
        illegalValue('boolean', name, value);
      },
      'int': function(name, value) {
        var n = parseInt(value);
        if (n === NaN) illegalValue('integer', name, value);
        return n;
      },
      'float': function(name, value) {
        var n = parseFloat(value);
        if (n === NaN) illegalValue('float', name, value);
        return n;
      },
      'selector': function(name, value) {
        return apres.$(value);
      },
      // "src" types return promise objects that asynchronously provide their
      // results once the resources are loaded, or immediately if they are cached
      'scriptSrc': function(name, value) {
        return apres.srcPromise(value);
      },
      'textSrc': function(name, value) {
        return apres.srcPromise(value, 'text');
      },
      'jsonSrc': function(name, value) {
        return apres.srcPromise(value, 'json');
      },
      'json': function(name, value) {
        return apres.$.parseJSON(value);
      }
    }
    apres.convertParams = function(params, paramMap) {
      var converted = {};
      for (var name in paramMap) {
        var info = paramMap[name];
        var value = params[name] || info.default;
        if (typeof value !== 'undefined') {
          if (info && info.type) {
            var convert = widgetParamConvs[info.type];
            converted[name] = convert ? convert(name, value) : value;
            if (typeof convert === 'undefined') {
              error('Apres - Unknown widget param type: ' + info.type);
            }
          } else {
            converted[name] = value;
          }
        }
      }
      return converted;
    }

    apres.getParamsFromElem = function(elem, paramMap, prefix) {
      var paramPrefix = prefix || "data-widget-";
      var params = {};
      for (var paramName in paramMap) {
        params[paramName] = elem.attr(paramPrefix + paramName);
      }
      params = apres.convertParams(params, paramMap);
      return params;
    }

    var widgetIdAttrName = 'data-apres-pvt-widget-id';
    var widgets = {};
    var widgetPending = {};
    var setWidget = function(elem, WidgetFactory, params) {
      var oldId = elem.attr(widgetIdAttrName);
      var oldWidget = widgets[oldId];
      var widget = null;
      if (oldWidget) {
        apres.undelegate(oldWidget, elem);
        delete widgets[oldId];
        elem.attr(widgetIdAttrName, null);
      }
      if (WidgetFactory) {
        var id = guid++;
        var registerWidget = function() {
          widget.events && apres.delegate(widget, elem);
          elem.trigger('widgetReady', widget);
        }
        var widgetReady = function(isReady) {
          if (isReady === false && typeof widgetPending[id] === 'undefined') {
            widgetPending[id] = true;
          } else if (widgetPending[id]) {
            widgetPending[id] = false;
            registerWidget();
          }
        }
        if (WidgetFactory.widgetParams) {
          params = $.extend(params,
            apres.getParamsFromElem(elem, WidgetFactory.widgetParams));
        }

        widget = widgets[id] = new WidgetFactory(elem, params, widgetReady);
        if (!widgetPending[id]) registerWidget();
        elem.attr(widgetIdAttrName, id);
      }
      if (oldWidget) {
        apres.pubsub.publishSync(topic.replaceWidget, 
          {elem: elem, oldWidget: oldWidget, newWidget: widget});
      }
      return widget;
    }

    // Get or install a widget object for an element
    //
    // @elem DOM element where the widget is installed.
    //
    // @WidgetFactory a constructor function for the widget, or a module name
    // for the widget constructor.
    //
    // @params an optional parameter object passed to the WidgetFactory.
    // if not provided, the parameters will be derived from the element's
    // `data-widget-*` attributes. To explicitly specify no parameters,
    // pass an empty object.
    //
    // @callback an optional callback function with the signature
    // `callback(err, widget)`. this function will be called when the widget
    // is installed, or an error occurs. 
    //
    apres.widget = function(elem, WidgetFactory, params, callback) {
      var id, widget;
      elem = apres.$(elem);
      if (typeof callback === 'undefined' && typeof params === 'function') {
        // apres.widget(elem, factory, callback)
        callback = params;
        params = undefined;
      }
      if (typeof WidgetFactory === 'undefined') {
        id = elem.attr(widgetIdAttrName);
        if (typeof id !== 'undefined') {
          return widgets[id];
        }
      } else {
        if (typeof WidgetFactory === 'string') {
          apres.require([WidgetFactory], 
            function(factory) {
              if (typeof factory !== 'function') {
                var msg = 'Apres - widget module "' + WidgetFactory + '" did not return a factory function';
                error(msg);
                if (callback) callback(Error(msg));
              }
              try {
                widget = setWidget(elem, factory, params);
                if (callback) callback(null, widget);
              } catch (err) {
                if (callback) {callback(err)} else {throw err}
                error('Error installing widget ' + WidgetFactory + ': ' + err);
              }
            },
            callback
          );
        } else {
          try {
            widget = setWidget(elem, WidgetFactory, params);
            if (callback) callback(null, widget);
          } catch (err) {
            if (callback) {callback(err)} else {throw err}
            error('Error installing widget ' + WidgetFactory + ': ' + err);
          }
        }
      }
    }

    var doc;
    var scanning = false;
    var scans;
    // limit re-entrant calls to findWidgets to avoid infinite loops
    var maxScans = 1000; 
    var elemQueue = [];

    // Scan the document element for widgets and initialize them when found.
    // The function is re-entrant, so if a widget modifies the DOM at any
    // time, including during its own initialization, it can call this method
    // to include any new widgets declared in the document. 
    //
    // @elem is the DOM element to be scanned. If omitted, the entire document
    // is scanned.
    apres.findWidgets = function(elem) {
      if (typeof elem == 'undefined') {
        if (!doc) throw new Error('document not defined, did you call apres.initialize()?');
        var elem = doc.documentElement;
      } else if (elem.get) {
        elem = elem.get(0);
      }
      elemQueue.push(elem);
      if (!scanning) {
        var widgetElems, i, widgetElem, widgetName;
        scanning = true;
        scans = 0;
        while (scanning && (elem = elemQueue[0])) {
          // Rather than simply popping, we remove all matching
          // elements in the queue to avoid duplicate scans
          elemQueue = elemQueue.filter(function(queueElem) {
            queueElem !== elem
          });
          elem.getElementsByClassName || (elem = elem.get(0));
          widgetElems = elem.getElementsByClassName('widget');
          for (i = 0; (widgetElem = widgetElems[i]); i++) {
            var factoryName = widgetElem.getAttribute('data-widget');
            if (factoryName) apres.widget(widgetElem, factoryName);
          }
        }
        scanning = false;
      } else if (++scans > maxScans) {
        scanning = false;
        error('Too many calls to apres.findWidgets(), widgets may be infinitely nested');
      }
    }

    var controller;
    var setController = function(newController) {
      if (newController !== controller) {
        if (controller) apres.undelegate(controller, doc.documentElement);
        apres.pubsub.publishSync(topic.replaceController, 
          {oldController: controller, newController: newController});
        controller = newController || undefined;
        apres.$(doc).ready(function() {
          if (controller) {
            apres.delegate(controller, doc.documentElement);
            apres.findWidgets();
            if (typeof controller.ready === 'function') controller.ready(apres.queryParams);
          } else {
            apres.findWidgets();
          }
        });
      }
    }

    // Get or set the controller for the view When setting a new controller,
    // it's `ready()` method will be called when the DOM is ready, or
    // immediately if it is already. Then any event mappings it declares will
    // be bound.  Event mappings for the previous controller, if any, will be
    // unbound first. If the controller being set is the same as the current
    // view controller, this is a no-op.
    //
    // @newController a controller object, or the name of a module that
    // returns a controller object.
    //
    // @callback is an optional callback function with the signature
    // `callback(err, controller)`. When @newController is a module name, this
    // function will be called when the controller is installed, or an error
    // occurs. 
    //
    apres.controller = function(newController, callback) {
      if (typeof newController === 'undefined') {
        return controller;
      } else if (typeof newController === 'string' && newController) {
        apres.controllerName = newController;
        require([newController], 
          function(controller) {
            try {
              setController(controller);
            } catch (err) {
              if (callback) {callback(err)} else {throw err}
            }
            if (callback) callback(null, controller);
          },
          callback
        );
      } else {
        apres.controllerName = undefined;
        setController(newController);
      }
    }

    apres.initialize = function(document) {
      var controllerName;
      doc = document;
      apres.queryParams = querystring.parse(doc.location.search.slice(1));
      if (doc.documentElement) {
        controllerName = doc.documentElement.getAttribute('data-apres-controller');
      }
      apres.controller(controllerName || null);
    }
    if (typeof document !== 'undefined') {
      // Bootstrap the current document
      apres.initialize(document);
    }
    return apres;
  }
);

// bind shim for js < 1.8.5 from
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }
    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments)));
      };
    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();
    return fBound;
  };
}

// Object.create shim for js < 1.8.5 from
// https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/create
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}

