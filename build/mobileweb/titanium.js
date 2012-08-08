/**
 * WARNING: this is generated code and will be lost if changes are made.
 * This generated source code is Copyright (c) 2010-2012 by Appcelerator, Inc. All Rights Reserved.
 */

var require = {
	app: {
		analytics: true,
		copyright: "2012 by Mike Fogg",
		deployType: "development",
		description: "This is a test app trying to replicate facebooks static navbar setup.",
		guid: "6c737d4c-2bc0-44ee-8545-75f92bb55579",
		id: "FacebookNavBarViewExample",
		name: "FacebookNavBarViewExample",
		names: {},
		publisher: "mfogg",
		url: "http://",
		version: "1.0"
	},
	has: {
		"declare-property-methods": true,
		"js-btoa": function(g) {
			return "btoa" in g;
		},
		"json-stringify": function(g) {
			return ("JSON" in g) && typeof JSON.stringify === "function" && JSON.stringify({a:0}, function(k,v){return v||1;}) === '{"a":1}';
		},
		"native-localstorage": function(g) {
			return "localStorage" in g && "setItem" in localStorage;
		},
		"object-defineproperty": function() {
			return (function (odp, obj) {
				try {
					odp && odp(obj, "x", {});
					return obj.hasOwnProperty("x");
				} catch (e) {}
			}(Object.defineProperty, {}));
		},
		"opera": typeof opera === "undefined" || opera.toString() != "[object Opera]",
		"ti-analytics-use-xhr": false,
		"ti-show-errors": true
	},
	locales: [],
	packages: [{"location": "./titanium", "main": "./Ti", "name": "Ti"}],
	project: {
		id: "com.example.facebookNavViews",
		name: "FacebookNavBarViewExample"
	},
	ti: {
		buildHash: "2ff31a3",
		buildDate: "05/30/12 10:21",
		filesystem: {
			registry: "ondemand"
		},
		theme: "default",
		version: "2.0.2.GA"
	},
	vendorPrefixes: {
		css: ["", "-webkit-", "-moz-", "-ms-", "-o-", "-khtml-"],
		dom: ["", "Webkit", "Moz", "ms", "O", "Khtml"]
	}
};/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 *
 * require.js
 * Copyright (c) 2010-2011, The Dojo Foundation
 * New BSD License / MIT License
 * <http://requirejs.org>
 * 
 * curl.js
 * Copyright (c) 2011 unscriptable.com / John Hann
 * MIT License
 * <https://github.com/unscriptable/curl>
 */

(function(global) {

	"use strict";

	var // misc variables
		x,
		odp,
		doc = global.document,
		el = doc.createElement("div"),

		// cached useful regexes
		commentRegExp = /(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg,
		cjsRequireRegExp = /[^.]require\(\s*["']([^'"\s]+)["']\s*\)/g,
		reservedModuleIdsRegExp = /exports|module/,
		pluginRegExp = /^(.+?)\!(.*)$/,
		notModuleRegExp = /(^\/)|(\:)|(\.js$)/,
		relativeRegExp = /^\./,
		packageNameRegExp = /([^\/]+)\/?(.*)/,
		urlRegExp = /^url\:(.+)/,

		// the global config settings
		cfg = global.require || {},

		// shortened packagePaths variable
		pp = cfg.packagePaths || {},

		// the number of seconds to wait for a script to load before timing out
		waitSeconds = (cfg.waitSeconds || 7) * 1000,

		baseUrl = cfg.baseUrl || "./",

		// CommonJS paths
		paths = cfg.paths || {},

		// feature detection results initialize by pre-calculated tests
		hasCache = cfg.hasCache || {},

		// a queue of module definitions to evaluate once a module has loaded
		defQ = [],

		// map of module ids to functions containing an entire module, which could
		// include multiple defines. when a dependency is not defined, the loader
		// will check the cache to see if it exists first before fetching from the
		// server. this is used when the build system bundles modules into the
		// minified javascript files.
		defCache = {},

		// map of package names to package resource definitions
		packages = {},

		// map of module ids to module resource definitions that are being loaded and processed
		waiting = {},

		// map of module ids to module resource definitions
		modules = {},

		// mixin of common functions
		fnMixin;

	/******************************************************************************
	 * Utility functions
	 *****************************************************************************/

	function _mix(dest, src) {
		for (var p in src) {
			src.hasOwnProperty(p) && (dest[p] = src[p]);
		}
		return dest;
	}

	function mix(dest) {
		// summary:
		//		Copies properties by reference from a source object to a destination
		//		object, then returns the destination object. To be clear, this will
		//		modify the dest being passed in.
		var i = 1;
		dest || (dest = {});
		while (i < arguments.length) {
			_mix(dest, arguments[i++]);
		}
		return dest;
	}

	function each(a, fn) {
		// summary:
		//		Loops through each element of an array and passes it to a callback
		//		function.
		var i = 0,
			l = (a && a.length) || 0,
			args = Array.prototype.slice.call(arguments, 0);
		args.shift();
		while (i < l) {
			args[0] = a[i++];
			fn.apply(null, args);
		}
	}

	function is(it, type) {
		// summary:
		//		Tests if "it" is a specific "type". If type is omitted, then
		//		it will return the type.
		//
		// returns:
		//		Boolean if type is passed in
		//		String of type if type is not passed in
		var t = it === void 0 ? "" : ({}).toString.call(it),
			m = t.match(/^\[object (.+)\]$/),
			v = m ? m[1] : "Undefined";
		return type ? type === v : v;
	}
	
	function isEmpty(it) {
		// summary:
		//		Checks if an object is empty.
		var p;
		for (p in it) {
			break;
		}
		return !it || (!it.call && !p);
	}

	function evaluate(code, sandboxVariables, globally) {
		// summary:
		//		Evaluates code globally or in a sandbox.
		//
		// code: String
		//		The code to evaluate
		//
		// sandboxVariables: Object?
		//		When "globally" is false, an object of names => values to initialize in
		//		the sandbox. The variable names must NOT contain '-' characters.
		//
		// globally: Boolean?
		//		When true, evaluates the code in the global namespace, generally "window".
		//		If false, then it will evaluate the code in a sandbox.

		var i,
			vars = [],
			vals = [],
			r;

		if (globally) {
			r = global.eval(code);
		} else {
			for (i in sandboxVariables) {
				vars.push(i + "=__vars." + i);
				vals.push(i + ":" + i);
			}
			r = (new Function("__vars", (vars.length ? "var " + vars.join(',') + ";\n" : "") + code + "\n;return {" + vals.join(',') + "};"))(sandboxVariables);
		}

		// if the last line of a module is a console.*() call, Firebug for some reason
		// sometimes returns "_firebugIgnore" instead of undefined or null
		return r === "_firebugIgnore" ? null : r;
	}

	function compactPath(path) {
		var result = [],
			segment,
			lastSegment;
		path = path.replace(/\\/g, '/').split('/');
		while (path.length) {
			segment = path.shift();
			if (segment === ".." && result.length && lastSegment !== "..") {
				result.pop();
				lastSegment = result[result.length - 1];
			} else if (segment !== ".") {
				result.push(lastSegment = segment);
			}
		}
		return result.join("/");
	}

	/******************************************************************************
	 * has() feature detection
	 *****************************************************************************/

	function has(name) {
		// summary:
		//		Determines of a specific feature is supported.
		//
		// name: String
		//		The name of the test.
		//
		// returns: Boolean (truthy/falsey)
		//		Whether or not the feature has been detected.

		if (is(hasCache[name], "Function")) {
			hasCache[name] = hasCache[name](global, doc, el);
		}
		return hasCache[name];
	}

	has.add = function(name, test, now, force){
		// summary:
		//		Adds a feature test.
		//
		// name: String
		//		The name of the test.
		//
		// test: Function
		//		The function that tests for a feature.
		//
		// now: Boolean?
		//		If true, runs the test immediately.
		//
		// force: Boolean?
		//		If true, forces the test to override an existing test.

		if (hasCache[name] === void 0 || force) {
			hasCache[name] = test;
		}
		return now && has(name);
	};

	/******************************************************************************
	 * Event handling
	 *****************************************************************************/

	function on(target, type, context, listener) {
		// summary:
		//		Connects a listener to an event on the specified target.
		//
		// target: Object|DomNode
		//		The target to add the event listener to.
		//
		// type: String
		//		The event to listen for.
		//
		// context: Object|Function
		//		When listener is defined, the context is the scope in which the listener
		//		is executed.
		//
		// listener: Function?|String?
		//		Optional. When present, the context is used as the scope.
		//
		// example:
		//		Attaching to a click event:
		//		|	on(myButton, "click", function() {
		//		|		alert("Howdy!");
		//		|	});
		//
		// example:
		//		Attaching to a click event within a declared class method:
		//		|	...
		//		|	constructor: function() {
		//		|		require.on(myButton, "click", this, "onButtonClick");
		//		|	},
		//		|	onButtonClick: function() {
		//		|		alert("Howdy from " + this.declaredClass + "!");
		//		|	}
		//		|	...
		//
		// example:
		//		Attaching to a click event with an anonymous function in a declared class:
		//		|	...
		//		|	constructor: function() {
		//		|		require.on(myButton, "click", this, function() {
		//		|			alert("Howdy from " + this.declaredClass + "!");
		//		|		});
		//		|	}
		//		|	...

		var cb = is(listener, "Function") ? function() {
			return listener.apply(context, arguments);
		} : is(listener, "String") ? function() {
			return context[listener].apply(context, arguments);
		} : context;

		target.addEventListener(type, cb, false);
		return function() {
			target.removeEventListener(type, cb, false);
		};
	}

	on.once = function(target, type, listener) {
		var h = on(target, type, function() {
			h && h(); // do the disconnect
			return listener.apply(this, arguments);
		});
		return h;
	};

	/******************************************************************************
	 * Configuration processing
	 *****************************************************************************/

	// make sure baseUrl ends with a slash
	if (!/\/$/.test(baseUrl)) {
		baseUrl += "/";
	}

	function configPackage(/*String|Object*/pkg, /*String?*/dir) {
		// summary:
		//		An internal helper function to configure a package and add it to the array
		//		of packages.
		//
		// pkg: String|Object
		//		The name of the package (if a string) or an object containing at a minimum
		//		the package's name, but possibly also the package's location and main
		//		source file
		//
		// dir: String?
		//		Optional. A base URL to prepend to the package location

		pkg = pkg.name ? pkg : { name: pkg };
		pkg.location = (/(^\/)|(\:)/.test(dir) ? dir : "") + (pkg.location || pkg.name);
		pkg.main = (pkg.main || "main").replace(/(^\.\/)|(\.js$)/, "");
		packages[pkg.name] = pkg;
	}

	// first init all packages from the config
	each(cfg.packages, configPackage);

	// second init all package paths and their packages from the config
	for (x in pp) {
		each(pp[x], configPackage, x + "/");
	}

	// run all feature detection tests
	for (x in cfg.has) {
		has.add(x, cfg.has[x], 0, true);
	}

	/******************************************************************************
	 * Module functionality
	 *****************************************************************************/

	function ResourceDef(name, refModule, deps, rawDef) {
		// summary:
		//		A resource definition that describes a file or module being loaded.
		//
		// description:
		//		A resource is anything that is "required" such as applications calling
		//		require() or a define() with dependencies.
		//
		//		This loader supports resources that define multiple modules, hence this
		//		object.
		//
		//		In addition, this object tracks the state of the resource (loaded,
		//		executed, etc) as well as loads a resource and executes the defintions.
		//
		// name: String
		//		The module id.
		//
		// deps: Array?
		//		An array of dependencies.
		//
		// rawDef: Object? | Function? | String?
		//		The object, function, or string that defines the resource.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.

		var match = name && name.match(pluginRegExp),
			isRelative = relativeRegExp.test(name),
			notModule = notModuleRegExp.test(name),
			exports = {},
			pkg = null,
			cjs,
			i,
			len,
			m,
			p,
			url = baseUrl,
			_t = this;

		// name could be:
		//  - a plugin		text!/some/file.html or include!/some/file.js
		//  - a module		some/module, ../some/module
		//  - a js file		/some/file.js
		//  - a url			http://www.google.com/

		_t.name = name;
		_t.deps = deps || [];
		_t.plugin = null;
		_t.callbacks = [];

		if (!match && (notModule || (isRelative && !refModule))) {
			_t.url = name;
		} else {
			if (match) {
				_t.plugin = _t.deps.length;
				_t.pluginArgs = match[2];
				_t.pluginCfg = cfg[match[1]];
				_t.deps.push(match[1]);
			} else if (name) {
				name = _t.name = compactPath((isRelative ? refModule.name + "/../" : "") + name);

				if (relativeRegExp.test(name)) {
					throw new Error("Irrational path \"" + name + "\"");
				}

				if (match = name.match(packageNameRegExp)) {
					for (i = 0, len = cfg.packages.length, m = match[1]; i < len; i++) {
						p = cfg.packages[i];
						if (p.name === m) {
							pkg = m;
							/\/$/.test(i = p.location) || (i += '/');
							url += compactPath(i + (match[2] ? name : p.main));
							break;
						}
					}
				}

				// MUST set pkg to anything other than null, even if this module isn't in a package
				if (!pkg || (!match && notModule)) {
					pkg = "";
					url += name;
				}

				_t.url = url + ".js";
			}
		}

		_t.pkg = pkg;
		_t.rawDef = rawDef;
		_t.loaded = !!rawDef;
		_t.refModule = refModule;

		// our scoped require()
		function scopedRequire() {
			var args = Array.prototype.slice.call(arguments, 0);
			args.length > 1 || (args[1] = 0);
			args[2] = _t;
			return req.apply(null, args);
		}
		scopedRequire.toUrl = function() {
			var args = Array.prototype.slice.call(arguments, 0);
			_t.plugin === null && (args[1] = _t);
			return toUrl.apply(null, args);
		};
		mix(scopedRequire, fnMixin, {
			cache: req.cache
		});

		_t.cjs = {
			require: scopedRequire,
			exports: exports,
			module: {
				exports: exports
			}
		};
	}

	ResourceDef.prototype.load = function(sync, callback) {
		// summary:
		//		Retreives a remote script and inject it either by XHR (sync) or attaching
		//		a script tag to the DOM (async).
		//
		// sync: Boolean
		//		If true, uses XHR, otherwise uses a script tag.
		//
		// callback: Function?
		//		A function to call when sync is false and the script tag loads.

		var s,
			x,
			scriptTagLoadEvent,
			scriptTagErrorEvent,
			_t = this,
			name = _t.name,
			cached = defCache[name];

		function fireCallbacks() {
			each(_t.callbacks, function(c) { c(_t); });
			_t.callbacks = [];
		}

		function onLoad(rawDef) {
			_t.loaded = 1;
			if (_t.rawDef = rawDef) {
				if (is(rawDef, "String")) {
					// if rawDef is a string, then it's either a cached string or xhr response
					if (/\.js$/.test(_t.url)) {
						rawDef = evaluate(rawDef, _t.cjs);
						_t.def = _t.rawDef = !isEmpty(rawDef.exports) ? rawDef.exports : (rawDef.module && !isEmpty(rawDef.module.exports) ? rawDef.module.exports : null);
						_t.def === null && (_t.rawDef = rawDef);
					} else {
						_t.def = rawDef;
						_t.executed = 1;
					}
				} else if (is(rawDef, "Function")) {
					// if rawDef is a function, then it's a cached module definition
					waiting[name] = _t;
					rawDef();
				}
			}
			processDefQ(_t);
			fireCallbacks();
			return 1;
		}

		_t.sync = sync;
		callback && _t.callbacks.push(callback);

		// if we don't have a url, then I suppose we're loaded
		if (_t.executed || !_t.url) {
			_t.loaded = 1;
			fireCallbacks();
			return;
		}

		// if we're already waiting, then we can just return and our callback will be fired
		if (waiting[name]) {
			return;
		}

		// if we're already loaded or the definition has been cached, then just return now
		if (_t.loaded || cached) {
			delete defCache[name];
			return onLoad(cached);
		}

		// mark this module as waiting to be loaded so that anonymous modules can be
		// identified
		waiting[name] = _t;

		function disconnect() {
			scriptTagLoadEvent && scriptTagLoadEvent();
			scriptTagErrorEvent && scriptTagErrorEvent();
		}

		function failed() {
			modules[name] = 0;
			delete waiting[name];
			disconnect();
		}

		if (sync) {
			x = new XMLHttpRequest();
			x.open("GET", _t.url, false);
			x.send(null);

			if (x.status === 200) {
				return onLoad(x.responseText);
			} else {
				failed();
				throw new Error("Failed to load module \"" + name + "\": " + x.status);
			}
		} else {
			// insert the script tag, attach onload, wait
			x = _t.node = doc.createElement("script");
			x.type = "text/javascript";
			x.charset = "utf-8";
			x.async = true;

			scriptTagLoadEvent = on(x, "load", function(e) {
				e = e || global.event;
				var node = e.target || e.srcElement;
				if (e.type === "load" || /complete|loaded/.test(node.readyState)) {
					disconnect();
					onLoad();
				}
			});

			scriptTagErrorEvent = on(x, "error", failed);

			// set the source url last
			x.src = _t.url;

			s = doc.getElementsByTagName("script")[0];
			s.parentNode.insertBefore(x, s);
		}
	};

	ResourceDef.prototype.execute = function(callback) {
		// summary:
		//		Executes the resource's rawDef which defines the module.
		//
		// callback: Function?
		//		A function to call after the module has been executed.

		var _t = this;

		if (_t.executed) {
			callback && callback();
			return;
		}

		// first need to make sure we have all the deps loaded
		fetch(_t, function(deps) {
			var i,
				p,
				r = _t.rawDef,
				q = defQ.slice(0), // backup the defQ
				finish = function() {
					_t.executed = 1;
					callback && callback();
				};

			// need to wipe out the defQ
			defQ = [];

			_t.def = _t.def
				||	(r && (is(r, "String")
						? evaluate(r, _t.cjs)
						: is(r, "Function")
							? r.apply(null, deps)
							: is(r, "Object")
								?	(function(obj, vars) {
										for (var i in vars) {
											this[i] = vars[i];
										}
										return obj;
									}).call({}, r, _t.cjs)
								: null
						)
					)
				|| _t.cjs.module.exports || _t.cjs.exports;

			// we might have just executed code above that could have caused a couple
			// define()'s to queue up
			processDefQ(_t);

			// restore the defQ
			defQ = q;

			// if plugin is not null, then it's the index in the deps array of the plugin
			// to invoke
			if (_t.plugin !== null) {
				p = deps[_t.plugin];

				// the plugin's content is dynamic, so just remove from the module cache
				if (p.dynamic) {
					delete modules[_t.name];
				}

				// if the plugin has a load function, then invoke it!
				p.load && p.load(_t.pluginArgs, _t.cjs.require, function(v) {
					_t.def = v;
					finish();
				}, _t.pluginCfg);
			}

			(p && p.load) || finish();
		}, _t.refModule, _t.sync);
	};

	function getResourceDef(name, refModule, deps, rawDef, dontCache, overrideCache) {
		// summary:
		//		Creates a new resource definition or returns an existing one from cache.

		var module = new ResourceDef(name, refModule, deps, rawDef),
			moduleName = module.name;

		if (refModule && refModule.cjs && name in refModule.cjs) {
			module.def = refModule.cjs[name];
			module.loaded = module.executed = 1;
			return module;
		}

		return dontCache || !moduleName ? module : (!modules[moduleName] || !modules[moduleName].executed || overrideCache ? (modules[moduleName] = module) : modules[moduleName]);
	}

	function processDefQ(module) {
		// summary:
		//		Executes all modules sitting in the define queue.
		//
		// description:
		//		When a resource is loaded, the remote AMD resource is fetched, it's
		//		possible that one of the define() calls was anonymous, so it should
		//		be sitting in the defQ waiting to be executed.

		var m,
			q = defQ.slice(0);
		defQ = [];

		while (q.length) {
			m = q.shift();

			// if the module is anonymous, assume this module's name
			m.name || (m.name = module.name);

			// if the module is this module, then modify this 
			if (m.name === module.name) {
				modules[m.name] = module;
				module.deps = m.deps;
				module.rawDef = m.rawDef;
				module.refModule = m.refModule;
				module.execute();
			} else {
				modules[m.name] = m;
				m.execute();
			}
		}

		delete waiting[module.name];
	}

	function fetch(deps, callback, refModule, sync) {
		// summary:
		//		Fetches all dependents and fires callback when finished or on error.
		//
		// description:
		//		The fetch() function will fetch each of the dependents either
		//		synchronously or asynchronously (default).
		//
		// deps: String | Array | Object
		//		A string or array of module ids to load or a resource definition.
		//
		// callback: Function?
		//		A callback function fired once the loader successfully loads and evaluates
		//		all dependent modules. The function is passed an ordered array of
		//		dependent module definitions.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.
		//
		// sync: Boolean?
		//		Forces the async path to be sync.
		//
		// returns: Object | Function
		//		If deps is a string, then it returns the corresponding module definition,
		//		otherwise the require() function.

		var i,
			l,
			count,
			type = is(deps),
			s = type === "String";

		if (type === "Object") {
			refModule = deps;
			deps = refModule.deps;
		}

		if (s) {
			deps = [deps];
			sync = 1;
		}

		for (i = 0, l = count = deps.length; i < l; i++) {
			deps[i] && (function(idx) {
				getResourceDef(deps[idx], refModule).load(!!sync, function(m) {
					m.execute(function() {
						deps[idx] = m.def;
						if (--count === 0) {
							callback(deps);
							count = -1; // prevent success from being called the 2nd time below
						}
					});
				});
			}(i));
		}

		count === 0 && callback(deps);
		return s ? deps[0] : deps;
	}

	function def(name, deps, rawDef) {
		// summary:
		//		Used to define a module and it's dependencies.
		//
		// description:
		//		Defines a module. If the module has any dependencies, the loader will
		//		resolve them before evaluating the module.
		//
		//		If any of the dependencies fail to load or the module definition causes
		//		an error, the entire definition is aborted.
		//
		// name: String|Array?
		//		Optional. The module name (if a string) or array of module IDs (if an array) of the module being defined.
		//
		// deps: Array?
		//		Optional. An array of module IDs that the rawDef being defined requires.
		//
		// rawDef: Object|Function
		//		An object or function that returns an object defining the module.
		//
		// example:
		//		Anonymous module, no deps, object definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the module definition
		//		is immediately defined.
		//
		//		|	define({
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Anonymous module, no deps, rawDef definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define(function(require, exports, module) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Named module, no deps, object definition.
		//
		//		Since no deps, the module definition is immediately defined.
		//
		//		|	define("arithmetic", {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Named module, no deps, rawDef definition.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define("arithmetic", function(require, exports, module) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Anonymous module, two deps, object definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the loader will load the two
		//		dependencies, then once the dependencies are loaded, it will evaluate a
		//		function wrapper around the module definition.
		//
		//		|	define(["dep1", "dep2"], {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Anonymous module, two deps, function definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the loader will load the two
		//		dependencies, then once the dependencies are loaded, it will evaluate
		//		the rawDef function.
		//
		//		|	define(["dep1", "dep2"], function(dep1, dep2) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Name module, two deps, object definition.
		//
		//		After the two dependencies are loaded, the loader will evaluate a
		//		function wrapper around the module definition.
		//
		//		|	define("arithmetic", ["dep1", "dep2"], {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Name module, two deps, function definition.
		//
		//		After the two dependencies are loaded, the loader will evaluate the
		//		function rawDef.
		//
		//		|	define("arithmetic", ["dep1", "dep2"], function(dep1, dep2) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});

		var i = ["require"],
			module;

		if (!rawDef) {
			rawDef = deps || name;
			rawDef.length === 1 || (i = i.concat(["exports", "module"]));
			if (typeof name !== "string") {
				deps = deps ? name : i;
				name = 0;
			} else {
				deps = i;
			}
		}

		if (reservedModuleIdsRegExp.test(name)) {
			throw new Error("Not allowed to define reserved module id \"" + name + "\"");
		}

		if (is(rawDef, "Function") && arguments.length === 1) {
			// treat rawDef as CommonJS definition and scan for any requires and add
			// them to the dependencies so that they can be loaded and passed in.
			rawDef.toString()
				.replace(commentRegExp, "")
				.replace(cjsRequireRegExp, function(match, dep) {
					deps.push(dep);
				});
		}

		module = getResourceDef(name, 0, deps, rawDef, 0, 1);

		// if not waiting for this module to be loaded, then the define() call was
		// possibly inline or deferred, so try fulfill dependencies, and define the
		// module right now.
		if (name && !waiting[name]) {
			module.execute();

		// otherwise we are definitely waiting for a script to load, eventhough we
		// may not know the name, we'll know when the script's onload fires.
		} else if (name || !isEmpty(waiting)) {
			defQ.push(module);

		// finally, we we're ask to define something without a name and there's no
		// scripts pending, so there's no way to know what the name is. :(
		} else {
			throw new Error("Unable to define anonymous module");
		}
	}

	// set the "amd" property and advertise supported features
	def.amd = {
		plugins: true,
		vendor: "titanium"
	};

	function toUrl(name, refModule) {
		// summary:
		//		Converts a module name including extension to a URL path.
		//
		// name: String
		//		The module name including extension.
		//
		// returns: String
		//		The fully resolved URL.
		//
		// example:
		//		Returns the URL for a HTML template file.
		//		|	define(function(require) {
		//		|		var templatePath = require.toUrl("./templates/example.html");
		//		|	});

		var	match = name.match(/(.+)(\.[^\/\.]+?)$/),
			module = getResourceDef((match && match[1]) || name, refModule, 0, 0, 1),
			url = module.url;

		module.pkg !== null && (url = url.substring(0, url.length - 3));
		return url + ((match && match[2]) || "");
	}

	function req(deps, callback, refModule) {
		// summary:
		//		Fetches a module, caches its definition, and returns the module. If an
		//		array of modules is specified, then after all of them have been
		//		asynchronously loaded, an optional callback is fired.
		//
		// deps: String | Array
		//		A string or array of strings containing valid module identifiers.
		//
		// callback: Function?
		//		Optional. A function that is fired after all dependencies have been
		//		loaded. Only applicable if deps is an array.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.
		//
		// returns: Object | Function
		//		If calling with a string, it will return the corresponding module
		//		definition.
		//
		//		If calling with an array of dependencies and a callback function, the
		//		require() function returns itself.
		//
		// example:
		//		Synchronous call.
		//		|	require("arithmetic").sq(10); // returns 100
		//
		// example:
		//		Asynchronous call.
		//		|	require(["arithmetic", "convert"], function(arithmetic, convert) {
		//		|		convert(arithmetic.sq(10), "fahrenheit", "celsius"); // returns 37.777
		//		|	});

		return fetch(deps, function(deps) {
			callback && callback.apply(null, deps);
		}, refModule) || req;
	}

	req.toUrl = toUrl;
	mix(req, fnMixin = {
		config: cfg,
		each: each,
		evaluate: evaluate,
		has: has,
		is: is,
		mix: mix,
		on: on
	});

	req.cache = function(subject) {
		// summary:
		//		Copies module definitions into the definition cache.
		//
		// description:
		//		When running a build, the build will call this function and pass in an
		//		object with module id => function. Each function contains the contents
		//		of the module's file.
		//
		//		When a module is required, the loader will first see if the module has
		//		already been defined.  If not, it will then check this cache and execute
		//		the module definition.  Modules not defined or cached will be fetched
		//		remotely.
		//
		// subject: String | Object
		//		When a string, returns the cached object or undefined otherwise an object
		//		with module id => function where each function wraps a module.
		//
		// example:
		//		This shows what build system would generate. You should not need to do this.
		//		|	require.cache({
		//		|		"arithmetic": function() {
		//		|			define(["dep1", "dep2"], function(dep1, dep2) {
		//		|				var api = { sq: function(x) { return x * x; } };
		//		|			});
		//		|		},
		//		|		"my/favorite": function() {
		//		|			define({
		//		|				color: "red",
		//		|				food: "pizza"
		//		|			});
		//		|		}
		//		|	});
		var p, m;
		if (is(subject, "String")) {
			return defCache[subject];
		} else {
			for (p in subject) {
				m = p.match(urlRegExp);
				if (m) {
					defCache[toUrl(m[1])] = subject[p];
				} else {
					m = getResourceDef(p, 0, 0, subject[p], 1);
					defCache[m.name] = m.rawDef;
				}
			}
		}
	};

	// expose require() and define() to the global namespace
	global.require = req;
	global.define = def;

}(window));require.cache({
"Ti/Codec":function(){
/* /titanium/Ti/Codec.js */

define(["Ti/_/declare", "Ti/_/lang", "Ti/_/Evented"], function(declare, lang, Evented) {

	var Codec;

	function paramError(msg) {
		throw new Error("Missing " + msg + " argument");
	}

	function parse(type, value) {
		return type === Codec.TYPE_DOUBLE || type === Codec.TYPE_FLOAT ? parseFloat(value) : parseInt(value);
	}

	return Codec = lang.setObject("Ti.Codec", Evented, {

		decodeNumber: function(args) {
			(!args || !args.source) && paramError("source");
			args.type || paramError("type");
			return parse(args.type, args.source.buffer);
		},

		decodeString: function(args) {
			(!args || !args.source) && paramError("source");
			var b = args.source.buffer || "",
				p = args.position | 0,
				l = args.length;
			return b.substring(p, l && p + l);
		},

		encodeNumber: function(args) {
			(!args || !args.source) && paramError("source");
			args.dest || paramError("dest");
			args.type || paramError("type");
			return dest.append(new (require("Ti/Buffer"))({ buffer: ""+parse(args.type, args.source.buffer) }));
		},

		encodeString: function(args) {
			(!args || !args.source) && paramError("source");
			args.dest || paramError("dest");
			var b = args.source.buffer || "",
				p = args.destPosition | 0;
			b = new (require("Ti/Buffer"))({ buffer: b.substring(args.sourcePosition | 0, args.sourceLength || b.length) });
			return p ? dest.insert(b, p) : dest.append(b);
		},

		getNativeByteOrder: function() {
			return this.LITTLE_ENDIAN;
		},

		constants: {
			BIG_ENDIAN: 2,
			CHARSET_ASCII: "ascii",
			CHARSET_ISO_LATIN_1: "ios-latin-1",
			CHARSET_UTF16: "utf16",
			CHARSET_UTF16BE: "utf16be",
			CHARSET_UTF16LE: "utf16le",
			CHARSET_UTF8: "utf8",
			LITTLE_ENDIAN: 1,
			TYPE_BYTE: "byte",
			TYPE_DOUBLE: "double",
			TYPE_FLOAT: "float",
			TYPE_INT: "int",
			TYPE_LONG: "long",
			TYPE_SHORT: "short"
		}

	});

});
},
"Ti/UI/EmailDialog":function(){
/* /titanium/Ti/UI/EmailDialog.js */

define(["Ti/_", "Ti/_/declare", "Ti/_/Evented", "Ti/_/lang"],
	function(_, declare, Evented, lang) {

	return declare("Ti.UI.EmailDialog", Evented, {

		open: function() {
			var r = this.toRecipients || [],
				url = "mailto:" + r.join(","),
				i, j,
				fields = {
					subject: "subject",
					ccRecipients: "cc",
					bccRecipients: "bcc",
					messageBody: "body"
				},
				params = {};

			for (i in fields) {
				if (j = this[i]) {
					require.is(j, "Array") && (j = j.join(","));
					params[fields[i]] = j;
				}
			}

			this.html || params.body && (params.body = _.escapeHtmlEntities(params.body));
			params = lang.urlEncode(params);

			location.href = url + (params ? "?" + params : "");

			this.fireEvent("complete", {
				result: this.SENT,
				success: true
			});
		},
		
		isSupported: function() {
			return true;
		},

		constants: {
			CANCELLED: 0,
			FAILED: 3,
			SAVED: 1,
			SENT: 2
		},

		properties: {
		    bccRecipients: void 0,
		    ccRecipients: void 0,
		    html: false,
		    messageBody: void 0,
		    subject: void 0,
		    toRecipients: void 0
		}

	});

});

},
"Ti/UI/PickerRow":function(){
/* /titanium/Ti/UI/PickerRow.js */

define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/UI"],
	function(declare, FontWidget, UI) {

	return declare("Ti.UI.PickerRow", FontWidget, {
		
		constructor: function() {
			this._addStyleableDomNode(this.domNode);
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		properties: {
			title: {
				post: function() {
					this._parentColumn && this._parentColumn._updateContentDimensions();
				}
			}
		}
		
	});
	
});
},
"Ti/UI/MobileWeb":function(){
/* /titanium/Ti/UI/MobileWeb.js */

define(["Ti/_/Evented", "Ti/_/lang", "Ti/UI/MobileWeb/NavigationGroup"],
	function(Evented, lang, NavigationGroup) {
	
	return lang.setObject("Ti.UI.MobileWeb", Evented, {
		createNavigationGroup: function(args) {
			return new NavigationGroup(args);
		}
	});
	
});
},
"Ti/UI/Switch":function(){
/* /titanium/Ti/UI/Switch.js */

define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, UI) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
        unitize = dom.unitize;

	return declare("Ti.UI.Switch", FontWidget, {

		constructor: function(args) {
			
			// This container holds the flex boxes used to position the elements
			this._contentContainer = dom.create("div", {
				className: "TiUISwitchContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "stretch",
					width: "100%",
					height: "100%"
				}
			}, this.domNode)
			
			// Create the text box and a flex box to align it
			this._titleContainer = dom.create("div", {
				className: "TiUISwitchTextAligner",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "center",
					boxFlex: 1
				}
			}, this._contentContainer);
			this._switchTitle = dom.create("div", {
				className: "TiUISwitchTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					textAlign: "center"
				}
			}, this._titleContainer);
			this._addStyleableDomNode(this._switchTitle);

			// Create the switch indicator and a flex box to contain it
			this._indicatorContainer = dom.create("div", {
				className: "TiUISwitchTextAligner",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxPack: "center",
					boxAlign: "center",
					marginTop: "3px"
				}
			}, this._contentContainer);
			this._switchIndicator = dom.create("div", {
				className: "TiUISwitchIndicator",
				style: {
					padding: "4px 4px",
					borderRadius: "4px",
					border: "1px solid #888",
					pointerEvents: "none",
					width: "40px"
				}
			}, this._indicatorContainer);
			this._switchIndicator.domNode += " TiUISwitchIndicator";
			
			// Set the default look
			this._setDefaultLook();
			var self = this;
			self.addEventListener("singletap",function(){
				self.value = !self.value;
			});
			
			this.value = false;
		},
		
		_updateLook: function() {
			if (this.backgroundColor || this.backgroundDisabledColor || this.backgroundDisabledImage || this.backgroundFocusedColor || 
				this.backgroundFocusedImage || this.backgroundImage || this.backgroundSelectedColor || this.backgroundSelectedImage) {
				this._clearDefaultLook();
			} else {
				this._setDefaultLook();
			}
			this._doBackground();
		},
		
		_setDefaultLook: function() {
			if (!this._hasDefaultLook) {
				this._hasDefaultLook = true;
				css.add(this.domNode, "TiUIElementGradient");
				this._previousBorderWidth = this.borderWidth;
				this._previousBorderColor = this.borderColor;
				this.borderWidth = 1;
				this.borderColor = "#666";
				setStyle(this.domNode, { 
					borderRadius: "6px",
					padding: "6px 6px"
				});
			}
		},
		
		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				var className = this.domNode.className;
				css.remove(this.domNode, "TiUIElementGradient");
				this.borderWidth = this._previousBorderWidth;
				this.borderColor = this._previousBorderColor;
				setStyle(this.domNode, { 
					borderRadius: "",
					padding: ""
				});
			}
		},
		
		_getContentSize: function(width, height) {
			var defaultLookOffset = (this._hasDefaultLook ? 12 : 0);
			return {
				width: Math.max(this._measureText(this._switchTitle.innerHTML, this._switchTitle).width, this._switchIndicator.offsetWidth) + defaultLookOffset,
				height: this._measureText(this._switchTitle.innerHTML, this._switchTitle).height + // Text height
						this._switchIndicator.offsetHeight + // Indicator height
						3 + // Padding between the indicator and text
						defaultLookOffset // Border of the default style
			};
		},
		
		_defaultWidth: UI.SIZE,
		
        _defaultHeight: UI.SIZE,

		properties: {
			
			// Override the default background info so we can hook into it
			backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,
			
			enabled: {
				set: function(value, oldValue) {
					
					if (value !== oldValue) {
						if (this._hasDefaultLook) {	
							if (!value) {
								css.remove(this.domNode,"TiUIElementGradient");
								setStyle(this.domNode,"backgroundColor","#aaa");
							} else {
								css.add(this.domNode,"TiUIElementGradient");
								setStyle(this.domNode,"backgroundColor","");
							}
						}
						this._setTouchEnabled(value);
					}
					return value;
				},
				value: true
			},
			
			textAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case UI.TEXT_VERTICAL_ALIGNMENT_TOP: cssValue = "start"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_CENTER: cssValue = "center"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: cssValue = "end"; break;
					}
					setStyle(this._titleContainer, "boxAlign", cssValue);
					return value;
				}
			},
			
			titleOff: {
				set: function(value) {
					if (!this.value) {
						this._switchTitle.innerHTML = value;
						this._hasSizeDimensions() && this._triggerLayout();
					}
					return value;
				},
				value: "Off"
			},
			
			titleOn: {
				set: function(value) {
					if (this.value) {
						this._switchTitle.innerHTML = value;
						this._hasSizeDimensions() && this._triggerLayout();
					}
					return value;
				},
				value: "On"
			},
			
            value: {
				set: function(value) {
					setStyle(this._switchIndicator,{
						backgroundColor: value ? "#0f0" : "#aaa"
					});
					value = !!value;
					this._switchTitle.innerHTML = value ? this.titleOn : this.titleOff;
					this._hasSizeDimensions() && this._triggerLayout();
					return value;
				},
				post: function() {
					this.fireEvent("change",{
						value: this.value
					});
				}
			},
			
			verticalAlign: {
				set: function(value) {
					var cssValue = "";
					switch(value) {
						case UI.TEXT_VERTICAL_ALIGNMENT_TOP: cssValue = "start"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_CENTER: cssValue = "center"; break;
						case UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM: cssValue = "end"; break;
					}
					setStyle(this._titleContainer, "boxPack", cssValue);
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}

		}

	});

});

},
"Ti/Platform/DisplayCaps":function(){
/* /titanium/Ti/Platform/DisplayCaps.js */

define(["Ti/_", "Ti/_/Evented", "Ti/_/lang"], function(_, Evented, lang) {

	var ua = navigator.userAgent.toLowerCase(),
		dc = lang.setObject("Ti.Platform.DisplayCaps", Evented, {
			constants: {
				density: function(){
					switch (ua) {
						case "iphone":
							return "medium";
						case "ipad":
							return "medium";
						default:
							return "";
					}
				},
	
				dpi: _.dpi,
	
				platformHeight: window.innerHeight,
	
				platformWidth: window.innerWidth
			}
		});

	return Ti.Platform.displayCaps = dc;

});
},
"Ti/UI/ImageView":function(){
/* /titanium/Ti/UI/ImageView.js */

define(["Ti/_/declare", "Ti/_/lang", "Ti/_/style", "Ti/_/UI/Widget", "Ti/UI"], 
	function(declare, lang, style, Widget, UI) {

	var setStyle = style.set,
		on = require.on,
		InternalImageView = declare(Widget, {

			domType: "img",
			onload: null,
			onerror: null,

			constructor: function() {
				this.domNode.ondragstart = function() { return false; }; // Prevent images from being dragged
			},

			_getContentSize: function() {
				return {
					width: this.domNode.width,
					height: this.domNode.height
				}
			},

			_doLayout: function(params) {
				// We have to remove the old style to get the image to scale to its default size,
				// otherwise we are just reading in whatever we set in the last doLayout(), which is
				// 0 if the image was not loaded...thus always clamping it to 0.
				this.domNode.style.width = "";
				this.domNode.style.height = "";
				
				var imageRatio = this.domNode.width / this.domNode.height,
					boundingHeight = params.boundingSize.height,
					boundingWidth = params.boundingSize.width,
					values = this.properties.__values__,
					isParentWidthSize = params.isParentSize.width,
					isParentHeightSize = params.isParentSize.height;

				function setByHeight() {
					values.width = boundingHeight * imageRatio;
					values.height = boundingHeight;
				}

				function setByWidth() {
					values.width = boundingWidth;
					values.height = boundingWidth / imageRatio;
				}

				if (!isParentWidthSize && !isParentHeightSize) {
					if (boundingWidth / boundingHeight > imageRatio) {
						setByHeight();
					} else {
						setByWidth();
					}
				} else if (!isParentWidthSize) {
					setByWidth();
				} else if (!isParentHeightSize) {
					setByHeight();
				} else {
					values.width = UI.SIZE;
					values.height = UI.SIZE;
				}

				return Widget.prototype._doLayout.call(this,params);
			},

			properties: {
				src: {
					set: function(value) {
						var node = this.domNode,
							disp = "none";
							onerror = lang.hitch(this, function(e) {
								this._triggerLayout();
								this.onerror && this.onerror(e);
							});

						if (value) {
							disp = "inherit";
							on(node, "load", this, function() {
								this.container._triggerLayout();
								this.onload && this.onload();
							});
							on(node, "error", onerror);
							on(node, "abort", onerror);
							node.src = require.cache(value) || value;
						}

						setStyle(node, "display", disp);
						return value;
					}
				}
			}
		});

	return declare("Ti.UI.ImageView", Widget, {

		_createImage: function(src, onload, onerror) {
			switch (src && src.declaredClass) {
				case "Ti.Filesystem.File":
					src = src.read();
				case "Ti.Blob":
					src = src.toString();
			}
			return new InternalImageView({
				onload: onload,
				onerror: onerror,
				src: src,
				container: this
			});
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,

		_slideshowCount: 0,

		_setSlideshowInterval: function() {
			var self = this,
				imgs = self._images;
			clearInterval(this._slideshowTimer);

			this._slideshowTimer = setInterval(function(){
				var rollover = false;

				setStyle(imgs[self._currentIndex].domNode, "display", "none");

				if (self.reverse) {
					if (--self._currentIndex === 0) {
						self._currentIndex = self.images.length - 1;
						rollover = true;
					}
				} else if (++self._currentIndex === self.images.length) {
					self._currentIndex = 0;
					rollover = true;
				}

				setStyle(imgs[self._currentIndex].domNode, "display", "inherit");

				if (self.repeatCount && rollover && ++self._slideshowCount === self.repeatCount) {
					self.stop();
					return;
				}

				self.fireEvent("change", {
					index: self._currentIndex
				});
			}, this.duration);
		},

		start: function(){
			if (this._images) {
				this._setState(1, 0);
				this._slideshowCount = 0;
				this._setSlideshowInterval();
				this.fireEvent("start");
			}
		},

		stop: function(){
			var imgs = this._images;
			if (imgs) {
				clearInterval(this._slideshowTimer);
				if (imgs.length) {
					var start = 0;
					this.reverse && (start = imgs.length - 1);
					this._currentIndex && setStyle(imgs[this._currentIndex].domNode, "display", "none");
					setStyle(imgs[start].domNode, "display", "inherit");
					this._currentIndex = start;
				}
				this._setState(0, 0);
				this.fireEvent("stop");
			}
		},

		pause: function(){
			if (this._images) {
				clearInterval(this._slideshowTimer);
				this._setState(1, 0);
				this.fireEvent("pause");
			}
		},

		resume: function() {
			if (this._images) {
				this._setSlideshowInterval();
				this._setState(0, 1);
			}
		},

		_setState: function(paused, animating) {
			this.constants.paused = !!paused;
			this.constants.animating = !!animating;
		},

		constants: {
			animating: false, 
			paused: false
		},

		properties: {
			duration: 30,

			image: {
				set: function(value) {
					this._removeAllChildren();
					this._images = void 0;
					this.add(this._createImage(value, function() {
						this.fireEvent("load", {
							state: "image"
						});
					}, function(e) {
						this.fireEvent("error", e);
					}));
					return value;
				}
			},

			images: {
				set: function(value) {
					var imgs = void 0,
						counter = 0,
						errored = 0;
					this._removeAllChildren();
					if (require.is(value, "Array")) {
						imgs = [];
						value.forEach(function(val) {
							var img = this._createImage(val, function() {
								!errored && ++counter === value.length && this.fireEvent("load", {
									state: "image"
								});
							}, function(e) {
								errored || (errored = 1) && this.fireEvent("error", e);
							});
							setStyle(img.domNode, "display", "none");
							imgs.push(img);
							this.add(img);
						}, this);
					}
					this._images = imgs;
					return value;
				},

				post: function() {
					this.stop();
				}
			},

			repeatCount: 0,

			reverse: false
		}

	});

});
},
"Ti/_/Gestures/TwoFingerTap":function(){
/* /titanium/Ti/_/Gestures/TwoFingerTap.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TwoFingerTap", GestureRecognizer, {
		
		name: "twofingertap",
		
		_touchStartLocation: null,
		_touchEndLocation: null,
		_fingerDifferenceThresholdTimer: null,
		
		// There are two possibilities: the user puts down two fingers at exactly the same time,
		// which is almost impossible, or they put one finger down first, followed by the second.
		// For the second case, we need ensure that the two taps were intended to be at the same time.
		// This value defines the maximum time difference before this is considered some other type of gesture.
		_fingerDifferenceThreshold: 100,
		
		// This is the amount of space the fingers are allowed drift until the gesture is no longer considered a two finger tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;
			
			// First finger down of the two, given a slight difference in contact time
			if (touchesLength == 1 && changedTouchesLength == 1) {
				this._touchStartLocation = [{
					x: x,
					y: y
				}];
				this._fingerDifferenceThresholdTimer = setTimeout(lang.hitch(this,function(){
					this._touchStartLocation = null;
				}),this._fingerDifferenceThreshold);
			
			// Second finger down of the two, given a slight difference in contact time
			} else if (touchesLength == 2 && changedTouchesLength == 1) {
				clearTimeout(this._fingerDifferenceThresholdTimer);
				if (this._touchStartLocation) {
					this._touchStartLocation.push({
						x: x,
						y: y
					});
				}
				
			// Two fingers down at the same time
			} else if (touchesLength == 2 && changedTouchesLength == 2) {
				this._touchStartLocation = [{
					x: x,
					y: y
				},
				{
					x: e.changedTouches[1].clientX,
					y: e.changedTouches[1].clientY
				}];
				
			// Something else, means it's not a two finger tap
			} else {
				this._touchStartLocation = null;
			}
		},
		
		processTouchEndEvent: function(e, element){
			
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;
			
			// One finger was lifted off, one remains
			if (touchesLength == 1 && changedTouchesLength == 1) {
				this._touchEndLocation = [{
					x: x,
					y: y
				}];
				this._fingerDifferenceThresholdTimer = setTimeout(lang.hitch(this,function(){
					this._touchStartLocation = null;
				}),this._fingerDifferenceThreshold);
				
			// Second or both fingers lifted off
			} else if (touchesLength == 0 && (changedTouchesLength == 1 || changedTouchesLength == 2)) {
				if (this._touchStartLocation && this._touchStartLocation.length === 2) {
					this._touchEndLocation || (this._touchEndLocation = []);
					for(var i = 0; i < changedTouchesLength; i++) {
						this._touchEndLocation.push({
							x: x,
							y: y
						});
					}
					if (this._touchEndLocation.length === 2) {
						var distance1OK = Math.abs(this._touchStartLocation[0].x - this._touchEndLocation[0].x) < this._driftThreshold && 
								Math.abs(this._touchStartLocation[0].y - this._touchEndLocation[0].y) < this._driftThreshold,
							distance2OK = Math.abs(this._touchStartLocation[1].x - this._touchEndLocation[1].x) < this._driftThreshold && 
								Math.abs(this._touchStartLocation[1].y - this._touchEndLocation[1].y) < this._driftThreshold;
						// Check if the end points are swapped from the start points
						if (!distance1OK || !distance2OK) {
							distance1OK = Math.abs(this._touchStartLocation[0].x - this._touchEndLocation[1].x) < this._driftThreshold && 
								Math.abs(this._touchStartLocation[0].y - this._touchEndLocation[1].y) < this._driftThreshold;
							distance2OK = Math.abs(this._touchStartLocation[1].x - this._touchEndLocation[0].x) < this._driftThreshold && 
								Math.abs(this._touchStartLocation[1].y - this._touchEndLocation[0].y) < this._driftThreshold;
						}
						if (distance1OK && distance2OK && !element._isGestureBlocked(this.name)) {
							this.blocking.push("singletap");
							this.blocking.push("doubletap");
							this.blocking.push("longpress");
							lang.hitch(element,element._handleTouchEvent(this.name,{
								x: (this._touchStartLocation[0].x + this._touchStartLocation[1].x) / 2,
								y: (this._touchStartLocation[0].y + this._touchStartLocation[1].y) / 2
							}));
						}
					}
					this._touchStartLocation = null;
				}
				
			// Something else, means it's not a two finger tap
			} else {
				this._touchStartLocation = null;
			}
			
			
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}
		
	});
	
});
},
"Ti/_/declare":function(){
/* /titanium/Ti/_/declare.js */

/**
 * declare() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/_/lang"], function(_, lang) {
	var is = require.is,
		mix = require.mix,
		counter = 0,
		classCounters = {};

	// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
	function c3mro(bases, className) {
		var result = [],
			roots = [ {cls: 0, refs: []} ],
			nameMap = {},
			clsCount = 1,
			l = bases.length,
			i = 0,
			j, lin, base, top, proto, rec, name, refs;

		// build a list of bases naming them if needed
		for (; i < l; ++i) {
			base = bases[i];
			if (!base) {
				throw new Error('Unknown base class for "' + className + '" [' + i + ']');
			} else if (is(base, "Object")) {
				base = bases[i] = makeFunction(base);
			} else if (!is(base, "Function")) {
				throw new Error('Base class not a function for "' + className + '" [' + i + ']');
			}
			lin = base._meta ? base._meta.bases : [base];
			top = 0;
			// add bases to the name map
			for (j = lin.length - 1; j >= 0; --j) {
				proto = lin[j].prototype;
				proto.hasOwnProperty("declaredClass") || (proto.declaredClass = "uniqName_" + (counter++));
				name = proto.declaredClass;
				if (!nameMap.hasOwnProperty(name)) {
					nameMap[name] = {count: 0, refs: [], cls: lin[j]};
					++clsCount;
				}
				rec = nameMap[name];
				if (top && top !== rec) {
					rec.refs.push(top);
					++top.count;
				}
				top = rec;
			}
			++top.count;
			roots[0].refs.push(top);
		}

		// remove classes without external references recursively
		while (roots.length) {
			top = roots.pop();
			result.push(top.cls);
			--clsCount;
			// optimization: follow a single-linked chain
			while (refs = top.refs, refs.length == 1) {
				top = refs[0];
				if (!top || --top.count) {
					// branch or end of chain => do not end to roots
					top = 0;
					break;
				}
				result.push(top.cls);
				--clsCount;
			}
			if (top) {
				// branch
				for (i = 0, l = refs.length; i < l; ++i) {
					top = refs[i];
					--top.count || roots.push(top);
				}
			}
		}

		if (clsCount) {
			throw new Error('Can\'t build consistent linearization for "' + className + '"');
		}

		// calculate the superclass offset
		base = bases[0];
		result[0] = base ?
			base._meta && base === result[result.length - base._meta.bases.length] ?
				base._meta.bases.length : 1 : 0;

		return result;
	}

	function makeConstructor(bases, ctorSpecial) {
		return function() {
			var a = arguments,
				args = a,
				a0 = a[0],
				f, i, m, p,
				l = bases.length,
				preArgs,
				dc = this.declaredClass;

			classCounters[dc] || (classCounters[dc] = 0);
			this.widgetId = dc + ":" + (classCounters[dc]++);

			// 1) call two types of the preamble
			if (ctorSpecial && (a0 && a0.preamble || this.preamble)) {
				// full blown ritual
				preArgs = new Array(bases.length);
				// prepare parameters
				preArgs[0] = a;
				for (i = 0;;) {
					// process the preamble of the 1st argument
					(a0 = a[0]) && (f = a0.preamble) && (a = f.apply(this, a) || a);
					// process the preamble of this class
					f = bases[i].prototype;
					f = f.hasOwnProperty("preamble") && f.preamble;
					f && (a = f.apply(this, a) || a);
					if (++i === l) {
						break;
					}
					preArgs[i] = a;
				}
			}

			// 2) call all non-trivial constructors using prepared arguments
			for (i = l - 1; i >= 0; --i) {
				f = bases[i];
				m = f._meta;
				if (m) {
					f = m.ctor;
					lang.mixProps(this, m.hidden);
				}
				is(f, "Function") && f.apply(this, preArgs ? preArgs[i] : a);
			}

			// 3) mixin args if any
			if (is(a0, "Object")) {
				f = this.constants;
				for (i in a0) {
					a0.hasOwnProperty(i) && ((f && i in f ? f.__values__ : this)[i] = a0[i]);
				}
			}

			// 4) continue the original ritual: call the postscript
			f = this.postscript;
			f && f.apply(this, args);
		};
	}

	function makeFunction(obj) {
		var fn = new Function;
		mix(fn.prototype, obj);
		fn._meta = {
			bases: [fn],
			hidden: obj
		};
		return fn;
	}

	function mixClass(dest, src) {
		for (var p in src) {
			if (src.hasOwnProperty(p) && !/^(constructor|properties|constants|__values__)$/.test(p)) {
				is(src[p], "Function") && (src[p].nom = name);
				dest[p] = src[p];
			}
		}
		return dest;
	}

	function declare(className, superclass, definition) {
		// summary:
		//		Creates an instantiable class object.
		//
		// className: String?
		//		Optional. The name of the class.
		//
		// superclass: null | Object | Array
		//		The base class or classes to extend.
		//
		// definition: Object
		//		The definition of the class.

		if (!is(className, "String")) {
			definition = superclass;
			superclass = className;
			className = "";
		}
		definition = definition || {};

		var bases = [definition.constructor],
			ctor,
			i,
			mixins = 1,
			proto = {},
			superclassType = is(superclass),
			t;

		// build the array of bases
		if (superclassType === "Array") {
			bases = c3mro(superclass, className);
			superclass = bases[mixins = bases.length - bases[0]];
		} else if (superclassType === "Function") {
			t = superclass._meta;
			bases = bases.concat(t ? t.bases : superclass);
		} else if (superclassType === "Object") {
			bases[1] = superclass = makeFunction(superclass);
		} else {
			superclass = 0;
		}

		// build the prototype chain
		if (superclass) {
			for (i = mixins - 1;; --i) {
				ctor = new Function;
				ctor.prototype = superclass.prototype;
				proto = new ctor;

				// stop if nothing to add (the last base)
				if (!i) {
					break;
				}

				// mix in properties
				t = bases[i];
				(t._meta ? mixClass : mix)(proto, t.prototype);

				// chain in new constructor
				ctor = new Function;
				ctor.superclass = superclass;
				ctor.prototype = proto;
				superclass = proto.constructor = ctor;
			}
		}

		// add all properties except constructor, properties, and constants
		mixClass(proto, definition);

		// if the definition is not an object, then we want to use its constructor
		t = definition.constructor;
		if (t !== Object.prototype.constructor) {
			t.nom = "constructor";
			proto.constructor = t;
		}

		// build the constructor and add meta information to the constructor
		mix(bases[0] = ctor = makeConstructor(bases, t), {
			_meta: {
				bases: bases,
				hidden: definition,
				ctor: definition.constructor
			},
			superclass: superclass && superclass.prototype,
			extend: function(src) {
				mixClass(this.prototype, src);
				return this;
			},
			prototype: proto
		});

		// add "standard" methods to the prototype
		mix(proto, {
			constructor: ctor,
			// TODO: need a nice way of accessing the super method without using arguments.callee
			// getInherited: function(name, args) {
			//	return is(name, "String") ? this.inherited(name, args, true) : this.inherited(name, true);
			// },
			// inherited: inherited,
			isInstanceOf: function(cls) {
				var bases = this.constructor._meta.bases,
					i = 0,
					l = bases.length;
				for (; i < l; ++i) {
					if (bases[i] === cls) {
						return true;
					}
				}
				return this instanceof cls;
			}
		});

		// add name if specified
		if (className) {
			proto.declaredClass = className;
			lang.setObject(className, ctor);
		}

		return ctor;
	}

	return _.declare = declare;
});
},
"Ti/_/include":function(){
/* /titanium/Ti/_/include.js */

define(function() {
	var cache = {},
		stack = [];

	return {
		dynamic: true, // prevent the loader from caching the result

		normalize: function(name, normalize) {
			var parts = name.split("!"),
				url = parts[0];
			parts.shift();
			return (/^\./.test(url) ? normalize(url) : url) + (parts.length ? "!" + parts.join("!") : "");
		},

		load: function(name, require, onLoad, config) {
			var c,
				x,
				parts = name.split("!"),
				len = parts.length,
				url,
				sandbox;

			if (sandbox = len > 1 && parts[0] === "sandbox") {
				parts.shift();
				name = parts.join("!");
			}

			url = require.toUrl(/^\//.test(name) ? name : "./" + name, stack.length ? { name: stack[stack.length-1] } : null);
			c = cache[url] || require.cache(url);

			if (!c) {
				x = new XMLHttpRequest();
				x.open("GET", url, false);
				x.send(null);
				if (x.status === 200) {
					c = x.responseText;
				} else {
					throw new Error("Failed to load include \"" + url + "\": " + x.status);
				}
			}

			stack.push(url);
			try {
				require.evaluate(cache[url] = c, 0, !sandbox);
			} catch (e) {
				throw e;
			} finally {
				stack.pop();
			}

			onLoad(c);
		}
	};
});

},
"Ti/UI/Slider":function(){
/* /titanium/Ti/UI/Slider.js */

define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/UI"], 
	function(declare, Widget, dom, css, style, lang, UI) {

	var setStyle = style.set,
		unitize = dom.unitize;

	return declare("Ti.UI.Slider", Widget, {

		constructor: function(args) {
			this._track = dom.create("div", {
				className: "TiUISliderTrack"
			}, this.domNode);
			
			this._thumb = dom.create("div", {
				className: "TiUIElementGradient TiUISliderThumb"
			}, this.domNode);
			
			var initialPosition,
				initialValue,
				self = this;
			this.addEventListener("touchstart", function(e) {
				initialPosition = e.x;
				initialValue = self.value;
			});
			this.addEventListener("touchmove", function(e) {
				self.value = Math.round((e.x - initialPosition) * (self.max - self.min) / (self.domNode.clientWidth - 32) + initialValue);
			});
		},
		
		_doLayout: function() {
			var dimensions = Widget.prototype._doLayout.apply(this,arguments);
			this._updateSize();
			return dimensions;	
		},
		
		_updateSize: function() {
			this._thumbLocation = Math.round((this.domNode.clientWidth - 32) * ((this.value - this.min) / (this.max - this.min)))
			setStyle(this._thumb, "transform", "translateX(" + this._thumbLocation + "px)");
		},
		
		_constrainValue: function(value) {
			var minVal = lang.val(this.minRange, this.min),
				maxVal = lang.val(this.maxRange, this.max);
			value < minVal && (value = minVal);
			value > maxVal && (value = maxVal);
			return value;
		},
		
		_defaultWidth: UI.FILL,
		
		_defaultHeight: UI.SIZE,
		
		_getContentSize: function(width, height) {
			// There is nothing to measure, or that has "dimensions" to return, so we just return sensible yet arbitrary defaults.
			return {
				width: 200,
				height: 40
			}
		},
		
		_setTouchEnabled: function(value) {
			Widget.prototype._setTouchEnabled.apply(this, arguments);
			var cssVal = value ? "auto" : "none";
			setStyle(this._track, "pointerEvents", cssVal);
			setStyle(this._thumb, "pointerEvents", cssVal);
		},

		properties: {
						
			enabled: {
				set: function(value, oldValue) {
					
					if (value !== oldValue) {
						if (!value) {
							css.remove(this._thumb,"TiUIElementGradient");
							setStyle(this._thumb,"backgroundColor","#aaa");
						} else {
							css.add(this._thumb,"TiUIElementGradient");
							setStyle(this._thumb,"backgroundColor","");
						}
						this._setTouchEnabled(value);
					}
					return value;
				},
				value: true
			},
			
			max: {
				set: function(value) {
					value < this.min && (value = this.min);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
					this._updateSize();
				},
				value: 100
			},
			
			maxRange: {
				set: function(value) {
					value > this.max && (value = this.max);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
					this._updateSize();
				}
			},
			
			min: {
				set: function(value) {
					value > this.max && (value = this.max);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
					this._updateSize();
				},
				value: 0
			},
			
			minRange: {
				set: function(value) {
					value < this.min && (value = this.min);
					return value;
				},
				post: function() {
					this.value = this._constrainValue(this.value);
					this._updateSize();
				}
			},
			
			value: {
				set: function(value, oldValue) {
					return this._constrainValue(value);
				},
				post: function(value, oldValue) {
					if (value !== oldValue) {
						this.fireEvent("change", {
							value: value,
							x: -1,
							y: -1
						});
					}
					this._updateSize();
				},
				value: 0
			}
		}

	});

});

},
"Ti/Utils":function(){
/* /titanium/Ti/Utils.js */

/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 *
 * A JavaScript implementation of the RSA Data Security, Inc. MD5
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * BSD License
 * <http://pajhome.org.uk/crypt/md5/md5.html>
 *
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256
 * Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * BSD License
 * <http://pajhome.org.uk/crypt/md5/sha256.html>
 */
 
 define(["Ti/_/encoding", "Ti/_/Evented", "Ti/_/lang", "Ti/Blob"], function(encoding, Evented, lang, Blob) {

	function toWord(s, y) {
		var wa = [],
			i = 0,
			l = s.length * 8;
		for (; i < l; i += 8) {
			wa[i>>5] |= (s.charCodeAt(i / 8) & 255) << ((y ? y - i : i) % 32);
		}
		return wa;
	}

	function toString(wa, y) {
		var s = [],
			i = 0,
			l = wa.length * 32;
		for (; i < l; i += 8) {
			s.push(String.fromCharCode((wa[i >> 5] >>> ((y ? y - i : i) % 32)) & 255));
		}
		return s.join('');
	}

	function toHex(wa, y) {
		var h = "0123456789abcdef",
			i = 0,
			l = wa.length * 4,
			s = [];
		for (; i < l; i++) {
			s.push(h.charAt((wa[i>>2]>>(((y?y-i:i)%4)*8+4))&0xF)+h.charAt((wa[i>>2]>>(((y?y-i:i)%4)*8))&0xF));
		}
		return s.join('');
	}

	function padWords(x, len) {
		x = toWord(x, 24);
		x[len >> 5] |= 0x80 << (24 - len % 32);
		x[((len + 64 >> 9) << 4) + 15] = len;
		return x;
	}

	function addWords(a, b) {
		var l = (a & 0xFFFF) + (b & 0xFFFF),
			m = (a >> 16) + (b >> 16) + (l >> 16);
		return (m << 16) | (l & 0xFFFF);
	}

	function R(n,c) { return (n<<c) | (n>>>(32-c)); }
	function C(q,a,b,x,s,t) { return addWords(R(addWords(addWords(a, q), addWords(x, t)), s), b); }
	function FF(a,b,c,d,x,s,t) { return C((b&c)|((~b)&d),a,b,x,s,t); }
	function GG(a,b,c,d,x,s,t) { return C((b&d)|(c&(~d)),a,b,x,s,t); }
	function HH(a,b,c,d,x,s,t) { return C(b^c^d,a,b,x,s,t); }
	function II(a,b,c,d,x,s,t) { return C(c^(b|(~d)),a,b,x,s,t); }
	function FT(t,b,c,d) {
		if (t<20) { return (b&c)|((~b)&d); }
		if (t<40) { return b^c^d; }
		if (t<60) { return (b&c)|(b&d)|(c&d); }
		return b^c^d;
	}
	function KT(t) { return (t<20)?1518500249:(t<40)?1859775393:(t<60)?-1894007588:-899497514; }

	function sha256_S (X, n) {return ( X >>> n ) | (X << (32 - n));}
	function sha256_Gamma0256(x) {return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ (x >>> 3));}
	function sha256_Gamma1256(x) {return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ (x >>> 10));}

	var sha256_K = [
		1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
		-1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
		1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
		264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
		-1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
		113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
		1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
		-1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
		430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
		1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
		-1866530822, -1538233109, -1090935817, -965641998
	];

	function isBlob(it) {
		return it && it.declaredClass === "Ti.Blob";
	}

	function base64decode(input) {
		return atob(encoding.utf8encode(input));
	}

	function getData(x) {
		return isBlob(x) ? (x._isBinary ? base64decode(x._data) : x._data) : x;
	}

	return lang.setObject("Ti.Utils", Evented, {

		base64decode: function(/*String|Ti.Blob*/input) {
			// if input is a binary blob, no sense in decoding it since it would just be re-encoded again
			return isBlob(input) && input._isBinary ? input : new Blob({ data: base64decode(input._data || input) });
		},

		base64encode: function(/*String|Ti.Blob*/input) {
			// if input is a binary blob, then it's already base64 encoded
			return isBlob(input) && input._isBinary ? input : new Blob({ data: encoding.utf8decode(btoa(input._data || input)) });
		},

		md5HexDigest: function(/*String|Ti.Blob*/x) {
			var x = encoding.utf8encode(getData(x)),
				len = x.length * 8,
				a = 1732584193,
				b = -271733879,
				c = -1732584194,
				d = 271733878,
				i = 0,
				l;

			x = toWord(x);
			x[len >> 5] |= 0x80 << (len % 32);
			x[(((len + 64) >>> 9) << 4) + 14] = len;

			for (l = x.length; i < l; i += 16) {
				var olda = a, oldb = b, oldc = c, oldd = d;

				a = FF(a,b,c,d,x[i+ 0],7 ,-680876936);
				d = FF(d,a,b,c,x[i+ 1],12,-389564586);
				c = FF(c,d,a,b,x[i+ 2],17, 606105819);
				b = FF(b,c,d,a,x[i+ 3],22,-1044525330);
				a = FF(a,b,c,d,x[i+ 4],7 ,-176418897);
				d = FF(d,a,b,c,x[i+ 5],12, 1200080426);
				c = FF(c,d,a,b,x[i+ 6],17,-1473231341);
				b = FF(b,c,d,a,x[i+ 7],22,-45705983);
				a = FF(a,b,c,d,x[i+ 8],7 , 1770035416);
				d = FF(d,a,b,c,x[i+ 9],12,-1958414417);
				c = FF(c,d,a,b,x[i+10],17,-42063);
				b = FF(b,c,d,a,x[i+11],22,-1990404162);
				a = FF(a,b,c,d,x[i+12],7 , 1804603682);
				d = FF(d,a,b,c,x[i+13],12,-40341101);
				c = FF(c,d,a,b,x[i+14],17,-1502002290);
				b = FF(b,c,d,a,x[i+15],22, 1236535329);

				a = GG(a,b,c,d,x[i+ 1],5 ,-165796510);
				d = GG(d,a,b,c,x[i+ 6],9 ,-1069501632);
				c = GG(c,d,a,b,x[i+11],14, 643717713);
				b = GG(b,c,d,a,x[i+ 0],20,-373897302);
				a = GG(a,b,c,d,x[i+ 5],5 ,-701558691);
				d = GG(d,a,b,c,x[i+10],9 , 38016083);
				c = GG(c,d,a,b,x[i+15],14,-660478335);
				b = GG(b,c,d,a,x[i+ 4],20,-405537848);
				a = GG(a,b,c,d,x[i+ 9],5 , 568446438);
				d = GG(d,a,b,c,x[i+14],9 ,-1019803690);
				c = GG(c,d,a,b,x[i+ 3],14,-187363961);
				b = GG(b,c,d,a,x[i+ 8],20, 1163531501);
				a = GG(a,b,c,d,x[i+13],5 ,-1444681467);
				d = GG(d,a,b,c,x[i+ 2],9 ,-51403784);
				c = GG(c,d,a,b,x[i+ 7],14, 1735328473);
				b = GG(b,c,d,a,x[i+12],20,-1926607734);

				a = HH(a,b,c,d,x[i+ 5],4 ,-378558);
				d = HH(d,a,b,c,x[i+ 8],11,-2022574463);
				c = HH(c,d,a,b,x[i+11],16, 1839030562);
				b = HH(b,c,d,a,x[i+14],23,-35309556);
				a = HH(a,b,c,d,x[i+ 1],4 ,-1530992060);
				d = HH(d,a,b,c,x[i+ 4],11, 1272893353);
				c = HH(c,d,a,b,x[i+ 7],16,-155497632);
				b = HH(b,c,d,a,x[i+10],23,-1094730640);
				a = HH(a,b,c,d,x[i+13],4 , 681279174);
				d = HH(d,a,b,c,x[i+ 0],11,-358537222);
				c = HH(c,d,a,b,x[i+ 3],16,-722521979);
				b = HH(b,c,d,a,x[i+ 6],23, 76029189);
				a = HH(a,b,c,d,x[i+ 9],4 ,-640364487);
				d = HH(d,a,b,c,x[i+12],11,-421815835);
				c = HH(c,d,a,b,x[i+15],16, 530742520);
				b = HH(b,c,d,a,x[i+ 2],23,-995338651);

				a = II(a,b,c,d,x[i+ 0],6 ,-198630844);
				d = II(d,a,b,c,x[i+ 7],10, 1126891415);
				c = II(c,d,a,b,x[i+14],15,-1416354905);
				b = II(b,c,d,a,x[i+ 5],21,-57434055);
				a = II(a,b,c,d,x[i+12],6 , 1700485571);
				d = II(d,a,b,c,x[i+ 3],10,-1894986606);
				c = II(c,d,a,b,x[i+10],15,-1051523);
				b = II(b,c,d,a,x[i+ 1],21,-2054922799);
				a = II(a,b,c,d,x[i+ 8],6 , 1873313359);
				d = II(d,a,b,c,x[i+15],10,-30611744);
				c = II(c,d,a,b,x[i+ 6],15,-1560198380);
				b = II(b,c,d,a,x[i+13],21, 1309151649);
				a = II(a,b,c,d,x[i+ 4],6 ,-145523070);
				d = II(d,a,b,c,x[i+11],10,-1120210379);
				c = II(c,d,a,b,x[i+ 2],15, 718787259);
				b = II(b,c,d,a,x[i+ 9],21,-343485551);

				a = addWords(a, olda);
				b = addWords(b, oldb);
				c = addWords(c, oldc);
				d = addWords(d, oldd);
			}

			return toHex([a,b,c,d]);
		},

		sha1: function(/*String|Ti.Blob*/x) {
			var x = encoding.utf8encode(getData(x)),
				a = 1732584193,
				b = -271733879,
				c = -1732584194,
				d = 271733878,
				e = -1009589776,
				i = 0,
				j, k, l,
				w = new Array(80);

			x = padWords(x, x.length * 8);

			for (l = x.length; i < l; i += 16) {
				var olda = a, oldb = b, oldc = c, oldd = d, olde = e;

				for (j = 0; j < 80; j++) {
					w[j] = j < 16 ? x[i + j] : R(w[j-3]^w[j-8]^w[j-14]^w[j-16], 1);
					k = addWords(addWords(R(a,5), FT(j,b,c,d)), addWords(addWords(e,w[j]), KT(j)));
					e = d;
					d = c;
					c = R(b, 30);
					b = a;
					a = k;
				}

				a = addWords(a, olda);
				b = addWords(b, oldb);
				c = addWords(c, oldc);
				d = addWords(d, oldd);
				e = addWords(e, olde);
			}

			return toHex([a, b, c, d, e], 3);
		},

		sha256: function(/*String|Ti.Blob*/x) {
			var x = encoding.utf8encode(getData(x)),
				a = 1779033703,
				b = -1150833019,
				c = 1013904242,
				d = -1521486534,
				e = 1359893119,
				f = -1694144372,
				g = 528734635,
				h = 1541459225,
				i = 0,
				j, l, T1, T2,
				w = new Array(64);

			x = padWords(x, x.length * 8);

			for (l = x.length; i < l; i += 16) {
				var olda = a, oldb = b, oldc = c, oldd = d, olde = e, oldf = f, oldg = g, oldh = h;

				for (j = 0; j < 64; j++) {
					w[j] = j < 16 ? x[i + j] : addWords(addWords(addWords(sha256_Gamma1256(w[j-2]), w[j-7]), sha256_Gamma0256(w[j-15])), w[j-16]);
					T1 = addWords(addWords(addWords(addWords(h, sha256_S(e, 6) ^ sha256_S(e, 11) ^ sha256_S(e, 25)), (e & f) ^ ((~e) & g)), sha256_K[j]), w[j]);
					T2 = addWords(sha256_S(a, 2) ^ sha256_S(a, 13) ^ sha256_S(a, 22), (a & b) ^ (a & c) ^ (b & c));
					h = g;
					g = f;
					f = e;
					e = addWords(d, T1);
					d = c;
					c = b;
					b = a;
					a = addWords(T1, T2);
				}

				a = addWords(a, olda);
				b = addWords(b, oldb);
				c = addWords(c, oldc);
				d = addWords(d, oldd);
				e = addWords(e, olde);
				f = addWords(f, oldf);
				g = addWords(g, oldg);
				h = addWords(h, oldh);
			}

			return toHex([a, b, c, d, e, f, g, h], 3);
		}

	});

});
},
"Ti/_/Gestures/TouchMove":function(){
/* /titanium/Ti/_/Gestures/TouchMove.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TouchMove", GestureRecognizer, {
		
		name: "touchmove",
		
		processTouchMoveEvent: function(e, element){
			if (!element._isGestureBlocked(this.name)) {
				for (var i = 0; i < e.changedTouches.length; i++) {
					lang.hitch(element,element._handleTouchEvent(this.name,{
						x: e.changedTouches[i].clientX,
						y: e.changedTouches[i].clientY,
						source: this.getSourceNode(e,element)
					}));
				}
			}
		}

	});

});
},
"Ti/_/Layouts/Horizontal":function(){
/* /titanium/Ti/_/Layouts/Horizontal.js */

define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI"], function(Base, declare, UI) {

	return declare("Ti._.Layouts.Horizontal", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentLeft = 0,
				children = element.children,
				availableWidth = width,
				childrenWithFillWidth = false;
				
			// Determine if any children have fill height
			for (var i = 0; i < children.length; i++) {
				children[i]._hasFillWidth() && (childrenWithFillWidth = true);
			}
			
			if (childrenWithFillWidth) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (this.verifyChild(child,element) && !child._hasFillWidth()) {
						var childWidth;
						if (child._markedForLayout) {
							childWidth = child._doLayout({
							 	origin: {
							 		x: 0,
							 		y: 0
							 	},
							 	isParentSize: {
							 		width: isWidthSize,
							 		height: isHeightSize
							 	},
							 	boundingSize: {
							 		width: width,
							 		height: height
							 	},
							 	alignment: {
							 		horizontal: this._defaultHorizontalAlignment,
							 		vertical: this._defaultVerticalAlignment
							 	},
							 	rightIsMargin: true,
								positionElement: false,
						 		layoutChildren: true
							}).effectiveWidth;
						} else {
							childWidth = child._measuredEffectiveWidth;
						}
						availableWidth -= childWidth;
					}
				}
			}
			
			for(var i = 0; i < children.length; i++) {
				
				// Layout the child
				var child = children[i],
					isWidthFill = child._hasFillWidth();
				
				if (child._markedForLayout) {
					child._doLayout({
					 	origin: {
					 		x: currentLeft,
					 		y: 0
					 	},
					 	isParentSize: {
					 		width: isWidthSize,
					 		height: isHeightSize
					 	},
					 	boundingSize: {
					 		width: isWidthFill ? availableWidth : width,
					 		height: height
					 	},
					 	alignment: {
					 		horizontal: this._defaultHorizontalAlignment,
					 		vertical: this._defaultVerticalAlignment
					 	},
						rightIsMargin: true,
					 	positionElement: true,
					 	layoutChildren: !childrenWithFillWidth || isWidthFill
				 	});
			 	}
				
				// Update the size of the component
				currentLeft = child._measuredLeft + child._measuredWidth + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
				var bottomMostEdge = child._measuredTop + child._measuredHeight + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
				currentLeft > computedSize.width && (computedSize.width = currentLeft);
				bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
			}
			return computedSize;
		},
		
		_defaultHorizontalAlignment: "left",
		
		_defaultVerticalAlignment: "top"

	});

});

},
"Ti/UI/Label":function(){
/* /titanium/Ti/UI/Label.js */

define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/Locale", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, Locale, UI) {

	var setStyle = style.set,
		unitize = dom.unitize,
		tabStop = 2,
		textPost = {
			post: "_setText"
		};

	return declare("Ti.UI.Label", FontWidget, {

		constructor: function() {
			// Create the aligner div. This sets up a flexbox to float the text to the middle
			var aligner = this.textAlignerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextAligner"),
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center"
				}
			}, this.domNode);

			// Create the container div. This gets floated by the flexbox
			this.textContainerDiv = dom.create("div", {
				className: css.clean("TiUILabelTextContainer")
			}, aligner);

			this._addStyleableDomNode(this.textContainerDiv);
			
			this.wordWrap = true;
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_getContentSize: function(width, height) {
			var text = this._getText();
			return {
				width: this._measureText(text, this.textContainerDiv, width).width,
				height: this._measureText(text, this.textContainerDiv, width).height
			};
		},

		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this,arguments);
			var cssVal = value ? "auto" : "none"
			setStyle(this.textAlignerDiv,"pointerEvents", cssVal);
			setStyle(this.textContainerDiv,"pointerEvents", cssVal);
		},

		_getText: function() {
			var i,
				lineStartIndex = 0,
				currentIndex = 0,
				currentTabIndex,
				text = Locale._getString(this.textid, this.text);

			// Convert \t and \n to &nbsp;'s and <br/>'s
			while (currentIndex < text.length) {
				if (text[currentIndex] === '\t') {
					var tabSpaces = "",
						numSpacesToInsert = tabStop - (currentTabIndex) % tabStop;
					for (i = 0; i < numSpacesToInsert; i++) {
						tabSpaces += "&nbsp;";
					}
					text = text.substring(0, currentIndex) + tabSpaces + text.substring(currentIndex + 1);
					currentIndex += tabSpaces.length;
					currentTabIndex += numSpacesToInsert;
				} else if (text[currentIndex] === '\n') {
					text = text.substring(0, currentIndex) + "<br/>" + text.substring(currentIndex + 1);
					currentIndex += 5;
					lineStartIndex = currentIndex;
					currentTabIndex = 0;
				} else {
					currentIndex++;
					currentTabIndex++;
				}
			}

			text.match(/<br\/>$/) && (text += "&nbsp;");
			return text;
		},

		_setText: function() {
			this.textContainerDiv.innerHTML = this._getText();
			this._hasSizeDimensions() && this._triggerLayout();
		},

		_setTextShadow: function() {
			var shadowColor = this.shadowColor && this.shadowColor !== "" ? this.shadowColor : void 0;
			setStyle(
				this.textContainerDiv,
				"textShadow",
				this.shadowOffset || shadowColor
					? (this.shadowOffset ? unitize(this.shadowOffset.x) + " " + unitize(this.shadowOffset.y) : "0px 0px") + " 0.1em " + lang.val(shadowColor,"black")
					: ""
			);
		},

		properties: {
			ellipsize: {
				set: function(value) {
					setStyle(this.textContainerDiv,"textOverflow", !!value ? "ellipsis" : "clip");
					return value;
				},
				value: true
			},
			html: {
				set: function(value) {
					this.textContainerDiv.innerHTML = value;
					this._hasSizeDimensions() && this._triggerLayout();
					return value;
				}
			},
			shadowColor: {
				post: function(value) {
					this._setTextShadow();
					return value;
				}
			},
			shadowOffset: {
				post: function(value) {
					this._setTextShadow();
					return value;
				}
			},
			text: textPost,
			textAlign: {
				set: function(value) {
					setStyle(this.textContainerDiv, "textAlign", /(center|right)/.test(value) ? value : "left");
					return value;
				}
			},
			textid: textPost,
			wordWrap: {
				set: function(value) {
					setStyle(this.textContainerDiv, "whiteSpace", !!value ? "normal" : "nowrap");
					return value;
				}
			}
		}

	});

});
},
"Ti/_/Layouts":function(){
/* /titanium/Ti/_/Layouts.js */

define(
	["Ti/_/Layouts/Composite", "Ti/_/Layouts/Horizontal", "Ti/_/Layouts/Vertical"],
	function(Composite, Horizontal, Vertical) {

	return {
		Composite: Composite,
		Horizontal: Horizontal,
		Vertical: Vertical
	};

});
},
"Ti/_/Gestures/GestureRecognizer":function(){
/* /titanium/Ti/_/Gestures/GestureRecognizer.js */

define(["Ti/_/declare", "Ti/_/lang"], function(declare,lang) {

	return declare("Ti._.Gestures.GestureRecognizer", null, {
		
		blocking: null,
		
		constructor: function() {
			this.blocking = [];
		},
		
		getSourceNode: function(evt, node) {
			var currentNode = evt.target,
				sourceWidgetId = currentNode.getAttribute("data-widget-id"),
				nodeStack = [node],
				i,
				children;
				
			// Find the first fully fledged Ti component
			while(!sourceWidgetId) {
				currentNode = currentNode.parentNode;
				if (!currentNode.getAttribute) {
					return;
				}
				sourceWidgetId = currentNode.getAttribute("data-widget-id");
			}
			
			// Find the instance corresponding to the widget id
			while(nodeStack.length > 0) {
				currentNode = nodeStack.pop();
				if (currentNode._alive) {
					if (currentNode.widgetId === sourceWidgetId) {
						return currentNode;
					}
					children = currentNode.children;
					for (i in children) {
						nodeStack.push(children[i]);
					}
				}
			}
		},
		
		processTouchStartEvent: function(e, element){
		},
		finalizeTouchStartEvent: function(){
		},
		
		processTouchEndEvent: function(e, element){
		},
		finalizeTouchEndEvent: function(){
		},
		
		processTouchMoveEvent: function(e, element){
		},
		finalizeTouchMoveEvent: function(){
		},
		
		processTouchCancelEvent: function(e, element){
		},
		finalizeTouchCancelEvent: function(){
		}

	});

});
},
"Ti/UI/ScrollableView":function(){
/* /titanium/Ti/UI/ScrollableView.js */

define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI"],
	function(declare, Widget, lang, dom, style, UI) {

	var setStyle = style.set,
		is = require.is,
		unitize = dom.unitize;

	return declare("Ti.UI.ScrollableView", Widget, {

		// This sets the minimum velocity that determines whether a swipe was a flick or a drag
		_velocityThreshold: 0.4,

		// This determines the minimum distance scale (i.e. width divided by this value) before a flick requests a page turn
		_minimumFlickDistanceScaleFactor: 15,

		// This determines the minimum distance scale (i.e. width divided by this value) before a drag requests a page turn
		_minimumDragDistanceScaleFactor: 2,

		constructor: function(args){

			// Create the content container
			this._contentContainer = UI.createView({
				left: 0,
				top: 0,
				width: "100%",
				height: "100%"
			});
			setStyle(this._contentContainer.domNode, "overflow", "hidden");
			this.add(this._contentContainer);

			// Create the paging control container
			this.add(this._pagingControlContainer = UI.createView({
				width: "100%",
				height: 20,
				bottom: 0,
				backgroundColor: "black",
				opacity: 0,
				touchEnabled: false
			}));

			this._pagingControlContainer.add(this._pagingControlContentContainer = UI.createView({
				width: UI.SIZE,
				height: "100%",
				top: 0,
				touchEnabled: false
			}));

			// State variables
			this._viewToRemoveAfterScroll = -1;

			var initialPosition,
				animationView,
				swipeInitialized = false,
				viewsToScroll,
				touchEndHandled,
				startTime;

			// This touch end handles the case where a swipe was started, but turned out not to be a swipe
			this.addEventListener("touchend", function(e) {
				if (!touchEndHandled && swipeInitialized) {
					var width = this._measuredWidth,
						destinationLeft = viewsToScroll.indexOf(this.views[this.currentPage]) * -width;
					animationView.animate({
						duration: (300 + 0.2 * width) / (width - Math.abs(e._distance)) * 10,
						left: destinationLeft,
						curve: UI.ANIMATION_CURVE_EASE_OUT
					},lang.hitch(this,function(){
						this._contentContainer._removeAllChildren();
						this._contentContainer.add(this.views[this.currentPage]);
					}));
				}
			})

			this.addEventListener("swipe", function(e){
				// If we haven't started swiping yet, start swiping,
				var width = this._measuredWidth;
				if (!swipeInitialized) {
					swipeInitialized = true;
					touchEndHandled = false;
					startTime = (new Date()).getTime();
					
					// Create the list of views that can be scrolled, the ones immediately to the left and right of the current view
					initialPosition = 0;
					viewsToScroll = [];
					if (this.currentPage > 0) {
						viewsToScroll.push(this.views[this.currentPage - 1]);
						initialPosition = -width;
					}
					viewsToScroll.push(this.views[this.currentPage]);
					if (this.currentPage < this.views.length - 1) {
						viewsToScroll.push(this.views[this.currentPage + 1]);
					}
					
					// Create the animation div
					animationView = UI.createView({
						width: unitize(viewsToScroll.length * width),
						height: "100%",
						left: initialPosition,
						top: 0
					});
		
					// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
					this._contentContainer._removeAllChildren();
					for (var i = 0; i < viewsToScroll.length; i++) {
						var viewContainer = UI.createView({
							left: unitize(i * width),
							top: 0,
							width: unitize(width),
							height: "100%",
							layout: "horizontal" // Do a horizontal to force the child to (0,0) without overwriting the original position values
						});
						setStyle(viewContainer.domNode,"overflow","hidden");
						viewContainer.add(viewsToScroll[i]);
						animationView.add(viewContainer);
					}
					
					// Set the initial position
					animationView.left = unitize(initialPosition);
					this._contentContainer.add(animationView);
					this._triggerLayout(true);
				}
				
				// Update the position of the animation div
				var newPosition = initialPosition + e._distance;
				newPosition = newPosition < 0 ? newPosition > -animationView._measuredWidth + width ? newPosition :-animationView._measuredWidth + width : 0;
				animationView.domNode.style.left = unitize(newPosition);
				
				// If the swipe is finished, we animate to the final position
				if (e._finishedSwiping) {
					swipeInitialized = false;
					touchEndHandled = true;
					
					// Determine whether this was a flick or a drag
					var velocity = Math.abs((e._distance) / ((new Date()).getTime() - startTime));
					var scaleFactor = velocity > this._velocityThreshold ? 
						this._minimumFlickDistanceScaleFactor : this._minimumDragDistanceScaleFactor
					
					// Find out which view we are animating to
					var destinationIndex = this.currentPage,
						animationLeft = initialPosition;
					if (e._distance > width / scaleFactor && this.currentPage > 0) {
						destinationIndex = this.currentPage - 1;
						animationLeft = 0;
					} else if (e._distance < -width / scaleFactor && this.currentPage < this.views.length - 1) {
						destinationIndex = this.currentPage + 1;
						if (viewsToScroll.length === 3) {
							animationLeft = -2 * width;
						} else {
							animationLeft = -width;
						}
					}
					
					var self = this;
					function finalizeSwipe() {
						self._contentContainer._removeAllChildren();
						self._contentContainer.add(self.views[destinationIndex]);
						self._triggerLayout(true);
						
						self.currentPage !== destinationIndex && self.fireEvent("scroll",{
							currentPage: destinationIndex,
							view: self.views[destinationIndex],
							x: e.x,
							y: e.y
						});
						
						self.properties.__values__.currentPage = destinationIndex;
					}
					
					// Check if the user attempted to scroll past the edge, in which case we directly reset the view instead of animation
					this._updatePagingControl(destinationIndex);
					if (newPosition == 0 || newPosition == -animationView._measuredWidth + width) {
						finalizeSwipe();
					} else {
						// Animate the view and set the final view
						animationView.animate({
							duration: 200 + (0.2 * width) / (width - Math.abs(e._distance)) * 10,
							left: animationLeft,
							curve: UI.ANIMATION_CURVE_EASE_OUT
						},lang.hitch(this,function(){
							finalizeSwipe();
						}));
					}
				}
			});
		},

		addView: function(view){
			if (view) {
				this.views.push(view);
	
				// Check if any children have been added yet, and if not load this view
				if (this.views.length == 1) {
					this.properties.__values__.currentPage = 0;
					this._contentContainer._removeAllChildren();
					this._contentContainer.add(view);
				}
				this._updatePagingControl(this.currentPage);
			}
		},

		removeView: function(view) {
			
			// Get and validate the location of the view
			var viewIndex = is(view,"Number") ? view : this.views.indexOf(view);
			if (viewIndex < 0 || viewIndex >= this.views.length) {
				return;
			}
	
			// Update the view if this view was currently visible
			if (viewIndex == this.currentPage) {
				if (this.views.length == 1) {
					this._contentContainer._removeAllChildren();
					this._removeViewFromList(viewIndex);
				} else {
					this._viewToRemoveAfterScroll = viewIndex;
				    this.scrollToView(viewIndex == this.views.length - 1 ? --viewIndex : ++viewIndex);
				}
			} else {
				this._removeViewFromList(viewIndex);
			}
		},

		_removeViewFromList: function(viewIndex) {
			// Remove the view
			this.views.splice(viewIndex,1);
	
			// Update the current view if necessary
			if (viewIndex < this.currentPage){
				this.properties.__values__.currentPage--;
			}
			
			this._updatePagingControl(this.currentPage);
		},

		scrollToView: function(view) {
			var viewIndex = is(view,"Number") ? view : this.views.indexOf(view)
			
			// Sanity check
			if (viewIndex < 0 || viewIndex >= this.views.length || viewIndex == this.currentPage) {
				return;
			}
	
			// If the scrollableView hasn't been laid out yet, we can't do much since the scroll distance is unknown.
			// At the same time, it doesn't matter since the user won't see it anyways. So we just append the new
			// element and don't show the transition animation.
			if (!this._contentContainer.domNode.offsetWidth) {
				this._contentContainer._removeAllChildren();
				this._contentContainer.add(this.views[viewIndex]);
			} else {
				
				// Calculate the views to be scrolled
				var width = this._measuredWidth,
					viewsToScroll = [],
					scrollingDirection = -1,
					initialPosition = 0;
				if (viewIndex > this.currentPage) {
					for (var i = this.currentPage; i <= viewIndex; i++) {
						viewsToScroll.push(this.views[i]);
					}
				} else {
					for (var i = viewIndex; i <= this.currentPage; i++) {
						viewsToScroll.push(this.views[i]);
					}
					initialPosition = -(viewsToScroll.length - 1) * width;
					scrollingDirection = 1;
				}
	
				// Create the animation div
				var animationView = UI.createView({
					width: unitize(viewsToScroll.length * width),
					height: "100%",
					left: initialPosition,
					top: 0
				});
	
				// Attach the child views, each contained in their own div so we can mess with positioning w/o touching the views
				this._contentContainer._removeAllChildren();
				for (var i = 0; i < viewsToScroll.length; i++) {
					var viewContainer = UI.createView({
						left: unitize(i * width),
						top: 0,
						width: unitize(width),
						height: "100%",
						layout: "horizontal" // Do a horizontal to force the child to (0,0) without overwriting the original position values
					});
					setStyle(viewContainer.domNode,"overflow","hidden");
					viewContainer.add(viewsToScroll[i]);
					animationView.add(viewContainer);
				}
				
				// Set the initial position
				animationView.left = unitize(initialPosition);
				this._contentContainer.add(animationView);
				this._triggerLayout(true);
	
				// Set the start time
				var duration = 300 + 0.2 * (width), // Calculate a weighted duration so that larger views take longer to scroll.
					distance = (viewsToScroll.length - 1) * width;
					
				this._updatePagingControl(viewIndex);
				animationView.animate({
					duration: duration,
					left: initialPosition + scrollingDirection * distance,
					curve: UI.ANIMATION_CURVE_EASE_IN_OUT
				},lang.hitch(this,function(){
					this._contentContainer._removeAllChildren();
					this._contentContainer.add(this.views[viewIndex]);
					this._triggerLayout(true);
					this.properties.__values__.currentPage = viewIndex;
					if (this._viewToRemoveAfterScroll != -1) {
						this._removeViewFromList(this._viewToRemoveAfterScroll);
						this._viewToRemoveAfterScroll = -1;
					}
					this.fireEvent("scroll",{
						currentPage: viewIndex,
						view: this.views[viewIndex]
					});
				}));
			}
		},

		_showPagingControl: function() {
			if (!this.showPagingControl) {
				this._pagingControlContainer.opacity = 0;
				return;
			}
			if (this._isPagingControlActive) {
				return;
			}
			this._isPagingControlActive = true;
			this._pagingControlContainer.animate({
				duration: 250,
				opacity: 0.75
			});
			this.pagingControlTimeout > 0 && setTimeout(lang.hitch(this,function() {
				this._pagingControlContainer.animate({
					duration: 750,
					opacity: 0
				});
				this._isPagingControlActive = false;
			}),this.pagingControlTimeout);
		},

		_updatePagingControl: function(newIndex, hidePagingControl) {
			this._pagingControlContentContainer._removeAllChildren();
			var diameter = this.pagingControlHeight / 2;
			for (var i = 0; i < this.views.length; i++) {
				var indicator = UI.createView({
					width: diameter,
					height: diameter,
					top: diameter / 2,
					left: i * 2 * diameter,
					backgroundColor: i === newIndex ? "white" : "grey"
				});
				setStyle(indicator.domNode,"borderRadius",unitize(diameter / 2));
				this._pagingControlContentContainer.add(indicator);
			}
			!hidePagingControl && this._showPagingControl();
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		properties: {
			currentPage: {
				set: function(value, oldValue) {
					if (value >= 0 && value < this.views.length) {
						this.scrollToView(value);
						return value;
					}
					return oldValue;
				}
			},
			pagingControlColor: {
				set: function(value) {
					this._pagingControlContainer.backgroundColor = value;
					return value;
				},
				value: "black"
			},
			pagingControlHeight: {
				set: function(value) {
					this._pagingControlContainer.height = value;
					return value;
				},
				value: 20
			},
			pagingControlTimeout: {
				set: function(value) {
					this.pagingControlTimeout == 0 && this._hidePagingControl();
					return value;
				},
				value: 1250
			},
			showPagingControl: {
				set: function(value) {
					this.pagingControlTimeout == 0 && this._hidePagingControl();
					return value;
				},
				value: false
			},
			views: {
				set: function(value, oldValue) {
					// Value must be an array
					if (!is(value,"Array")) {
						return;
					}
					if (oldValue.length == 0 && value.length > 0) {
						this._contentContainer._removeAllChildren();
						this._contentContainer.add(value[0]);
					}
					this.properties.__values__.currentPage = 0;
					return value;
				},
				post: function() {
					this._updatePagingControl(this.currentPage,true);
				},
				value: []
			}
		}

	});

});
},
"Ti/UI/ActivityIndicator":function(){
/* /titanium/Ti/UI/ActivityIndicator.js */

define(["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/style", "Ti/Locale", "Ti/UI"],
	function(declare, lang, FontWidget, dom, style, Locale, UI) {

	var opacity = 0.3,
		setStyle = style.set,
		postMessage = {
			post: "_renderMessage"
		};

	return declare("Ti.UI.ActivityIndicator", FontWidget, {

		constructor: function() {
			var prongs = this._prongs = [],
				container = this._contentContainer = dom.create("div", {
					className: "TiUIActivityIndicatorContentContainer",
					style: {
						boxOrient: "horizontal",
						boxPack: "center",
						boxAlign: "center",
						pointerEvents: "none"
					}
				}, this.domNode),
				indicator = this._indicatorIndicator = dom.create("div", {
					className: "TiUIActivityIndicatorIndicator",
					style: {
						pointerEvents: "none"
					}
				}, container),
				i = 0;

			for (; i < 12; i++) {
				prongs.push(dom.create("div", {
					className: "TiUIActivityIndicatorProng",
					style: {
						transform: "translate(16px,0px) rotate(" + i * 30 + "deg)",
						transformOrigin: "2px 18px",
						opacity: opacity
					}
				}, this._indicatorIndicator));
			}

			this._addStyleableDomNode(this._indicatorMessage = dom.create("div", {
				className: "TiUIActivityIndicatorMessage",
				style: {
					pointerEvents: "none"
				}
			}, container));
		},

		show: function() {
			if (!this._visible) {
				setStyle(this._contentContainer, "display", ["-webkit-box", "-moz-box"]);
				this._timer = setInterval(lang.hitch(this, "_animate"), 100);
				this._visible = 1;
			}
		},

		hide: function() {
			clearTimeout(this._timer);
			if (this._visible) {
				setStyle(this._contentContainer, "display", "none");
				this._visible = 0;
			}
		},

		_currentProng: 0,

		_animate: function() {
			var prong = this._prongs[this._currentProng];
			++this._currentProng == 12 && (this._currentProng = 0);
			setStyle(prong, "transition", "");
			setTimeout(function() {
				setStyle(prong, "opacity", 1);
				setTimeout(function() {
					setStyle(prong, "transition", "opacity 500ms linear 0ms");
					setTimeout(function() {
						setStyle(prong, "opacity", opacity);
					}, 1);
				}, 1);
			}, 1);
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,

		_messagePadding: 0,

		_getContentSize: function(width, height) {
			var msg = this._getMessage();
			return {
				width: 36 + this._measureText(msg, this._indicatorMessage).width + this._messagePadding,
				height: Math.max(this._measureText(msg, this._indicatorMessage).height, 36)
			};
		},

		_getMessage: function() {
			return Locale._getString(this.messageid, this.message);
		},

		_renderMessage: function() {
			var msg = this._getMessage();
			this._messagePadding = msg ? 5 : 0;
			setStyle(this._indicatorMessage, "paddingLeft", dom.unitize(this._messagePadding));
			this._indicatorMessage.innerHTML = msg;
			this._hasSizeDimensions() && this._triggerLayout();
		},

		properties: {
			message: postMessage,
			messageid: postMessage
		}

	});

});
},
"Ti/_/UI/Element":function(){
/* /titanium/Ti/_/UI/Element.js */

define(
	["Ti/_/browser", "Ti/_/css", "Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/_/style", "Ti/_/Evented",
	"Ti/UI", "Ti/_/Gestures/DoubleTap","Ti/_/Gestures/LongPress","Ti/_/Gestures/Pinch","Ti/_/Gestures/SingleTap",
	"Ti/_/Gestures/Swipe","Ti/_/Gestures/TouchCancel","Ti/_/Gestures/TouchEnd","Ti/_/Gestures/TouchMove",
	"Ti/_/Gestures/TouchStart","Ti/_/Gestures/TwoFingerTap", "Ti/_/Promise"],
	function(browser, css, declare, dom, event, lang, style, Evented, UI,
		DoubleTap, LongPress, Pinch, SingleTap, Swipe, TouchCancel, TouchEnd,
		TouchMove, TouchStart, TwoFingerTap, Promise) {

	var unitize = dom.unitize,
		computeSize = dom.computeSize,
		on = require.on,
		setStyle = style.set,
		isDef = lang.isDef,
		val = lang.val,
		is = require.is,
		transitionEvents = {
			webkit: "webkitTransitionEnd",
			trident: "msTransitionEnd",
			gecko: "transitionend",
			presto: "oTransitionEnd"
		},
		transitionEnd = transitionEvents[browser.runtime] || "transitionEnd",
		curves = ["ease", "ease-in", "ease-in-out", "ease-out", "linear"],
		postDoBackground = {
			post: "_doBackground"
		},
		postLayoutProp = {
			set: function(value, oldValue) {
				if (value !== oldValue) {
					!this._batchUpdateInProgress && this._triggerLayout();
				}
				return value;
			}
		};

	return declare("Ti._.UI.Element", Evented, {

		domType: null,
		domNode: null,
		_alive: 1,

		constructor: function(args) {
			var self = this,

				node = this.domNode = this._setFocusNode(dom.create(this.domType || "div", {
					className: "TiUIElement " + css.clean(this.declaredClass),
					"data-widget-id": this.widgetId
				})),

				// Handle click/touch/gestures
				recognizers = this._gestureRecognizers = {
					Pinch: new Pinch,
					Swipe: new Swipe,
					TwoFingerTap: new TwoFingerTap,
					DoubleTap: new DoubleTap,
					LongPress: new LongPress,
					SingleTap: new SingleTap,
					TouchStart: new TouchStart,
					TouchEnd: new TouchEnd,
					TouchMove: new TouchMove,
					TouchCancel: new TouchCancel
				},

				// Each event could require a slightly different precedence of execution, which is why we have these separate lists.
				// For now they are the same, but I suspect they will be different once the android-iphone parity is determined.
				touchRecognizers = {
					Start: recognizers,
					Move: recognizers,
					End: recognizers,
					Cancel: recognizers
				},

				useTouch = "ontouchstart" in window,
				bg = lang.hitch(this, "_doBackground");

			require.has("devmode") && args && args._debug && dom.attr.set(node, "data-debug", args._debug);

			function processTouchEvent(eventType, evt) {
				var i,
					gestureRecognizers = touchRecognizers[eventType],
					eventType = "Touch" + eventType + "Event",
					touches = evt.changedTouches;
				if (this._preventDefaultTouchEvent) {
					this._preventDefaultTouchEvent && evt.preventDefault && evt.preventDefault();
					for (i in touches) {
						touches[i].preventDefault && touches[i].preventDefault();
					}
				}
				useTouch || require.mix(evt, {
					touches: evt.type === "mouseup" ? [] : [evt],
					targetTouches: [],
					changedTouches: [evt]
				});
				for (i in gestureRecognizers) {
					gestureRecognizers[i]["process" + eventType](evt, self);
				}
				for (i in gestureRecognizers) {
					gestureRecognizers[i]["finalize" + eventType]();
				}
			}

			this._touching = false;

			on(this.domNode, useTouch ? "touchstart" : "mousedown", function(evt){
				var handles = [
					on(window, useTouch ? "touchmove" : "mousemove", function(evt){
						(useTouch || self._touching) && processTouchEvent("Move", evt);
					}),
					on(window, useTouch ? "touchend" : "mouseup", function(evt){
						self._touching = false;
						processTouchEvent("End", evt);
						event.off(handles);
					}),
					useTouch && on(window, "touchcancel", function(evt){
						processTouchEvent("Cancel", evt);
						event.off(handles);
					})
				];
				self._touching = true;
				processTouchEvent("Start", evt);
			});

			this.addEventListener("touchstart", bg);
			this.addEventListener("touchend", bg);

			// TODO: mixin JSS rules (http://jira.appcelerator.org/browse/TIMOB-6780)
			var values = this.constants.__values__;
			values.size = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
			values.rect = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
		},

		_setParent: function(view) {
			this._parent = view;
		},
		
		_add: function(view) {
			view._setParent(this);
			this.children.push(view);
			this.containerNode.appendChild(view.domNode);
			view._hasBeenLaidOut = false;
			this._triggerLayout(this._isAttachedToActiveWin());
		},

		_insertAt: function(view,index) {
			if (index > this.children.length || index < 0) {
				return;
			} else if (index === this.children.length) {
				this.add(view);
			} else {
				view._parent = this;
				this.containerNode.insertBefore(view.domNode,this.children[index].domNode);
				this.children.splice(index,0,view);
				this._triggerLayout();
			}
		},

		_remove: function(view) {
			var p = this.children.indexOf(view);
			if (p !== -1) {
				this.children.splice(p, 1);
				view._setParent();
				dom.detach(view.domNode);
				this._triggerLayout();
			}
		},

		_removeAllChildren: function(view) {
			var children = this.children;
			while (children.length) {
				this.remove(children[0]);
			}
			this._triggerLayout();
		},

		destroy: function() {
			if (this._alive) {
				this._parent && this._parent._remove(this);
				if (this.domNode) {
					dom.destroy(this.domNode);
					this.domNode = null;
				}
			}
			Evented.destroy.apply(this, arguments);
		},
		
		_markedForLayout: false,
		
		_isAttachedToActiveWin: function() {
			// If this element is not attached to an active window, skip the calculation
			var isAttachedToActiveWin = false,
				node = this;
			while(node) {
				if (node === UI._container) {
					isAttachedToActiveWin = true;
					break;
				}
				node = node._parent;
			}
			return isAttachedToActiveWin;
		},
		
		_triggerLayout: function(force) {
			this._isAttachedToActiveWin() && (!this._batchUpdateInProgress || force) && UI._triggerLayout(this, force);
		},
		
		_getInheritedWidth: function() {
			var parent = this._parent,
				parentWidth;
			if (parent) {
				parentWidth = lang.val(parent.width,parent._defaultWidth);
				return parentWidth === UI.INHERIT ? parent._getInheritedWidth() : parentWidth;
			}
		},
		
		_getInheritedHeight: function(node) {
			var parent = this._parent,
				parentHeight;
			if (parent) {
				parentHeight = lang.val(parent.height,parent._defaultHeight);
				return parentHeight === UI.INHERIT ? parent._getInheritedHeight() : parentHeight;
			}
		},
		
		_hasSizeDimensions: function() {
			var width = this._getInheritedWidth(),
				height = this._getInheritedHeight()
			return (this._width === UI.SIZE || width === UI.SIZE) || 
				(this._height === UI.SIZE || height === UI.SIZE);
		},
		
		_hasFillWidth: function() {
			var width = this.width;
			if (isDef(width)) {
				if (width === UI.INHERIT) {
					return this._getInheritedWidth() === UI.FILL;
				}
				return width === UI.FILL;
			}
			if (isDef(this.left) + isDef(this.right) + !!(this.center && isDef(this.center.x)) > 1) {
				return false;
			}
			if (this._defaultWidth === UI.FILL) {
				return true;
			}
			if (this._defaultWidth === UI.INHERIT) {
				return this._getInheritedWidth() === UI.FILL;
			}
		},
		
		_hasFillHeight: function() {
			var height = this.height;
			if (isDef(height)) {
				if (height === UI.INHERIT) {
					return this._getInheritedHeight() === UI.FILL;
				}
				return height === UI.FILL;
			}
			if (isDef(this.top) + isDef(this.bottom) + !!(this.center && isDef(this.center.y)) > 1) {
				return false;
			}
			if (this._defaultHeight === UI.FILL) {
				return true;
			}
			if (this._defaultHeight === UI.INHERIT) {
				return this._getInheritedHeight() === UI.FILL;
			}
		},
		
		_hasBeenLaidOut: false,
		
		_isDependentOnParent: function(){
			function isPercent(value) {
				return /%$/.test("" + value);
			}
			var centerX = this.center && this.center.x,
				centerY = this.center && this.center.y,
				width = this._getInheritedWidth(),
				height = this._getInheritedHeight();
			return !!(isPercent(width) || isPercent(height) || isPercent(this.top) || isPercent(this.bottom) || 
				isPercent(this.left) || isPercent(this.right) || isPercent(centerX) || isPercent(centerY) || 
				this._hasFillWidth() || this._hasFillHeight() ||
				(!isDef(this.left) && !isDef(centerX) && !isDef(this.right) && this._parent && this._parent._layout._defaultHorizontalAlignment !== "left") ||
				(!isDef(this.top) && !isDef(centerY) && !isDef(this.bottom) && this._parent && this._parent._layout._defaultVerticalAlignment !== "top"));
		},
		
		startLayout: function() {
			this._batchUpdateInProgress = true;
		},
		
		finishLayout: function() {
			this._batchUpdateInProgress = false;
			UI._triggerLayout(this, true);
		},
		
		updateLayout: function(params) {
			this.startLayout();
			for(var i in params) {
				this[i] = params[i];
			}
			this.finishLayout();
		},
		
		_layoutParams: {
		 	origin: {
		 		x: 0,
		 		y: 0
		 	},
		 	isParentSize: {
		 		width: 0,
		 		height: 0
		 	},
		 	boundingSize: {
		 		width: 0,
		 		height: 0
		 	},
		 	alignment: {
		 		horizontal: "center",
		 		vertical: "center"
		 	}
	 	},

		_doLayout: function(params) {
			
			this._layoutParams = params;
			
			var dimensions = this._computeDimensions({
					layoutParams: params,
					position: {
						left: this.left,
						top: this.top,
						right: this.right,
						bottom: this.bottom,
						center: this.center
					},
					size: {
						width: this.width,
						height: this.height
					},
					layoutChildren: params.layoutChildren
				});
				
			if (params.positionElement) {
				UI._elementLayoutCount++;
				
				// Set and store the dimensions
				var styles = {
					zIndex: this.zIndex | 0
				};
				styles.left = unitize(this._measuredLeft = dimensions.left);
				styles.top = unitize(this._measuredTop = dimensions.top);
				styles.width = unitize(this._measuredWidth = dimensions.width);
				styles.height = unitize(this._measuredHeight = dimensions.height);
				this._measuredRightPadding = dimensions.rightPadding;
				this._measuredBottomPadding = dimensions.bottomPadding;
				this._measuredBorderSize = dimensions.borderSize;
				this._measuredEffectiveWidth = dimensions.effectiveWidth;
				this._measuredEffectiveHeight = dimensions.effectiveHeight;
				setStyle(this.domNode, styles);
			
				this._markedForLayout = false;
				this._hasBeenLaidOut = true;
				
				// Recompute the gradient, if it exists
				this.backgroundGradient && this._computeGradient();
				
				this.fireEvent("postlayout");
			}
			
			return dimensions;
		},

		_computeDimensions: function(params) {
			
			var layoutParams = params.layoutParams,
				boundingWidth = layoutParams.boundingSize.width,
				boundingHeight = layoutParams.boundingSize.height,
				position = params.position,
				size  = params.size,
				
				// Compute as many sizes as possible, should be everything except SIZE values for width and height and undefined values
				left = computeSize(position.left, boundingWidth, 1),
				top = computeSize(position.top, boundingHeight, 1),
				originalRight = computeSize(position.right, boundingWidth),
				originalBottom = computeSize(position.bottom, boundingHeight),
				centerX = position.center && computeSize(position.center.x, boundingWidth, 1),
				centerY = position.center && computeSize(position.center.y, boundingHeight, 1),
				width = computeSize(size.width === UI.INHERIT ? this._getInheritedWidth() : size.width, boundingWidth),
				height = computeSize(size.height === UI.INHERIT ? this._getInheritedHeight() : size.height, boundingHeight),

				// Convert right/bottom coordinates to be with respect to (0,0)
				right = layoutParams.rightIsMargin ? void 0 : isDef(originalRight) ? (boundingWidth - originalRight) : void 0,
				bottom = layoutParams.bottomIsMargin ? void 0 : isDef(originalBottom) ? (boundingHeight - originalBottom) : void 0,
				
				// Calculate the "padding"
				rightPadding = is(originalRight,"Number") ? originalRight : 0,
				bottomPadding = is(originalBottom,"Number") ? originalBottom : 0,
				origin = layoutParams.origin;
			
			is(width,"Number") && (width = Math.max(width,0));
			is(height,"Number") && (height = Math.max(height,0));

			// Unfortunately css precidence doesn't match the titanium, so we have to handle precedence and default setting ourselves
			var defaultWidth = this._defaultWidth;
			if (isDef(width)) {
				if (isDef(left)) {
					right = void 0;
				} else if (isDef(centerX)){
					if (width === UI.SIZE) {
						left = "calculateDefault";
					} else {
						left = centerX - width / 2;
						right = void 0;
					}
				} else if (!isDef(right)){
					// Set the default position
					left = "calculateDefault";
				}
			} else {
				if (isDef(centerX)) {
					if (isDef(left)) {
						width = (centerX - left) * 2;
						right = void 0;
					} else if (isDef(right)) {
						width = (right - centerX) * 2;
					} else {
						// Set the default width
						width = computeSize(defaultWidth === UI.INHERIT ? this._getInheritedWidth() : defaultWidth, boundingWidth);
					}
				} else {
					if (!isDef(left) || !isDef(right)) {
						width = computeSize(defaultWidth === UI.INHERIT ? this._getInheritedWidth() : defaultWidth, boundingWidth);
						if(!isDef(left) && !isDef(right)) {
							// Set the default position
							left = "calculateDefault";
						}
					}
				}
			}
			var defaultHeight = this._defaultHeight;
			if (isDef(height)) {
				if (isDef(top)) {
					bottom = void 0;
				} else if (isDef(centerY)){
					if(height === UI.SIZE) {
						top = "calculateDefault";
					} else {
						top = centerY - height / 2;
						bottom = void 0;
					}
				} else if (!isDef(bottom)) {
					// Set the default position
					top = "calculateDefault";
				}
			} else {
				if (isDef(centerY)) {
					if (isDef(top)) {
						height = (centerY - top) * 2;
						bottom = void 0;
					} else if (isDef(bottom)) {
						height = (bottom - centerY) * 2;
					} else {
						// Set the default height
						height = computeSize(defaultHeight === UI.INHERIT ? this._getInheritedHeight() : defaultHeight, boundingHeight);
					}
				} else {
					if (!isDef(top) || !isDef(bottom)) {
						// Set the default height
						height = computeSize(defaultHeight === UI.INHERIT ? this._getInheritedHeight() : defaultHeight, boundingHeight);
						if(!isDef(top) && !isDef(bottom)) {
							// Set the default position
							top = "calculateDefault";
						}
					}
				}
			}
			
			// Calculate the border
			function getValue(value) {
				var value = parseInt(computedStyle[value]);
				return isNaN(value) ? 0 : value;
			}
					
			var computedStyle = window.getComputedStyle(this.domNode),
				borderSize = {
					left: getValue("border-left-width") + getValue("padding-left"),
					top: getValue("border-top-width") + getValue("padding-top"),
					right: getValue("border-right-width") + getValue("padding-right"),
					bottom: getValue("border-bottom-width") + getValue("padding-bottom")
				};
				
			function constrainValue(value, minValue, maxValue) {
				return (isDef(minValue) && minValue > value ? minValue : // Apply the min width 
					isDef(maxValue) && maxValue < value ? maxValue : value); // Apply the max width
			}

			// Calculate the width/left properties if width is NOT SIZE
			var calculateWidthAfterChildren = false,
				calculateHeightAfterChildren = false;
			if (width === UI.SIZE) {
				calculateWidthAfterChildren = true;
			} else {
				if (width === UI.FILL) {
					if (isDef(left)) {
						left === "calculateDefault" && (left = 0);
						width = boundingWidth - left - rightPadding;
					} else if (isDef(right)) {
						width = right;
					}
				} else if (isDef(right)) {
					if (isDef(left)) {
						width = right - left;
					} else {
						left = right - width;
					}
				}
				width = constrainValue(width, this._minWidth, this._maxWidth) - borderSize.left - borderSize.right;
			}
			if (height === UI.SIZE) {
				calculateHeightAfterChildren = true;
			} else {
				if (height === UI.FILL) {
					if (isDef(top)) {
						top === "calculateDefault" && (top = 0);
						height = boundingHeight - top - bottomPadding;
					} else if (isDef(bottom)) {
						height = bottom;
					}
				} else if (isDef(bottom)) {
					if (isDef(top)) {
						height = bottom - top;
					} else {
						top = bottom - height;
					}
				}
				height = constrainValue(height, this._minHeight, this._maxHeight) - borderSize.top - borderSize.bottom;
			}

			if (this._getContentSize) {
				var contentSize = this._getContentSize();
				width === UI.SIZE && (width = contentSize.width);
				height === UI.SIZE && (height = contentSize.height);
			} else {
				var computedSize;
				if (params.layoutChildren) {
					computedSize = this._layout._doLayout(this,is(width,"Number") ? width : boundingWidth,is(height,"Number") ? height : boundingHeight, !is(width,"Number"), !is(height,"Number"));
				} else {
					computedSize = this._layout._computedSize;
				}
				width === UI.SIZE && (width = constrainValue(computedSize.width, this._minWidth, this._maxWidth));
				height === UI.SIZE && (height = constrainValue(computedSize.height, this._minHeight, this._maxHeight));
			}
			
			if (calculateWidthAfterChildren) {
				if (isDef(right) && !isDef(left)) {
					left = right - width;
				}
			}
			if (calculateHeightAfterChildren) {
				if (isDef(bottom) && !isDef(top)) {
					top = bottom - height;
				}
			}

			// Set the default top/left if need be
			if (left === "calculateDefault") {
				if (!layoutParams.isParentSize.width) {
					switch(layoutParams.alignment.horizontal) {
						case "center": left = computeSize("50%",boundingWidth) - borderSize.left - (is(width,"Number") ? width : 0) / 2; break;
						case "right": left = boundingWidth - borderSize.left - borderSize.right - (is(width,"Number") ? width : 0) / 2; break;
						default: left = 0; // left
					}
				} else {
					left = 0;
				}
			}
			if (top === "calculateDefault") {
				if (!layoutParams.isParentSize.height) {
					switch(layoutParams.alignment.vertical) {
						case "center": top = computeSize("50%",boundingHeight) - borderSize.top - (is(height,"Number") ? height : 0) / 2; break;
						case "bottom": top = boundingWidth - borderSize.top - borderSize.bottom - (is(height,"Number") ? height : 0) / 2; break;
						default: top = 0; // top
					}
				} else {
					top = 0;
				}
			}
			
			return {
				effectiveWidth: left + width + rightPadding + borderSize.left + borderSize.right,
				effectiveHeight: top + height + bottomPadding + borderSize.top + borderSize.bottom,
				left: Math.round(left + origin.x),
				top: Math.round(top + origin.y),
				rightPadding: Math.round(rightPadding),
				bottomPadding: Math.round(bottomPadding),
				width: Math.round(Math.max(width,0)),
				height: Math.round(Math.max(height,0)),
				borderSize: borderSize
			};
		},
		
		convertPointToView: function(point, destinationView) {
			
			// Make sure that both nodes are connected to the root
			if (!this._isAttachedToActiveWin() || !destinationView._isAttachedToActiveWin()) {
				return null;
			}
			
			if (!point || !is(point.x,"Number") || !is(point.y,"Number")) {
				throw new Error("Invalid point");
			}
			
			if (!destinationView.domNode) {
				throw new Error("Invalid destination view");
			}
			
			function getAbsolutePosition(node, point, additive) {
				var x = point.x,
					y = point.y,
					multiplier = (additive ? 1 : -1);
					
				while(node) {
					x += multiplier * node.domNode.offsetLeft;
					y += multiplier * node.domNode.offsetTop;
					node = node._parent;
				}
					
				return {x: x, y: y};
			}
			
			// Find this node's location relative to the root
			return getAbsolutePosition(destinationView,getAbsolutePosition(this,point,true),false);
		},

		// This method returns the offset of the content relative to the parent's location. 
		// This is useful for controls like ScrollView that can move the children around relative to itself.
		_getContentOffset: function(){
			return {x: 0, y: 0};
		},
		
		_computeGradient: function() {
			
			var backgroundGradient = this.backgroundGradient;
				colors = backgroundGradient.colors,
				type = backgroundGradient.type,
				cssVal = type + "-gradient(";
			
			// Convert common units to absolute
			var startPointX = computeSize(backgroundGradient.startPoint.x, this._measuredWidth),
				startPointY = computeSize(backgroundGradient.startPoint.y, this._measuredHeight),
				centerX = computeSize("50%", this._measuredWidth),
				centerY = computeSize("50%", this._measuredHeight),
				numColors = colors.length;
			
			if (type === "linear") {
				
				// Convert linear specific values to absolute
				var endPointX = computeSize(backgroundGradient.endPoint.x, this._measuredWidth),
					endPointY = computeSize(backgroundGradient.endPoint.y, this._measuredHeight);
					
				var userGradientStart,
					userGradientEnd;
				if (Math.abs(startPointX - endPointX) < 0.01) {
					// Vertical gradient shortcut
					if (startPointY < endPointY) {
						userGradientStart = startPointY;
						userGradientEnd = endPointY;
						cssVal += "270deg";
					} else {
						userGradientStart = endPointY;
						userGradientEnd = startPointY;
						cssVal += "90deg";
					}
				} else if(Math.abs(startPointY - endPointY) < 0.01) {
					// Horizontal gradient shortcut
					if (startPointX < endPointX) {
						userGradientStart = startPointX;
						userGradientEnd = endPointX;
						cssVal += "0deg";
					} else {
						userGradientStart = endPointX;
						userGradientEnd = startPointX;
						cssVal += "180deg";
					}
				}else {
					
					// Rearrange values so that start is to the left of end
					var mirrorGradient = false;
					if (startPointX > endPointX) {
						mirrorGradient = true;
						var temp = startPointX;
						startPointX = endPointX;
						endPointX = temp;
						temp = startPointY;
						startPointY = endPointY;
						endPointY = temp;
					}
					
					// Compute the angle, start location, and end location of the gradient
					var angle = Math.atan2(endPointY - startPointY, endPointX - startPointX)
						tanAngle = Math.tan(angle),
						cosAngle = Math.cos(angle),
						originLineIntersection = centerY - centerX * tanAngle;
						userDistance = (startPointY - startPointX * tanAngle - originLineIntersection) * cosAngle,
						userXOffset = userDistance * Math.sin(angle),
						userYOffset = userDistance * cosAngle,
						startPointX = startPointX + userXOffset,
						startPointY = startPointY - userYOffset,
						endPointX = endPointX + userXOffset,
						endPointY = endPointY - userYOffset,
						shiftedAngle = Math.PI / 2 - angle;
					if (angle > 0) {
						var globalGradientStartDistance = originLineIntersection * Math.sin(shiftedAngle),
							globalGradientStartOffsetX = -globalGradientStartDistance * Math.cos(shiftedAngle),
							globalGradientStartOffsetY = globalGradientStartDistance * Math.sin(shiftedAngle);
						userGradientStart = Math.sqrt(Math.pow(startPointX - globalGradientStartOffsetX,2) + Math.pow(startPointY - globalGradientStartOffsetY,2));
						userGradientEnd = Math.sqrt(Math.pow(endPointX - globalGradientStartOffsetX,2) + Math.pow(endPointY - globalGradientStartOffsetY,2));
					} else {
						var globalGradientStartDistance = (this._measuredHeight - originLineIntersection) * Math.sin(shiftedAngle),
							globalGradientStartOffsetX = -globalGradientStartDistance * Math.cos(shiftedAngle),
							globalGradientStartOffsetY = this._measuredHeight - globalGradientStartDistance * Math.sin(shiftedAngle);
						userGradientStart = Math.sqrt(Math.pow(startPointX - globalGradientStartOffsetX,2) + Math.pow(startPointY - globalGradientStartOffsetY,2));
						userGradientEnd = Math.sqrt(Math.pow(endPointX - globalGradientStartOffsetX,2) + Math.pow(endPointY - globalGradientStartOffsetY,2));
					}
					
					// Set the angle info for the gradient
					angle = mirrorGradient ? angle + Math.PI : angle;
					cssVal += Math.round((360 * (2 * Math.PI - angle) / (2 * Math.PI))) + "deg";
				}
				
				// Calculate the color stops
				for (var i = 0; i < numColors; i++) {
					var color = colors[i];
					if (is(color,"String")) {
						color = { color: color };
					}
					if (!is(color.offset,"Number")) {
						color.offset = i / (numColors - 1);
					}
					cssVal += "," + color.color + " " + Math.round(computeSize(100 * color.offset + "%", userGradientEnd - userGradientStart) + userGradientStart) + "px";
				}
				
			} else if (type === "radial") {
				
				// Convert radial specific values to absolute
				var radiusTotalLength = Math.min(this._measuredWidth,this._measuredHeight),
					startRadius = computeSize(backgroundGradient.startRadius, radiusTotalLength),
					endRadius = computeSize(backgroundGradient.endRadius, radiusTotalLength);
				
				var colorList = [],
					mirrorGradient = false;
				if (startRadius > endRadius) {
					var temp = startRadius;
					startRadius = endRadius;
					endRadius = temp;
					mirrorGradient = true;
					
					for (var i = 0; i <= (numColors - 2) / 2; i++) {
						var mirroredPosition = numColors - i - 1;
						colorList[i] = colors[mirroredPosition],
						colorList[mirroredPosition] = colors[i];
					}
					if (numColors % 2 === 1) {
						var middleIndex = Math.floor(numColors / 2);
						colorList[middleIndex] = colors[middleIndex];
					}
				} else {
					for (var i = 0; i < numColors; i++) {
						colorList[i] = colors[i];
					}
				}
				
				cssVal += startPointX + "px " + startPointY + "px";
				
				// Calculate the color stops
				for (var i = 0; i < numColors; i++) {
					var color = colorList[i];
					if (is(color,"String")) {
						color = { color: color };
					}
					var offset;
					if (!is(color.offset,"Number")) {
						offset = i / (numColors - 1);
					} else {
						offset = mirrorGradient ? numColors % 2 === 1 && i === Math.floor(numColors / 2) ? color.offset : 1 - color.offset : color.offset;
					}
					cssVal += "," + color.color + " " + Math.round(computeSize(100 * offset + "%", endRadius - startRadius) + startRadius) + "px";
				}
			}

			cssVal += ")";

			require.each(require.config.vendorPrefixes.css, lang.hitch(this,function(vendorPrefix) {
				setStyle(this.domNode, "backgroundImage", vendorPrefix + cssVal);
			}));
		},
		
		_preventDefaultTouchEvent: true,

		_isGestureBlocked: function(gesture) {
			for (var recognizer in this._gestureRecognizers) {
				var blockedGestures = this._gestureRecognizers[recognizer].blocking;
				for (var blockedGesture in blockedGestures) {
					if (gesture === blockedGestures[blockedGesture]) {
						return true;
					}
				}
			}
			return false;
		},

		_handleTouchEvent: function(type, e) {
			this.enabled && this.fireEvent(type, e);
		},
		
		_defaultBackgroundColor: void 0,
		
		_defaultBackgroundImage: void 0,
		
		_defaultBackgroundDisabledColor: void 0,
		
		_defaultBackgroundDisabledImage: void 0,
		
		_defaultBackgroundFocusedColor: void 0,
		
		_defaultBackgroundFocusedImage: void 0,
		
		_defaultBackgroundSelectedColor: void 0,
		
		_defaultBackgroundSelectedImage: void 0,

		_doBackground: function(evt) {
			var evt = evt || {},
				m = (evt.type || "").match(/mouse(over|out)/),
				node = this.domNode,
				bi = this.backgroundImage || this._defaultBackgroundImage || "none",
				bc = this.backgroundColor || this._defaultBackgroundColor;

			if (this._touching) {
				bc = this.backgroundSelectedColor || this._defaultBackgroundSelectedColor || bc;
				bi = this.backgroundSelectedImage || this._defaultBackgroundSelectedImage || bi;
			}

			m && (this._over = m[1] === "over");
			if (!this._touching && this.focusable && this._over) {
				bc = this.backgroundFocusedColor || this._defaultBackgroundFocusedColor || bc;
				bi = this.backgroundFocusedImage || this._defaultBackgroundFocusedImage || bi;
			}

			if (!this.enabled) {
				bc = this.backgroundDisabledColor || this._defaultBackgroundDisabledColor || bc;
				bi = this.backgroundDisabledImage || this._defaultBackgroundDisabledImage || bi;
			}

			!this.backgroundGradient && setStyle(node, {
				backgroundColor: bc || (bi && bi !== "none" ? "transparent" : ""),
				backgroundImage: style.url(bi)
			});
		},

		_setFocusNode: function(node) {
			var f = this._focus = this._focus || {};

			if (f.node !== node) {
				if (f.node) {
					event.off(f.evts);
					event.off(f.evtsMore);
				}
				f.node = node;
				f.evts = [
					on(node, "focus", this, "_doBackground"),
					on(node, "blur", this, "_doBackground") /*,
					on(node, "mouseover", this, function() {
						this._doBackground();
						f.evtsMore = [
							on(node, "mousemove", this, "_doBackground"),
							on(node, "mouseout", this, function() {
								this._doBackground();
								event.off(f.evtsMore);
								f.evtsMore = [];
							})
						];
					})*/
				];
			}

			return node;
		},

		show: function() {
			this.visible = true;
		},

		hide: function() {
			this.visible = false;
		},

		animate: function(anim, callback) {
			if (UI._layoutInProgress) {
				on.once(UI,"postlayout", lang.hitch(this,function(){
					this._doAnimation(anim,callback);
				}));
			} else {
				this._doAnimation(anim,callback);
			}
		},
		
		_doAnimation: function(anim, callback) {
			var anim = anim || {},
				curve = curves[anim.curve] || "ease",
				fn = lang.hitch(this, function() {
					var transformCss = "";

					// Set the color and opacity properties
					anim.backgroundColor !== void 0 && (this.backgroundColor = anim.backgroundColor);
					anim.opacity !== void 0 && setStyle(this.domNode, "opacity", anim.opacity);
					setStyle(this.domNode, "display", anim.visible !== void 0 && !anim.visible ? "none" : "");
					
					// Set the position and size properties
					
					if (!["left", "top", "right", "bottom", "center", "width", "height"].every(function(v) { return !isDef(anim[v]); })) {
						// TODO set border width here

						var dimensions = this._computeDimensions({
							layoutParams: this._layoutParams,
							position: {
								left: val(anim.left, this.left),
								top: val(anim.top, this.top),
								right: val(anim.right, this.right),
								bottom: val(anim.bottom, this.bottom),
								center: anim.center || this.center
							},
							size: {
								width: val(anim.width, this.width),
								height: val(anim.height, this.height)
							},
							layoutChildren: false
						});
	
						setStyle(this.domNode, {
							left: unitize(dimensions.left),
							top: unitize(dimensions.top),
							width: unitize(dimensions.width),
							height: unitize(dimensions.height),
							borderLeftWidth: unitize(dimensions.borderSize.left),
							borderTopWidth: unitize(dimensions.borderSize.top),
							borderRightWidth: unitize(dimensions.borderSize.right),
							borderBottomWidth: unitize(dimensions.borderSize.bottom)
						});
					}

					// Set the z-order
					!isDef(anim.zIndex) && setStyle(this.domNode, "zIndex", anim.zIndex);

					// Set the transform properties
					if (anim.transform) {
						this._curTransform = this._curTransform ? this._curTransform.multiply(anim.transform) : anim.transform;
						transformCss = this._curTransform.toCSS();
					}

					setStyle(this.domNode, "transform", transformCss);
				});

			anim.duration = anim.duration || 0;
			anim.delay = anim.delay || 0;
			anim.transform && setStyle(this.domNode, "transform", "");
			anim.start && anim.start();

			if (anim.duration > 0) {
				// Create the transition, must be set before setting the other properties
				setStyle(this.domNode, "transition", "all " + anim.duration + "ms " + curve + (anim.delay ? " " + anim.delay + "ms" : ""));
				on.once(window, transitionEnd, lang.hitch(this, function(e) {
					if (!this._destroyed) {
						// Clear the transform so future modifications in these areas are not animated
						setStyle(this.domNode, "transition", "");
						is(anim.complete, "Function") && anim.complete();
						is(callback, "Function") && callback();
					}
				}));
				setTimeout(fn, 0);
			} else {
				fn();
				is(anim.complete, "Function") && anim.complete();
				is(callback, "Function") && callback();
			}
		},

		_setTouchEnabled: function(value) {
			setStyle(this.domNode, "pointerEvents", value ? "auto" : "none");
			if (!value) {
				for (var i in this.children) {
					this.children[i]._setTouchEnabled(value);
				}
			}
		},

		_measuredLeft: 0,
		_measuredTop: 0,
		_measuredRightPadding: 0,
		_measuredBottomPadding: 0,
		_measuredWidth: 0,
		_measuredHeight: 0,
		_measuredBorderSize: {
			value: {
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			}
		},
		
		constants: {
			size: {
				get: function() {
					return {
						x: 0,
						y: 0,
						width: this._measuredWidth,
						height: this._measuredHeight
					};
				}
			},
			rect: {
				get: function() {
					return {
						x: this._measuredTop,
						y: this._measuredLeft,
						width: this._measuredWidth,
						height: this._measuredHeight
					};
				}
			},
			parent: function() {
				return this._parent;
			}
		},

		properties: {
			backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundGradient: {
				set: function(value, oldValue) {
					
					// Type and colors are required
					if (!is(value.type,"String") || !is(value.colors,"Array") || value.colors.length < 2) {
						return;
					}
					
					// Vet the type and assign default values
					var type = value.type,
						startPoint = value.startPoint,
						endPoint = value.endPoint;
					if (type === "linear") {
						if (!startPoint || !("x" in startPoint) || !("y" in startPoint)) {
							value.startPoint = {
								x: "0%",
								y: "50%"
							}
						}
						if (!endPoint || !("x" in endPoint) || !("y" in endPoint)) {
							value.endPoint = {
								x: "100%",
								y: "50%"
							}
						}
					} else if (type === "radial") {
						if (!startPoint || !("x" in startPoint) || !("y" in startPoint)) {
							value.startPoint = {
								x: "50%",
								y: "50%"
							}
						}
					} else {
						return;
					}
					return value;
				},
				post: function() {
					this.backgroundGradient && this._computeGradient();
				}
			},

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,

			borderColor: {
				set: function(value) {
					setStyle(this.domNode, "borderColor", value);
					return value;
				}
			},

			borderRadius: {
				set: function(value) {
					setStyle(this.domNode, "borderRadius", unitize(value));
					return value;
				},
				value: 0
			},

			borderWidth: {
				set: function(value) {
					setStyle(this.domNode, "borderWidth", unitize(value));
					return value;
				},
				value: 0
			},

			bottom: postLayoutProp,

			center: postLayoutProp,

			color: {
				set: function(value) {
					return setStyle(this.domNode, "color", value);
				}
			},

			enabled: {
				post: "_doBackground",
				set: function(value) {
					this._focus.node.disabled = !value;
					return value;
				},
				value: true
			},

			focusable: {
				value: false,
				set: function(value) {
					dom.attr[value ? "set" : "remove"](this._focus.node, "tabindex", 0);
					return value;
				}
			},

			_minHeight: postLayoutProp,

			_maxHeight: postLayoutProp,

			height: postLayoutProp,

			left: postLayoutProp,

			opacity: {
				set: function(value) {
					return setStyle(this.domNode, "opacity", value);
				}
			},

			visible: {
				set: function(value, orig) {
					if (value !== orig) {
						!value && (this._lastDisplay = style.get(this.domNode, "display"));
						setStyle(this.domNode, "display", !!value ? this._lastDisplay || "" : "none");
						!!value && this._triggerLayout();
					}
					return value;
				}
			},

			right: postLayoutProp,

			touchEnabled: {
				set: function(value) {
					this._setTouchEnabled(value);
					return value;
				},
				value: true
			},

			top: postLayoutProp,

			transform: {
				set: function(value) {
					setStyle(this.domNode, "transform", value.toCSS());
					return this._curTransform = value;
				}
			},

			_minWidth: postLayoutProp,

			_maxWidth: postLayoutProp,

			width: postLayoutProp,

			zIndex: postLayoutProp
		}

	});

});
},
"Ti/_/Gestures/TouchCancel":function(){
/* /titanium/Ti/_/Gestures/TouchCancel.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TouchCancel", GestureRecognizer, {
		
		name: "touchcancel",
		
		processTouchCancelEvent: function(e, element){
			if (!element._isGestureBlocked(this.name)) {
				for (var i = 0; i < e.changedTouches.length; i++) {
					lang.hitch(element,element._handleTouchEvent(this.name,{
						x: e.changedTouches[i].clientX,
						y: e.changedTouches[i].clientY,
						source: this.getSourceNode(e,element)
					}));
				}
			}
		}

	});

});
},
"Ti/UI/TableView":function(){
/* /titanium/Ti/UI/TableView.js */

define(["Ti/_/declare", "Ti/UI/View", "Ti/_/style", "Ti/_/lang","Ti/UI/MobileWeb/TableViewSeparatorStyle", "Ti/UI"], 
	function(declare, View, style, lang, TableViewSeparatorStyle, UI) {

	var setStyle = style.set,
		is = require.is,
		isDef = lang.isDef,
		refreshSections = function() {
			this._refreshSections();
		};
		
	return declare("Ti.UI.TableView", View, {
		
		constructor: function(args) {
			
			// Content must go in a separate container so the scrollbar can exist outside of it
			var contentContainer = this._contentContainer = UI.createView({
				width: UI.INHERIT,
				height: UI.INHERIT,
				left: 0,
				top: 0,
				layout: 'vertical'
			});
			this.add(contentContainer);
			setStyle(contentContainer.domNode,"overflow","hidden");
			
			// Use horizontal layouts so that the default location is always (0,0)
			contentContainer.add(this._header = UI.createView({
				height: UI.SIZE, 
				width: UI.INHERIT, 
				layout: "vertical"
			}));
			contentContainer.add(this._sections = UI.createView({
				height: UI.SIZE, 
				width: UI.INHERIT, 
				layout: "vertical"
			}));
			contentContainer.add(this._footer = UI.createView({
				height: UI.SIZE, 
				width: UI.INHERIT, 
				layout: "vertical"
			}));
			
			this.data = [];
			
			this._createVerticalScrollBar();
			
			var self = this;
			function getContentHeight() {
				return self._header._measuredHeight + self._sections._measuredHeight + self._footer._measuredHeight;
			}
			
			// Handle scrolling
			var previousTouchLocation;
			this.addEventListener("touchstart",function(e) {
				previousTouchLocation = e.y;
				
				this._startScrollBars({
					y: contentContainer.domNode.scrollTop / (getContentHeight() - this._measuredHeight)
				},
				{
					y: contentContainer._measuredHeight / (getContentHeight())
				});
			});
			this.addEventListener("touchend",function(e) {
				previousTouchLocation = null;
				
				this._endScrollBars();
				
				// Create the scroll event
				this._isScrollBarActive && this.fireEvent("scrollEnd",{
					contentOffset: {x: 0, y: contentContainer.domNode.scrollTop + this._header._measuredHeight},
					contentSize: {width: this._sections._measuredWidth, height: this._sections._measuredHeight},
					size: {width: this._measuredWidth, height: this._measuredHeight},
					x: e.x,
					y: e.y
				});
			});
			this.addEventListener("touchmove",lang.hitch(this,function(e) {
				contentContainer.domNode.scrollTop += previousTouchLocation - e.y;
				previousTouchLocation = e.y;
				
				this._updateScrollBars({
					y: contentContainer.domNode.scrollTop / (getContentHeight() - this._measuredHeight)
				});
				
				this._fireScrollEvent(e.x,e.y);
			}));
			this.domNode.addEventListener("mousewheel",function(e) {
				self._startScrollBars({
					y: contentContainer.domNode.scrollTop / (getContentHeight() - self._measuredHeight)
				},
				{
					y: contentContainer._measuredHeight / (getContentHeight())
				});
				setTimeout(function(){
					contentContainer.domNode.scrollLeft -= e.wheelDeltaX;
					contentContainer.domNode.scrollTop -= e.wheelDeltaY;
					self._updateScrollBars({
						y: (contentContainer.domNode.scrollTop - e.wheelDeltaY) / (getContentHeight() - self._measuredHeight)
					});
					setTimeout(function(){
						self._endScrollBars();
					},10);
				},10);
			});
			
			require.on(contentContainer.domNode,"scroll",lang.hitch(this,function(e){
				if (!this._touching) {
					this._fireScrollEvent();
				}
			}));
		},
		
		_fireScrollEvent: function(x,y) {
			// Calculate the visible items
			var firstVisibleItem,
				visibleItemCount = 0,
				scrollTop = this._contentContainer.scrollTop,
				sections = this._sections.children;
			for(var i = 0; i < sections.length; i+= 2) {
				
				// Check if the section is visible
				var section = sections[i],
					sectionOffsetTop = section._measuredTop - scrollTop,
					sectionOffsetBottom = section._measuredTop + section._measuredHeight - scrollTop;
				if (sectionOffsetBottom > 0 && sectionOffsetTop < this._contentContainer._measuredHeight) {
					
					var rows = section._rows.children
					for (var j = 1; j < rows.length; j += 2) {
						var row = rows[j],
							rowOffsetTop = row._measuredTop + section._measuredTop - scrollTop,
							rowOffsetBottom = row._measuredTop + row._measuredHeight + section._measuredTop - scrollTop;
						if (rowOffsetBottom > 0 && rowOffsetTop < this._contentContainer._measuredHeight) {
							visibleItemCount++;
							if (!firstVisibleItem) {
								firstVisibleItem = row;
							}
						}
					}
				}
			}
			
			// Create the scroll event
			this._isScrollBarActive && this.fireEvent("scroll",{
				contentOffset: {x: 0, y: this._contentContainer.scrollTop},
				contentSize: {width: this._sections._measuredWidth, height: this._sections._measuredHeight},
				firstVisibleItem: firstVisibleItem,
				size: {width: this._contentContainer._measuredWidth, height: this._contentContainer._measuredHeight},
				totalItemCount: this.data.length,
				visibleItemCount: visibleItemCount,
				x: x,
				y: y
			});
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,
		
		_getContentOffset: function(){
			return {x: this._contentContainer.scrollLeft, y: this._contentContainer.scrollTop};
		},
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				if (this._tableViewRowClicked && this._tableViewSectionClicked) {
					e.row = this._tableViewRowClicked;
					e.rowData = this._tableViewRowClicked;
					var index = 0,
						sections = this._sections.children;
					for(var i = 0; i < sections.length; i+= 2) {
						var localIndex = sections[i]._rows.children.indexOf(this._tableViewRowClicked);
						if (localIndex !== -1) {
							index += Math.floor(localIndex / 2);
							break;
						} else {
							index += sections[i].rowCount;
						}
					}
					e.index = index;
					e.section = this._tableViewSectionClicked;
					e.searchMode = false; 
					View.prototype._handleTouchEvent.apply(this,arguments); // This intentionally squelches the event if a row was not click
				}
			} else {
				View.prototype._handleTouchEvent.apply(this,arguments);
			}
		},
		
		_tableViewRowClicked: null,
		_tableViewSectionClicked: null,
		
		_createSeparator: function() {
			var separator = UI.createView({
				height: 1,
				width: UI.INHERIT,
				backgroundColor: "white"
			});
			setStyle(separator.domNode,"minWidth","100%"); // Temporary hack until TIMOB-8124 is completed.
			return separator;
		},
		
		_createDecorationLabel: function(text) {
			return UI.createLabel({
				text: text, 
				backgroundColor: "darkGrey",
				color: "white",
				width: UI.INHERIT,
				height: UI.SIZE,
				left: 0,
				font: {fontSize: 22}
			});
		},
		
		_refreshSections: function() {
			for (var i = 0; i < this._sections.children.length; i += 2) {
				this._sections.children[i]._refreshRows();
			}
			this._triggerLayout();
		},
		
		_calculateLocation: function(index) {
			var currentOffset = 0,
				section;
			for(var i = 0; i < this._sections.children.length; i += 2) {
				section = this._sections.children[i];
				currentOffset += section.rowCount;
				if (index < currentOffset) {
					return {
						section: section,
						localIndex: section.rowCount - (currentOffset - index)
					};
				}
			}
			
			// Handle the special case of inserting after the last element in the last section
			if (index == currentOffset) {
				return {
					section: section,
					localIndex: section.rowCount
				};
			}
		},
		
		_insertRow: function(value, index) {
			var location = this._calculateLocation(index);
			if (location) {
				location.section.add(value,location.localIndex);
			}
			this._refreshSections();
		},
		
		_removeRow: function(index) {
			var location = this._calculateLocation(index);
			if (location) {
				location.section._removeAt(location.localIndex);
			}
		},

		appendRow: function(value) {
			this._currentSection.add(value);
			this._refreshSections();
		},
		
		deleteRow: function(index) {
			this._removeRow(index);
		},
		
		insertRowAfter: function(index, value) {
			this._insertRow(value, index + 1);
		},
		
		insertRowBefore: function(index, value) {
			this._insertRow(value, index);
		},
		
		updateRow: function(index, row) {
			this._removeRow(index);
			this._insertRow(row, index);
		},
		
		scrollToIndex: function(index) {
			var location = this._calculateLocation(index);
			if (location) {
				this._contentContainer.domNode.scrollTop = location.section._measuredTop + location.section._rows.children[2 * location.localIndex + 1]._measuredTop;
			}
		},
		
		scrollToTop: function(top) {
			this._contentContainer.scrollTop = top;
		},
		
		properties: {
			data: {
				set: function(value) {
					if (is(value,'Array')) {
						
						var retval = [];
						
						// Remove all of the previous sections
						this._sections._removeAllChildren();
						
						// Convert any object literals to TableViewRow instances
						for (var i in value) {
							if (!isDef(value[i].declaredClass) || (value[i].declaredClass != "Ti.UI.TableViewRow" && value[i].declaredClass != "Ti.UI.TableViewSection")) {
								value[i] = UI.createTableViewRow(value[i]);
							}
						}
						
						// If there is no data, we still need to create a default section
						if (value.length == 0) {
							this._sections.add(this._currentSection = UI.createTableViewSection({_tableView: this}));
							this._sections.add(this._createSeparator());
							retval.push(this._currentSection);
						}
			
						// Add each element
						for (var i = 0; i < value.length; i++) {
							if (value[i].declaredClass === "Ti.UI.TableViewRow") {
								// Check if the first item is a row, meaning we need a default section
								if (i === 0) {
									this._sections.add(this._currentSection = UI.createTableViewSection({_tableView: this}));
									this._sections.add(this._createSeparator());
									retval.push(this._currentSection);
								}
								this._currentSection.add(value[i]);
							} else if (value[i].declaredClass === "Ti.UI.TableViewSection") {
								value[i]._tableView = this;
								this._sections.add(this._currentSection = value[i]);
								this._sections.add(this._createSeparator());
								retval.push(this._currentSection);
							}
						}
						this._refreshSections();
						
						return retval;
					} else {
						// Data must be an array
						return;
					}
				}
			},
			footerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer.add(this._createDecorationLabel(value));
					}
					return value;
				}
			},
			footerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer.add(value);
					}
					return value;
				}
			},
			headerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header.add(this._createDecorationLabel(value));
						this._header.add(this._createSeparator());
					}
					return value;
				}
			},
			headerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header.add(value);
					}
					return value;
				}
			},
			maxRowHeight: {
				post: refreshSections
			},
			minRowHeight: {
				post: refreshSections
			},
			rowHeight: {
				post: refreshSections,
				value: "50px"
			},
			separatorColor: {
				post: refreshSections,
				value: "lightGrey"
			},
			separatorStyle: {
				post: refreshSections,
				value: TableViewSeparatorStyle.SINGLE_LINE
			}
		}

	});

});
},
"Ti/UI/TextField":function(){
/* /titanium/Ti/UI/TextField.js */

define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/css", "Ti/_/dom", "Ti/_/lang", "Ti/_/style", "Ti/UI"],
	function(declare, TextBox, css, dom, lang, style, UI) {

	var borderStyles = ["None", "Line", "Bezel", "Rounded"];

	return declare("Ti.UI.TextField", TextBox, {

		constructor: function(args) {
			var f = this._field = dom.create("input", {
				autocomplete: "off",
				style: {
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					bottom: 0
				}
			}, this.domNode);

			this._initTextBox();
			this._keyboardType();
			this.borderStyle = UI.INPUT_BORDERSTYLE_BEZEL;

			require.on(f, "focus", this, function() {
				this.clearOnEdit && (f.value = "");
			});
		},

        _defaultWidth: UI.SIZE,

        _defaultHeight: UI.SIZE,
		
		_getContentSize: function(width, height) {
			return {
				width: this._measureText(this.value, this._field, width).width + 6,
				height: this._measureText(this.value, this._field, width).height + 6
			};
		},

		_setTouchEnabled: function(value) {
			this.slider && style.set(this._field, "pointerEvents", value ? "auto" : "none");
		},

		_keyboardType: function(args) {
			var t = "text",
				args = args || {};
			if (lang.val(args.pm, this.passwordMask)) {
				t = "password";
			} else {
				switch (lang.val(args.kt, this.keyboardType)) {
					case UI.KEYBOARD_EMAIL:
						t = "email";
						break;
					case UI.KEYBOARD_NUMBER_PAD:
						t = "number";
						break;
					case UI.KEYBOARD_PHONE_PAD:
						t = "tel";
						break;
					case UI.KEYBOARD_URL:
						t = "url";
						break;
				}
			}
			this._field.type = t;
		},

		properties: {
			borderStyle: {
				set: function(value, oldValue) {
					var n = this.domNode,
						s = "TiUITextFieldBorderStyle";
					if (value !== oldValue) {
						// This code references constants Ti.UI.INPUT_BORDERSTYLE_NONE, 
						// Ti.UI.INPUT_BORDERSTYLE_LINE, Ti.UI.INPUT_BORDERSTYLE_BEZEL, and Ti.UI.INPUT_BORDERSTYLE_ROUNDED
						css.remove(n, s + borderStyles[oldValue]);
						css.add(n, s + borderStyles[value]);
					}
					return value;
				}
			},

			clearOnEdit: false,

			hintText: {
				set: function(value) {
					this._field.placeholder = value;
					return value;
				}
			},

			keyboardType: {
				set: function(value) {
					this._keyboardType({ kt:value });
					return value;
				}
			},

			maxLength: {
				set: function(value) {
					value = Math.min(value|0, 0);
					dom.attr[value > 0 ? "set" : "remove"](this._field, "maxlength", value);
					return value;
				}
			},

			passwordMask: {
				value: false,
				set: function(value) {
					this._keyboardType({ pm:value });
					return value;
				}
			}
		}

	});

});

},
"Ti/_/dom":function(){
/* /titanium/Ti/_/dom.js */

/**
 * create(), attr(), place(), & remove() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/_/style"], function(_, style) {
	var is = require.is,
		forcePropNames = {
			innerHTML:	1,
			className:	1,
			value:		1
		},
		attrNames = {
			// original attribute names
			classname: "class",
			htmlfor: "for",
			// for IE
			tabindex: "tabIndex",
			readonly: "readOnly"
		},
		names = {
			// properties renamed to avoid clashes with reserved words
			"class": "className",
			"for": "htmlFor",
			// properties written as camelCase
			tabindex: "tabIndex",
			readonly: "readOnly",
			colspan: "colSpan",
			frameborder: "frameBorder",
			rowspan: "rowSpan",
			valuetype: "valueType"
		},
		attr = {
			set: function(node, name, value) {
				if (arguments.length === 2) {
					// the object form of setter: the 2nd argument is a dictionary
					for (var x in name) {
						attr.set(node, x, name[x]);
					}
					return node;
				}

				var lc = name.toLowerCase(),
					propName = names[lc] || name,
					forceProp = forcePropNames[propName],
					attrId, h;

				if (propName === "style" && !require.is(value, "String")) {
					return style.set(node, value);
				}

				if (forceProp || is(value, "Boolean") || is(value, "Function")) {
					node[name] = value;
					return node;
				}

				// node's attribute
				node.setAttribute(attrNames[lc] || name, value);
				return node;
			},
			remove: function(node, name) {
				node.removeAttribute(name);
				return node;
			}
		};

	return {
		create: function(tag, attrs, refNode, pos) {
			var doc = refNode ? refNode.ownerDocument : document;
			is(tag, "String") && (tag = doc.createElement(tag));
			attrs && attr.set(tag, attrs);
			refNode && this.place(tag, refNode, pos);
			return tag;
		},

		attr: attr,

		place: function(node, refNode, pos) {
			refNode.appendChild(node);
			return node;
		},

		detach: function(node) {
			return node.parentNode && node.parentNode.removeChild(node);
		},

		destroy: function(node) {
			try {
				var destroyContainer = node.ownerDocument.createElement("div");
				destroyContainer.appendChild(this.detach(node) || node);
				destroyContainer.innerHTML = "";
			} catch(e) {
				/* squelch */
			}
		},

		unitize: function(x) {
			return isNaN(x-0) || x-0 != x ? x : x + "px"; // note: must be != and not !==
		},
		
		computeSize: function(x, totalLength, convertSizeToUndef) {
			if (is(x,"Number") && isNaN(x)) {
				return 0;
			}
			var type = require.is(x);
			if (type === "String") {
				var UI = require("Ti/UI");
				if (x === UI.SIZE) {
					convertSizeToUndef && (x = void 0);
				} else {
					var value = parseFloat(x),
						units = x.substring(x.length - 2);
					units.indexOf("%") !== -1 && (units = "%");

					switch(units) {
						case "%":
							if(totalLength == UI.SIZE) {
								convertSizeToUndef ? void 0 : UI.SIZE;
							} else if (!require.is(totalLength,"Number")) {
								console.error("Could not compute percentage size/position of element.");
								return;
							} 
							return value / 100 * totalLength;
						case "mm":
							value *= 10;
						case "cm":
							return value * 0.0393700787 * _.dpi;
						case "in":
							return value * _.dpi;
						case "px":
							return value;
						case "dp":
							return value * _.dpi / 96;
					}
				}
			} else if (type !== "Number") {
				x = void 0;
			}

			return x;
		}
	};
});
},
"Ti/_/UI/Widget":function(){
/* /titanium/Ti/_/UI/Widget.js */

define(["Ti/_/declare", "Ti/UI/View"], function(declare, View) {

	// base class for various widgets that will eventually merge with Ti._.UI.Element in 1.9
	return declare("Ti._.UI.Widget", View);

});
},
"Ti/Media/VideoPlayer":function(){
/* /titanium/Ti/Media/VideoPlayer.js */

define(["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/Media", "Ti/UI/View"],
	function(declare, dom, event, lang, Media, View) {

	var doc = document,
		on = require.on,
		prefixes = require.config.vendorPrefixes.dom,
		STOPPED = 0,
		STOPPING = 1,
		PAUSED = 2,
		PLAYING = 3,
		requestFullScreen = "requestFullScreen",
		exitFullScreen = "exitFullScreen",
		nativeFullScreen = (function() {
			for (var i = 0, prefix; i < prefixes.length; i++) {
				prefix = prefixes[i].toLowerCase();
				if (doc[prefix + "CancelFullScreen"]) {
					requestFullScreen = prefix + "RequestFullScreen";
					exitFullScreen = prefix + "ExitFullScreen";
					return 1;
				}
			}
			return !!doc.cancelFullScreen;
		}()),
		fakeFullscreen = true,
		mimeTypes = {
			"m4v": "video/mp4",
			"mov": "video/quicktime",
			"mp4": "video/mp4",
			"ogg": "video/ogg",
			"ogv": "video/ogg",
			"webm": "video/webm"
		};

	function isFullScreen(fs) {
		return nativeFullScreen ? (!!doc.mozFullScreen || !!doc.webkitIsFullScreen) : !!fs;
	}

	return declare("Ti.Media.VideoPlayer", View, {

		_currentState: STOPPED,

		constructor: function() {
			this._handles = [];
		},

		properties: {
			autoplay: false,
			currentPlaybackTime: {
				get: function() {
					return this._video ? this._video.currentTime * 1000 : 0;
				},
				set: function(value) {
					this._video && (this._video.currentTime = (value / 1000) | 0);
					return value;
				}
			},
			fullscreen: {
				value: isFullScreen(),

				set: function(value) {
					var h,
						v = this._video;

					value = !!value;
					if (nativeFullScreen) {
						try {
							value === isFullScreen() && (value = !value);
							v[value ? requestFullScreen : exitFullScreen]();
						} catch(ex) {}
					} else if (fakeFullscreen) {
						v.className = value ? "fullscreen" : "";
						value && (h = on(window, "keydown", function(e) {
							if (e.keyCode === 27) {
								this.fullscreen = 0;
								h();
							}
						}));
					}

					this.fireEvent("fullscreen", {
						entering: value
					});

					return value;
				}
			},
			mediaControlStyle: {
				value: Media.VIDEO_CONTROL_DEFAULT,
				set: function(value) {
					this._video && (this._video.controls = value === Media.VIDEO_CONTROL_DEFAULT);
					return value;
				}
			},
			repeatMode: Media.VIDEO_REPEAT_MODE_NONE,
			scalingMode: {
				set: function(value) {
					var n = this.domNode,
						fit = Media.VIDEO_SCALING_ASPECT_FIT,
						m = {};

					m[Media.VIDEO_SCALING_NONE] = "TiScalingNone";
					m[fit] = "TiScalingAspectFit";
					n.className = n.className.replace(/(scaling\-[\w\-]+)/, "") + ' ' + (m[value] || m[value = fit]);
					return value;
				}
			},
			url: {
				set: function(value) {
					this.constants.playing = false;
					this._currentState = STOPPED;
					this.properties.__values__.url = value;
					this._createVideo();
					return value;
				}
			}
		},

		constants: {
			playbackState: Media.VIDEO_PLAYBACK_STATE_STOPPED,
			playing: false,
			initialPlaybackTime: 0,
			endPlaybackTime: 0,
			playableDuration: 0,
			loadState: Media.VIDEO_LOAD_STATE_UNKNOWN,
			duration: 0
		},

		_set: function(type, state) {
			var evt = {};
			evt[type] = this.constants[type] = state;
			this.fireEvent(type === "loadState" ? type.toLowerCase() : type, evt);
		},

		_complete: function(evt) {
			var ended = evt.type === "ended";
			this.constants.playing = false;
			this._currentState = STOPPED;
			this.fireEvent("complete", {
				reason: ended ? Media.VIDEO_FINISH_REASON_PLAYBACK_ENDED : Media.VIDEO_FINISH_REASON_USER_EXITED
			});
			ended && this.repeatMode === Media.VIDEO_REPEAT_MODE_ONE && setTimeout(lang.hitch(this, function() { this._video.play(); }), 1);
		},

		_stalled: function() {
			this._set("loadState", Media.VIDEO_LOAD_STATE_STALLED);
		},

		_fullscreenChange: function(e) {
			this.properties.__values__.fullscreen = !isFullScreen(this.fullscreen);
		},

		_durationChange: function() {
			var d = this._video.duration * 1000,
				c = this.constants;
			if (d !== Infinity) {
				this.duration || this.fireEvent("durationAvailable", {
					duration: d
				});
				c.duration = c.playableDuration = c.endPlaybackTime = d;
			}
		},

		_paused: function() {
			var pbs = Media.VIDEO_PLAYBACK_STATE_STOPPED;
			this.constants.playing = false;
			if (this._currentState === PLAYING) {
				this._currentState = PAUSED;
				pbs = Media.VIDEO_PLAYBACK_STATE_PAUSED;
			} else if (this._currentState === STOPPING) {
				this._video.currentTime = 0;
			}
			this._set("playbackState", pbs);
		},

		_createVideo: function(dontCreate) {
			var i, match,
				video = this._video,
				url = this.url;

			if (!url) {
				return;
			}

			if (dontCreate && video && video.parentNode) {
				return video;
			}

			this.release();

			video = this._video = dom.create("video", {
				tabindex: 0
			});

			this.mediaControlStyle === Media.VIDEO_CONTROL_DEFAULT && (video.controls = 1);
			this.scalingMode = Media.VIDEO_SCALING_ASPECT_FIT;

			this._handles = [
				on(video, "playing", this, function() {
					this._currentState = PLAYING;
					this.constants.playing = true;
					this.fireEvent("playing", {
						url: video.currentSrc
					});
					this._set("playbackState", Media.VIDEO_PLAYBACK_STATE_PLAYING);
				}),
				on(video, "pause", this, "_paused"),
				on(video, "canplay", this, function() {
					this._set("loadState", Media.VIDEO_LOAD_STATE_PLAYABLE);
					this._currentState === STOPPED && this.autoplay && video.play();
				}),
				on(video, "canplaythrough", this, function() {
					this._set("loadState", Media.VIDEO_LOAD_STATE_PLAYTHROUGH_OK);
					this.fireEvent("preload");
				}),
				on(video, "loadeddata", this, function() {
					this.fireEvent("load");
				}),
				on(video, "loadedmetadata", this, "_durationChange"),
				on(video, "durationchange", this, "_durationChange"),
				on(video, "timeupdate", this, function() {
					this.constants.currentPlaybackTime = this._video.currentTime * 1000;
					this._currentState === STOPPING && this.pause();
				}),
				on(video, "error", this, function() {
					var msg = "Unknown error";
					switch (video.error.code) {
						case 1: msg = "Aborted"; break;
						case 2: msg = "Decode error"; break;
						case 3: msg = "Network error"; break;
						case 4: msg = "Unsupported format";
					}
					this.constants.playing = false;
					this._set("loadState", Media.VIDEO_LOAD_STATE_UNKNOWN);
					this.fireEvent("error", {
						message: msg
					});
					this.fireEvent("complete", {
						reason: Media.VIDEO_FINISH_REASON_PLAYBACK_ERROR
					});
				}),
				on(video, "abort", this, "_complete"),
				on(video, "ended", this, "_complete"),
				on(video, "stalled", this, "_stalled"),
				on(video, "waiting", this, "_stalled"),
				on(video, "mozfullscreenchange", this, "_fullscreenChange"),
				on(video, "webkitfullscreenchange", this, "_fullscreenChange")
			];

			this.domNode.appendChild(video);

			require.is(url, "Array") || (url = [url]);

			for (i = 0; i < url.length; i++) {
				match = url[i].match(/.+\.([^\/\.]+?)$/);
				dom.create("source", {
					src: url[i],
					type: match && mimeTypes[match[1]]
				}, video);
			}

			return video;
		},

		play: function() {
			this._currentState !== PLAYING && this._createVideo(1).play();
		},

		pause: function() {
			this._currentState === PLAYING && this._createVideo(1).pause();
		},

		destroy: function() {
			this.release();
			View.prototype.destroy.apply(this, arguments);
		},

		release: function() {
			var i,
				video = this._video,
				parent = video && video.parentNode;
			this._currentState = STOPPED;
			this.constants.playing = false;
			if (parent) {
				event.off(this._handles);
				parent.removeChild(video);
			}
			this._video = null;
		},

		stop: function() {
			var v = this._video;
			this._currentState = STOPPING;
			if (v) {
				v.pause();
				v.currentTime = 0;
			}
		}

	});

});

},
"Ti/UI/OptionDialog":function(){
/* /titanium/Ti/UI/OptionDialog.js */

define(["Ti/_/declare", "Ti/_/lang", "Ti/_/Evented", "Ti/Locale", "Ti/UI", "Ti/_/css"],
	function(declare, lang, Evented, Locale, UI, css) {

	return declare("Ti.UI.OptionDialog", Evented, {

		show: function() {
			// Create the window and a background to dim the current view
			var optionsWindow = this._optionsWindow = UI.createWindow(),
				dimmingView = UI.createView({
					backgroundColor: "black",
					opacity: 0,
					left: 0,
					top: 0,
					right: 0,
					bottom: 0
				}),
				optionsDialog = UI.createView({
					width: "100%",
					height: UI.SIZE,
					bottom: 0,
					backgroundColor: "white",
					layout: "vertical",
					opacity: 0
				});

			optionsWindow.add(dimmingView);
			optionsWindow.add(optionsDialog);

			// Add the title
			optionsDialog.add(UI.createLabel({
				text: Locale._getString(this.titleid, this.title),
				font: {fontWeight: "bold"},
				left: 5,
				right: 5,
				top: 5,
				height: UI.SIZE,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));

			// Create buttons
			require.is(this.options, "Array") && this.options.forEach(function(opt, i, arr) {
				var button = UI.createButton({
					left: 5,
					right: 5,
					top: 5,
					bottom: i === arr.length - 1 ? 5 : 0,
					height: UI.SIZE,
					title: opt,
					index: i
				});
				if (i === this.destructive) {
					css.add(button.domNode, "TiUIElementGradientDestructive");
				} else if (i === this.cancel) {
					css.add(button.domNode, "TiUIElementGradientCancel");
				}
				optionsDialog.add(button);
				button.addEventListener("singletap", lang.hitch(this, function(){
					optionsWindow.close();
					this._optionsWindow = void 0;
					this.fireEvent("click", {
						index: i,
						cancel: this.cancel,
						destructive: this.destructive
					});
				}));
			}, this);

			// Animate the background after waiting for the first layout to occur
			optionsWindow.addEventListener("postlayout", function() {
				optionsDialog.animate({
					bottom: -optionsDialog._measuredHeight,
					opacity: 1,
					duration: 0
				});
				dimmingView.animate({
					opacity: 0.5,
					duration: 150
				}, function(){
					optionsDialog.animate({
						bottom: 0,
						duration: 150
					});
				});
			});

			// Show the options dialog
			optionsWindow.open();
		},

		properties: {
			cancel: -1,
			destructive: -1,
			options: void 0,
			title: void 0,
			titleid: void 0
		}

	});

});

},
"Ti/Locale":function(){
/* /titanium/Ti/Locale.js */

define(["require", "Ti/_/lang", "Ti/_/Evented"], function(require, lang, Evented) {

	var locale = lang.val(navigator.language,navigator.browserLanguage).replace(/^([^\-\_]+)[\-\_](.+)?$/, function(o, l, c){ return l.toLowerCase() + (c && "-" + c.toUpperCase()); }),
		languageParts = locale.split("-"),
		language = languageParts[0];
		strings = {},
		cfg = require.config,
		app = cfg.app;

	document.title = app.name = app.names[language] || app.name;

	try {
		~cfg.locales.indexOf(language) && (strings = require("./Locale/" + language + "/i18n"));
	} catch (e) {}

	function getString(key, hint) {
		return strings[key] || hint || key || "";
	}

	Object.defineProperty(window, "L", { value: getString, enumarable: true });

	// format a date into a locale specific date format. Optionally pass a second argument (string) as either "short" (default), "medium" or "long" for controlling the date format.
	String.formatDate = function(dt, fmt) {
		console.debug('Method "String.formatDate" is not implemented yet.');
		return dt.toString();
	};

	// format a date into a locale specific time format.
	String.formatTime = function(dt) {
		console.debug('Method "String.formatTime" is not implemented yet.');
		return dt.toString();
	};

	// format a number into a locale specific currency format.
	String.formatCurrency = function(amt) {
		console.debug('Method "String.formatCurrency" is not implemented yet.');
		return amt;
	};

	// format a number into a locale specific decimal format.
	String.formatDecimal = function(dec) {
		console.debug('Method "String.formatDecimal" is not implemented yet.');
		return dec;
	};

	return lang.setObject("Ti.Locale", Evented, {

		constants: {
			currentCountry: languageParts[1] || "",
			currentLanguage: languageParts[0] || "",
			currentLocale: locale
		},

		formatTelephoneNumber: function(s) {
			return s;
		},

		getCurrencyCode: function(locale) {
			// locale = "en-US" => "USD"
			return "";
		},

		getCurrencySymbol: function(currencyCode) {
			// currencyCode = "en-US" => "$"
			return "";
		},

		getLocaleCurrencySymbol: function(locale) {
			// locale = "en-US" => "$"
			return "";
		},

		getString: getString,

		_getString: function(key, hint) {
			return lang.val(hint, getString(key, hint));
		}

	});

});
},
"Ti/_/Gestures/TouchEnd":function(){
/* /titanium/Ti/_/Gestures/TouchEnd.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TouchEnd", GestureRecognizer, {
		
		name: "touchend",
		
		processTouchEndEvent: function(e, element){
			if (!element._isGestureBlocked(this.name)) {
				for (var i = 0; i < e.changedTouches.length; i++) {
					lang.hitch(element,element._handleTouchEvent(this.name,{
						x: e.changedTouches[i].clientX,
						y: e.changedTouches[i].clientY,
						source: this.getSourceNode(e,element)
					}));
				}
			}
		}

	});

});
},
"Ti/_/Gestures/DoubleTap":function(){
/* /titanium/Ti/_/Gestures/DoubleTap.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.DoubleTap", GestureRecognizer, {
		
		name: "doubletap",
		
		_firstTapTime: null,
		_firstTapLocation: null,
		
		// This is the amount of time that can elapse before the two taps are considered two separate single taps
		_timeThreshold: 250,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
				
		initTracker: function(x,y) {
			this._firstTapTime = (new Date()).getTime();
			this._firstTapLocation = {
				x: x,
				y: y
			}
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				
				if (this._firstTapTime) {
					var elapsedTime = (new Date()).getTime() - this._firstTapTime;
					this._firstTapTime = null;
					if (elapsedTime < this._timeThreshold && Math.abs(this._firstTapLocation.x - x) < this._driftThreshold && 
							Math.abs(this._firstTapLocation.y - y) < this._driftThreshold) {
						var result = {
							x: x,
							y: y,
							source: this.getSourceNode(e,element)
						};
						if (!element._isGestureBlocked(this.name)) {
							this.blocking.push("singletap");
							lang.hitch(element,element._handleTouchEvent("dblclick",result));
							lang.hitch(element,element._handleTouchEvent(this.name,result));
						}
					} else {
						this.initTracker(x,y);
					}
				} else {
					this.initTracker(x,y);
				}
				
			}
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchCancelEvent: function(e, element){
			this._firstTapTime = null;
		}

	});

});
},
"Ti/UI/TableViewSection":function(){
/* /titanium/Ti/UI/TableViewSection.js */

define(["Ti/_/declare", "Ti/_/lang", "Ti/_/UI/Widget", "Ti/_/style","Ti/UI/MobileWeb/TableViewSeparatorStyle", "Ti/UI"], 
	function(declare, lang, Widget, style, TableViewSeparatorStyle, UI) {
	
	var is = require.is,
		setStyle = style.set;

	return declare("Ti.UI.TableViewSection", Widget, {
		
		constructor: function(args) {
			this._indexedContent = [];

			require.each(["_header", "_rows", "_footer"], lang.hitch(this, function(v) {
				Widget.prototype.add.call(this, this[v] = UI.createView({ 
					height: UI.SIZE, 
					width: UI.INHERIT, 
					layout: "vertical"
				}));
			}));

			// Create the parts out of Ti controls so we can make use of the layout system
			this.layout = "vertical";
		},

		_defaultWidth: UI.INHERIT,

		_defaultHeight: UI.SIZE,
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._tableView && (this._tableView._tableViewSectionClicked = this);
			}
			Widget.prototype._handleTouchEvent.apply(this,arguments);
		},
		
		_tableView: null,
		
		_createSeparator: function() {
			var showSeparator = this._tableView && this._tableView.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE,
				separator = UI.createView({
					height: showSeparator ? 1 : 0,
					width: UI.INHERIT,
					backgroundColor: showSeparator ? this._tableView.separatorColor : "transparent"
				});
			setStyle(separator.domNode,"minWidth","100%"); // Temporary hack until TIMOB-8124 is completed.
			return separator;
		},
		
		_createDecorationLabel: function(text) {
			return UI.createLabel({
				text: text, 
				backgroundColor: "darkGrey",
				color: "white",
				width: UI.INHERIT,
				height: UI.SIZE,
				left: 0,
				font: {fontSize: 18}
			});
		},
		
		_refreshRows: function() {
			if (this._tableView) {
				// Update the row information
				var rows = this._rows.children,
					tableView = this._tableView,
					rowsData = this.constants.rows = [];
				for (var i = 1; i < rows.length; i += 2) {
					var row = rows[i];
					row._defaultHeight = tableView.rowHeight;
					row._minHeight = tableView.minRowHeight;
					row._maxHeight = tableView.maxRowHeight;
					rowsData.push(row);
				}
				
				for (var i = 0; i < rows.length; i += 2) {
					var row = rows[i];
					if (tableView.separatorStyle === TableViewSeparatorStyle.SINGLE_LINE) {
						row.height = 1;
						row.backgroundColor = tableView.separatorColor;
					} else {
						row.height = 0;
						row.backgroundColor = "transparent";
					}
				}
			}
		},
		
		_insertHelper: function(value, index) {
			if (!lang.isDef(value.declaredClass) || value.declaredClass != "Ti.UI.TableViewRow") {
				value = UI.createTableViewRow(value);
			}
			
			this._rows._insertAt(value, 2 * index + 1);
			this._rows._insertAt(this._createSeparator(), 2 * index + 2);
			value._tableViewSection = this;
			this.rowCount++;
			this._refreshRows();
		},
		
		add: function(value, index) {
			
			var rows = this._rows.children,
				rowCount = this.rowCount;
			if (!lang.isDef(index)) {
				index = rowCount;
			}
			if (index < 0 || index > rowCount) {
				return;
			}
			
			if (rows.length === 0) {
				this._rows.add(this._createSeparator());
			}
			
			if (is(value,"Array")) {
				for (var i in value) {
					this._insertHelper(value[i],index++);
				}
			} else {
				this._insertHelper(value,index);
			}
		},
		
		_removeAt: function(index) {
			if (index < 0 || index >= this.rowCount) {
				return;
			}
			this._rows.children[2 * index + 1]._tableViewSection = null;
			this._rows.remove(this._rows.children[2 * index + 1]); // Remove the separator
			this._rows.remove(this._rows.children[2 * index + 1]); // Remove the row
			
			// Remove the last separator, if there are no rows left
			if (this._rows.children.length === 1) {
				this._rows.remove(this._rows.children[0]);
			}
			this._refreshRows();
		},
		
		remove: function(view) {
			var index = this._rows.children.indexOf(view);
			if (index === -1) {
				return;
			}
			
			this._removeAt(index);
		},
		
		constants: {
			rows: void 0
		},
					
		properties: {
			footerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer.add(this._createDecorationLabel(value));
						this._footer.add(this._createSeparator());
					}
					return value;
				}
			},
			footerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._footer._removeAllChildren();
						this._footer.add(value);
					}
					return value;
				}
			},
			headerTitle: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header.add(this._createDecorationLabel(value));
						this._header.add(this._createSeparator());
					}
					return value;
				}
			},
			headerView: {
				set: function(value, oldValue) {
					if (oldValue != value) {
						this._header._removeAllChildren();
						this._header.add(value);
					}
					return value;
				}
			},
			
			rowCount: function(value) {
				return Math.floor(this._rows.children.length / 2);
			}
		}

	});

});
},
"Ti/UI/AlertDialog":function(){
/* /titanium/Ti/UI/AlertDialog.js */

define(["Ti/_/css", "Ti/_/declare", "Ti/_/lang", "Ti/_/Evented", "Ti/Locale", "Ti/UI"],
	function(css, declare, lang, Evented, Locale, UI) {

	return declare("Ti.UI.AlertDialog", Evented, {

		show: function() {
			// Create the window and a background to dim the current view
			var alertWindow = this._alertWindow = UI.createWindow(),
				dimmingView = UI.createView({
					backgroundColor: "black",
					opacity: 0,
					left: 0,
					top: 0,
					right: 0,
					bottom: 0
				}),
				alertDialog = UI.createView({
					backgroundColor: "white",
					borderRadius: 3,
					height: UI.SIZE,
					layout: "vertical",
					opacity: 0,
					width: "50%"
				}),
				buttons = this.buttonNames || [];

			alertWindow.add(dimmingView);
			alertWindow.add(alertDialog);

			// Add the title
			alertDialog.add(UI.createLabel({
				text: Locale._getString(this.titleid, this.title),
				font: {fontWeight: "bold"},
				left: 5,
				right: 5,
				top: 5,
				height: UI.SIZE,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));

			// Add the message
			alertDialog.add(UI.createLabel({
				text: Locale._getString(this.messageid, this.message),
				left: 5,
				right: 5,
				top: 5,
				height: UI.SIZE,
				textAlign: UI.TEXT_ALIGNMENT_CENTER
			}));

			buttons.length || buttons.push(Locale._getString(this.okid, this.ok || "OK"));

			buttons.forEach(function(title, i) {
				var button = UI.createButton({
					left: 5,
					right: 5,
					top: 5,
					bottom: i === buttons.length - 1 ? 5 : 0,
					height: UI.SIZE,
					title: title,
					index: i
				});
				i === this.cancel && css.add(button.domNode, "TiUIElementGradientCancel");
				alertDialog.add(button);
				button.addEventListener("singletap", lang.hitch(this, function(){
					alertWindow.close();
					this._alertWindow = void 0;
					this.fireEvent("click", {
						index: i,
						cancel: this.cancel === i
					});
				}));
			}, this);

			// Animate the background after waiting for the first layout to occur
			alertWindow.addEventListener("postlayout", function() {
				dimmingView.animate({
					opacity: 0.5,
					duration: 200
				}, function(){
					alertDialog.animate({
						opacity: 1,
						duration: 200
					});
				});
			});

			// Show the alert dialog
			alertWindow.open();
		},

		hide: function() {
			this._alertWindow && this._alertWindow.close();
		},

		properties: {
			buttonNames: void 0,
			cancel: -1,
			message: void 0,
			messageid: void 0,
			ok: void 0,
			okid: void 0,
			title: void 0,
			titleid: void 0
		}

	});

});

},
"Ti/_/UI/TextBox":function(){
/* /titanium/Ti/_/UI/TextBox.js */

define(
	["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/style", "Ti/_/lang", "Ti/_/UI/FontWidget", "Ti/UI"],
	function(declare, dom, event, style, lang, FontWidget, UI) {
		
	var setStyle = style.set;

	return declare("Ti._.UI.TextBox", FontWidget, {
		
		constructor: function(){
			this._addEventModifier(["click", "singletap", "blur", "change", "focus", "return"], function(data) {
				data.value = this.value;
			});
		},

		_field: null,
		
		_preventDefaultTouchEvent: false,

		_initTextBox: function() {
			// wire up events
			var field = this._field,
				form = this._form = dom.create("form", null, this.domNode);

			this._addStyleableDomNode(this._setFocusNode(field));

			require.on(field, "keydown", this, function(e) {
				if (this.editable) {
					if (e.keyCode === 13) {
						if (this.suppressReturn) {
							event.stop(e);
							field.blur();
						}
						this.fireEvent("return");
					}
				} else {
					event.stop(e);
				}
			});
			require.on(field, "keypress", this, function() {
				this._capitalize();
			});
			
			var updateInterval = null,
				previousText = "";
			require.on(field, "focus", this, function(){
				updateInterval = setInterval(lang.hitch(this,function(){
					var value = field.value,
						newData = false;
					if (previousText.length != value.length) {
						newData = true;
					} else if(previousText != value) {
						newData = true;
					}
					if (newData) {
						this.fireEvent("change");
						previousText = value;
					}
				}),200);
			});
			require.on(field, "blur", this, function(){
				clearInterval(updateInterval);
			});
		},

		_capitalize: function(ac, val) {
			var f = this._field,
				ac = "off";
			switch (ac || this.autocapitalization) {
				case UI.TEXT_AUTOCAPITALIZATION_ALL:
					f.value = f.value.toUpperCase();
					break;
				case UI.TEXT_AUTOCAPITALIZATION_SENTENCES:
					ac = "on";
			}
			this._field.autocapitalize = ac;
		},

		blur: function() {
			this._field.blur();
			this.fireEvent("blur");
		},

		focus: function() {
			this._field.focus();
			this.fireEvent("focus");
		},

		hasText: function() {
			return !this._field.value.length;
		},

		properties: {
			autocapitalization: {
				value: UI.TEXT_AUTOCAPITALIZATION_SENTENCES,
				set: function(value, oldValue) {
					value !== oldValue && this._capitalize(value);
					return value;
				}
			},

			autocorrect: {
				value: false,
				set: function(value) {
					this._field.autocorrect = !!value ? "on" : "off";
					return value;
				}
			},

			editable: true,

			returnKeyType: {
				value: UI.RETURNKEY_DEFAULT,
				set: function(value) {
					var title = "",
						dest = this.domNode,
						disp = "none";
					if (value !== UI.RETURNKEY_DEFAULT) {
						dest = this._form;
						disp = "inherit";
						~[4,8,10].indexOf(value) && (title = "Search");
					}
					setStyle(this._form,"display",disp);
					this._field.title = title;
					dom.place(this._field, dest);
					return value;
				}
			},

			suppressReturn: true,

			textAlign: {
				set: function(value) {
					setStyle(this._field, "textAlign", /(center|right)/.test(value) ? value : "left");
					return value;
				}
			},

			value: {
				get: function() {
					return this._field.value;
				},
				set: function(value) {
					return this._capitalize(this._field.value = value);
				},
				value: ""
			}
		}

	});

});
},
"Ti/_/css":function(){
/* /titanium/Ti/_/css.js */

define(["Ti/_", "Ti/_/string"], function(_, string) {
	function processClass(node, cls, adding) {
		var i = 0, p,
			cn = " " + node.className + " ",
			cls = require.is(cls, "Array") ? cls : cls.split(" ");

		for (; i < cls.length; i++) {
			p = cn.indexOf(" " + cls[i] + " ");
			if (adding && p === -1) {
				cn += cls[i] + " ";
			} else if (!adding && p !== -1) {
				cn = cn.substring(0, p) + cn.substring(p + cls[i].length + 1);
			}
		}

		node.className = string.trim(cn);
	}

	return _.css = {
		add: function(node, cls) {
			processClass(node, cls, 1);
		},

		remove: function(node, cls) {
			processClass(node, cls);
		},

		clean: function(cls) {
			return cls.replace(/[^A-Za-z0-9\-]/g, "");
		}
	};
});
},
"Ti/XML":function(){
/* /titanium/Ti/XML.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	// Add getters and setters to the various prototypes
	[
		[
			"Document",
			"doctype,implementation,documentElement,inputEncoding,xmlEncoding,domConfig",
			"xmlStandalone,xmlVersion,strictErrorChecking,documentURI"
		],[
			"Node",
			"nodeName,nodeType,parentNode,childNodes,firstChild,lastChild,previousSibling,nextSibling,attributes,ownerDocument,namespaceURI,localName,baseURI",
			"textContent,nodeValue,prefix"
		],[
			"NamedNodeMap",
			"length"
		],[
			"CharacterData",
			"length",
			"data"
		],[
			"Attr",
			"name,specified,ownerElement,schemaTypeInfo,isId",
			"value"
		],[
			"Element",
			"tagName,schemaTypeInfo"
		],[
			"Text",
			"isElementContentWhitespace,wholeText"
		],[
			"DocumentType",
			"name,entities,notations,publicId,systemId,internalSubset"
		],[
			"Notation",
			"publicId,systemId"
		],[
			"NodeList",
			"length"
		],[
			"Entity",
			"publicId,systemId,notationName,inputEncoding,xmlEncoding,xmlVersion"
		],[
			"ProcessingInstruction",
			"target",
			"data"
		]
	].forEach(function(e) {
		var f = window[e[0]];
		f && lang.generateAccessors(f, e[1], e[2]);
	});

	Object.defineProperty(Element.prototype, "text", { 
		get: function() { return this.textContent; },
		enumerable: true
	});

	return lang.setObject("Ti.XML", Evented, {
		
		parseString: function(xml) {
			return (new DOMParser()).parseFromString(xml,"text/xml");
		},
		
		serializeToString: function(node) {
			return (new XMLSerializer()).serializeToString(node);
		}

	});

});
},
"Ti/Network":function(){
/* /titanium/Ti/Network.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var conn = navigator.connection,
		online = navigator.onLine,
		Network = lang.setObject("Ti.Network", Evented, {

			constants: {
				NETWORK_LAN: 1,
				NETWORK_MOBILE: 3,
				NETWORK_NONE: 0,
				NETWORK_UNKNOWN: -1,
				NETWORK_WIFI: 2,
				networkType: function() {
					if (!online) {
						return Network.NETWORK_NONE;
					}		
					if (conn && conn.type == conn.WIFI) {
						return Network.NETWORK_WIFI;
					}
					if (conn && conn.type == conn.ETHERNET) {
						return Network.NETWORK_LAN;
					}
					if (conn && (conn.type == conn.CELL_2G || conn.type == conn.CELL_3G)) {
						return Network.NETWORK_MOBILE;
					}
					return Network.NETWORK_UNKNOWN;
				},
				networkTypeName: function() {
					if (!online) {
						return "NONE";
					}		
					if (conn && conn.type == conn.WIFI) {
						return "WIFI";
					}
					if (conn && conn.type == conn.ETHERNET) {
						return "LAN";
					}
					if (conn && (conn.type == conn.CELL_2G || conn.type == conn.CELL_3G)) {
						return "MOBILE";
					}
					return "UNKNOWN";
				},
				online: function() {
					return online;
				}
			},

			properties: {
				httpURLFormatter: null
			},

			createHTTPClient: function(args) {
				return new (require("Ti/Network/HTTPClient"))(args);
			},

			decodeURIComponent: function(value) {
				return decodeURIComponent(value);
			},

			encodeURIComponent: function(value) {
				return encodeURIComponent(value);
			}

		});

	function onlineChange(evt) {
		evt.type === "online" && !online && (online = 1);
		evt.type === "offline" && online && (online = 0);

		Network.fireEvent("change", {
			networkType		: Network.networkType,
			networkTypeName	: Network.networkTypeName,
			online			: online
		});
	}

	require.on(window, "online", onlineChange);
	require.on(window, "offline", onlineChange);

	return Network;

});
},
"Ti/_/Gestures/TouchStart":function(){
/* /titanium/Ti/_/Gestures/TouchStart.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.TouchStart", GestureRecognizer, {
		
		name: "touchstart",
		
		processTouchStartEvent: function(e, element){
			if (!element._isGestureBlocked(this.name)) {
				for (var i = 0; i < e.changedTouches.length; i++) {
					lang.hitch(element,element._handleTouchEvent(this.name,{
						x: e.changedTouches[i].clientX,
						y: e.changedTouches[i].clientY,
						source: this.getSourceNode(e,element)
					}));
				}
			}
		}

	});

});
},
"Ti/Blob":function(){
/* /titanium/Ti/Blob.js */

define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	return declare("Ti.Blob", Evented, {

		constructor: function(args) {
			args = args || {};
			this._data = args.data || "";
		},

		postscript: function() {
			var type = this.mimeType,
				img,
				v = this.constants.__values__;

			(this._isBinary = /^(application|image|audio|video)\//.test(type)) && (v.size = v.length);

			if (!type.indexOf("image/")) {
				img = new Image;
				require.on.once(img, "load", function() {
					v.width = img.width;
					v.height = img.height;
				});
				img.src = this.toString();
			}
		},

		append: function(/*String|Blob*/blob) {
			blob && (this._data = (this._data || "") + blob.toString());
		},

		toString: function() {
			return (this._isBinary ? "data:" + this.mimeType + ";base64," : "") + (this._data || "");
		},

		constants: {
			file: null,
			height: 0,
			length: 0,
			mimeType: "",
			nativePath: "",
			size: 0,
			text: function() {
				return this._isBinary ? null : this._data || "";
			},
			width: 0
		}

	});

});
},
"Ti/UI/PickerColumn":function(){
/* /titanium/Ti/UI/PickerColumn.js */

define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/UI", "Ti/_/style", "Ti/_/lang"],
	function(declare, FontWidget, dom, UI, style, lang) {
		
	var setStyle = style.set,
		contentPadding = 15,
		on = require.on;

	return declare("Ti.UI.PickerColumn", FontWidget, {
		
		constructor: function() {
			var self = this,
				clickEventName = "ontouchstart" in window ? "touchend" : "click",
				upArrow = this._upArrow = dom.create("div", {
					className: "TiUIElementGradient",
					style: {
						textAlign: "center",
						position: "absolute",
						top: "0px",
						height: "40px",
						width: "100%",
						borderBottom: "1px solid #666",
						fontSize: "28px",
						cursor: "pointer"
					},
					innerHTML: "\u2227"
				}, this.domNode);
			on(upArrow, clickEventName, function(){
				var nextRow = self._rows.indexOf(self.selectedRow);
				if (nextRow > 0) {
					self.selectedRow = self._rows[nextRow - 1];
				} else {
					self.selectedRow = self._rows[self._rows.length - 1];
				}
			});
			
			var titleContainer = this._titleContainer = dom.create("div", {
				style: {
					position: "absolute",
					top: "50%",
					height: "1em",
					width: "100%",
					marginTop: "-0.5em",
					textAlign: "center"
				}
			}, this.domNode);
			this._addStyleableDomNode(titleContainer);
			
			var titleClickArea = dom.create("div", {
				style: {
					position: "absolute",
					top: "40px",
					bottom: "40px",
					width: "100%"
				}
			}, this.domNode);
			on(titleClickArea, clickEventName, function() {
				// Create the window and a background to dim the current view
				var listWindow = UI.createWindow();
				var dimmingView = UI.createView({
					backgroundColor: "black",
					opacity: 0,
					left: 0,
					top: 0,
					right: 0,
					bottom: 0
				});
				listWindow.add(dimmingView);
				
				// Create the list dialog itself
				var listDialog = UI.createView({
					width: "75%",
					height: UI.SIZE,
					backgroundColor: "white",
					layout: "vertical",
					borderRadius: 3,
					opacity: 0
				});
				listWindow.add(listDialog);
				
				// Create the table rows
				var rows = self._rows,
					data = [],
					selectedRowIndex = 0;
				for(var i in rows) {
					var row = rows[i],
						isSelectedRow = row === self.selectedRow;
					data.push({
						title: row.title,
						hasCheck: isSelectedRow
					});
					isSelectedRow && (selectedRowIndex = parseInt(i));
				}
				
				// Add the table to the dialog
				var listTable = UI.createTableView({
					left: 5,
					right: 5,
					top: 5,
					height: data.length < 10 ? UI.SIZE : "70%",
					data: data
				});
				listDialog.add(listTable);
				listTable.addEventListener("singletap", function(e) {
					e.index in self._rows && (self.selectedRow = self._rows[e.index]);
					listWindow.close();
				});
				
				// Add a cancel button
				var cancelButton = UI.createButton({
					left: 5,
					top: 5,
					right: 5,
					title: "Cancel"
				});
				listDialog.add(cancelButton);
				cancelButton.addEventListener("singletap", function() {
					listWindow.close();
				});
				
				// Add a view to handle padding since there is no TI API to do it
				listDialog.add(UI.createView({ height: "5px" }));
				
				// Show the options dialog
				listWindow.open();
				
				// Animate the background after waiting for the first layout to occur
				setTimeout(function(){
					dimmingView.animate({
						opacity: 0.5,
						duration: 200
					}, function(){
						listDialog.animate({
							opacity: 1,
							duration: 200
						}, function() {
							listTable.scrollToIndex(selectedRowIndex);
						});
					});
				},30);
			});
			
			var downArrow = this._downArrow = dom.create("div", {
				className: "TiUIElementGradient",
				style: {
					textAlign: "center",
					position: "absolute",
					bottom: "0px",
					height: "40px",
					width: "100%",
					borderTop: "1px solid #666",
					fontSize: "28px",
						cursor: "pointer"
				}
			}, this.domNode);
			downArrow.innerHTML = "\u2228";
			on(downArrow, clickEventName, function() {
				var nextRow = self._rows.indexOf(self.selectedRow);
				if (nextRow < self._rows.length - 1) {
					self.selectedRow = self._rows[nextRow + 1];
				} else {
					self.selectedRow = self._rows[0];
				}
			});
			this._rows = [];
		},
		
		_setCorners: function(left, right, radius) {
			setStyle(this._upArrow, "borderTopLeftRadius", left ? radius : "0px");
			setStyle(this._downArrow, "borderBottomLeftRadius", left ? radius : "0px");
			setStyle(this._upArrow, "borderTopRightRadius", right ? radius : "0px");
			setStyle(this._downArrow, "borderBottomRightRadius", right ? radius : "0px");
			setStyle(this.domNode,"borderRight", right ? "" : "1px solid #666");
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_doLayout: function() {
			this._updateContentWidth();
			this._parentPicker && this._parentPicker._updateColumnHeights();
			
			return FontWidget.prototype._doLayout.apply(this,arguments);
		},
		
		_getContentSize: function(width, height) {
			var titleContainer = this._titleContainer;
				text = titleContainer.innerHTML;
			return {
				width: Math.max(this._widestRowWidth + contentPadding, 100),
				height: this._tallestRowHeight + contentPadding + this._upArrow.clientHeight + this._downArrow.clientHeight
			};
		},
		
		_widestRowWidth: 0,
		
		_tallestRowHeight: 0,
		
		_updateContentWidth: function() {
			if (this._hasSizeDimensions()) {
				var widestRowWidth = 0;
				for(var i in this._rows) {
					var row = this._rows[i];
					widestRowWidth = Math.max(widestRowWidth, row._measureText(row.title, row.domNode).width);
				}
				if (this._widestRowWidth !== widestRowWidth) {
					this._widestRowWidth = widestRowWidth;
					this._triggerLayout();
				}
			}
		},
		
		_getTallestRowHeight: function() {
			if (this._hasSizeDimensions()) {
				var widestRowWidth = 0,
					tallestRowHeight = 0;
				for(var i in this._rows) {
					var row = this._rows[i];
					tallestRowHeight = Math.max(tallestRowHeight, row._measureText(row.title, row.domNode).height);
				}
				return tallestRowHeight;
			}
		},
		
		_setTallestRowHeight: function(height) {
			if (this._tallestRowHeight !== height) {
				this._tallestRowHeight = height;
				this._triggerLayout();
			}
		},
		
		addRow: function(row) {
			this._rows.push(row);
			row._parentColumn = this;
			this._updateContentWidth();
			this._parentPicker && this._parentPicker._updateColumnHeights();
			if (!this.selectedRow) {
				this.selectedRow = row;
			}
		},
		
		removeRow: function(row) {
			var rowIndex = this._rows.indexOf(row);
			if (rowIndex !== -1) {
				this._rows.splice(rowIndex,1);
				row._parentColumn = void 0;
				this._updateContentWidth();
				this._parentPicker && this._parentPicker._updateColumnHeights();
				if (this.selectedRow === row) {
					this.selectedRow = this._rows[0];
				}
			}
		},
		
		constants: {
			
			rowCount: {
				get: function() {
					return this._rows.length;
				}
			},
			
			rows: {
				get: function() {
					return this._rows;
				}
			}
			
		},
		
		properties: {
			
			selectedRow: {
				set: function(value) {
					if (!value) {
						this.font = void 0;
						this.color = void 0;
						this._titleContainer.innerHTML = "";
						this._hasSizeDimensions() && this._triggerLayout();
					} else {
						var rowIndex = this._rows.indexOf(value);
						if (rowIndex === -1) {
							return;
						}
						this.font = value.font;
						this.color = lang.val(value.color, "");
						this._titleContainer.innerHTML = value.title;
						this._hasSizeDimensions() && this._triggerLayout();
					}
					return value;
				},
				post: function(value) {
					this.fireEvent("change", {
						column: this,
						rowIndex: this._rows.indexOf(value),
						row: value,
						value: value && value.title
					});
				}
			}
			
		}
	
	});
	
});
},
"url:Ti/_/UI/WebViewBridge.js":"var a, b,\n\
	w = window,\n\
	p = w.parent,\n\
	u = w.onunload;\n\
\n\
if(p && p.Ti){\n\
	a = p.Ti.API;\n\
	b = p.Ti.App;\n\
	Ti = {\n\
		API: {\n\
			log: a.log,\n\
			debug: a.debug,\n\
			error: a.error,\n\
			info: a.info,\n\
			warn: a.warn\n\
		},\n\
		App: {\n\
			addEventListener: b.addEventListener,\n\
			removeEventListener: b.removeEventListener,\n\
			fireEvent: b.fireEvent\n\
		}\n\
	};\n\
}\n\
\n\
w.onunload = function() {\n\
	Ti.App.fireEvent(\"WEBVIEW_ID\");\n\
	u && u();\n\
};",
"Ti/UI/Picker":function(){
/* /titanium/Ti/UI/Picker.js */

define(["Ti/_/declare", "Ti/UI/View", "Ti/_/UI/Widget", "Ti/UI", "Ti/_/lang", "Ti/_/dom", "Ti/_/ready"],
	function(declare, View, Widget, UI, lang, dom, ready) {
		
	var is = require.is,
		borderRadius = 6,
		unitizedBorderRadius = dom.unitize(borderRadius),
		inputSizes = {},
		DateTimeInput = declare(Widget, {
			
			constructor: function() {
				var input = this._input = dom.create("input", {
					style: {
						left: unitizedBorderRadius,
						top: unitizedBorderRadius,
						right: unitizedBorderRadius,
						bottom: unitizedBorderRadius,
						position: "absolute"
					}
				}, this.domNode);
				var currentValue = this._input.value,
					self = this;
				function handleChange() {
					if (currentValue !== input.value) {
						currentValue = input.value;
						self.fireEvent("change", {
							value: input.valueAsDate
						});
					}
				}
				on(this._input, "ontouchstart" in window ? "touchend" : "click", function() {
					handleChange();
				});
				on(this._input, "keyup", function() {
					handleChange();
				});
			},
			
			_doLayout: function(params) {
				var values = this.properties.__values__;
				values.width = params.isParentSize.width ? UI.SIZE : "100%";
				values.height = params.isParentSize.height ? UI.SIZE : "100%";
				
				return Widget.prototype._doLayout.call(this,params);
			},
		
			_getContentSize: function(width, height) {
				return inputSizes[this.type];
			},
			
			properties: {
				type: {
					set: function(value) {
						this._input.type = value;
						return value;
					}
				},
				min: {
					set: function(value) {
						this._input.min = lang.val(value,"");
						return value;
					}
				},
				max: {
					set: function(value) {
						this._input.max = lang.val(value,"");
						return value;
					}
				},
				value: {
					set: function(value) {
						// Some browsers have this property, but if you assign to it, it throws an exception.
						try {
							this._input.valueAsDate = value;
						} catch(e) {}
					}
				}
			}
		});
	
	ready(function() {
		var inputRuler = dom.create("input", {
			style: {
				height: "auto",
				width: "auto"
			}
		}, document.body);
		
		["Date", "Time", "DateTime"].forEach(function(type) {
			try {
				inputRuler.type = type;
			} catch(e) {}
			inputSizes[type] = {
				width: inputRuler.clientWidth + 2 * borderRadius,
				height: inputRuler.clientHeight + 2 * borderRadius
			};
		});
		
		dom.detach(inputRuler);
	});

	return declare("Ti.UI.Picker", View, {
		
		constructor: function() {
			this.layout = "horizontal";
			this._layout._defaultVerticalAlignment = "center";
			this._columns = [];
		},
		
		_currentColumn: null,
		
		_addColumn: function(column) {
			this._columns.push(column);
			column._parentPicker = this;
			var numColumns = this._columns.length,
				width = this.width === UI.SIZE ? UI.SIZE : 100 / numColumns + "%",
				height = this.height === UI.SIZE ? UI.SIZE : "100%";
			for (var i = 0; i < numColumns; i++) {
				var column = this._columns[i];
				column.width = width;
				column.height = height;
				column._setCorners(i === 0, i === numColumns - 1, unitizedBorderRadius);
			}
			column._pickerChangeEventListener = lang.hitch(this,function(e) {
				var eventInfo = {
					column: e.column,
					columnIndex: this._columns.indexOf(e.column),
					row: e.row,
					rowIndex: e.rowIndex
				};
				if (this.type === UI.PICKER_TYPE_PLAIN) {
					var selectedValue = []
					for(var i in this._columns) {
						var selectedRow = this._columns[i].selectedRow;
						selectedRow && selectedValue.push(selectedRow.title);
					}
					eventInfo.selectedValue = selectedValue;
				} else {
					
				}
				this.fireEvent("change", eventInfo);
			});
			column.addEventListener("change", column._pickerChangeEventListener);
			View.prototype.add.call(this,column);
		},
		
		_updateColumnHeights: function() {
			var tallestColumnHeight = 0,
				i;
			for(i in this._columns) {
				tallestColumnHeight = Math.max(tallestColumnHeight, this._columns[i]._getTallestRowHeight());
			}
			for(i in this._columns) {
				this._columns[i]._setTallestRowHeight(tallestColumnHeight);
			}
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		add: function(value) {
			if (is(value,"Array")) {
				for (var i in value) {
					this.add(value[i]);
				}
			} else if(lang.isDef(value.declaredClass)) {
				if (value.declaredClass === "Ti.UI.PickerColumn") {
					this._addColumn(value);
				} else if(value.declaredClass === "Ti.UI.PickerRow") {
					this._currentColumn === null && (this._addColumn(this._currentColumn = UI.createPickerColumn()));
					this._currentColumn.addRow(value);
				}
			}
		},
		
		getSelectedRow: function(columnIndex) {
			var column = this._columns[columnIndex];
			return column && column.selectedRow;
		},
		
		setSelectedRow: function(columnIndex, rowIndex) {
			var column = this._columns[columnIndex];
			column && (column.selectedRow = column.rows[rowIndex]);
		},
		
		properties: {
			columns: {
				get: function(value) {
					return this._columns;
				},
				set: function(value) {
					
					// Remove the existing columns
					this._removeAllChildren();
					for(var i in this._columns) {
						var column = this._columns[i];
						column.removeEventListener(column._pickerChangeEventListener);
						column._parentPicker = void 0;
					}
					this._columns = [];
					
					// Add the new column(s)
					value && this.add(value);
					
					// We intentionally don't return anything because we are not using the internal storage mechanism.
				}
			},
			
			maxDate: {
				set: function(value) {
					this._dateTimeInput && (this._dateTimeInput.max = value);
					return value;
				}
			},
			
			minDate: {
				set: function(value) {
					this._dateTimeInput && (this._dateTimeInput.min = value);
					return value;
				}
			},
			
			type: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this.columns = void 0;
						this._dateTimeInput = null;
						var self = this;
						function createInput(inputType) {
							var dateTimeInput = self._dateTimeInput = new DateTimeInput({
								type: inputType
							});
							dateTimeInput.addEventListener("change", function(e) {
								self.properties.__values__.value = e.value;
								self.fireEvent("change",e);
							});
							dateTimeInput.min = self.min;
							dateTimeInput.max = self.max;
							View.prototype.add.call(self,dateTimeInput);
						}
						switch(value) {
							case UI.PICKER_TYPE_DATE:
								createInput("Date");
								break;
							case UI.PICKER_TYPE_TIME:
								createInput("Time");
								break;
							case UI.PICKER_TYPE_DATE_AND_TIME: 
								createInput("DateTime");
								break;
						}
					}
					return value;
				},
				value: UI.PICKER_TYPE_PLAIN
			},
			
			value: {
				set: function(value) {
					this._dateTimeInput.value = value;
					return value;
				}
			}
			
		}
	
	});
	
});
},
"Ti/_/string":function(){
/* /titanium/Ti/_/string.js */

/**
 * String.format() functionality based on dojox.string code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["Ti/_", "Ti/_/lang"], function(_, lang) {

	var assert = _.assert,
		has = require.has,
		is = require.is,
		mix = require.mix,
		zeros10 = "0000000000",
		spaces10 = "          ",
		specifiers = {
			b: {
				base: 2,
				isInt: 1
			},
			o: {
				base: 8,
				isInt: 1
			},
			x: {
				base: 16,
				isInt: 1
			},
			X: {
				extend: ["x"],
				toUpper: 1
			},
			d: {
				base: 10,
				isInt: 1
			},
			i: {
				extend: ["d"]
			},
			u: {
				extend: ["d"],
				isUnsigned: 1
			},
			c: {
				setArg: function(token) {
					if (!isNaN(token.arg)) {
						var num = parseInt(token.arg);
						assert(num < 0 || num > 127, "Invalid character code passed to %c in sprintf");
						token.arg = isNaN(num) ? "" + num : String.fromCharCode(num);
					}
				}
			},
			s: {
				setMaxWidth: function(token) {
					token.maxWidth = token.period === "." ? token.precision : -1;
				}
			},
			e: {
				isDouble: 1
			},
			E: {
				extend: ["e"],
				toUpper: 1
			},
			f: {
				isDouble: 1
			},
			F: {
				extend: ["f"]
			},
			g: {
				isDouble: 1
			},
			G: {
				extend: ["g"],
				toUpper: 1
			}
		};

	function pad(token, length, padding) {
		var tenless = length - 10,
			pad;

		is(token.arg, "String") || (token.arg = "" + token.arg);

		while (token.arg.length < tenless) {
			token.arg = token.rightJustify ? token.arg + padding : padding + token.arg;
		}

		pad = length - token.arg.length;
		token.arg = token.rightJustify ? token.arg + padding.substring(0, pad) : padding.substring(0, pad) + token.arg;
	}

	function zeroPad(token, length) {
		pad(token, lang.val(length, token.precision), zeros10);
	}

	function spacePad(token, length) {
		pad(token, lang.val(length, token.minWidth), spaces10);
	}

	function fitField(token) {
		token.maxWidth >= 0 && token.arg.length > token.maxWidth ? token.arg.substring(0, token.maxWidth) : token.zeroPad ? zeroPad(token, token.minWidth) : spacePad(token);
	}

	function formatInt(token) {
		var i = parseInt(token.arg);

		if (!isFinite(i)) {
			// allow this only if arg is number
			assert(!is(token.arg, "Number"), "Format argument '" + token.arg + "' not an integer; parseInt returned " + i);
			i = 0;
		}

		// if not base 10, make negatives be positive
		// otherwise, (-10).toString(16) is '-a' instead of 'fffffff6'
		i < 0 && (token.isUnsigned || token.base != 10) && (i = 0xffffffff + i + 1);

		if (i < 0) {
			token.arg = (-i).toString(token.base);
			zeroPad(token);
			token.arg = "-" + token.arg;
		} else {
			token.arg = i.toString(token.base);
			// need to make sure that argument 0 with precision==0 is formatted as ''
			i || token.precision ? zeroPad(token) : (token.arg = "");
			token.sign && (token.arg = token.sign + token.arg);
		}
		if (token.base === 16) {
			token.alternative && (token.arg = '0x' + token.arg);
			token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
		}
		token.base === 8 && token.alternative && token.arg.charAt(0) != '0' && (token.arg = '0' + token.arg);
	}

	function formatDouble(token) {
		var f = parseFloat(token.arg);

		if (!isFinite(f)) {
			// allow this only if arg is number
			assert(!is(token.arg, "Number"), "Format argument '" + token.arg + "' not a float; parseFloat returned " + f);
			// C99 says that for 'f':
			//   infinity -> '[-]inf' or '[-]infinity' ('[-]INF' or '[-]INFINITY' for 'F')
			//   NaN -> a string  starting with 'nan' ('NAN' for 'F')
			// this is not commonly implemented though.
			f = 0;
		}

		switch (token.specifier) {
			case 'e':
				token.arg = f.toExponential(token.precision);
				break;
			case 'f':
				token.arg = f.toFixed(token.precision);
				break;
			case 'g':
				// C says use 'e' notation if exponent is < -4 or is >= prec
				// ECMAScript for toPrecision says use exponential notation if exponent is >= prec,
				// though step 17 of toPrecision indicates a test for < -6 to force exponential.
				if(Math.abs(f) < 0.0001){
					//print("forcing exponential notation for f=" + f);
					token.arg = f.toExponential(token.precision > 0 ? token.precision - 1 : token.precision);
				}else{
					token.arg = f.toPrecision(token.precision);
				}

				// In C, unlike 'f', 'gG' removes trailing 0s from fractional part, unless alternative format flag ("#").
				// But ECMAScript formats toPrecision as 0.00100000. So remove trailing 0s.
				if(!token.alternative){
					//print("replacing trailing 0 in '" + s + "'");
					token.arg = token.arg.replace(/(\..*[^0])0*/, "$1");
					// if fractional part is entirely 0, remove it and decimal point
					token.arg = token.arg.replace(/\.0*e/, 'e').replace(/\.0$/,'');
				}
				break;
			default:
				throw new Error("Unexpected double notation '" + token.doubleNotation + "'");
		}

		// C says that exponent must have at least two digits.
		// But ECMAScript does not; toExponential results in things like "1.000000e-8" and "1.000000e+8".
		// Note that s.replace(/e([\+\-])(\d)/, "e$10$2") won't work because of the "$10" instead of "$1".
		// And replace(re, func) isn't supported on IE50 or Safari1.
		token.arg = token.arg.replace(/e\+(\d)$/, "e+0$1").replace(/e\-(\d)$/, "e-0$1");

		// Ensure a '0' before the period.
		// Opera implements (0.001).toString() as '0.001', but (0.001).toFixed(1) is '.001'
		has("opera") && (token.arg = token.arg.replace(/^\./, '0.'));

		// if alt, ensure a decimal point
		if (token.alternative) {
			token.arg = token.arg.replace(/^(\d+)$/,"$1.");
			token.arg = token.arg.replace(/^(\d+)e/,"$1.e");
		}

		f >= 0 && token.sign && (token.arg = token.sign + token.arg);
		token.arg = token.toUpper ? token.arg.toUpperCase() : token.arg.toLowerCase();
	}

	String.format = function(format) {
		var args = lang.toArray(arguments),
			re = /\%(?:\(([\w_]+)\)|([1-9]\d*)\$)?([0 +\-\#]*)(\*|\d+)?(\.)?(\*|\d+)?[hlL]?([\%scdeEfFgGiouxX])/g,
			tokens = [],
			sequence,
			mapped = 0,
			match,
			copy,
			content,
			lastIndex = 0,
			position = 0,
			str = "",
			keys = ["mapping", "intmapping", "flags", "_minWidth", "period", "_precision", "specifier"];

		// tokenize
		while (match = re.exec(format)) {
			content = format.slice(lastIndex, re.lastIndex - match[0].length);
			content.length && tokens.push(content);
			if (has("opera")) {
				copy = match.slice(0);
				while (copy.length < match.length) {
					copy.push(null);
				}
				match = copy;
			}
			sequence = {};
			match.slice(1).concat(tokens.length).map(function(x, y) {
				keys[y] && (sequence[keys[y]] = x);
			});
			tokens.push(sequence);
			sequence[0] && mapped++;
			lastIndex = re.lastIndex;
		}
		content = format.slice(lastIndex);
		content.length && tokens.push(content);

		// strip off the format
		args.shift();
		assert(!mapped || args.length, "Format has no mapped arguments");

		require.each(tokens, function(token) {
			var tf,
				flags = {},
				fi,
				flag,
				mixins = specifiers[token.specifier];

			if (is(token, "String")) {
				str += token;
			} else {
				if (mapped) {
					assert(args[token.mapping] === void 0, "Missing key " + token.mapping);
				} else {
					token.intmapping && (position = parseInt(token.intmapping) - 1);
					assert(position < args.length, "Got " + args.length + " format arguments, insufficient for '" + format + "'");
				}
				token.arg = args[mapped ? token.mapping : position++];

				if (!token.compiled) {
					mix(token, {
						compiled: 1,
						sign: "",
						zeroPad: 0,
						rightJustify: 0,
						alternative: 0,
						minWidth: token._minWidth | 0,
						maxWidth: -1,
						toUpper: 0,
						isUnsigned: 0,
						isInt: 0,
						isDouble: 0,
						precision: token.period === '.' ? token._precision | 0 : 1
					});

					for (tf = token.flags, fi = tf.length; fi--;) {
						flags[flag = tf.charAt(fi)] = 1;
						switch (flag) {
							case " ":
								token.sign = " ";
								break;
							case "+":
								token.sign = "+";
								break;
							case "0":
								token.zeroPad = !flags["-"];
								break;
							case "-":
								token.rightJustify = 1;
								token.zeroPad = 0;
								break;
							case "\#":
								token.alternative = 1;
								break;
							default:
								throw new Error("Bad formatting flag '" + flag + "'");
						}
					}

					assert(mixins !== void 0, "Unexpected specifier '" + token.specifier + "'");

					if (mixins.extend) {
						mix(mixins, specifiers[mixins.extend]);
						delete mixins.extend;
					}
					mix(token, mixins);
				}

				is(token.setArg, "Function") && token.setArg(token);
				is(token.setMaxWidth, "Function") && token.setMaxWidth(token);

				if (token._minWidth === "*") {
					assert(mapped, "* width not supported in mapped formats");
					assert(isNaN(token.minWidth = parseInt(args[position++])), "The argument for * width at position " + position + " is not a number in " + this._format);
					// negative width means rightJustify
					if (token.minWidth < 0) {
						token.rightJustify = 1;
						token.minWidth = -token.minWidth;
					}
				}

				if(token._precision === "*" && token.period === "."){
					assert(mapped, "* precision not supported in mapped formats");
					assert(isNaN(token.precision = parseInt(args[position++])), "The argument for * precision at position " + position + " is not a number in " + this._format);
					// negative precision means unspecified
					if (token.precision < 0) {
						token.precision = 1;
						token.period = '';
					}
				}

				if (token.isInt) {
					// a specified precision means no zero padding
					token.period === '.' && (token.zeroPad = 0);
					formatInt(token);
				} else if(token.isDouble) {
					token.period !== '.' && (token.precision = 6);
					formatDouble(token);
				}

				fitField(token);

				str += "" + token.arg;
			}
		});

		return str;
	};

	return {
		capitalize: function(s) {
			s = s || "";
			return s.substring(0, 1).toUpperCase() + s.substring(1);
		},

		trim: String.prototype.trim ?
			function(str){ return str.trim(); } :
			function(str){ return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); }
	};

});
},
"Ti/Filesystem/FileStream":function(){
/* /titanium/Ti/Filesystem/FileStream.js */

define(["Ti/_/declare", "Ti/IOStream"], function(declare, IOStream) {

	return declare("Ti.Filesystem.Filestream", IOStream);

});
},
"Ti/Facebook":function(){
/* /titanium/Ti/Facebook.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var facebookInitialized = false,
		loginAfterInitialization = false,
		appid = null,
		notLoggedInMessage = "not logged in",
		facebookDiv = document.createElement("div"),
		facebookScriptTagID = "facebook-jssdk",
		facebookLoaded = false,
		api;
		
	function initFacebook() {
		FB.init({
			appId: appid, // App ID
			status: false, // do NOT check login status because we're gonna do it after init() anyways
			cookie: true, // enable cookies to allow the server to access the session
			oauth: true, // enable OAuth 2.0
			xfbml: true  // parse XFBML
		});
		FB.getLoginStatus(function(response){
			facebookInitialized = true;
			(response.status == "connected" && initSession(response)) || loginAfterInitialization && loginInternal();
		}, true);
	}

	function initSession(response) {
		var authResponse = response.authResponse;
		if (authResponse) {
			// Set the various status members
			api.loggedIn = true;
			api.uid = authResponse.userID;
			api.expirationDate = new Date((new Date()).getTime() + authResponse.expiresIn * 1000);
			api.accessToken = authResponse.accessToken;

			// Set a timeout to match when the token expires
			authResponse.expiresIn && setTimeout(function(){ 
				api.logout();
			}, authResponse.expiresIn * 1000);

			// Fire the login event
			api.fireEvent("login", {
				cancelled: false,
				data: response,
				success: true,
				uid: api.uid
			});

			return true;
		}
	}

	function processResponse(response, requestParamName, requestParamValue, callback) {
		result = {source:api,success:false};
		result[requestParamName] = requestParamValue;
		if (!response || response.error) {
			response && (result["error"] = response.error);
		} else {
			result["success"] = true;
			result["result"] = JSON.stringify(response);
		}
		callback(result);
	}
		
	function loginInternal() {
		FB.login(function(response) {
			initSession(response) || api.fireEvent("login", {
				cancelled	: true,
				data		: response,
				error		: "user cancelled or an internal error occured.",
				success		: false,
				uid			: response.id
			});
		}, {"scope":api.permissions.join()});
	}

	api = lang.setObject("Ti.Facebook", Evented, {
		
		authorize: function() {
			// Sanity check
			if (!appid) {
				throw new Error("App ID not set. Facebook authorization cancelled.");
			}
	
			// Check if facebook is still initializing, and if so queue the auth request
			if (facebookInitialized) {
				// Authorize
				loginInternal();
			} else {
				loginAfterInitialization = true;
			}
		},
		
		createLoginButton: function(parameters) {
			return new (require("Ti/Facebook/LoginButton"))(parameters);
		},
		
		dialog: function(action, params, callback) {
			if (api.loggedIn) {
				params.method = action;
				FB.ui(params,function(response){
					processResponse(response,"action",action,callback);
				});
			} else {
				callback({
					success	: false,
					error	: notLoggedInMessage,
					action	: action,
					source	: api
				});
			}
		},
		
		logout: function() {
			api.loggedIn && FB.logout(function(response) {
				api.loggedIn = false;
				api.fireEvent("logout", {
					success	: true
				});
			});
		},
		
		request: function(method, params, callback) {
			if (api.loggedIn) {
				params.method = method;
				params.urls = "facebook.com,developers.facebook.com";
				FB.api(params,function(response){
					processResponse(response,"method",method,callback);
				});
			} else {
				callback({
					success	: false,
					error	: notLoggedInMessage,
					method	: method,
					source	: api
				});
			}
		},
		
		requestWithGraphPath: function(path, params, httpMethod, callback) {
			if (api.loggedIn) {
				FB.api(path,httpMethod,params,function(response){
					processResponse(response,"path",path,callback);
				});
			} else {
				callback({
					success	: false,
					error	: notLoggedInMessage,
					path	: path,
					source	: api
				});
			}
		},
		
		constants: {
			
			forceDialogAuth: true,
			
			BUTTON_STYLE_NORMAL: 1,
			
			BUTTON_STYLE_WIDE: 2
		},
		
		properties: {
			
			accessToken: void 0,
			
			appid: {
				set: function(value){
					appid = value;
					facebookLoaded && initFacebook();
					return value;
				}
			},
			
			expirationDate: void 0,
			
			loggedIn: false,
			
			permissions: void 0,
			
			uid: void 0
		}
		
	});
	
	// Create the div required by Facebook
	facebookDiv.id = "fb-root";
	document.body.appendChild(facebookDiv);

	// Load the Facebook SDK Asynchronously.
	if (!document.getElementById(facebookScriptTagID)) {
		var facebookScriptTag = document.createElement("script"),
			head = document.getElementsByTagName("head")[0];
		facebookScriptTag.id = facebookScriptTagID; 
		facebookScriptTag.async = true;
		facebookScriptTag.src = "//connect.facebook.net/en_US/all.js";
		head.insertBefore(facebookScriptTag, head.firstChild);
	}

	window.fbAsyncInit = function() {
		facebookLoaded = true;
		appid && initFacebook();
	};
	
	return api;

});
},
"Ti/Filesystem/File":function(){
/* /titanium/Ti/Filesystem/File.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Filesystem/Local", "Ti/App/Properties"], function(declare, Evented, Local, Properties) {

	var backend = Properties.getString("ti.fs.backend");

	return declare("Ti.Filesystem.File", [Evented, backend ? require(backend) : Local]);

});
},
"Ti/UI/MobileWeb/NavigationGroup":function(){
/* /titanium/Ti/UI/MobileWeb/NavigationGroup.js */

define(["Ti/_/declare", "Ti/UI/View", "Ti/UI", "Ti/_/style", "Ti/_/lang"],
	function(declare, View, UI, style, lang) {
		
	var isDef = lang.isDef;

	return declare("Ti.UI.MobileWeb.NavigationGroup", View, {

		constructor: function(args) {
			var self = this;
			self._windows = [];
			
			// Process the creation time args
			if (!args.window) {
				throw new Error("A window must be specified at creation time in Ti.UI.MobileWeb.NavigationGroup.");
			}
			var rootWindow = self.constants.window = args && args.window;
			
			// Create the nav controls
			self.layout = "vertical";
			self._navBarContainer = UI.createView({
				width: UI.FILL,
				height: 50,
				backgroundColor: "#888"
			});
			self._navBarContainer.add(self._backButton = UI.createButton({
				title: "Back",
				left: 5,
				opacity: 0,
				enabled: true
			}));
			self._backButton.addEventListener("singletap", function(){
				self.close();
			});
			self._navBarContainer.add(self._title = UI.createLabel({
				text: rootWindow._getTitle(),
				width: UI.FILL,
				textAlign: UI.TEXT_ALIGNMENT_CENTER,
				touchEnabled: false
			}));
			
			// Create the content container
			self._contentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});
			self._contentContainer.add(rootWindow);
			
			self.navBarAtTop = true;
		},

		_defaultWidth: UI.FILL,
		
		_defaultHeight: UI.FILL,

		open: function(win, options) {
			// Show the back button, if need be
			var backButton = this._backButton;

			backButton.opacity || backButton.animate({opacity: 1, duration: 250}, function() {
				backButton.opacity = 1;
				backButton.enabled = true;
			});

			// Set a default background
			!isDef(win.backgroundColor) && !isDef(win.backgroundImage) && (win.backgroundColor = "#fff");

			// Show the window
			this._windows.push(win);
			this._contentContainer.add(win);
			this._title.text = win._getTitle();
		},
		
		close: function(win, options) {
			var windows = this._windows,
				topWindowIdx = windows.length - 1,
				win = win || windows[topWindowIdx],
				windowLocation = windows.indexOf(win),
				backButton = this._backButton,
				nextWindow = this.window;

			if (!~windowLocation) {
				return;
			}

			// If the window is on top, we have to go to the previous window
			if (windows[topWindowIdx] === win) {
				if (topWindowIdx > 0) {
					nextWindow = windows[topWindowIdx - 1];
				} else {
					backButton.animate({opacity: 0, duration: 250}, function() {
						backButton.opacity = 0;
						backButton.enabled = false;
					});
				}
				this._title.text = nextWindow._getTitle();
			}

			// Remove the window
			windows.splice(windowLocation, 1);
			this._contentContainer.remove(win);
		},

		constants: {
			window: void 0
		},

		properties: {
			navBarAtTop: {
				set: function (value, oldValue) {
					if (value !== oldValue) {
						
						var navBarContainer = this._navBarContainer,
							contentContainer = this._contentContainer;
						this.remove(navBarContainer);
						this.remove(contentContainer);
						
						var borderLocation;
						if (value) {
							this.add(navBarContainer);
							this.add(contentContainer);
							borderLocation = "borderBottom"
						} else {
							this.add(contentContainer);
							this.add(navBarContainer);
							borderLocation = "borderTop"
						}
						style.set(navBarContainer.domNode,borderLocation,"1px solid #555");
					}
					return value;
				}
			}
		}

	});

});
},
"Ti/UI/TextArea":function(){
/* /titanium/Ti/UI/TextArea.js */

define(["Ti/_/declare", "Ti/_/UI/TextBox", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI"],
	function(declare, TextBox, dom, css, style, UI) {

	return declare("Ti.UI.TextArea", TextBox, {

		constructor: function(args) {
			this._field = dom.create("textarea", {
				autocomplete: "off",
				style: {
					position: "absolute",
					left: 0,
					right: 0,
					top: 0,
					bottom: 0
				}
			}, this.domNode);

			this._initTextBox();
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_getContentSize: function(width, height) {
			return {
				width: this._measureText(this.value, this._field, width).width,
				height: this._measureText(this.value, this._field, width).height
			};
		},

		_setTouchEnabled: function(value) {
			TextBox.prototype._setTouchEnabled.apply(this,arguments);
			this.slider && style.set(this.textArea, "pointerEvents", value ? "auto" : "none");
		}

	});

});

},
"Ti/UI/ProgressBar":function(){
/* /titanium/Ti/UI/ProgressBar.js */

define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/UI/FontWidget", "Ti/_/lang", "Ti/_/dom", "Ti/_/style", "Ti/UI"], 
	function(declare, Widget, FontWidget, lang, dom, style, UI) {

	var setStyle = style.set;

	var InternalProgressBar = declare(Widget, {
			
			constructor: function() {
				this._contentContainer = dom.create("div", {
					className: "TiUIProgressBarContainer",
					style: {
						pointerEvents: "none",
						width: "100%",
						height: "100%",
						overflow: "hidden"
					}
				}, this.domNode);
				this._indicator = dom.create("div", {
					className: "TiUIProgressBarIndicator",
					style: {
						pointerEvents: "none",
						width: "0%",
						height: "100%"
					}
				}, this._contentContainer);
			},
			
			_doLayout: function(params) {
				var values = this.properties.__values__;
				values.width = params.isParentSize.width ? UI.SIZE : "100%";
				values.height = params.isParentSize.height ? UI.SIZE : "100%";
				
				return Widget.prototype._doLayout.call(this,params);
			},
			
			_getContentSize: function(width, height) {
				return {
					width: 200,
					height: 25
				};
			},
			
			_setPosition: function(location) {
				setStyle(this._indicator, "width", Math.round(100 * location) + "%");
			}
		});

	return declare("Ti.UI.ProgressBar", Widget, {
		
		constructor: function() {
			this.add(this._contentContainer = UI.createView({
				width: UI.SIZE,
				height: UI.SIZE,
				left: 0,
				top: 0,
				layout: "vertical"
			}));
			this._contentContainer._layout._defaultHorizontalLayout = "left";
			this._contentContainer.add(this._message = UI.createLabel());
			this._contentContainer.add(this._progressBar = new InternalProgressBar());
		},
			
		_doLayout: function() {
			var props = this._contentContainer.properties.__values__;
			props.width = this.width === UI.SIZE || !lang.isDef(this.width) ? UI.SIZE : "100%";
			props.height = this.height === UI.SIZE || !lang.isDef(this.height) ? UI.SIZE : "100%";
			
			if (this._message._getContentSize().width === 0) {
				this._message.properties.__values__.height = 0;
				this._progressBar.properties.__values__.top = 0;
			} else {
				this._message.properties.__values__.height = UI.SIZE;
				this._progressBar.properties.__values__.top = 2;
			}
			
			return Widget.prototype._doLayout.apply(this,arguments);
		},
		
		_updateSize: function() {
			this._progressBar._setPosition((this.value - this.min) / (this.max - this.min));
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		properties: {
			color: {
				set: function(value) {
					this._message.color = value;
					return value;
				}
			},
			
			font: {
				set: function(value) {
					this._message.font = value;
					return value;
				}
			},
			
			message: {
				set: function(value) {
					this._message.text = value;
					return value;
				}
			},
			
			min: {
				set: function(value) {
					if (value > this.max) {
						value = this.max;
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 0
			},
			
			max: {
				set: function(value) {
					if (value < this.min) {
						value = this.min;
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 100
			},
			
			value: {
				set: function(value) {
					if (value < this.min) {
						value = this.min;
					} else if (value > this.max) {
						value = this.max;
					}
					return value;
				},
				post: function() {
					this._updateSize();
				},
				value: 0
			}
		}
		
	});
});
},
"Ti/UI/ScrollView":function(){
/* /titanium/Ti/UI/ScrollView.js */

define(["Ti/_/declare", "Ti/UI/View", "Ti/_/style", "Ti/_/lang", "Ti/UI"],
	function(declare, View, style, lang, UI) {

	return declare("Ti.UI.ScrollView", View, {
		
		constructor: function(args) {
			
			// Content must go in a separate container so the scrollbar can exist outside of it
			var contentContainer = this._contentContainer = UI.createView({
				width: "100%",
				height: "100%",
				left: 0,
				top: 0
			});
			View.prototype.add.call(this,contentContainer);
			style.set(contentContainer.domNode,"overflow","hidden");
			
			contentContainer.add(this._contentMeasurer = UI.createView({
				width: UI.SIZE,
				height: UI.SIZE,
				left: 0,
				top: 0
			}));
			style.set(this._contentMeasurer.domNode,"overflow","hidden");
			
			this._createHorizontalScrollBar();
			this._createVerticalScrollBar();
			
			// Handle scrolling
			var previousTouchLocation;
			this.addEventListener("touchstart",function(e) {
				previousTouchLocation = {x: e.x, y: e.y};
				
				this._startScrollBars({
					x: contentContainer.domNode.scrollLeft / (this._contentMeasurer._measuredWidth - this._measuredWidth),
					y: contentContainer.domNode.scrollTop / (this._contentMeasurer._measuredHeight - this._measuredHeight)
				},
				{
					x: contentContainer._measuredWidth / (this._contentMeasurer._measuredWidth),
					y: contentContainer._measuredHeight / (this._contentMeasurer._measuredHeight)
				});
				
				this._isScrollBarActive && this.fireEvent("dragStart",{});
			});
			this.addEventListener("touchend",function(e) {
				previousTouchLocation = null;
				
				this._endScrollBars();
				
				this._isScrollBarActive && this.fireEvent("dragEnd",{
					decelerate: false
				});
			});
			this.addEventListener("touchmove",lang.hitch(this,function(e) {
				var scrollLeft = contentContainer.domNode.scrollLeft,
					scrollTop = contentContainer.domNode.scrollTop;
				contentContainer.domNode.scrollLeft += previousTouchLocation.x - e.x;
				contentContainer.domNode.scrollTop += previousTouchLocation.y - e.y;
				previousTouchLocation = {x: e.x, y: e.y};
				
				// Create the scroll event
				this._isScrollBarActive && this.fireEvent("scroll",{
					x: scrollLeft,
					y: scrollTop,
					dragging: true
				});
				
				this._updateScrollBars({
					x: scrollLeft / (this._contentMeasurer._measuredWidth - this._measuredWidth),
					y: scrollTop / (this._contentMeasurer._measuredHeight - this._measuredHeight)
				});
			}));
			var self = this;
			this.domNode.addEventListener("mousewheel",function(e) {
				self._startScrollBars({
					x: contentContainer.domNode.scrollLeft / (self._contentMeasurer._measuredWidth - self._measuredWidth),
					y: contentContainer.domNode.scrollTop / (self._contentMeasurer._measuredHeight - self._measuredHeight)
				},
				{
					x: contentContainer._measuredWidth / (self._contentMeasurer._measuredWidth),
					y: contentContainer._measuredHeight / (self._contentMeasurer._measuredHeight)
				});
				setTimeout(function(){
					contentContainer.domNode.scrollLeft -= e.wheelDeltaX;
					contentContainer.domNode.scrollTop -= e.wheelDeltaY;
					
					// Create the scroll event
					self._isScrollBarActive && self.fireEvent("scroll",{
						x: contentContainer.domNode.scrollLeft,
						y: contentContainer.domNode.scrollTop,
						dragging: false
					});
					self._updateScrollBars({
						x: (contentContainer.domNode.scrollLeft - e.wheelDeltaX) / (self._contentMeasurer._measuredWidth - self._measuredWidth),
						y: (contentContainer.domNode.scrollTop - e.wheelDeltaY) / (self._contentMeasurer._measuredHeight - self._measuredHeight)
					});
					setTimeout(function(){
						self._endScrollBars();
					},10);
				},10);
			});
		},
		
		scrollTo: function(x,y) {
			x !== null && (this._contentContainer.scrollLeft = parseInt(x));
			y !== null && (this._contentContainer.scrollTop = parseInt(y));
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,
		
		_getContentOffset: function(){
			return this.contentOffset;
		},
		
		_doLayout: function() {
			this._contentMeasurer.layout = this.layout;
			return View.prototype._doLayout.apply(this,arguments);
		},
		
		add: function(view) {
			this._contentMeasurer.add(view);
		},
		
		remove: function(view) {
			this._contentMeasurer.remove(view);
		},

		properties: {
			contentHeight: {
				get: function(value) {
					return this._contentMeasurer.height;
				},
				set: function(value) {
					this._contentMeasurer.height = value;
					return value;
				}
			},
			
			contentOffset: {
				get: function(value) {
					return {x: this._contentContainer.domNode.scrollLeft, y: this._contentContainer.domNode.scrollTop}
				},
				set: function(value) {
					this._contentContainer.domNode.scrollLeft = value.x;
					this._contentContainer.domNode.scrollTop = value.y;
					return value;
				}
			},
			
			contentWidth: {
				get: function(value) {
					return this._contentMeasurer.width;
				},
				set: function(value) {
					this._contentMeasurer.width = value;
					return value;
				}
			},
			
			showHorizontalScrollIndicator: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						if (value) {
							this._createHorizontalScrollBar();
						} else {
							this._destroyHorizontalScrollBar();
						}
					}
					return value;
				},
				value: true
			},
			
			showVerticalScrollIndicator: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						if (value) {
							this._createVerticalScrollBar();
						} else {
							this._destroyVerticalScrollBar();
						}
					}
					return value;
				},
				value: true
			}
		}

	});

});
},
"Ti/_/Gestures/Pinch":function(){
/* /titanium/Ti/_/Gestures/Pinch.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.Pinch", GestureRecognizer, {
		
		name: "pinch",
		
		_touchStartLocation: null,
		_fingerDifferenceThresholdTimer: null,
		_startDistance: null,
		_previousDistance: null,
		_previousTime: null,
		
		// There are two possibilities: the user puts down two fingers at exactly the same time,
		// which is almost impossible, or they put one finger down first, followed by the second.
		// For the second case, we need ensure that the two taps were intended to be at the same time.
		// This value defines the maximum time difference before this is considered some other type of gesture.
		_fingerDifferenceThreshold: 100,
		
		// This is the minimum amount of space the fingers are must move before it is considered a pinch
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY,
				touchesLength = e.touches.length,
				changedTouchesLength = e.changedTouches.length;
			
			// First finger down of the two, given a slight difference in contact time
			if (touchesLength == 1 && changedTouchesLength == 1) {
				this._touchStartLocation = [{
					x: x,
					y: y
				}];
				this._fingerDifferenceThresholdTimer = setTimeout(lang.hitch(this,function(){
					this._touchStartLocation = null;
				}),this._fingerDifferenceThreshold);
			
			// Second finger down of the two, given a slight difference in contact time
			} else if (touchesLength == 2 && changedTouchesLength == 1) {
				clearTimeout(this._fingerDifferenceThresholdTimer);
				if (this._touchStartLocation) {
					this._touchStartLocation.push({
						x: x,
						y: y
					});
					this._startDistance = Math.sqrt(Math.pow(this._touchStartLocation[0].x - this._touchStartLocation[1].x,2) + 
						Math.pow(this._touchStartLocation[0].y - this._touchStartLocation[1].y,2));
				}
				
			// Two fingers down at the same time
			} else if (touchesLength == 2 && changedTouchesLength == 2) {
				this._touchStartLocation = [{
					x: x,
					y: y
				},
				{
					x: e.changedTouches[1].clientX,
					y: e.changedTouches[1].clientY
				}];
				this._startDistance = Math.sqrt(Math.pow(this._touchStartLocation[0].x - this._touchStartLocation[1].x,2) + 
					Math.pow(this._touchStartLocation[0].y - this._touchStartLocation[1].y,2));
				
			// Something else, means it's not a pinch
			} else {
				this._touchStartLocation = null;
			}
		},
		
		processTouchEndEvent: function(e, element){
			this.processTouchMoveEvent(e, element);
			this._touchStartLocation = null;
		},
		
		processTouchMoveEvent: function(e, element){
			if (this._touchStartLocation && this._touchStartLocation.length == 2 && e.touches.length == 2) {
				var currentDistance = Math.sqrt(Math.pow(e.touches[0].clientX - e.touches[1].clientX,2) + 
					Math.pow(e.touches[0].clientY - e.touches[1].clientY,2)),
					velocity = 0,
					currentTime = (new Date()).getTime();
				if (this._previousDistance) {
					velocity = Math.abs(this._previousDistance / this._startDistance - currentDistance / this._startDistance) / ((currentTime - this._previousTime) / 1000); 
				}
				this._previousDistance = currentDistance;
				this._previousTime = currentTime;
				if (!element._isGestureBlocked(this.name)) {
					lang.hitch(element,element._handleTouchEvent(this.name,{
						scale: currentDistance / this._startDistance,
						velocity: velocity,
						source: this.getSourceNode(e,element)
					}));
				}
			}
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}
		
	});
	
});
},
"Ti/IOStream":function(){
/* /titanium/Ti/IOStream.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/Buffer", "Ti/Filesystem"], function(declare, Evented, Buffer, Filesystem) {

	return declare("Ti.IOStream", Evented, {

		constructor: function(args) {
			args = args || {};
			this._data = args.data || "";
			this._mode = args.mode || Filesystem.MODE_APPEND;
		},

		close: function() {
			this._closed = true;
		},

		isReadable: function() {
			return !this._closed;
		},

		isWriteable: function() {
			return !this._closed && (this._mode === Filesystem.MODE_WRITE || this._mode === Filesystem.MODE_APPEND);
		},

		read: function(buffer, offset, length) {
			if (this.isReadable()) {
				var d = this._data,
					len = length || d.length,
					bytesRead = buffer.append(new Buffer({ value: d.substring(offset || 0, len) }));
				this._data = d.substring(len);
				return bytesRead;
			}
			return 0;
		},

		write: function(buffer, offset, length) {
			if (this.isWriteable()) {
				var b = buffer.value;
				offset = offset | 0;
				length = length || b.length;
				this._data += b.substring(offset, length);
				return length - offset;
			}
			return 0;
		}

	});

});
},
"Ti/Filesystem":function(){
/* /titanium/Ti/Filesystem.js */

define(["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/Filesystem/File"],
	function(_, Evented, lang, File) {

	var applicationDataDirectory = "appdata://",
		tempDirectory = "tmp://";

	function join() {
		var re = /(.+:\/\/)?(.*)/,
			prefix = "",
			result = [],
			lastSegment,
			path = lang.toArray(arguments).filter(function(a) {
				return a !== void 0;
			}).map(function(a) {
				prefix || (prefix = a.match(re)) && (prefix = prefix[1] || "");
				return a.replace(prefix, "").replace(/^\/|\/$/g, '');
			}).join('/');

		// compact the path
		path.split('/').forEach(function(segment) {
			if (segment === ".." && lastSegment !== "..") {
				if (!result.length) {
					throw new Error('Irrational path "' + path + '"')
				}
				result.pop();
				lastSegment = result[result.length - 1];
			} else if (segment && segment !== ".") {
				result.push(lastSegment = segment);
			}
		});

		// re-assemble path
		path = prefix + result.join('/');
		if (!prefix && !/^\//.test(path)) {
			path = '/' + path;
		}

		return path;
	}

	function makeTemp(type) {
		var f = new File({
			_type: type.charAt(0),
			nativePath: tempDirectory + _.uuid()
		});
		return f["create" + type]() ? f : null;
	}

	return lang.setObject("Ti.Filesystem", Evented, {
		constants: {
			MODE_APPEND: 4,
			MODE_READ: 1,
			MODE_WRITE: 2,
			applicationDataDirectory: applicationDataDirectory,
			lineEnding: '\n',
			resourcesDirectory: '/',
			separator: '/',
			tempDirectory: tempDirectory
		},

		protocols: ["appdata", "tmp"],

		createTempDirectory: function() {
			return makeTemp("Directory");
		},

		createTempFile: function() {
			return makeTemp("File");
		},

		getFile: function() {
			return new File(join.apply(null, arguments));
		},

		isExternalStoragePresent: function() {
			return false;
		},

		openStream: function(mode) {
			var args = lang.toArray(arguments),
				file;
			args.shift();
			file = new File(join.apply(null, args));
			return file.open(mode);
		}
	});

});
},
"Ti/UI":function(){
/* /titanium/Ti/UI.js */

define(
	["Ti/_", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/dom"],
	function(_, Evented, lang, ready, style, dom) {

	var global = window,
		body = document.body,
		on = require.on,
		modules = "2DMatrix,ActivityIndicator,AlertDialog,Animation,Button,EmailDialog,ImageView,Label,OptionDialog,Picker,PickerColumn,PickerRow,ProgressBar,ScrollableView,ScrollView,Slider,Switch,Tab,TabGroup,TableView,TableViewRow,TableViewSection,TextArea,TextField,View,WebView,Window",
		creators = {},
		setStyle = style.set,
		handheld = navigator.userAgent.toLowerCase().match(/(iphone|android)/),
		iphone = handheld && handheld[0] === "iphone",
		targetHeight = {},
		hidingAddressBar,
		hideAddressBar = finishAddressBar = function() {
			Ti.UI._recalculateLayout();
			hidingAddressBar = 0;
		},
		unitize = dom.unitize,
		showStats = false;

	on(body, "touchmove", function(e) {
		e.preventDefault();
	});

	require.each(modules.split(','), function(name) {
		creators['create' + name] = function(args) {
			return new (require("Ti/UI/" + name))(args);
		};
	});

	if (!navigator.standalone && handheld) {
		hideAddressBar = function() {
			if (!hidingAddressBar) {
				hidingAddressBar = 1;
				var isPortrait = require("Ti/Gesture").isPortrait | 0,
					h = targetHeight[isPortrait],
					timer;

				if (!h) {
					if (iphone) {
						h = global.innerHeight + 60;
						if (global.screen.availHeight - h > 50) {
							h += 50;
						}
					} else {
						h = global.outerHeight / (global.devicePixelRatio || 0);
					}
					targetHeight[isPortrait] = h;
				}

				setStyle(body, "height", h + "px");

				if (iphone) {
					global.scrollTo(0, 0);
					finishAddressBar();
				} else {
					timer = setInterval(function() {
						global.scrollTo(0, -1);
						if (global.innerHeight + 1 >= h) {
							clearTimeout(timer);
							finishAddressBar();
						}
					}, 50);
				}
			}
		}
		ready(hideAddressBar);
		on(global, "orientationchange", hideAddressBar);
		on(global, "touchstart", hideAddressBar);
	}

	ready(10, function() {
		var splashScreen = document.getElementById("splash"),
			container = (Ti.UI._container = Ti.UI.createView({
				left: 0,
				top: 0
			})),
			node = container.domNode;
		setStyle(node, "overflow", "hidden");
		body.appendChild(node);
		container.addEventListener("postlayout", function(){
			setTimeout(function(){
				setStyle(splashScreen,{
					position: "absolute",
					width: unitize(container._measuredWidth),
					height: unitize(container._measuredHeight),
					left: "0px",
					top: "0px",
					right: "",
					bottom: ""
				});
			},10);
		});
		hideAddressBar();
	});
	
	function updateOrientation() {
		Ti.UI._recalculateLayout();
		require("Ti/Gesture")._updateOrientation();
	}
	on(global, "resize", updateOrientation);
	on(global, "orientationchange", updateOrientation);

	return lang.setObject("Ti.UI", Evented, creators, {

		_addWindow: function(win, set) {
			this._container.add(win.modal ? win._modalParentContainer : win);
			set && this._setWindow(win);
			return win;
		},

		_setWindow: function(win) {
			this.constants.currentWindow = win;
		},

		_removeWindow: function(win) {
			this._container.remove(win.modal ? win._modalParentContainer : win);
			return win;
		},
		
		_layoutSemaphore: 0,
		
		_nodesToLayout: [],
		
		_startLayout: function() {
			this._layoutSemaphore++;
		},
		
		_finishLayout: function() {
			this._layoutSemaphore--;
			if (this._layoutSemaphore === 0) {
				this._triggerLayout(true);
			}
		},
		
		_elementLayoutCount: 0,
		
		_layoutCount: 0,
		
		_triggerLayout: function(node, force) {
			var self = this;
			if (~self._nodesToLayout.indexOf(node)) {
				return;
			}
			self._nodesToLayout.push(node);
			function startLayout() {
				
				self._elementLayoutCount = 0;
				self._layoutCount++;
				var startTime = (new Date()).getTime(),
					nodes = self._nodesToLayout,
					layoutNode,
					node,
					parent,
					previousParent,
					children,
					child,
					recursionStack,
					rootNodesToLayout = [],
					layoutRootNode = false,
					breakAfterChildrenCalculations;
					
				// Determine which nodes need to be re-layed out
				for (var i in nodes) {
					layoutNode = nodes[i];
						
					// Mark all of the children for update that need to be updated
					recursionStack = [layoutNode];
					while (recursionStack.length > 0) {
						node = recursionStack.pop();
						node._markedForLayout = true;
						children = node.children;
						for (var j in children) {
							child = children[j];
							if (node.layout !== "composite" || child._isDependentOnParent() || !child._hasBeenLayedOut) {
								recursionStack.push(child);
							}
						}
					}
					
					// Go up and mark any other nodes that need to be marked
					parent = layoutNode;
					while(1) {
						breakAfterChildrenCalculations = false;
						if (!parent._parent) {
							layoutRootNode = true;
							break;
						} else if(!parent._parent._hasSizeDimensions()) {
							!parent._parent._markedForLayout && !~rootNodesToLayout.indexOf(parent._parent) && rootNodesToLayout.push(parent._parent);
							if (parent._parent.layout !== "composite") {
								breakAfterChildrenCalculations = true;
							} else {
								break;
							}
						}
						
						previousParent = parent;
						parent = parent._parent;
						recursionStack = [parent];
						while (recursionStack.length > 0) {
							node = recursionStack.pop();
							children = node.children;
							for (var j in children) {
								child = children[j];
								if (child !== previousParent && (node.layout !== "composite" || child._isDependentOnParent())) {
									child._markedForLayout = true;
									recursionStack.push(child);
								}
							}
						}
						if (breakAfterChildrenCalculations) {
							break;
						}
					}
				}
				
				// Layout all nodes that need it
				if (layoutRootNode) {
					var container = self._container;
					container._doLayout({
					 	origin: {
					 		x: 0,
					 		y: 0
					 	},
					 	isParentSize: {
					 		width: false,
					 		height: false
					 	},
					 	boundingSize: {
					 		width: global.innerWidth,
					 		height: global.innerHeight
					 	},
					 	alignment: {
					 		horizontal: "center",
					 		vertical: "center"
					 	},
					 	positionElement: true,
					 	layoutChildren: true
				 	});
				}
				for (var i in rootNodesToLayout) {
					node = rootNodesToLayout[i];
					node._layout._doLayout(node, node._measuredWidth, node._measuredHeight, node._getInheritedWidth() === Ti.UI.SIZE, node._getInheritedHeight() === Ti.UI.SIZE);
				}
				
				showStats && console.debug("Layout " + self._layoutCount + ": " + self._elementLayoutCount + 
					" elements laid out in " + ((new Date().getTime() - startTime)) + "ms");
					
				self._layoutInProgress = false;
				self._layoutTimer = null;
				self._nodesToLayout = [];
				
				self.fireEvent("postlayout");
			}
			if (force) {
				clearTimeout(self._layoutTimer);
				self._layoutInProgress = true;
				startLayout();
			} else if (self._nodesToLayout.length === 1) {
				self._layoutInProgress = true;
				self._layoutTimer = setTimeout(function(){ startLayout(); }, 25);
			}
		},
		
		_recalculateLayout: function() {
			var container = this._container;
			if (container) {
				container.width = global.innerWidth;
				container.height = global.innerHeight;
			}
		},

		properties: {
			backgroundColor: {
				set: function(value) {
					return this._container.backgroundColor = value;
				}
			},
			backgroundImage: {
				set: function(value) {
					return setStyle(body, "backgroundImage", value ? style.url(value) : "");
				}
			},
			currentTab: void 0
		},
		
		convertUnits: function(convertFromValue, convertToUnits) {
			var intermediary = dom.computeSize(convertFromValue, 0, false);
			switch(convertToUnits) {
				case Ti.UI.UNIT_MM:
					intermediary *= 10;
				case Ti.UI.UNIT_CM:
					return intermediary / ( 0.0393700787 * _.dpi * 10);
				case Ti.UI.UNIT_IN:
					return intermediary / _.dpi;
				case Ti.UI.UNIT_DIP:
					return intermediary * 96 / _.dpi;
				case Ti.UI.UNIT_PX:
					return intermediary;
				default: return 0;
			}
		},

		constants: {
			currentWindow: void 0,
			UNKNOWN: 0,
			FACE_DOWN: 1,
			FACE_UP: 2,
			PORTRAIT: 3,
			UPSIDE_PORTRAIT: 4,
			LANDSCAPE_LEFT: 5,
			LANDSCAPE_RIGHT: 6,
			INPUT_BORDERSTYLE_NONE: 0, // DO NOT CHANGE! Values are referenced directly in code
			INPUT_BORDERSTYLE_LINE: 1, // DO NOT CHANGE! Values are referenced directly in code
			INPUT_BORDERSTYLE_BEZEL: 2, // DO NOT CHANGE! Values are referenced directly in code
			INPUT_BORDERSTYLE_ROUNDED: 3, // DO NOT CHANGE! Values are referenced directly in code
			KEYBOARD_DEFAULT: 2,
			KEYBOARD_EMAIL: 3,
			KEYBOARD_NUMBER_PAD: 6,
			KEYBOARD_PHONE_PAD: 7,
			KEYBOARD_URL: 8,
			NOTIFICATION_DURATION_LONG: 1,
			NOTIFICATION_DURATION_SHORT: 2,
			PICKER_TYPE_DATE: 2,
			PICKER_TYPE_DATE_AND_TIME: 3,
			PICKER_TYPE_PLAIN: 4,
			PICKER_TYPE_TIME: 5,
			RETURNKEY_DEFAULT: 0, // return
			RETURNKEY_DONE: 1, // Done
			RETURNKEY_EMERGENCY_CALL: 2, // Emergency Call
			RETURNKEY_GO: 3, // Go
			RETURNKEY_GOOGLE: 4, // Search
			RETURNKEY_JOIN: 5, // Join
			RETURNKEY_NEXT: 6, // Next
			RETURNKEY_ROUTE: 7, // Route
			RETURNKEY_SEARCH: 8, // Search
			RETURNKEY_SEND: 9, // Send
			RETURNKEY_YAHOO: 10, // Search
			TEXT_ALIGNMENT_CENTER: "center",
			TEXT_ALIGNMENT_RIGHT: "right",
			TEXT_ALIGNMENT_LEFT: "left",
			TEXT_AUTOCAPITALIZATION_ALL: 3,
			TEXT_AUTOCAPITALIZATION_NONE: 0,
			TEXT_AUTOCAPITALIZATION_SENTENCES: 2,
			TEXT_AUTOCAPITALIZATION_WORDS: 1,
			TEXT_VERTICAL_ALIGNMENT_BOTTOM: 2,
			TEXT_VERTICAL_ALIGNMENT_CENTER: 1,
			TEXT_VERTICAL_ALIGNMENT_TOP: 3,
			ANIMATION_CURVE_EASE_IN: 1,
			ANIMATION_CURVE_EASE_IN_OUT: 2,
			ANIMATION_CURVE_EASE_OUT: 3,
			ANIMATION_CURVE_LINEAR: 4,
			SIZE: "auto",
			FILL: "fill",
			INHERIT: "inherit",
			UNIT_PX: "px",
			UNIT_MM: "mm",
			UNIT_CM: "cm",
			UNIT_IN: "in",
			UNIT_DIP: "dp" // We don't have DIPs, so we treat them as pixels
		}

	});

});
},
"Ti/UI/TabGroup":function(){
/* /titanium/Ti/UI/TabGroup.js */

define(["Ti/_/declare", "Ti/_/css", "Ti/_/UI/SuperView", "Ti/UI/View", "Ti/UI", "Ti/_/lang", "Ti/_/style"], 
	function(declare, css, SuperView, View, UI, lang, style) {

	var is = require.is,
		setStyle = style.set,
		postUpdateTabsBackground = {
			post: "_updateTabsBackground"
		};

	return declare("Ti.UI.TabGroup", SuperView, {

		constructor: function(args){
			
			var self = this,
				tabsAtBottom = self.constants.tabsAtBottom = lang.val(args && args.tabsAtBottom, self.constants.tabsAtBottom);
			
			// Create the tabBarContainer class
			var TabBarContainer = declare("Ti._.UI.TabGroup.TabBarContainer", View, {
				_doLayout: function(params) {
					
					var tabs = self.tabs,
						numTabs = tabs.length,
						totalDividerWidth = (numTabs - 1) * self.tabDividerWidth,
						tabWidth = Math.floor((params.boundingSize.width - totalDividerWidth) / numTabs);
					for (var i = 0; i < numTabs - 1; i++) {
						tabs[i]._defaultWidth = tabWidth;
					}
					 // Make the last tab consume the remaining space. Fractional widths look really bad in tabs.
					tabs[i] && (tabs[i]._defaultWidth = params.boundingSize.width - totalDividerWidth - tabWidth * (numTabs - 1));
					
					return View.prototype._doLayout.apply(this,arguments)
				}
			});
			
			// Create the tab bar
			self._tabBarContainer = new TabBarContainer({
				width: UI.FILL,
				layout: "horizontal"
			});
			self.tabHeight = 75;

			// Create the tab window container
			self._tabContentContainer = UI.createView({
				width: UI.FILL,
				height: UI.FILL
			});
			
			// Add the windows ordered such that they respect tabsAtBottom
			self.layout = "vertical";
			self.tabs = [];
			self.tabsAtBottom = args ? lang.val(args.tabsAtBottom, true) : true;
		},

		addTab: function(tab) {
			// Initialize the tabs, if necessary
			var tabs = this.tabs = this.tabs || [];
			tabs.push(tab);
			tab._tabGroup = this;

			// Set the active tab if there are currently no tabs, otherwise add a divider
			if (tabs.length === 1) {
				this.properties.activeTab = tab;
			} else {
				this._tabBarContainer.add(this._createTabDivider());
			}
			
			// Add the tab to the UI
			this._tabBarContainer.add(tab);
			
			// Update the background on the tab
			this._updateTabBackground(tab);
		},

		removeTab: function(tab) {
			// Remove the tab from the list
			var tabs = this.tabs,
				idx = this.tabs.indexOf(tab);

			if (idx >= 0) {
				tabs.splice(idx, 1);

				// Remove the tab from the tab bar and recalculate the tab sizes
				this._tabBarContainer.remove(tab);

				// Update the active tab, if necessary
				tab === this._activeTab && this._activateTab(tabs[0]);
			}
		},
		
		_createTabDivider: function() {
			return UI.createView({
				width: this.tabDividerWidth,
				height: UI.FILL,
				backgroundColor: this.tabDividerColor
			});
		},
		
		_handleFocusBlurEvent: function(type) {
			var previousTab = this._previousTab,
				activeTab = this._activeTab,
				tabs = this.tabs,
				data = {
					index: tabs.indexOf(activeTab),
					previousIndex: tabs.indexOf(previousTab),
					tab: activeTab,
					previousTab: previousTab
				};
			if (previousTab) {
				previousTab.window && previousTab.window._handleBlurEvent();
				previousTab.fireEvent("blur",data);
			}
			SuperView.prototype["_handle" + type + "Event"].call(this,data);
			activeTab.window && activeTab.window._handleFocusEvent();
			activeTab.fireEvent("focus",data);
		},
		
		_handleFocusEvent: function() {
			this._handleFocusBlurEvent("Focus");
		},
		
		_handleBlurEvent: function() {
			this._handleFocusBlurEvent("Blur");
		},

		_activateTab: function(tab) {
			var tabs = this.tabs,
				prev = this._previousTab = this._activeTab;
			
			if (prev !== tab) {
				if (prev) {
					prev.active = false;
					prev._doBackground();
					prev._tabNavigationGroup && this._tabContentContainer.remove(prev._tabNavigationGroup);
				}
	
				tab.active = true;
				tab._tabNavigationGroup && (tab._tabNavigationGroup.navBarAtTop = this.tabsAtBottom);
				this._activeTab = tab;
				UI.currentTab = tab;
				tab._tabNavigationGroup && this._tabContentContainer.add(tab._tabNavigationGroup);
				this._handleFocusEvent();
				this._updateTabsBackground();
			}
		},
		
		_updateTabBackground: function(tab) {
			var prefix = tab.active ? "activeTab" : "tabs";
			tab._defaultBackgroundColor = this[prefix + "BackgroundColor"];
			tab._defaultBackgroundImage = this[prefix + "BackgroundImage"];
			tab._defaultBackgroundFocusedColor = this[prefix + "BackgroundFocusedColor"];
			tab._defaultBackgroundFocusedImage = this[prefix + "BackgroundFocusedImage"];
			tab._defaultBackgroundDisabledColor = this[prefix + "BackgroundDisabledColor"];
			tab._defaultBackgroundDisabledImage = this[prefix + "BackgroundDisabledImage"];
			tab._defaultBackgroundSelectedColor = this[prefix + "BackgroundSelectedColor"];
			tab._defaultBackgroundSelectedImage = this[prefix + "BackgroundSelectedImage"];
			tab._doBackground();
		},
		
		_updateTabsBackground: function() {
			var tabs = this.tabs;
			for (var i = 0; i < tabs.length; i++) {
				this._updateTabBackground(tabs[i]);
			}
		},
		
		_updateDividers: function(){
			var tabs = this._tabBarContainer.children;
			for(var i = 1; i < tabs.length; i += 2) {
				var tab = tabs[i];
				tab.width = this.tabDividerWidth;
				tab.backgroundColor = this.tabDividerColor;
			}
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		properties: {
			activeTab: {
				set: function(value) {
					if (is(value, "Number")) {
						value = this.tabs[value];
					}
					if (!value in this.tabs) {
						return;
					}
					return value;
				},
				post: function(value) {
					lang.isDef(value) && this._activateTab(value);
				}
			},

			tabs: {
				set: function(value) {
					var i,
						tabBarContainer = this._tabBarContainer;

					if (!is(value, "Array")) {
						return;
					}

					tabBarContainer._removeAllChildren();

					if (value.length) {
						this._activateTab(value[0]);
						for (i = 0; i < value.length - 1; i++) {
							tabBarContainer.add(value[i]);
							tabBarContainer.add(this._createTabDivider());
						}
						tabBarContainer.add(value[value.length - 1]); // No trailing divider
					}

					return value;
				},
				post: "_updateTabsBackground"
			},
			
			tabsAtBottom: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						
						this._activeTab && this._activeTab._tabNavigationGroup && (this._activeTab._tabNavigationGroup.navBarAtTop = value);
						
						var tabContentContainer = this._tabContentContainer,
							tabBarContainer = this._tabBarContainer;
						this.remove(tabContentContainer);
						this.remove(tabBarContainer);
						
						if (value) {
							this.add(tabContentContainer);
							this.add(tabBarContainer);
						} else {
							this.add(tabBarContainer);
							this.add(tabContentContainer);
						}
					}
					return value;
				}
			},
			
			activeTabBackgroundColor: {
				post: "_updateTabsBackground",
				value: "#fff"
			},
			
			activeTabBackgroundImage: postUpdateTabsBackground,
			
			activeTabBackgroundDisabledColor: {
				post: "_updateTabsBackground",
				value: "#888"
			},
			
			activeTabBackgroundDisabledImage: postUpdateTabsBackground,
			
			activeTabBackgroundFocusedColor: {
				post: "_updateTabsBackground",
				value: "#ccc"
			},
			
			activeTabBackgroundFocusedImage: postUpdateTabsBackground,
			
			activeTabBackgroundSelectedColor: {
				post: "_updateTabsBackground",
				value: "#ddd"
			},
			
			activeTabBackgroundSelectedImage: postUpdateTabsBackground,
			
			tabsBackgroundColor: {
				post: "_updateTabsBackground",
				value: "#aaa"
			},
			
			tabsBackgroundImage: postUpdateTabsBackground,
			
			tabsBackgroundDisabledColor: {
				post: "_updateTabsBackground",
				value: "#666"
			},
			
			tabsBackgroundDisabledImage: postUpdateTabsBackground,
			
			tabsBackgroundFocusedColor: {
				post: "_updateTabsBackground",
				value: "#ccc"
			},
			
			tabsBackgroundFocusedImage: postUpdateTabsBackground,
			
			tabsBackgroundSelectedColor: {
				post: "_updateTabsBackground",
				value: "#ddd"
			},
			
			tabsBackgroundSelectedImage: postUpdateTabsBackground,
			
			tabDividerColor: {
				post: function() {
					this._updateDividers();
				},
				value: "#555"
			},
			
			tabDividerWidth: {
				post: function() {
					this._updateDividers();
				},
				value: 1
			},
			
			tabHeight: {
				set: function(value) {
					this._tabBarContainer.height = value;
					return value;
				}
			}
		}
	});

});

},
"Ti/Buffer":function(){
/* /titanium/Ti/Buffer.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/Blob", "Ti/Codec"], function(declare, Evented, Blob, Codec) {

	var Buffer;

	return Buffer = declare("Ti.Buffer", Evented, {

		constructor: function(args) {
			args && args.value && this._set(args.value);
		},

		append: function(buffer, offset, len) {
			var v = buffer.value;
			offset = offset | 0,
			length = length || v.length;
			this._set(this.value + v.substring(offset, offset + length));
			return length - offset;
		},

		clear: function() {
			this._set("");
		},

		clone: function(offset, length) {
			return new Buffer({ value: offset ? this.value.substring(offset, length && offset + length) : this.value });
		},

		copy: function(srcBuffer, offset, srcOffset, srcLength) {
			var v = srcBuffer.value,
				offset = offset | 0,
				srcOffset = srcOffset | 0,
				len = Math.max(this.length, srcLength && srcOffset + srcLength) - offset,
				srcBuffer = v.substring(srcOffset, len);
			this._set(this.value.substring(0, offset) + srcBuffer + this.value.substring(offset, srcBuffer.length - offset));
		},

		fill: function(fillByte, offset, length) {
			if (!fillByte) {
				throw new Error("Missing fillByte argument");
			}
			offset = offset | 0;
			length = this.length - offset - length | 0;
			this._set(this.value.substring(0, offset | 0) + (new Array(length)).join((fillByte + ' ').charAt(0)) + this.value.substring(length));
		},

		insert: function(buffer, offset, srcOffset, srcLength) {
			var b = buffer.value;
			srcOffset = srcOffset | 0;
			offset = offset | 0;
			this._set(this.value.substring(0, offset) + v.substring(srcOffset, srcLength && srcOffset + srcLength) + this.value.substring(offset));
			return srcLength || v.length;
		},

		release: function() {
			this.length = 0;
		},

		toBlob: function() {
			return new Blob({ data: this.value });
		},

		toString: function() {
			return ""+this.value;
		},

		_set: function(value) {
			this.constants.__values__.value = ""+value;
		},

		_resize: function(offset, length) {
			offset = offset | 0;
			this._set(this.value.substring(offset, length && (offset + length | 0)));
		},

		constants: {
			byteOrder: Codec.LITTLE_ENDIAN,
			type: Codec.CHARSET_UTF8,
			value: ""
		},

		properties: {
			length: {
				get: function() {
					return this.value.length;
				},
				set: function(newValue, oldValue) {
					if (newValue < oldValue) {
						this._resize(0, newValue);
					} else {
						this.constants.__values__.value += (new Array(newValue - oldValue)).join(' ');
					}
					return newValue;
				}
			}
		}

	});

});
},
"Ti/Gesture":function(){
/* /titanium/Ti/Gesture.js */

define(["Ti/_/Evented", "Ti/_/lang", "Ti/UI", "Ti/_/ready"], function(Evented, lang, UI, ready) {

	var win = window,
		on = require.on,
		lastOrient = null,
		lastShake = (new Date()).getTime(),
		lastAccel = {},
		api = lang.setObject("Ti.Gesture", Evented, {
			_updateOrientation: function() {
				getWindowOrientation();
				lastOrient !== api.orientation && api.fireEvent('orientationchange', {
					orientation: lastOrient = api.orientation
				});
			},

			isLandscape: function() {
				return api.landscape;
			},

			isPortrait: function() {
				return api.portrait;
			},

			properties: {
				portrait: false,
				landscape: false,
				orientation: UI.UNKNOWN
			}
		});

	function getWindowOrientation() {
		var landscape = !!(window.innerWidth && (window.innerWidth > window.innerHeight));
		api.orientation = landscape ? UI.LANDSCAPE_LEFT : UI.PORTRAIT;
		api.landscape = landscape;
		api.portrait = !landscape;
		return api.orientation;
	}
	ready(function() {
		getWindowOrientation();
	});

	function deviceOrientation(evt) {
		var orient = null,
			beta = Math.abs(evt.beta || evt.y|0 * 90),
			gamma = Math.abs(evt.gamma || evt.x|0 * 90);

		beta < 5 && gamma > 170 && (orient = UI.FACE_DOWN);
		beta < 5 && gamma < 5 && (orient = UI.FACE_UP);
		beta > 50 && 0 > beta && lastOrient != orient && (orient = UI.UPSIDE_PORTRAIT);

		if (orient !== null && lastOrient !== orient) {
			api.fireEvent('orientationchange', {
				orientation: lastOrient = orient,
				source: evt.source
			});
		}
	}

	on(win, "MozOrientation", deviceOrientation);
	on(win, "deviceorientation", deviceOrientation);

	on(win, "devicemotion", function(evt) {
		var e = evt.acceleration || evt.accelerationIncludingGravity,
			x, y, z,
			currentTime,
			accel = e && {
				x: e.x,
				y: e.y,
				z: e.z,
				source: evt.source
			};

		if (accel) {
			if (lastAccel.x !== void 0) {
				x = Math.abs(lastAccel.x - accel.x) > 10;
				y = Math.abs(lastAccel.y - accel.y) > 10;
				z = Math.abs(lastAccel.z - accel.z) > 10;
				if ((x && (y || z)) || (y && z)) {
					currentTime = (new Date()).getTime();
					if ((accel.timestamp = currentTime - lastShake) > 300) {
						lastShake = currentTime;
						api.fireEvent('shake', accel);
					}
				}
			}
			lastAccel = accel;
		}
	});

	return api;

});
},
"Ti/API":function(){
/* /titanium/Ti/API.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var api = {};

	require.each(["debug", "error", "info", "log", "warn"], function(fn) {
		api[fn] = function() {
			console[fn]("[" + fn.toUpperCase() + "] " + lang.toArray(arguments).map(function(a) {
				return require.is(a, "Object") ? a.hasOwnProperty("toString") ? a.toString() : JSON.stringify(a) : a === null ? "null" : a === void 0 ? "undefined" : a;
			}).join(' '));
		};
	});

	return lang.setObject("Ti.API", Evented, api);

});
},
"Ti/Accelerometer":function(){
/* /titanium/Ti/Accelerometer.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	var lastShake = (new Date()).getTime(),
		lastAccel = {},
		threshold = 0.2,
		api = lang.setObject("Ti.Accelerometer", Evented);
	
	require.on(window, "devicemotion", function(evt) {
		var e = evt.acceleration || evt.accelerationIncludingGravity,
			currentTime,
			accel = e && {
				x: e.x,
				y: e.y,
				z: e.z,
				source: evt.source
			};
		if (accel) {
			if (lastAccel.x !== void 0 && (
				Math.abs(lastAccel.x - accel.x) > threshold || 
				Math.abs(lastAccel.y - accel.y) > threshold ||
				Math.abs(lastAccel.z - accel.z) > threshold
			)) {
				currentTime = (new Date()).getTime();
				accel.timestamp = currentTime - lastShake;
				lastShake = currentTime;
				api.fireEvent("update", accel);
			}
			lastAccel = accel;
		}
	});
	
	return api;
	
});
},
"Ti/UI/2DMatrix":function(){
/* /titanium/Ti/UI/2DMatrix.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/Platform"], function(declare, Evented, Platform) {

	var isFF = Platform.runtime === "gecko",
		api,
		px = function(x) {
			return isFF ? x + "px" : x;
		};

	function detMinor(y, x, m) {
		var x1 = x == 0 ? 1 : 0,
			x2 = x == 2 ? 1 : 2,
			y1 = y == 0 ? 1 : 0,
			y2 = y == 2 ? 1 : 2;
		return (m[y1][x1] * m[y2][x2]) - (m[y1][x2] * m[y2][x1]);
	}

	function mult(obj, a, b, c, d, tx, ty, r) {
		return {
			a: obj.a * a + obj.b * c,
			b: obj.a * b + obj.b * d,
			c: obj.c * a + obj.d * c,
			d: obj.c * b + obj.d * d,
			tx: obj.a * tx + obj.b * ty + obj.tx,
			ty: obj.c * tx + obj.d * ty + obj.ty,
			rotation: obj.rotation + (r | 0)
		};
	}

	return api = declare("Ti.UI.2DMatrix", Evented, {

		properties: {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			tx: 0,
			ty: 0,
			rotation: 0
		},

		constructor: function(matrix) {
			matrix && require.mix(this, matrix);
		},

		invert: function() {
			var x = 0,
				y = 0,
				m = [[this.a, this.b, this.tx], [this.c, this.d, this.ty], [0, 0, 1]],
				n = m,
				det = this.a * detMinor(0, 0, m) - this.b * detMinor(0, 1, m) + this.tx * detMinor(0, 2, m);

			if (Math.abs(det) > 1e-10) {
				det = 1.0 / det;
				for (; y < 3; y++) {
					for (; x < 3; x++) {
						n[y][x] = detMinor(x, y, m) * det;
						(x + y) % 2 == 1 && (n[y][x] = -n[y][x]);
					}
				}
			}

			return new api(mult(this, n[0][0], n[0][1], n[1][0], n[1][1], n[0][2], n[1][2]));
		},

		multiply: function(other) {
			return new api(mult(this, other.a, other.b, other.c, other.d, other.tx, other.ty, other.rotation));
		},

		rotate: function(angle) {
			return new api({ a: this.a, b: this.b, c: this.c, d: this.d, tx: this.tx, ty: this.ty, rotation: this.rotation + angle });
		},

		scale: function(x, y) {
			return new api(mult(this, x, 0, 0, y, 0, 0));
		},

		translate: function(x, y) {
			return new api(mult(this, 0, 0, 0, 0, x, y));
		},

		toCSS: function() {
			var i = 0,
				v = [this.a, this.b, this.c, this.d, this.tx, this.ty];
	
			for (; i < 6; i++) {
				v[i] = v[i].toFixed(6);
				i > 4 && (v[i] = px(v[i]));
			}

			return "matrix(" + v.join(",") + ") rotate(" + this.rotation + "deg)";
		}

	});

});

},
"Ti/_/lang":function(){
/* /titanium/Ti/_/lang.js */

/**
 * hitch() and setObject() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(function() {
	var global = this,
		hitch,
		is = require.is;

	function toArray(obj, offset) {
		return [].concat(Array.prototype.slice.call(obj, offset||0));
	}

	function hitchArgs(scope, method) {
		var pre = toArray(arguments, 2);
			named = is(method, "String");
		return function() {
			var s = scope || global,
				f = named ? s[method] : method;
			return f && f.apply(s, pre.concat(toArray(arguments)));
		};
	}

	return {
		hitch: hitch = function(scope, method) {
			if (arguments.length > 2) {
				return hitchArgs.apply(global, arguments);
			}
			if (!method) {
				method = scope;
				scope = null;
			}
			if (is(method, "String")) {
				scope = scope || global;
				if (!scope[method]) {
					throw(['hitch: scope["', method, '"] is null (scope="', scope, '")'].join(''));
				}
				return function() {
					return scope[method].apply(scope, arguments || []);
				};
			}
			return !scope ? method : function() {
				return method.apply(scope, arguments || []);
			};
		},

		isDef: function(it) {
			return !is(it, "Undefined");
		},

		mixProps: function(dest, src, everything) {
			var d, i, p, v, special = { properties: 1, constants: 0 };
			for (p in src) {
				if (src.hasOwnProperty(p) && !/^(constructor|__values__)$/.test(p)) {
					if (p in special) {
						d = dest[p] || (dest[p] = {});
						d.__values__ || (d.__values__ = {});
						for (i in src[p]) {
							(function(property, externalDest, internalDest, valueDest, /* setter/getter, getter, or value */ descriptor, capitalizedName, writable) {
								var o = is(descriptor, "Object"),
									getter = o && is(descriptor.get, "Function") && descriptor.get,
									setter = o && is(descriptor.set, "Function") && descriptor.set,
									pt = o && is(descriptor.post),
									post = pt === "Function" ? descriptor.post : pt === "String" ? hitch(externalDest, descriptor.post) : 0;

								if (o && (getter || setter || post)) {
									valueDest[property] = descriptor.value;
								} else if (is(descriptor, "Function")) {
									getter = descriptor;
								} else {
									valueDest[property] = descriptor;
								}

								// first set the internal private interface
								Object.defineProperty(internalDest, property, {
									get: function() {
										return getter ? getter.call(externalDest, valueDest[property]) : valueDest[property];
									},
									set: function(v) {
										var args = [v, valueDest[property], property];
										args[0] = valueDest[property] = setter ? setter.apply(externalDest, args) : v;
										post && post.apply(externalDest, args);
									},
									configurable: true,
									enumerable: true
								});

								// this is the public interface
								Object.defineProperty(dest, property, {
									get: function() {
										return internalDest[property];
									},
									set: function(v) {
										if (!writable) {
											throw new Error('Property "' + property + '" is read only');
										}
										internalDest[property] = v;
									},
									configurable: true,
									enumerable: true
								});

								if (require.has("declare-property-methods") && (writable || property.toUpperCase() !== property)) {
									externalDest["get" + capitalizedName] = function() { return internalDest[property]; };
									writable && (externalDest["set" + capitalizedName] = function(v) { return internalDest[property] = v; });
								}
							}(i, dest, d, d.__values__, src[p][i], i.substring(0, 1).toUpperCase() + i.substring(1), special[p]));
						}
					} else if (everything) {
						dest[p] = src[p];
					}
				}
			}
			return dest;
		},
		
		generateAccessors: function(definition, readOnlyProps, props) {
			
			function generateGetter(prop) {
				var getterName = "get" + prop.substring(0, 1).toUpperCase() + prop.substring(1);
				if (!(getterName in definition.prototype)) {
					definition.prototype[getterName] = function() {
						return this[prop];
					}
				}
			}
			
			function generateSetter(prop) {
				var setterName = "set" + prop.substring(0, 1).toUpperCase() + prop.substring(1);
				if (!(setterName in definition.prototype)) {
					definition.prototype[setterName] = function(value) {
						return this[prop] = value;
					}
				}
			}
			
			readOnlyProps && readOnlyProps.split(",").forEach(generateGetter);
			props && props.split(",").forEach(function(prop) {
				generateGetter(prop);
				generateSetter(prop);
			});
		},

		setObject: function(name) {
			var parts = name.split("."),
				q = parts.pop(),
				obj = window,
				i = 0,
				p = parts[i++];

			if (p) {
				do {
					obj = p in obj ? obj[p] : (obj[p] = {});
				} while (obj && (p = parts[i++]));
			}

			if (!obj || !q) {
				return;
			}
			q = q in obj ? obj[q] : (obj[q] = {});

			// need to mix args into values
			for (i = 1; i < arguments.length; i++) {
				is(arguments[i], "Object") ? this.mixProps(q, arguments[i], 1) : (q = arguments[i]);
			}

			return q;
		},

		toArray: toArray,

		urlEncode: function(obj) {
			var enc = encodeURIComponent,
				pairs = [],
				prop,
				value;

			for (prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					is(value = obj[prop], "Array") || (value = [value]);
					prop = enc(prop) + "=";
					require.each(value, function(v) {
						pairs.push(prop + enc(v));
					});
				}
			}

			return pairs.join("&");
		},

		val: function(originalValue, defaultValue) {
			return is(originalValue, "Undefined") ? defaultValue : originalValue;
		}
	};
});
},
"Ti/UI/WebView":function(){
/* /titanium/Ti/UI/WebView.js */

define(["Ti/_/declare", "Ti/_/UI/Widget", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/_/text!Ti/_/UI/WebViewBridge.js", "Ti/App", "Ti/API", "Ti/UI"],
	function(declare, Widget, dom, event, lang, bridge, App, API, UI) {

	var on = require.on;

	return declare("Ti.UI.WebView", Widget, {

		constructor: function() {
			App.addEventListener(this.widgetId + ":unload", lang.hitch(this, function() {
				this._loading(1);
			}));
			this.backgroundColor = "#fff";
		},

		destroy: function() {
			App.removeEventListener(this.widgetId + ":unload");
			this._destroy();
			Widget.prototype.destroy.apply(this, arguments);
		},

		_destroy: function() {
			if (this._iframe) {
				event.off(this._iframeHandles);
				dom.destroy(this._iframe);
			}
		},

		_createIFrame: function() {
			if (this._parent) {
				this._destroy();
				this._loading(1);

				var url = this.url,
					match = this.url.match(/(https?)\:\/\/([^\:\/]*)(:?\d*)(.*)/),
					loc = window.location,
					isSameDomain = !match || (match[0] + ":" === loc.protocol && match[1] + match[2] === window.location.host),
					iframe = this._iframe = dom.create("iframe", {
						frameborder: 0,
						marginwidth: 0,
						marginheight: 0,
						hspace: 0,
						vspace: 0,
						scrolling: this.showScrollbars ? "auto" : "no",
						src: url || require.toUrl("Ti/_/UI/blank.html"),
						style: {
							width: "100%",
							height: "100%"
						}
					}, this.domNode);

				this._iframeHandles = [
					require.on(iframe, "load", this, function(evt) {
						var i = Math.max(isSameDomain | 0, 0),
							cw = iframe.contentWindow,
							prop,
							url;

						if (i !== -1) {
							// we can always guarantee that the first load we'll know if it's the same domain
							isSameDomain = -1;
						} else {
							// for every load after the first, we need to try which will throw security errors
							for (prop in cw) {
								i++;
								break;
							}
						}

						if (i > 0) {
							url = cw.location.href;
							this.evalJS(bridge.replace("WEBVIEW_ID", this.widgetId + ":unload"));
							this.html && this._setContent(this.html);
						} else {
							API.warn("Unable to inject WebView bridge into cross-domain URL, ignore browser security message");
						}

						this._loading();
						this.fireEvent("load", {
							url: url ? (this.properties.__values__.url = url) : this.url
						});
					}),
					require.on(iframe, "error", this, function() {
						this._loading();
						this.fireEvent("error", {
							message: "Page failed to load",
							url: this.url
						});
					})
				];

				return 1;
			}
		},

		_setParent: function(view) {
			Widget.prototype._setParent.apply(this, arguments);

			// we are being added to a parent, need to manually fire
			(this.url || this.html) && this._createIFrame();
		},

		_getWindow: function() {
			return this._iframe.contentWindow;
		},

		_getDoc: function() {
			return this._getWindow().document;
		},

		_getHistory: function() {
			return this._getWindow().history;
		},

		_loading: function(v) {
			this.loading || v && this.fireEvent("beforeload", {
				url: this.url
			});
			this.constants.loading = !!v;
		},

		canGoBack: function() {
			return this.url && !!this._getHistory().length;
		},

		canGoForward: function() {
			return this.url && !!this._getHistory().length;
		},

		evalJS: function(js) {
			var w = this._getWindow(),
				r = null;
			try {
				r = js && w && w.eval && w.eval(js);
			} catch (e) {}
			return r;
		},

		goBack: function() {
			if (this.canGoBack()) {
				var h = this._getHistory();
				if (h) {
					this._loading(1);
					h.go(-1);
				}
			}
		},

		goForward: function() {
			if (this.canGoForward()) {
				var h = this._getHistory();
				if (h) {
					this._loading(1);
					h.go(1);
				}
			}
		},

		reload: function() {
			var w = this._getWindow();
			this.url && w ? (w.location.href = this.url) : this._createIFrame();
		},

		stopLoading: function(hardStop) {
			try {
				this.loading && hardStop ? this._destroy() : this._getWindow().stop();
			} catch (e) {}
			this._loading();
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,
		
		_getContentSize: function() {
			return {
				width: this._iframe ? this._iframe.clientWidth : 0,
				height: this._iframe ? this._iframe.clientHeight : 0
			};
		},

		_setContent: function(value) {
			try {
				var doc = this._getDoc();
				doc.open();
				doc.write(value);
				doc.close();
			} catch (e) {}
			return value;
		},

		properties: {
			data: {
				set: function(value) {
					var data = value;
					switch (data && data.declaredClass) {
						case "Ti.Filesystem.File":
							data = data.read();
						case "Ti.Blob":
							data = data.toString();
						default:
							this.html = data;
					}
					return value;
				}
			},

			html: {
				get: function(value) {
					var doc = this._iframe && this._getDoc();
					if (doc) {
						return doc.documentElement.innerHTML;
					}
				},
				set: function(value) {
					this.properties.__values__.url = "";
					this._createIFrame() && this._setContent(value);
					return value;
				}
			},

			showScrollbars: {
				set: function(value) {
					this._iframe && dom.attr.set(this._iframe, "scrolling", value ? "auto" : "no");
					return value;
				},
				value: true
			},

			url: { 
				post: function(value) {
					var values = this.properties.__values__;
					values.data = void 0;
					values.html = void 0;
					this._createIFrame();
				}
			}
		},

		constants: {
			loading: false
		}

	});

});
},
"Ti/_":function(){
/* /titanium/Ti/_.js */

define(["Ti/_/lang"], function(lang) {
	// Pre-calculate the screen DPI
	var body = document.body,
		measureDiv = document.createElement('div'),
		dpi;

	measureDiv.style.width = "1in";
	measureDiv.style.visibility = "hidden";
	body.appendChild(measureDiv);
	dpi = parseInt(measureDiv.clientWidth);
	body.removeChild(measureDiv);

	return lang.setObject("Ti._", {
		assert: function(test, msg) {
			if (!test) {
				throw new Error(msg);
			}
		},
		dpi: dpi,
		escapeHtmlEntities: function(html) {
			return (""+html).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
		},
		getAbsolutePath: function(path) {
			/^app\:\/\//.test(path) && (path = path.substring(6));
			/^\//.test(path) && (path = path.substring(1));
			return /^\/\//.test(path) || ~path.indexOf("://") ? path : location.pathname.replace(/(.*)\/.*/, "$1") + "/" + path;
		},
		uuid: function() {
			/**
			 * Math.uuid.js (v1.4)
			 * Copyright (c) 2010 Robert Kieffer
			 * Dual licensed under the MIT and GPL licenses.
			 * <http://www.broofa.com>
			 * mailto:robert@broofa.com
			 */
			// RFC4122v4 solution:
			return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0,
					v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			}).toUpperCase();
		}
	});
});
},
"Ti/Map":function(){
/* /titanium/Ti/Map.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.setObject("Ti.Map", Evented, {

		constants: {
			// these constants MUST match the correct order of the markers in Ti.Map.View
			ANNOTATION_GREEN: 1,
			ANNOTATION_PURPLE: 2,
			ANNOTATION_RED: 0,

			HYBRID_TYPE: 2,
			SATELLITE_TYPE: 1,
			STANDARD_TYPE: 0,
			TERRAIN_TYPE: 3
		},

		createAnnotation: function(args) {
			return new (require("Ti/Map/Annotation"))(args);
		},

		createView: function(args) {
			return new (require("Ti/Map/View"))(args);
		}

	});

});
},
"Ti/UI/Window":function(){
/* /titanium/Ti/UI/Window.js */

define(["Ti/_/declare", "Ti/Gesture", "Ti/Locale", "Ti/_/UI/SuperView", "Ti/UI"],
	function(declare, Gesture, Locale, SuperView, UI) {

	return declare("Ti.UI.Window", SuperView, {
	
		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		postscript: function() {
			if (this.url) {
				var prevWindow = UI.currentWindow;
				UI._setWindow(this);
				require("Ti/_/include!sandbox!" + this.url);
				UI._setWindow(prevWindow);
			}
		},

		_getTitle: function() {
			return Locale.getString(this.titleid, this.title);
		},

		constants: {
			url: void 0
		},

		properties: {
			modal: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						if (value) {
							var parentContainer = this._modalParentContainer = UI.createView();
							parentContainer.add(UI.createView({
								backgroundColor: "#000",
								opacity: 0.5
							}));
							parentContainer.add(this._modalContentContainer = UI.createView({
								width: UI.SIZE,
								height: UI.SIZE
							}));
							this._modalContentContainer.add(this);
						} else if (this._modalParentContainer) {
							this._modalParentContainer._opened && this._modalParentContainer.close();
							this._modalContentContainer.remove(this);
							this._modalParentContainer = null;
							if (this._opened) {
								this.close(); // Close to reset state...at this point it's not attached to the window anymore, but thinks it's still open
								this.open();
							}
						}
					}
					return value;
				}
			},

			orientation: {
				get: function() {
					return Gesture.orientation;
				}
			},

			title: void 0,

			titleid: void 0
		}

	});

});
},
"Ti/Platform":function(){
/* /titanium/Ti/Platform.js */

define(["Ti/_", "Ti/_/browser", "Ti/_/Evented", "Ti/_/lang", "Ti/Locale", "Ti/_/dom", "Ti/UI"],
	function(_, browser, Evented, lang, Locale, dom, UI) {
		
	var doc = document,
		midName = "ti:mid",
		matches = doc.cookie.match(new RegExp("(?:^|; )" + midName + "=([^;]*)")),
		mid = matches ? decodeURIComponent(matches[1]) : void 0,
		unloaded,
		on = require.on,
		hiddenIFrame = dom.create("iframe",{id: "urlOpener", style: {display: "none"} },doc.body);

	mid || (mid = localStorage.getItem(midName));
	mid || localStorage.setItem(midName, mid = _.uuid());

	function saveMid() {
		if (!unloaded) {
			unloaded = 1;
			var d = new Date();
			d.setTime(d.getTime() + 63072e7); // forever in mobile terms
			doc.cookie = midName + "=" + encodeURIComponent(mid) + "; expires=" + d.toUTCString();
			localStorage.setItem(midName, mid);
		}
	}
 
	on(window, "beforeunload", saveMid);
	on(window, "unload", saveMid);

	var nav = navigator,
		battery = nav.battery || nav.webkitBattery || nav.mozBattery,
		Platform = lang.setObject("Ti.Platform", Evented, {

			canOpenURL: function(url) {
				return !!url;
			},

			createUUID: _.uuid,

			is24HourTimeFormat: function() {
				return false;
			},

			openURL: function(url){
				if (/^([tel|sms|mailto])/.test(url)) {
					hiddenIFrame.contentWindow.location.href = url;
				} else { 
					var win = UI.createWindow({
							layout: "vertical",
							backgroundColor: "#888"
						}),
						backButton = UI.createButton({
							top: 2,
							bottom: 2,
							title: "Close"
						}),
						webview = UI.createWebView({
							width: UI.FILL,
							height: UI.FILL
						});
					backButton.addEventListener("singletap", function(){
						win.close();
					});
					win.add(backButton);
					win.add(webview);
					win.open();
					setTimeout(function(){
						webview.url = url;
					}, 1);
				}
			},

			properties: {
				batteryMonitoring: false
			},

			constants: {
				BATTERY_STATE_CHARGING: 1,
				BATTERY_STATE_FULL: 2,
				BATTERY_STATE_UNKNOWN: -1,
				BATTERY_STATE_UNPLUGGED: 0,
				address: void 0,
				architecture: void 0,
				availableMemory: void 0,
				batteryLevel: function() {
					return this.batteryMonitoring && battery ? battery.level * 100 : -1;
				},
				batteryState: function() {
					return this.batteryMonitoring && battery && battery.charging ? this.BATTERY_STATE_CHARGING : this.BATTERY_STATE_UNKNOWN;
				},
				isBrowser: true,
				id: mid,
				locale: Locale,
				macaddress: void 0,
				model: nav.userAgent,
				name: "mobileweb",
				netmask: void 0,
				osname: "mobileweb",
				ostype: nav.platform,
				runtime: browser.runtime,
				processorCount: void 0,
				username: void 0,
				version: require.config.ti.version
			}

		});

	battery && require.on(battery, "chargingchange", function() {
		Platform.batteryMonitoring && Platform.fireEvent("battery", {
			level: Platform.batteryLevel,
			state: Platform.batteryState
		});
	});

	return Platform;

});

},
"Ti/_/style":function(){
/* /titanium/Ti/_/style.js */

define(["Ti/_", "Ti/_/string", "Ti/Filesystem"], function(_, string, Filesystem) {

	var vp = require.config.vendorPrefixes.dom,
		is = require.is;

	function set(node, name, value) {
		var i = 0,
			x,
			uc;
		if (node) {
			if (arguments.length > 2) {
				while (i < vp.length) {
					x = vp[i++];
					x += x ? uc || (uc = string.capitalize(name)) : name;
					if (x in node.style) {
						(is(value, "Array") ? value : [value]).forEach(function(v) { node.style[x] = v; });
						return value;
					}
				}
			} else {
				for (x in name) {
					set(node, x, name[x]);
				}
			}
		}
		return node;
	}

	return {
		url: function(/*String|Blob*/url) {
			if (url && url.declaredClass === "Ti.Blob") {
				return "url(" + url.toString() + ")";
			}
			var match = url && url.match(/^(.+):\/\//),
				file = match && ~Filesystem.protocols.indexOf(match[1]) && Filesystem.getFile(url);
			return file && file.exists()
				? "url(" + file.read().toString() + ")"
				: !url || url === "none"
					? ""
					: /^url\(/.test(url)
						? url
						: "url(" + (require.cache(url) || _.getAbsolutePath(url)) + ")";
		},

		get: function(node, name) {
			if (is(name, "Array")) {
				for (var i = 0; i < name.length; i++) {
					name[i] = node.style[name[i]];
				}
				return name;
			}
			return node.style[name];
		},

		set: set
	};
});
},
"Ti/Analytics":function(){
/* /titanium/Ti/Analytics.js */

define(["Ti/_/analytics", "Ti/_/Evented", "Ti/_/lang"], function(analytics, Evented, lang) {

	return lang.setObject("Ti.Analytics", Evented, {

		addEvent: function(type, name, data) {
			analytics.add(type, name, data);
		},

		featureEvent: function(name, data) {
			analytics.add("app.feature", name, data);
		},

		navEvent: function(from, to, name, data) {
			analytics.add("app.nav", name, data);
		},

		settingsEvent: function(name, data) {
			analytics.add("app.settings", name, data);
		},

		timedEvent: function(name, start, stop, duration, data) {
			analytics.add("app.timed", name, require.mix({}, data, {
				start: start,
				stop: stop,
				duration: duration
			}));
		},

		userEvent: function(name, data) {
			analytics.add("app.user", name, data);
		}

	});

});
},
"Ti/_/Map/Google":function(){
/* /titanium/Ti/_/Map/Google.js */

define(["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/App/Properties", "Ti/Geolocation", "Ti/Map", "Ti/UI/View", "Ti/Utils"],
	function(declare, dom, event, lang, Properties, Geolocation, Map, View, Utils) {

	function mapType(type) {
		var t = gmaps.MapTypeId;
		switch (type) {
			case Map.HYBRID_TYPE: return t.HYBRID;
			case Map.SATELLITE_TYPE: return t.SATELLITE;
			case Map.TERRAIN_TYPE: return t.TERRAIN;
		}
		return t.ROADMAP;
	};

	var isDef = lang.isDef,
		mix = require.mix,
		on = require.on,
		handleTouchEvent = View.prototype._handleTouchEvent,
		defaultRegion = {
			latitude: 39.828175,
			longitude: -98.5795,
			latitudeDelta: 30.137412,
			longitudeDelta: 63.235658
		},
		gmaps,
		gevent,
		theInfoWindow,
		// the order of the markers MUST match the ANNOTATION_* constants defined in Ti.Map
		markers = { 0: "red", 1: "green", 2: "purple" },
		locationMarkerImage,
		onload = Ti.deferStart(),
		MapView = declare("Ti.Map.View", View, {

			constructor: function() {
				this.properties.annotations = [];
				this._routes = [];
				this.fireEvent("loading");
			},

			postscript: function() {
				var region = this.region,
					gmap = this._gmap = new gmaps.Map(this.domNode, {
						disableDefaultUI: true,
						zoom: 2,
						zoomControl: true,
						center: new gmaps.LatLng(region.latitude, region.longitude),
						mapTypeId: mapType(this.mapType)
					});

				this._boundsEvt = gevent.addListener(gmap, "bounds_changed", lang.hitch(this, "_fitRegion"));
				this._updateMap(region, 1);
				this._updateUserLocation(this.userLocation);
				this.annotations.forEach(this._createMarker, this);
				this._annotationEvents = [];
			},

			destroy: function() {
				event.off(this._annotationEvents);
				gevent.removeListener(this._boundsEvt);
				gevent.clearInstanceListeners(this._gmap);
				this.removeAllAnnotations();
				this._gmap = null;
				View.prototype.destroy.apply(this, arguments);
			},

			addAnnotation: function(/*Object|Ti.Map.Annotation*/a) {
				if (a) {
					a.declaredClass === "Ti.Map.Annotation" || (a = new Annotation(a));
					~this.annotations.indexOf(a) || this._createMarker(a, this.annotations.length);
				}
			},

			addAnnotations: function(/*Array*/annotations) {
				annotations && annotations.forEach(this.addAnnotation, this);
			},

			addRoute: function(/*Object*/route) {
				if (route && (route.points || []).length) {
					route.pline = new gmaps.Polyline({
						map: this._gmap,
						path: route.points.map(function(p) {
							return new gmaps.LatLng(p.latitude, p.longitude);
						}),
						strokeColor: route.color || "#000",
						strokeWeight: route.width || 1
					});
					this._routes.push(route);
				}
			},

			deselectAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var idx = this._indexOfAnnotation(a);
				theInfoWindow && theInfoWindow.idx === idx && this._hide(this.annotations[idx]);
			},

			removeAllAnnotations: function() {
				theInfoWindow && theInfoWindow.close();
				this.removeAnnotations(this.annotations);
			},

			removeAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var anno = this.properties.annotations,
					i = 0,
					idx = this._indexOfAnnotation(a);

				if (a = anno[idx]) {
					theInfoWindow && this._hide(a);
					gevent.removeListener(a.evt);
					a.marker.setMap(null);
					delete a.marker;
					a.destroy();
					anno[idx] = null;
				}
			},

			removeAnnotations: function(/*Array*/annotations) {
				annotations.forEach(function(a) {
					this.removeAnnotation(a);
				}, this);
			},

			removeRoute: function(/*Object*/route) {
				if (route && route.name) {
					var r = this._routes,
						i = 0;
					for (; i < r.length; i++) {
						if (r[i].name === route.name) {
							route.pline.setMap(null);
							delete route.pline;
							r.splice(i--, 1);
						}
					}
				}
			},

			selectAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var idx = this._indexOfAnnotation(a);
				~idx && this._show(this.annotations[idx]);
			},

			setLocation: function(location) {
				location && (this.region = location);
				isDef(location.animate) && (this.animated = location.animate);
				isDef(location.animated) && (this.animated = location.animated);
				isDef(location.regionFit) && (this.regionFit = location.regionFit);
				this._updateMap(location);
			},

			zoom: function(level) {
				var gmap = this._gmap;
				gmap.setZoom(gmap.getZoom() + level);
			},

			_show: function(annotation, clicksource) {
				if (annotation && (!theInfoWindow || theInfoWindow.idx !== annotation.idx)) {
					var _t = this,
						idx = annotation.idx,
						cls = "TiMapAnnotation",
						type,
						p = dom.create("div", { className: cls }),
						annotationNode = p,
						nodes = {
							annotation: annotationNode,
							leftButton: annotation.leftButton && dom.create("img", { className: cls + "LeftButton", src: annotation.leftButton }, p),
							rightButton: annotation.rightButton && dom.create("img", { className: cls + "RightButton", src: annotation.rightButton }, p),
							dummy: (p = dom.create("div", { className: cls + "Content" }, p)) && 0,
							title: dom.create("h1", { innerHTML: annotation._getTitle() }, p),
							subtitle: dom.create("p", { innerHTML: annotation._getSubtitle() }, p)
						},
						shown;

					function onShow() {
						var i = theInfoWindow.idx;
						i !== void 0 && ~i && i !== idx && _t._hide(_t.annotations[i]);
						shown || (shown = 1) && _t._dispatchEvents(annotation, clicksource);
					}

					// wire up the dom nodes in the info window
					event.off(_t._annotationEvents);
					for (type in nodes) {
						(function(t, node) {
							node && _t._annotationEvents.push(on(node, "click", function(evt) {
								event.stop(evt);
								_t._hide(annotation, t);
							}));
						}(type, nodes[type]));
					}

					// listen for updates to the annotation object
					_t._annotationEvents.push(on(annotation, "update", function(args) {
						if (theInfoWindow.idx === idx) {
							var p = args.property,
								markerImg;
							switch (p) {
								case "title":
								case "subtitle":
									nodes[p].innerHTML = args.value;
									break;
								case "leftButton":
								case "rightButton":
									nodes[p].src = args.value;
									break;
								case "image":
								case "pincolor":
									markerImg = _t._getMarkerImage(annotation);
									annotation.marker.setIcon(markerImg[0]);
									annotation.marker.setShadow(markerImg[1] || null);
							}
						}
					}));

					if (theInfoWindow) {
						onShow();
						theInfoWindow.setContent(annotationNode);
					} else {
						theInfoWindow = new gmaps.InfoWindow({ content: annotationNode });
						gevent.addListener(theInfoWindow, "domready", onShow);
						gevent.addListener(theInfoWindow, "closeclick", function() {
							_t._hide(annotation, "annotation");
						});
					}

					theInfoWindow.open(_t._gmap, annotation.marker);
					theInfoWindow.idx = idx;
				}
			},

			_hide: function(annotation, clicksource) {
				if (!clicksource || !~clicksource.indexOf("Button")) {
					theInfoWindow.close();
					theInfoWindow.idx = -1;
				}
				this._dispatchEvents(annotation, clicksource);
			},

			_dispatchEvents: function(annotation, clicksource) {
				var idx = annotation.idx,
					props = {
						annotation: annotation,
						clicksource: clicksource = clicksource || "pin",
						index: idx,
						latitude: annotation.latitude,
						longitude: annotation.longitude,
						map: this,
						subtitle: annotation._getSubtitle(),
						title: annotation._getTitle()
					};

				handleTouchEvent.call(this, "singletap", props);
				handleTouchEvent.call(this, "click", props);
				annotation._onclick(this, idx, clicksource);
			},

			_getMarkerImage: function(a) {
				var markerImg = markers[a.pincolor | 0],
					hash,
					blob;

				if (a.image) {
					if (a.image.declaredClass === "Ti.Blob") {
						markerImg = markers[hash = Utils.md5HexDigest(blob = a.image.toString())];
						markerImg || (markerImg = markers[hash] = [new gmaps.MarkerImage(blob)]); //, new gmaps.Size(x1, 34), new point(x2, 0), new point(10, 34));
					} else {
						markerImg = markers[a.image];
						markerImg || (markerImg = markers[a.image] = [new gmaps.MarkerImage(a.image)]);
					}
				}

				return markerImg;
			},

			_createMarker: function(a, i) {
				var markerImg = this._getMarkerImage(a);
				a.idx = i;
				a.evt = gevent.addListener(a.marker = new gmaps.Marker({
					map: this._gmap,
					icon: markerImg[0],
					shadow: markerImg[1],
					position: new gmaps.LatLng(a.latitude, a.longitude),
					optimized: false,
					title: a._getTitle(),
					animation: a.animate && gmaps.Animation.DROP
				}), "click", lang.hitch(this, function() {
					this[theInfoWindow && theInfoWindow.idx === i ? "_hide" : "_show"](a);
				}));
				this.properties.__values__.annotations[i] = a;
			},

			_indexOfAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var anno = this.properties.annotations,
					i = 0;

				if (a && a.declaredClass === "Ti.Map.Annotation") {
					return a.idx;
				}

				for (; i < anno.length; i++) {
					if (anno[i].title === a) {
						return i;
					}
				}
				return -1;
			},

			_fitRegion: function() {
				var c = this.constants,
					gmap = this._gmap,
					center = gmap.getCenter(),
					bounds = gmap.getBounds(),
					ne = bounds.getNorthEast(),
					sw = bounds.getSouthWest(),
					latD = c.latitudeDelta = ne.lat() - sw.lat(),
					lngD = c.longitudeDelta = ne.lng() - sw.lng(),
					region = {
						latitude: center.lat(),
						longitude: center.lng(),
						latitudeDelta: latD,
						longitudeDelta: lngD
					};

				this.regionFit && (this.properties.__values__.region = region);

				if (!this._initialized) {
					this._initialized = 1;
					this.fireEvent("complete");
				}

				this.fireEvent("regionChanged", region);
			},

			_updateMap: function(region, dontAnimate) {
				var gmap = this._gmap;
				if (gmap) {
					var animated = !dontAnimate && this.animated,
						latD = region.latitudeDelta / 2.0,
						lngD = region.longitudeDelta / 2.0;
					gmap[animated ? "panTo" : "setCenter"](new gmaps.LatLng(region.latitude, region.longitude));
					gmap[animated ? "panToBounds" : "fitBounds"](new gmaps.LatLngBounds(
						new gmaps.LatLng(region.latitude - latD, region.longitude - lngD),
						new gmaps.LatLng(region.latitude + latD, region.longitude + lngD)
					));
				}
			},

			_updateUserLocation: function(userLocation) {
				var gmap = this._gmap;
				if (gmap && (userLocation || this._locationInited)) {
					this._locationInited = 1;

					Geolocation[userLocation ? "addEventListener" : "removeEventListener"]("location", lang.hitch(this, function(e) {
						var marker = this._locationMarker,
							coords = e.coords,
							code = e.code,
							msg,
							pos;

						if (coords) {
							pos = new gmaps.LatLng(coords.latitude, coords.longitude);
							if (marker) {
								marker.setPosition(pos);
							} else {
								this._locationMarker = new gmaps.Marker({
									map: this._gmap,
									icon: locationMarkerImage,
									position: pos
								});
							}
						} else if ("code" in e) {
							Ti.API.warn("Geolocation error: " + (code === Geolocation.ERROR_DENIED ? "permission denied" : code === Geolocation.ERROR_TIMEOUT ? "timeout" : code === Geolocation.ERROR_LOCATION_UNKNOWN ? "position unavailable" : "unknown"));
						}
					}));

					if (!Geolocation.locationServicesEnabled) {
						Ti.API.warn("Geolocation services unavailable");
						this.properties.__values__.userLocation = false;
					} else if (!userLocation || this._locationMarker) {
						this._locationMarker.setVisible(userLocation);
					}
				}
			},

			_handleTouchEvent: function(type, e) {
				/(click|singletap)/.test(type) || View.prototype._handleTouchEvent.apply(this,arguments);
			},

			constants: {
				latitudeDelta: 0,
				longitudeDelta: 0
			},

			properties: {
				animated: false,
				annotations: {
					set: function(value) {
						value = value.filter(function(a) { return a && a.declaredClass === "Ti.Map.Annotation"; });
						if (this._gmap) {
							this.removeAllAnnotations();
							value.forEach(this._createMarker, this);
						}
						return value;
					}
				},
				mapType: {
					set: function(value) {
						this._gmap && this._gmap.setMapTypeId(mapType(value));
						return value;
					}
				},
				region: {
					set: function(newValue, oldValue) {
						return mix({}, defaultRegion, oldValue, newValue);
					},
					post: function(newValue, oldValue) {
						newValue !== oldValue && this._updateMap(newValue);
					},
					value: null
				},
				regionFit: true,
				userLocation: {
					post: function(value) {
						this._updateUserLocation(value);
					},
					value: false
				}
			}

		});

	window.TiMapViewInit = function() {
		gmaps = google.maps;
		gevent = gmaps.event;

		var i,
			prefix = "themes/" + require.config.ti.theme + "/Map/",
			point = gmaps.Point;

		function makeMarker(color, x1, x2) {
			return new gmaps.MarkerImage(prefix + "marker_" + color + ".png", new gmaps.Size(x1, 34), new point(x2, 0), new point(10, 34));
		}

		for (i in markers) {
			markers[i] = [makeMarker(markers[i], 20, 0), makeMarker(markers[i], 37, 20)];
		}

		locationMarkerImage = new gmaps.MarkerImage(prefix + "location.png", new gmaps.Size(22, 22), new point(0, 0), new point(11, 11));

		onload();
	};

	require(["http://maps.googleapis.com/maps/api/js?key=" + Properties.getString("ti.map.apikey", "") + "&sensor=true&callback=TiMapViewInit"]);

	return MapView;

});
},
"Ti/App/Properties":function(){
/* /titanium/Ti/App/Properties.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var storageKey = "ti:properties",
		types = {
			"Bool": function(value) {
				return !!value;
			},
			"Double": function(value) {
				return parseFloat(value);
			},
			"Int": function(value) {
				return parseInt(value);
			},
			"List": function(value) {
				return require.is(value, "Array") ? value : [value];
			},
			"String": function(value) {
				return "" + value;
			}
		},
		type,
		storage,
		api = lang.setObject("Ti.App.Properties",  Evented, {
			hasProperty: function(prop) {
				return !!getStorage(prop);
			},
			listProperties: function() {
				var storage = getStorage(),
					props = [],
					prop;
				for (prop in storage) {
					props.push(prop);
				}
				return props;
			},
			removeProperty: function(prop) {
				setProp(prop);
			}
		});

	function getStorage(prop) {
		if (!storage) {
			var value = localStorage.getItem(storageKey);
			storage = (require.is(value, "String") && JSON.parse(value)) || {};
		}
		if (prop) {
			return storage[prop];
		}
		return storage;
	}

	function getProp(prop, type, defaultValue) {
		var value = getStorage(prop);
		return value === void 0 ? defaultValue || null : types[type] ? types[type](value) : value;
	}

	function setProp(prop, type, value) {
		if (prop) {
			getStorage();
			if (value === void 0) {
				delete storage[prop];
			} else {
				storage[prop] = types[type] ? types[type](value) : value;
			}
			localStorage.setItem(storageKey, JSON.stringify(storage));
		}
	}

	for (type in types) {
		(function(t) {
			api["get" + t] = function(prop, defaultValue) {
				return getProp(prop, t, defaultValue);
			};
			api["set" + t] = function(prop, value) {
				setProp(prop, t, value)
			};
		}(type));
	}

	return api;

});
},
"Ti/_/UI/FontWidget":function(){
/* /titanium/Ti/_/UI/FontWidget.js */

define(["Ti/_/declare", "Ti/_/dom", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/_/UI/Widget"],
	function(declare, dom, lang, ready, style, Widget) {

	var textRuler;

	ready(function() {
		textRuler = dom.create("p", {
			style: {
				position: "absolute",
				top: "-1000em",
				left: 0,
				height: "auto",
				width: "auto"
			}
		}, document.body);
	});

	return declare("Ti._.UI.FontWidget", Widget, {

		constructor: function() {
			this._styleableDomNodes = [];
		},

		_setFont: function(font,domNode) {
			if (font) {
				require.is(font.fontSize, "Number") && (font.fontSize = dom.unitize(font.fontSize));
				style.set(domNode, font);
			} else {
				style.set(domNode,{
					fontFamily: "",
					fontSize: "",
					fontStyle: "",
					fontWeight: ""
				});
			}
		},

		_addStyleableDomNode: function(styleableDomNode) {
			this._styleableDomNodes.push(styleableDomNode);
		},

		_removeStyleableDomNode: function(styleableDomNode) {
			var index = this._styleableDomNodes.indexOf(styleableDomNode);
			index != -1 && this._styleableDomNodes.splice(index,1);
		},

		_measureText: function(text, domNode, width) {
			var computedStyle = window.getComputedStyle(domNode) || {},
				font = this.font || {},
				emptyText = !text || text === "";

			textRuler.innerHTML = emptyText ? "\u00C4y" : text;

			this._setFont({
				fontFamily: font.fontFamily || computedStyle.fontFamily || "",
				fontSize: font.fontSize || computedStyle.fontSize || "",
				fontStyle: font.fontStyle || computedStyle.fontStyle || "",
				fontWeight: font.fontWeight || computedStyle.fontWeight || ""
			}, textRuler);
			style.set(textRuler,{
				whiteSpace: domNode.style.whiteSpace,
				width: dom.unitize(lang.val(width,"auto"))
			});

			// Return the computed style
			return { width: emptyText ? 0 : textRuler.clientWidth + 0.5, height: textRuler.clientHeight };
		},

		properties: {
			color: {
				set: function(value) {
					for (var domNode in this._styleableDomNodes) {
						style.set(this._styleableDomNodes[domNode], "color", value);
					}
					return value;
				}
			},
			font: {
				set: function(value) {
					for (var domNode in this._styleableDomNodes) {
						this._setFont(value, this._styleableDomNodes[domNode]);
					}
					return value;
				}
			}
		}
	});
	
});
},
"Ti/UI/Tab":function(){
/* /titanium/Ti/UI/Tab.js */

define(["Ti/_/declare", "Ti/UI/View", "Ti/_/dom", "Ti/Locale", "Ti/UI"],
	function(declare, View, dom, Locale, UI) {

	var postTitle = {
		post: "_setTitle"
	};

	return declare("Ti.UI.Tab", View, {

		constructor: function(args) {
			var container = this._contentContainer = dom.create("div", {
				className: "TiUITabContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "vertical",
					boxPack: "center",
					boxAlign: "center"
				}
			}, this.domNode);

			this._tabIcon = dom.create("img", {
				className: "TiUITabImage"
			}, container);

			this._tabTitle = dom.create("div", {
				className: "TiUITabTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					userSelect: "none"
				}
			}, container);

			var self = this;
			this.addEventListener("singletap", function(e) {
				self._tabGroup && self._tabGroup.setActiveTab(self);
			});
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		_tabGroup: null,

		_tabNavigationGroup: null,

		open: function(win, options) {
			if (this._tabNavigationGroup) {
				this._tabNavigationGroup.open(win, options);
			} else {
				this.window = win;
			}
		},

		close: function(win, options) {
			this._tabNavigationGroup.close(win, options);
		},

		_setTitle: function() {
			this._tabTitle.innerHTML = Locale._getString(this.titleid, this.title);
		},

		properties: {
			active: {
				get: function(value) {
					return this._tabGroup && this._tabGroup.activeTab === this;
				}
			},

			icon: {
				set: function(value) {
					return this._tabIcon.src = value;
				}
			},

			title: postTitle,

			titleid: postTitle,

			window: {
				set: function(value) {
					var tabGroup = this._tabGroup;
					this._tabNavigationGroup = UI.MobileWeb.createNavigationGroup({
						window: value,
						navBarAtTop: tabGroup && tabGroup.tabsAtTop
					});
					this.active && tabGroup && tabGroup.setActiveTab(this); // Force the new nav group to get attached
					return value;
				}
			}
		}

	});

});

},
"Ti/_/encoding":function(){
/* /titanium/Ti/_/encoding.js */

define(["Ti/_/lang"], function(lang) {

	var fromCharCode = String.fromCharCode,
		x = 128;

	return lang.setObject("Ti._.encoding", {

		utf8encode: function(str) {
			var c,
				str = str.replace(/\r\n/g,"\n");
				i = 0,
				len = str.length,
				bytes = [];
	
			while (i < len) {
				c = str.charCodeAt(i++);

				if (c < x) {
					bytes.push(fromCharCode(c));
				} else if((c >= x) && (c < 2048)) {
					bytes.push(fromCharCode((c >> 6) | 192));
					bytes.push(fromCharCode((c & 63) | x));
				} else {
					bytes.push(fromCharCode((c >> 12) | 224));
					bytes.push(fromCharCode(((c >> 6) & 63) | x));
					bytes.push(fromCharCode((c & 63) | x));
				}
			}

			return bytes.join('');
		},

		utf8decode: function(bytes) {
			var str = [],
				i = 0,
				len = bytes.length,
				c,
				c2;

			while (i < len) {
				c = bytes.charCodeAt(i);
				if (c < x) {
					str.push(fromCharCode(c));
					i++;
				} else {
					c2 = bytes.charCodeAt(i+1);
					if(c > 191 && c < 224) {
						str.push(fromCharCode(((c & 31) << 6) | (c2 & 63)));
						i += 2;
					} else {
						str.push(fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (bytes.charCodeAt(i+2) & 63)));
						i += 3;
					}
				}
			}

			return str.join('');
		}

	});

});
},
"Ti/Network/HTTPClient":function(){
/* /titanium/Ti/Network/HTTPClient.js */

define(["Ti/_", "Ti/_/declare", "Ti/_/lang", "Ti/_/Evented", "Ti/Network", "Ti/Blob", "Ti/_/event"],
	function(_, declare, lang, Evented, Network, Blob, event) {

	var is = require.is,
		on = require.on;

	return declare("Ti.Network.HTTPClient", Evented, {

		constructor: function() {
			var xhr = this._xhr = new XMLHttpRequest;

			this._handles = [
				on(xhr, "error", this, "_onError"),
				on(xhr.upload, "error", this, "_onError"),
				on(xhr, "progress", this, function(evt) {
					evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
					is(this.ondatastream, "Function") && this.ondatastream.call(this, evt);
				}),
				on(xhr.upload, "progress", this, function(evt) {
					evt.progress = evt.lengthComputable ? evt.loaded / evt.total : false;
					is(this.onsendstream, "Function") && this.onsendstream.call(this, evt);
				})
			];

			xhr.onreadystatechange = lang.hitch(this, function() {
				var c = this.constants;
				switch (xhr.readyState) {
					case 0: c.readyState = this.UNSENT; break;
					case 1: c.readyState = this.OPENED; break;
					case 2: c.readyState = this.LOADING; break;
					case 3: c.readyState = this.HEADERS_RECEIVED; break;
					case 4:
						clearTimeout(this._timeoutTimer);
						this._completed = 1;
						c.readyState = this.DONE;
						if (xhr.status == 200) {
							if (this.file) {
								Filesystem.getFile(Filesystem.applicationDataDirectory,
									this.file).write(xhr.responseText);
							}
							c.responseText = xhr.responseText;
							c.responseData = new Blob({
								data: xhr.responseText,
								length: xhr.responseText.length,
								mimeType: xhr.getResponseHeader("Content-Type")
							});
							c.responseXML = xhr.responseXML;
							is(this.onload, "Function") && this.onload.call(this);
						} else {
							xhr.status / 100 | 0 > 3 && this._onError();
						}
				}
				this._fireStateChange();
			});
		},

		destroy: function() {
			if (this._xhr) {
				this._xhr.abort();
				this._xhr = null;
			}
			event.off(this._handles);
			Evented.destroy.apply(this, arguments);
		},

		_onError: function(error) {
			this.abort();
			is(error, "Object") || (error = { message: error });
			error.error || (error.error = error.message || this._xhr.status);
			parseInt(error.error) || (error.error = "Can't reach host");
			is(this.onerror, "Function") && this.onerror.call(this, error);
		},

		abort: function() {
			var c = this.constants;
			c.responseText = c.responseXML = c.responseData = "";
			this._completed = true;
			clearTimeout(this._timeoutTimer);
			this.connected && this._xhr.abort();
			c.readyState = this.UNSENT;
			this._fireStateChange();
		},

		_fireStateChange: function() {
			is(this.onreadystatechange, "Function") && this.onreadystatechange.call(this);
		},

		getResponseHeader: function(name) {
			return this._xhr.readyState > 1 ? this._xhr.getResponseHeader(name) : null;
		},

		open: function(method, url, async) {
			var httpURLFormatter = Ti.Network.httpURLFormatter,
				c = this.constants,
				wc = this.withCredentials,
				async = wc ? true : !!async;
			this.abort();
			this._xhr.open(
				c.connectionType = method,
				c.location = _.getAbsolutePath(httpURLFormatter ? httpURLFormatter(url) : url),
				async
			);
			wc && (this._xhr.withCredentials = wc);
		},

		send: function(args){
			try {
				var timeout = this.timeout | 0;
				this._completed = false;
				args = is(args, "Object") ? lang.urlEncode(args) : args;
				args && this._xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				this._xhr.send(args);
				clearTimeout(this._timeoutTimer);
				timeout && (this._timeoutTimer = setTimeout(lang.hitch(this, function() {
					if (this.connected) {
						this.abort();
						!this._completed && this._onError("Request timed out");
					}
				}, timeout)));
			} catch (ex) {console.debug(ex)}
		},

		setRequestHeader: function(name, value) {
			this._xhr.setRequestHeader(name, value);
		},

		properties: {
			ondatastream: void 0,
			onerror: void 0,
			onload: void 0,
			onreadystatechange: void 0,
			onsendstream: void 0,
			timeout: void 0,
			withCredentials: false
		},

		constants: {
			DONE: 4,

			HEADERS_RECEIVED: 2,

			LOADING: 3,

			OPENED: 1,

			UNSENT: 1,

			connected: function() {
				return this.readyState >= this.OPENED;
			},

			connectionType: void 0,

			location: void 0,

			readyState: this.UNSENT,

			responseData: void 0,

			responseText: void 0,

			responseXML: void 0,

			status: function() {
				return this._xhr.status;
			},

			statusText: function() {
				return this._xhr.statusText;
			}
		}

	});

});

},
"Ti/_/Layouts/Base":function(){
/* /titanium/Ti/_/Layouts/Base.js */

define(["Ti/_/css", "Ti/_/declare", "Ti/_/style", "Ti/_/dom"], function(css, declare, style, dom) {

	return declare("Ti._.Layouts.Base", null, {

		constructor: function(element) {
			this.element = element;
			css.add(element.domNode, css.clean(this.declaredClass));
		},

		destroy: function() {
			css.remove(this.element.domNode, css.clean(this.declaredClass));
		},
		
		verifyChild: function(child, parent) {
			if (!child._alive || !child.domNode) {
				console.debug("WARNING: Attempting to layout element that has been destroyed.\n\t Removing the element from the parent.\n\t The parent has a widget ID of " + parent.widgetId + ".");
				var children = parent.children;
				children.splice(children.indexOf(child),1);
				return;
			}
			return 1;
		},
		
		_computedSize: {width: 0, height: 0}

	});

});
},
"Ti/_/Layouts/Composite":function(){
/* /titanium/Ti/_/Layouts/Composite.js */

define(["Ti/_/Layouts/Base", "Ti/_/declare"], function(Base, declare) {

	return declare("Ti._.Layouts.Composite", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				children = element.children;
			for(var i = 0; i < children.length; i++) {
				
				// Layout the child
				var child = element.children[i];
				if (this.verifyChild(child,element)) {
					if (child._markedForLayout) {
						child._doLayout({
						 	origin: {
						 		x: 0,
						 		y: 0
						 	},
						 	isParentSize: {
						 		width: isWidthSize,
						 		height: isHeightSize
						 	},
						 	boundingSize: {
						 		width: width,
						 		height: height
						 	},
						 	alignment: {
						 		horizontal: this._defaultHorizontalAlignment,
						 		vertical: this._defaultVerticalAlignment
						 	},
						 	positionElement: true,
						 	layoutChildren: true
					 	});
					}
					
					// Update the size of the component
					var rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
					var bottomMostEdge = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
					rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
					bottomMostEdge > computedSize.height && (computedSize.height = bottomMostEdge);
				}
			}
			return computedSize;
		},
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "center"
		
	});

});

},
"Ti/UI/TableViewRow":function(){
/* /titanium/Ti/UI/TableViewRow.js */

define(["Ti/_/declare", "Ti/_/lang", "Ti/UI/View", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/UI"],
	function(declare, lang, View, dom, css, style, UI) {

	var setStyle = style.set,
		isDef = lang.isDef,
		imagePrefix = "themes/" + require.config.ti.theme + "/UI/TableViewRow/"
		checkImage = imagePrefix + "check.png",
		childImage = imagePrefix + "child.png",
		detailImage = imagePrefix + "detail.png";

	return declare("Ti.UI.TableViewRow", View, {
		
		// The number of pixels 1 indention equals
		_indentionScale: 10,
		
		constructor: function(args) {
			this.add(this._defaultControl = UI.createView({
				width: UI.INHERIT,
				height: UI.INHERIT,
				layout: "horizontal"
			}));
			this._defaultControl._layout._defaultVerticalAlignment = "center";
			
			this._defaultControl.add(this._leftImageView = UI.createImageView({
				width: UI.SIZE,
				height: UI.SIZE
			})); 

			this._defaultControl.add(this._titleLabel = UI.createLabel({
				width: UI.INHERIT,
				height: UI.INHERIT,
				wordWrap: false
			}));

			this._defaultControl.add(this._rightImageView = UI.createImageView({
				width: UI.SIZE, 
				height: UI.SIZE
			}));
		},
		
		_usingDefaultControl: 1,

		_defaultWidth: UI.INHERIT,

		_defaultHeight: UI.SIZE,
		
		_tableRowHeight: void 0,
		
		_tableViewSection: null,
		
		_handleTouchEvent: function(type, e) {
			if (type === "click" || type === "singletap") {
				this._tableViewSection && this._tableViewSection._tableView && (this._tableViewSection._tableView._tableViewRowClicked = this);
			}
			View.prototype._handleTouchEvent.apply(this,arguments);
		},

		_doBackground: function(evt) {
			if (this._touching) {
				this._titleLabel.color = this.selectedColor;
			} else {
				this._titleLabel.color = this.color;
			}
			View.prototype._doBackground.apply(this,arguments);
		},

		properties: {
			className: void 0,
			color: {
				set: function(value) {
					this._titleLabel.color = value;
					return value;
				}
			},
			hasCheck: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage) && !this.hasChild) {
						this._rightImageView.image = value ? checkImage : "";
					}
					return value;
				}
			},
			hasChild: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage)) {
						this._rightImageView.image = value ? childImage : "";
					}
					return value;
				}
			},
			hasDetail: {
				set: function(value, oldValue) {
					if (value !== oldValue && !isDef(this.rightImage) && !this.hasChild && !this.hasCheck) {
						this._rightImageView.image = value ? detailImage : "";
					}
					return value;
				}
			},
			indentionLevel: {
				set: function(value) {
					this._leftImageView.left = value * this._indentionScale;
					return value;
				},
				value: 0
			},
			leftImage: {
				set: function(value) {
					this._leftImageView.image = value;
					return value;
				}
			},
			rightImage: {
				set: function(value, oldValue) {
					if (value !== oldValue) {
						this._rightImageView.image = value;
					}
					return value;
				}
			},
			selectedColor: void 0,
			title: {
				set: function(value) {
					this._titleLabel.text = value;
					return value;
				}
			},
			
			// Pass through to the label
			font: {
				set: function(value) {
					this._titleLabel.font = value;
					return value;
				}
			}
		}

	});

});
},
"Ti/UI/Button":function(){
/* /titanium/Ti/UI/Button.js */

define(["Ti/_/declare", "Ti/_/UI/FontWidget", "Ti/_/dom", "Ti/_/css", "Ti/_/style", "Ti/_/lang", "Ti/Locale", "Ti/UI"],
	function(declare, FontWidget, dom, css, style, lang, Locale, UI) {

	var setStyle = style.set,
		postDoBackground = {
			post: "_updateLook"
		},
		titlePost = {
			post: "_updateTitle"
		};

	return declare("Ti.UI.Button", FontWidget, {

		constructor: function() {
			this._contentContainer = dom.create("div", {
				className: "TiUIButtonContentContainer",
				style: {
					display: ["-webkit-box", "-moz-box"],
					boxOrient: "horizontal",
					boxPack: "center",
					boxAlign: "center",
					pointerEvents: "none",
					width: "100%",
					height: "100%"
				}
			}, this.domNode);

			this._buttonImage = dom.create("img", {
				className: "TiUIButtonImage",
				style: {
					pointerEvents: "none"
				}
			}, this._contentContainer);

			this._buttonTitle = dom.create("div", {
				className: "TiUIButtonTitle",
				style: {
					whiteSpace: "nowrap",
					pointerEvents: "none",
					userSelect: "none"
				}
			}, this._contentContainer);

			this._addStyleableDomNode(this._buttonTitle);
			
			this._setDefaultLook();
			
			this.addEventListener("touchstart",function(){
				if (this.selectedColor) {
					setStyle(this._buttonTitle,"color",this.selectedColor);
				}
			});
			this.addEventListener("touchend",function(){
				if (this.selectedColor) {
					setStyle(this._buttonTitle,"color",this.color || "black");
				}
			});
			this.domNode.addEventListener("mouseout",lang.hitch(this,function(){
				if (this.selectedColor) {
					setStyle(this._buttonTitle,"color",this.color || "black");
				}
			}));
		},

		_defaultWidth: UI.SIZE,

		_defaultHeight: UI.SIZE,
		
		_updateLook: function() {
			if (this.backgroundColor || this.backgroundDisabledColor || this.backgroundDisabledImage || this.backgroundFocusedColor || 
				this.backgroundFocusedImage || this.backgroundImage || this.backgroundSelectedColor || this.backgroundSelectedImage) {
				this._clearDefaultLook();
			} else {
				this._setDefaultLook();
			}
			this._doBackground();
		},
		
		_setDefaultLook: function() {
			if (!this._hasDefaultLook) {
				this._hasDefaultLook = true;
				css.add(this.domNode, "TiUIElementGradient");
				css.add(this.domNode, "TiUIButtonDefault");
			}
		},
		
		_clearDefaultLook: function() {
			if (this._hasDefaultLook) {
				this._hasDefaultLook = false;
				css.remove(this.domNode, "TiUIElementGradient");
				css.remove(this.domNode, "TiUIButtonDefault");
			}
		},
		
		_getContentSize: function(width, height) {
			return {
				width: this._buttonImage.width + this._measureText(this.title, this._buttonTitle).width,
				height: Math.max(this._buttonImage.height, this._measureText(this.title, this._buttonTitle).height)
			};
		},

		_setTouchEnabled: function(value) {
			FontWidget.prototype._setTouchEnabled.apply(this, arguments);
			var cssVal = value ? "auto" : "none";
			setStyle(this._contentContainer, "pointerEvents", cssVal);
			setStyle(this._buttonImage, "pointerEvents", cssVal);
			setStyle(this._buttonTitle, "pointerEvents", cssVal);
		},

		_updateTitle: function() {
			this._buttonTitle.innerHTML = Locale._getString(this.titleid, this.title);
			this._hasSizeDimensions() && this._triggerLayout();
		},

		properties: {
			
			// Override the default background info so we can hook into it
			backgroundColor: postDoBackground,

			backgroundDisabledColor: postDoBackground,

			backgroundDisabledImage: postDoBackground,

			backgroundFocusedColor: postDoBackground,

			backgroundFocusedImage: postDoBackground,

			backgroundImage: postDoBackground,

			backgroundSelectedColor: postDoBackground,

			backgroundSelectedImage: postDoBackground,
			
			enabled: {
				set: function(value, oldValue) {
					
					if (value !== oldValue) {
						if (this._hasDefaultLook) {	
							if (!value) {
								css.remove(this.domNode,"TiUIElementGradient");
								setStyle(this.domNode,"backgroundColor","#aaa");
							} else {
								css.add(this.domNode,"TiUIElementGradient");
								setStyle(this.domNode,"backgroundColor","");
							}
						}
						this._setTouchEnabled(value);
					}
					return value;
				},
				value: true
			},
			
			image: {
				set: function(value) {
					require.on(this._buttonImage, "load", lang.hitch(this, function () {
						this._hasSizeDimensions() && this._triggerLayout();
					}));
					this._buttonImage.src = value;
					return value;
				}
			},
			selectedColor: void 0,
			textAlign: {
				set: function(value) {
					setStyle(this._contentContainer, "boxPack", value === UI.TEXT_ALIGNMENT_LEFT ? "start" : value === UI.TEXT_ALIGNMENT_RIGHT ? "end" : "center");
					return value;
				}
			},
			title: titlePost,
			titleid: titlePost,
			verticalAlign: {
				set: function(value) {
					setStyle(this._contentContainer, "boxAlign", value === UI.TEXT_VERTICAL_ALIGNMENT_TOP ? "start" : value === UI.TEXT_VERTICAL_ALIGNMENT_BOTTOM ? "end" : "center");
					return value;
				},
				value: UI.TEXT_VERTICAL_ALIGNMENT_CENTER
			}
		}

	});

});
},
"Ti/_/Gestures/SingleTap":function(){
/* /titanium/Ti/_/Gestures/SingleTap.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.SingleTap", GestureRecognizer, {
		
		name: "singletap",
		
		_touchStartLocation: null,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
			}
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1 && this._touchStartLocation) {
				var x = e.changedTouches[0].clientX,
					y = e.changedTouches[0].clientY;
				if (Math.abs(this._touchStartLocation.x - x) < this._driftThreshold && 
						Math.abs(this._touchStartLocation.y - y) < this._driftThreshold) {
					this._touchStartLocation = null;
					var result = {
						x: x,
						y: y,
						source: this.getSourceNode(e,element)
					};
					if (!element._isGestureBlocked(this.name)) {
						lang.hitch(element,element._handleTouchEvent("click",result));
						lang.hitch(element,element._handleTouchEvent(this.name,result));
					}
				}
			}
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		}

	});

});
},
"Ti/Media":function(){
/* /titanium/Ti/Media.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.setObject("Ti.Media", Evented, {

		constants: {
			UNKNOWN_ERROR: 0,
			DEVICE_BUSY: 1,
			NO_CAMERA: 2,
			NO_VIDEO: 3,

			VIDEO_CONTROL_DEFAULT: 1,
			VIDEO_CONTROL_EMBEDDED: 1,
			VIDEO_CONTROL_FULLSCREEN: 2,
			VIDEO_CONTROL_NONE: 0,
			VIDEO_CONTROL_HIDDEN: 0,

			VIDEO_SCALING_NONE: 0,
			VIDEO_SCALING_ASPECT_FILL: 2,
			VIDEO_SCALING_ASPECT_FIT: 1,
			VIDEO_SCALING_MODE_FILL: 3,

			VIDEO_PLAYBACK_STATE_STOPPED: 0,
			VIDEO_PLAYBACK_STATE_PLAYING: 1,
			VIDEO_PLAYBACK_STATE_PAUSED: 2,

			VIDEO_LOAD_STATE_PLAYABLE: 1,
			VIDEO_LOAD_STATE_PLAYTHROUGH_OK: 2,
			VIDEO_LOAD_STATE_STALLED: 4,
			VIDEO_LOAD_STATE_UNKNOWN: 0,

			VIDEO_REPEAT_MODE_NONE: 0,
			VIDEO_REPEAT_MODE_ONE: 1,

			VIDEO_FINISH_REASON_PLAYBACK_ENDED: 0,
			VIDEO_FINISH_REASON_PLAYBACK_ERROR: 1,
			VIDEO_FINISH_REASON_USER_EXITED: 2,

			MEDIA_TYPE_PHOTO: "public.image",
			MEDIA_TYPE_VIDEO: "public.video"
		},

		//beep: function() {},

		//createAudioPlayer: function() {},

		//createSound: function() {},

		createVideoPlayer: function(args) {
			return new (require("Ti/Media/VideoPlayer"))(args);
		},

		vibrate: function(pattern) {
			"vibrate" in navigator && navigator.vibrate(require.is(pattern, "Array") ? pattern : [pattern | 0]);
		}

	});
	
});
},
"Ti/_/text":function(){
/* /titanium/Ti/_/text.js */

define(function() {
	var cache = {};

	return {
		dynamic: true, // prevent the loader from caching the result

		normalize: function(name, normalize) {
			var parts = name.split("!"),
				url = parts[0];
			parts.shift();
			return (/^\./.test(url) ? normalize(url) : url) + (parts.length ? "!" + parts.join("!") : "");
		},

		load: function(name, require, onLoad, config) {
			var x,
				url = require.toUrl(name),
				c = cache[url] || require.cache(url);

			if (!c) {
				x = new XMLHttpRequest();
				x.open("GET", url, false);
				x.send(null);
				if (x.status === 200) {
					c = x.responseText;
				} else {
					throw new Error("Failed to load text \"" + url + "\": " + x.status);
				}
			}

			onLoad(c);
		}
	};
});

},
"Ti/UI/MobileWeb/TableViewSeparatorStyle":function(){
/* /titanium/Ti/UI/MobileWeb/TableViewSeparatorStyle.js */

define("Ti/UI/MobileWeb/TableViewSeparatorStyle", ["Ti/_/lang"], function(lang) {

	return lang.setObject("Ti.UI.MobileWeb.TableViewSeparatorStyle", {}, {
		constants: {
			NONE: 0,
			SINGLE_LINE: 1
		}
	});
	
});
},
"Ti/Map/View":function(){
/* /titanium/Ti/Map/View.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/_/Map/Google", "Ti/App/Properties"], function(declare, Evented, Google, Properties) {

	var backend = Properties.getString("ti.map.backend");

	return declare("Ti.Map.View", [Evented, backend ? require(backend) : Google]);

});

},
"Ti/_/UI/SuperView":function(){
/* /titanium/Ti/_/UI/SuperView.js */

define(["Ti/_/declare", "Ti/UI", "Ti/UI/View"], function(declare, UI, View) {

	return declare("Ti._.UI.SuperView", View, {

		destroy: function() {
			this.close();
			View.prototype.destroy.apply(this, arguments);
		},

		open: function(args) {
			if (!this._opened) {
				this._opened = 1;
				UI._addWindow(this, 1).show();
				this.fireEvent("open");
				this._handleFocusEvent();
			}
		},

		close: function(args) {
			if (this._opened) {
				this._opened = 0;
				UI._removeWindow(this);
				this.fireEvent("close");
				this._handleBlurEvent();
			}
		},
		
		_handleFocusEvent: function(args) {
			this.fireEvent("focus",args);
		},
		
		_handleBlurEvent: function(args) {
			this.fireEvent("blur",args);
		}

	});

});
},
"Ti/_/browser":function(){
/* /titanium/Ti/_/browser.js */

define(["Ti/_"], function(_) {
	var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/);
	return _.browser = {
		runtime: match ? match[0] : "unknown"
	};
});
},
"Ti/_/Gestures/LongPress":function(){
/* /titanium/Ti/_/Gestures/LongPress.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.LongPress", GestureRecognizer, {
		
		name: "longpress",
		
		_timer: null,
		_touchStartLocation: null,
		
		// This is the amount of time that must elapse before the tap is considered a long press
		_timeThreshold: 500,
		
		// This is the amount of space the finger is allowed drift until the gesture is no longer considered a tap
		_driftThreshold: 25,
		
		processTouchStartEvent: function(e, element){
			clearTimeout(this._timer);
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
				this._timer = setTimeout(lang.hitch(this,function(){
					if (!element._isGestureBlocked(this.name)) {
						this.blocking.push("singletap");
						this.blocking.push("doubletap");
						lang.hitch(element,element._handleTouchEvent("longpress",{
							x: e.changedTouches[0].clientX,
							y: e.changedTouches[0].clientY,
							source: this.getSourceNode(e,element)
						}));
					}
				}),this._timeThreshold);
			}
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				clearTimeout(this._timer);
			}
		},
		finalizeTouchEndEvent: function(){
			this.blocking = [];
		},
		
		processTouchMoveEvent: function(e, element){
			if (!this._touchStartLocation || Math.abs(this._touchStartLocation.x - e.changedTouches[0].clientX) > this._driftThreshold || 
					Math.abs(this._touchStartLocation.y - e.changedTouches[0].clientY) > this._driftThreshold) {
				clearTimeout(this._timer);
			}
		},
		
		processTouchCancelEvent: function(e, element){
			clearTimeout(this._timer);
		}
		
	});
	
});
},
"Ti":function(){
/* /titanium/Ti.js */

/**
 * This file contains source code from the following:
 *
 * es5-shim
 * Copyright 2009, 2010 Kristopher Michael Kowal
 * MIT License
 * <https://github.com/kriskowal/es5-shim>
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(
	["Ti/_", "Ti/_/analytics", "Ti/App", "Ti/_/Evented", "Ti/_/lang", "Ti/_/ready", "Ti/_/style", "Ti/Buffer", "Ti/Platform", "Ti/UI", "Ti/Locale", "Ti/_/include"],
	function(_, analytics, App, Evented, lang, ready, style, Buffer, Platform, UI) {

	var global = window,
		cfg = require.config,
		deployType = cfg.app.deployType,
		ver = cfg.ti.version,
		is = require.is,
		each = require.each,
		has = require.has,
		on = require.on,
		loaded,
		unloaded,
		showingError,
		waiting = [],
		Ti = lang.setObject("Ti", Evented, {
			constants: {
				buildDate: cfg.ti.buildDate,
				buildHash: cfg.ti.buildHash,
				version: ver
			},

			properties: {
				userAgent: function() {
					return navigator.userAgent;
				}
			},

			createBuffer: function(args) {
				return new Buffer(args);
			},

			include: function(files) {
				typeof files === "array" || (files = [].concat(Array.prototype.slice.call(arguments, 0)));
				each(files, function(f) {
					require("Ti/_/include!" + f);
				});
			},

			deferStart: function() {
				if (loaded) {
					console.warn("app.js already loaded!");
				} else {
					var n = Math.round(Math.random()*1e12);
					waiting.push(n);
					return function() {
						var p = waiting.indexOf(n);
						~p && waiting.splice(p, 1);
						loaded = 1;
						waiting.length || require(cfg.main || ["app.js"]);
					};
				}
			}
		}),
		loadAppjs = Ti.deferStart();

	// add has() tests
	has.add("devmode", deployType === "development");

	// Object.defineProperty() shim
	if (!has("object-defineproperty")) {
		// add support for Object.defineProperty() thanks to es5-shim
		var odp = Object.defineProperty;
		Object.defineProperty = function defineProperty(obj, prop, desc) {
			if (!obj || (!is(obj, "Object") && !is(obj, "Function") && !is(obj, "Window"))) {
				throw new TypeError("Object.defineProperty called on non-object: " + obj);
			}
			desc = desc || {};
			if (!desc || (!is(desc, "Object") && !is(desc, "Function"))) {
				throw new TypeError("Property description must be an object: " + desc);
			}
	
			if (odp) {
				try {
					return odp.call(Object, obj, prop, desc);
				} catch (e) {}
			}
	
			var op = Object.prototype,
				h = function (o, p) {
					return o.hasOwnProperty(p);
				},
				a = h(op, "__defineGetter__"),
				p = obj.__proto__;
	
			if (h(desc, "value")) {
				if (a && (obj.__lookupGetter__(prop) || obj.__lookupSetter__(prop))) {
					obj.__proto__ = op;
					delete obj[prop];
					obj[prop] = desc.value;
					obj.__proto__ = p;
				} else {
					obj[prop] = desc.value;
				}
			} else {
				if (!a) {
					throw new TypeError("Getters and setters can not be defined on this javascript engine");
				}
				if (h(desc, "get")) {
					defineGetter(obj, prop, desc.get);
				}
				if (h(desc, "set")) {
					defineSetter(obj, prop, desc.set);
				} else {
					obj[prop] = null;
				}
			}
		};
	}

	if (!has("js-btoa")) {
		var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
			fromCharCode = String.fromCharCode;

		global.btoa = function(bytes) {
			var ascii = [],
				chr1, chr2, chr3,
				enc1, enc2, enc3, enc4,
				i = 0,
				len = bytes.length;

			while (i < len) {
				chr1 = bytes.charCodeAt(i++);
				chr2 = bytes.charCodeAt(i++);
				chr3 = bytes.charCodeAt(i++);

				enc1 = chr1 >> 2;
				enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
				enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
				enc4 = chr3 & 63;

				if (isNaN(chr2)) {
					enc3 = enc4 = 64;
				} else if (isNaN(chr3)) {
					enc4 = 64;
				}

				ascii.push(tab.charAt(enc1) + tab.charAt(enc2) + tab.charAt(enc3) + tab.charAt(enc4));
			}

			return ascii.join('');
		};

		global.atob = function(ascii) {
			var bytes = [],
				enc1, enc2, enc3, enc4,
				i = 0,
				len = ascii.length;

			ascii = ascii.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < len) {
				enc1 = tab.indexOf(ascii.charAt(i++));
				enc2 = tab.indexOf(ascii.charAt(i++));
				enc3 = tab.indexOf(ascii.charAt(i++));
				enc4 = tab.indexOf(ascii.charAt(i++));

				bytes.push(fromCharCode((enc1 << 2) | (enc2 >> 4)));

				enc3 !== 64 && bytes.push(fromCharCode(((enc2 & 15) << 4) | (enc3 >> 2)));
				enc4 !== 64 && bytes.push(fromCharCode(((enc3 & 3) << 6) | enc4));
			}

			return bytes.join('');
		};
	}

	// console.*() shim	
	console === void 0 && (console = {});

	// make sure "log" is always at the end
	each(["debug", "info", "warn", "error", "log"], function (c) {
		console[c] || (console[c] = ("log" in console)
			?	function () {
					var a = Array.apply({}, arguments);
					a.unshift(c + ":");
					console.log(a.join(" "));
				}
			:	function () {}
		);
	});

	// JSON.parse() and JSON.stringify() shim
	if (!has("json-stringify")) {
		function escapeString(s){
			return ('"' + s.replace(/(["\\])/g, '\\$1') + '"').
				replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
				replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r");
		}
	
		JSON.parse = function (s) {
			return eval('(' + s + ')');
		};
	
		JSON.stringify = function (value, replacer, space) {
			if (is(replacer, "String")) {
				space = replacer;
				replacer = null;
			}
	
			function stringify(it, indent, key) {
				var val,
					len,
					objtype = typeof it,
					nextIndent = space ? (indent + space) : "",
					sep = space ? " " : "",
					newLine = space ? "\n" : "",
					ar = [];
	
				if (replacer) {
					it = replacer(key, it);
				}
				if (objtype === "number") {
					return isFinite(it) ? it + "" : "null";
				}
				if (is(objtype, "Boolean")) {
					return it + "";
				}
				if (it === null) {
					return "null";
				}
				if (is(it, "String")) {
					return escapeString(it);
				}
				if (objtype === "function" || objtype === "undefined") {
					return void 0;
				}
	
				// short-circuit for objects that support "json" serialization
				// if they return "self" then just pass-through...
				if (is(it.toJSON, "Function")) {
					return stringify(it.toJSON(key), indent, key);
				}
				if (it instanceof Date) {
					return '"{FullYear}-{Month+}-{Date}T{Hours}:{Minutes}:{Seconds}Z"'.replace(/\{(\w+)(\+)?\}/g, function(t, prop, plus){
						var num = it["getUTC" + prop]() + (plus ? 1 : 0);
						return num < 10 ? "0" + num : num;
					});
				}
				if (it.valueOf() !== it) {
					return stringify(it.valueOf(), indent, key);
				}
	
				// array code path
				if (it instanceof Array) {
					for(key = 0, len = it.length; key < len; key++){
						var obj = it[key];
						val = stringify(obj, nextIndent, key);
						if (!is(val, "String")) {
							val = "null";
						}
						ar.push(newLine + nextIndent + val);
					}
					return "[" + ar.join(",") + newLine + indent + "]";
				}
	
				// generic object code path
				for (key in it) {
					var keyStr;
					if (is(key, "Number")) {
						keyStr = '"' + key + '"';
					} else if (is(key, "String")) {
						keyStr = escapeString(key);
					} else {
						continue;
					}
					val = stringify(it[key], nextIndent, key);
					if (!is(val, "String")) {
						// skip non-serializable values
						continue;
					}
					// At this point, the most non-IE browsers don't get in this branch 
					// (they have native JSON), so push is definitely the way to
					ar.push(newLine + nextIndent + keyStr + ":" + sep + val);
				}
				return "{" + ar.join(",") + newLine + indent + "}"; // String
			}
	
			return stringify(value, "", "");
		};
	}

	// protect global titanium object
	Object.defineProperty(global, "Ti", { value: Ti, writable: false });
	Object.defineProperty(global, "Titanium", { value: Ti, writable: false });

	// print the Titanium version *after* the console shim
	console.info("[INFO] Appcelerator Titanium " + ver + " Mobile Web");

	// make sure we have some vendor prefixes defined
	cfg.vendorPrefixes || (cfg.vendorPrefixes = ["", "Moz", "Webkit", "O", "ms"]);

	// expose JSON functions to Ti namespace
	Ti.parse = JSON.parse;
	Ti.stringify = JSON.stringify;

	function shutdown() {
		if (!unloaded) {
			unloaded = 1;
			App.fireEvent("close");
			analytics.add("ti.end", "ti.end");
		}
	}

	on(global, "beforeunload", shutdown);
	on(global, "unload", shutdown);

	if (has("ti-show-errors")) {
		on(global, "error", function(e) {
			if (!showingError) {
				showingError = 1;

				var f = e.filename || "",
					match = f.match(/:\/\/.+(\/.*)/),
					filename = match ? match[1] : e.filename,
					line = e.lineno,
					win = UI.createWindow({
						backgroundColor: "#f00",
						top: "100%",
						height: "100%",
						layout: "vertical"
					}),
					view,
					button,
					makeLabel = function(text, height, color, fontSize) {
						win.add(UI.createLabel({
							color: color,
							font: { fontSize: fontSize, fontWeight: "bold" },
							height: height,
							left: 10,
							right: 10,
							textAlign: UI.TEXT_ALIGNMENT_CENTER,
							text: text
						}));
					};

				makeLabel("Application Error", "15%", "#0f0", "24pt");
				makeLabel((e.message || "Unknown error").replace(/([^:]+:)/, "").trim() + (filename && filename !== "undefined" ? " at " + filename : "") + (line ? " (line " + line + ")" : ""), "45%", "#fff", "16pt");
				win.add(view = UI.createView({ height: "12%" }));
				view.add(button = UI.createButton({ title: "Dismiss" }));
				win.addEventListener("close", function() { win.destroy(); });
				button.addEventListener("singletap", function() {
					win.animate({
						duration: 500,
						top: "100%"
					}, function() {
						win.close();
						showingError = 0;
					});
				});
				makeLabel("Error messages will only be displayed during development. When your app is packaged for final distribution, no error screen will appear. Test your code!", "28%", "#000", "10pt");
				
				on.once(win,"postlayout", function() {
					setTimeout(function() {
						win.animate({
							duration: 500,
							top: 0
						}, function() {
							win.top = 0;
							win.height = "100%";
						});
					}, 100);
				});
				
				win.open();
			}
		});
	}

	ready(function() {
		style.set(document.body, {
			margin: 0,
			padding: 0
		});

		if (cfg.app.analytics) {
			// enroll event
			if (localStorage.getItem("mobileweb_enrollSent") === null) {
				// setup enroll event
				analytics.add("ti.enroll", "ti.enroll", {
					app_name: App.name,
					oscpu: 1,
					mac_addr: null,
					deploytype: deployType,
					ostype: Platform.osname,
					osarch: null,
					app_id: App.id,
					platform: Platform.name,
					model: Platform.model
				});
				localStorage.setItem("mobileweb_enrollSent", true)
			}

			// app start event
			analytics.add("ti.start", "ti.start", {
				tz: (new Date()).getTimezoneOffset(),
				deploytype: deployType,
				os: Platform.osname,
				osver: Platform.ostype,
				version: cfg.tiVersion,
				un: null,
				app_version: cfg.appVersion,
				nettype: null
			});

			// try to sent previously sent analytics events on app load
			analytics.send();
		}

		// load app.js when ti and dom is ready
		ready(loadAppjs);
	});

	return Ti;

});
},
"Ti/UI/Animation":function(){
/* /titanium/Ti/UI/Animation.js */

define(["Ti/_/declare", "Ti/_/Evented"], function(declare, Evented) {

	return declare("Ti.UI.Animation", Evented, {

		start: function() {
			this.fireEvent("start");
		},

		complete: function() {
			this.fireEvent("complete");
		},

		properties: {
			autoreverse: void 0,
			backgroundColor: void 0,
			bottom: void 0,
			center: void 0,
			color: void 0,
			curve: void 0,
			delay: void 0,
			duration: void 0,
			height: void 0,
			left: void 0,
			opacity: void 0,
			repeat: void 0,
			right: void 0,
			top: void 0,
			transform: void 0,
			visible: void 0,
			width: void 0,
			zIndex: void 0
		}

	});

});

},
"Ti/UI/View":function(){
/* /titanium/Ti/UI/View.js */

define(["Ti/_/declare", "Ti/_/dom", "Ti/_/UI/Element", "Ti/_/lang", "Ti/_/string", "Ti/_/Layouts", "Ti/_/style", "Ti/UI"],
	function(declare, dom, Element, lang, string, Layouts, style, UI) {
		
	var unitize = dom.unitize,
		set = style.set,
		View;

	return View = declare("Ti.UI.View", Element, {

		_parent: null,

		constructor: function() {
			this.children = [];
			this.layout = "composite";
			this.containerNode = this.domNode;
		},

		add: function(view) {
			this._add(view);
		},

		remove: function(view) {
			this._remove(view);
		},

		destroy: function() {
			if (this.children) {
				var c;
				while (this.children.length) {
					c = this.children.splice(0, 1);
					c[0].destroy();
				}
			}
			Element.prototype.destroy.apply(this, arguments);
		},

		_getScrollableContentWidth: function() {
			return 600;
		},

		_getScrollablePosition: function() {
			return {x: 0, y: 0};
		},

		_createHorizontalScrollBar: function() {
			var scrollBar = this._horizontalScrollBar = dom.create("div", {
				className: "TiUIScrollBar",
				style: {
					position: 'absolute',
					zIndex: 0x7FFFFFFF, // Max (32-bit) z-index
					border: "3px solid #555",
					borderRadius: "3px",
					height: "0px",
					bottom: "0px",
					opacity: 0
				}
			}, this.domNode);
		},

		_destroyHorizontalScrollBar: function() {
			this._cancelPreviousAnimation();
			dom.destroy(this._horizontalScrollBar);
		},

		_createVerticalScrollBar: function() {
			var scrollBar = this._verticalScrollBar = dom.create("div", {
				className: "TiUIScrollBar",
				style: {
					position: 'absolute',
					zIndex: 0x7FFFFFFF, // Max (32-bit) z-index
					border: "3px solid #555",
					borderRadius: "3px",
					width: "0px",
					right: "0px",
					opacity: 0
				}
			}, this.domNode);
		},
		
		_destroyVerticalScrollBar: function() {
			this._cancelPreviousAnimation();
			dom.destroy(this._verticalScrollBar);
		},
		
		_cancelPreviousAnimation: function() {
			if (this._isScrollBarActive) {
				set(this._horizontalScrollBar,"transition","");
				set(this._verticalScrollBar,"transition","");
				clearTimeout(this._horizontalScrollBarTimer);
				clearTimeout(this._verticalScrollBarTimer);
			}
		},
		
		_startScrollBars: function(normalizedScrollPosition, visibleAreaRatio) {
			
			this._cancelPreviousAnimation();
			
			if (this._horizontalScrollBar && visibleAreaRatio.x < 1 && visibleAreaRatio.x > 0) {
				var startingX = normalizedScrollPosition.x,
					measuredWidth = this._measuredWidth;
				startingX < 0 && (startingX = 0);
				startingX > 1 && (startingX = 1);
				this._horizontalScrollBarWidth = (measuredWidth - 6) * visibleAreaRatio.x;
				this._horizontalScrollBarWidth < 10 && (this._horizontalScrollBarWidth = 10);
				set(this._horizontalScrollBar, {
					opacity: 0.5,
					left: unitize(startingX * (measuredWidth - this._horizontalScrollBarWidth - 6)),
					width: unitize(this._horizontalScrollBarWidth)
				});
				this._isScrollBarActive = true;
			}
			
			if (this._verticalScrollBar && visibleAreaRatio.y < 1 && visibleAreaRatio.y > 0) {
				var startingY = normalizedScrollPosition.y,
					measuredHeight = this._measuredHeight;
				startingY < 0 && (startingY = 0);
				startingY > 1 && (startingY = 1);
				this._verticalScrollBarHeight = (measuredHeight - 6) * visibleAreaRatio.y;
				this._verticalScrollBarHeight < 10 && (this._verticalScrollBarHeight = 10);
				set(this._verticalScrollBar, {
					opacity: 0.5,
					top: unitize(startingY * (measuredHeight - this._verticalScrollBarHeight - 6)),
					height: unitize(this._verticalScrollBarHeight)
				});
				this._isScrollBarActive = true;
			}
		},
		
		_updateScrollBars: function(normalizedScrollPosition) {
			if (!this._isScrollBarActive) {
				return;
			}
			
			if (this._horizontalScrollBar) {
				var newX = normalizedScrollPosition.x,
					measuredWidth = this._measuredWidth;
				newX < 0 && (newX = 0);
				newX > 1 && (newX = 1);
				set(this._horizontalScrollBar,"left",unitize(newX * (measuredWidth - this._horizontalScrollBarWidth - 6)));
			}
			
			if (this._verticalScrollBar) {
				var newY = normalizedScrollPosition.y,
					measuredHeight = this._measuredHeight;
				newY < 0 && (newY = 0);
				newY > 1 && (newY = 1);
				set(this._verticalScrollBar,"top",unitize(newY * (measuredHeight - this._verticalScrollBarHeight - 6)));
			}
		},
		
		_endScrollBars: function() {
			if (!this._isScrollBarActive) {
				return;
			}
			
			var self = this;
			if (this._horizontalScrollBar) {
				var horizontalScrollBar = this._horizontalScrollBar;
				if (horizontalScrollBar) {
					set(horizontalScrollBar,"transition","all 1s ease-in-out");
					setTimeout(function(){
						set(horizontalScrollBar,"opacity",0);
						self._horizontalScrollBarTimer = setTimeout(function(){
							self._isScrollBarActive = false;
							set(horizontalScrollBar,"transition","");
						},500);
					},0);
				}
			}
			
			if (this._verticalScrollBar) {
				var verticalScrollBar = this._verticalScrollBar;
				if (verticalScrollBar) {
					set(verticalScrollBar,"transition","all 1s ease-in-out");
					setTimeout(function(){
						set(verticalScrollBar,"opacity",0);
						self._verticalScrollBarTimer = setTimeout(function(){
							self._isScrollBarActive = false;
							set(verticalScrollBar,"transition","");
						},500);
					},0);
				}
			}
		},

		_defaultWidth: UI.FILL,

		_defaultHeight: UI.FILL,

		properties: {
			layout: {
				set: function(value) {
					var match = value.match(/^(horizontal|vertical)$/),
						value = match ? match[0] : "composite";

					if (this._layout) {
						this._layout.destroy();
						this._layout = null;
					}

					this._layout = new Layouts[string.capitalize(value)](this);

					return value;
				}
			}
		}

	});

});
},
"Ti/_/Evented":function(){
/* /titanium/Ti/_/Evented.js */

define(function() {

	return {
		destroy: function() {
			for (var i in this) {
				delete this[i];
			}
			this._alive = 0;
		},

		addEventListener: function(name, handler) {
			this.listeners || (this.listeners = {});
			(this.listeners[name] = this.listeners[name] || []).push(handler);
		},

		removeEventListener: function(name, handler) {
			if (this.listeners) {
				if (handler) {
					var i = 0,
						events = this.listeners[name],
						l = events && events.length || 0;
	
					for (; i < l; i++) {
						events[i] === handler && events.splice(i, 1);
					}
				} else {
					delete this.listeners[name];
				}
			}
		},

		fireEvent: function(name, eventData) {
			var i = 0,
				modifiers = this._modifiers && this._modifiers[name],
				listeners = this.listeners && this.listeners[name],
				l = modifiers && modifiers.length,
				data = require.mix({
					source: this,
					type: name
				}, eventData);
				
			while (i < l) {
				modifiers[i++].call(this, data);
			}

			if (listeners) {
				// We deep copy the listeners because the original list can change in the middle of a callback
				listeners = [].concat(listeners);
				i = 0;
				l = listeners.length;
				while (i < l) {
					listeners[i++].call(this, data);
				}
			}
		},

		_addEventModifier: function(name, handler) {
			this._modifiers || (this._modifiers = {});
			(require.is(name, "Array") ? name : [name]).forEach(function(n) {
				(this._modifiers[n] = this._modifiers[n] || []).push(handler);
			}, this);
		}
	};

});
},
"Ti/_/Filesystem/Local":function(){
/* /titanium/Ti/_/Filesystem/Local.js */

define(["Ti/_/declare", "Ti/_/encoding", "Ti/_/lang", "Ti/API", "Ti/Blob"],
	function(declare, encoding, lang, API, Blob) {

	var reg,
		regDate = (new Date()).getTime(),
		File,
		Filesystem,
		ls = localStorage,
		slash = '/',
		metaMap = {
			n: "sname",
			c: "i_created",
			m: "i_modified",
			t: "s_type",
			y: "s_mimeType",
			e: "b_remote",
			x: "bexecutable",
			r: "breadonly",
			s: "isize",
			l: "bsymbolicLink",
			h: "bhidden"
		},
		metaCast = {
			i: function(i) {
				return i - 0;
			},
			s: function(s) {
				return ""+s;
			},
			b: function(b) {
				return !!(b|0);
			}
		},
		metaPrefix = "ti:fs:meta:",
		blobPrefix = "ti:fs:blob:",
		pathRegExp = /(\/)?([^\:]*)(\:\/\/)?(.*)/,

		// important! add new mime types to the end of array and then figure out the index to assign to each extension
		mimeTypes = "application/octet-stream,text/plain,text/html,text/css,text/xml,text/mathml,image/gif,image/jpeg,image/png,image/x-icon,image/svg+xml,application/x-javascript,application/json,application/pdf,application/x-opentype,audio/mpeg,video/mpeg,video/quicktime,video/x-flv,video/x-ms-wmv,video/x-msvideo,video/ogg,video/mp4,video/webm,text/csv".split(','),
		mimeExtentions = { txt: 1, html: 2, htm: 2, css: 3, xml: 4, mml: 5, gif: 6, jpeg: 7, jpg: 7, png: 8, ico: 9, svg: 10, js: 11, json: 12, pdf: 13, otf: 14, mp3: 15, mpeg: 16, mpg: 16, mov: 17, flv: 18, wmv: 19, avi: 20, ogg: 21, ogv: 21, mp4: 22, m4v: 22, webm: 23, csv: 24 };

	function getLocal(path, meta) {
		return ls.getItem("ti:fs:" + (meta ? "meta:" : "blob:") + path);
	}

	function setLocal(path, value, meta) {
		ls.setItem("ti:fs:" + (meta ? "meta:" : "blob:") + path, value);
		return value.length;
	}

	function getRemote(path) {
		var xhr = new XMLHttpRequest;
		xhr.overrideMimeType('text/plain; charset=x-user-defined');
		xhr.open("GET", '.' + path, false);
		xhr.send(null);
		return xhr.status === 200 ? { data: xhr.responseText, mimeType: xhr.getResponseHeader("Content-Type") } : null;
	}

	function registry(path) {
		var stack = [],
			r;

		if (!reg) {
			reg = {
				'/': "tD\nr1"
			};

			require("./titanium/filesystem.registry").split(/\n|\|/).forEach(function(line, i) {
				var depth = 0,
					line = line.split('\t'),
					len = line.length,
					name;

				if (i === 0 && line[0] === "ts") {
					regDate = line[1];
					reg[slash] += "\nc" + regDate;
				} else {
					for (; depth < len && !line[depth]; depth++) {}
					stack = stack.slice(0, depth).concat(name = line[depth]);
					reg[slash + stack.join(slash)] = "n" + name + "\nt" + (depth + 1 == len ? 'D' : 'F\ns' + line[depth + 1]);
				}
			});
		}
		return (r = reg[path]) && r + "\nr1\ne1\nc" + regDate + "\nm" + regDate;
	}

	function filesystem() {
		return Filesystem || (Filesystem = require("Ti/Filesystem"));
	}

	function mkdir(prefix, parts, i, parent) {
		var file,
			i = i || 1,
			path = prefix + parts.slice(0, i).join(slash);

		if (parent && parent.readonly) {
			// parent directory is readonly, so we can't create a directory here
			API.error('Unable to create "' + path + '" because parent is readonly');
			return false;
		}

		file = new File({
			nativePath: path,
			type: 'D'
		});
		file.createDirectory();

		if (++i > parts.length) {
			// we're done!
			return true;
		}

		return mkdir(prefix, parts, i, file);
	}

	function mkdirs(path) {
		if (path) {
			var match = path.match(pathRegExp),
				prefix = (match[1] ? match[1] : match[2] + match[3]) || slash;
			path = match[1] ? match[2] : match[4];
			return path ? mkdir(prefix, path.split(slash)) : true;
		}
		return false;
	}

	function cpdir(src, dest) {
		var path = src.nativePath,
			re = new RegExp("^(ti:fs:meta|ti:fs:blob):" + path + (/\/$/.test(path) ? '' : slash) + "(.*)"),
			match,
			key,
			i = 0,
			len = ls.length;

		dest = filesystem().getFile(dest.nativePath, src.name);

		if (mkdirs(dest.nativePath)) {
			while (i < len) {
				key = ls.key(i++);
				(match = key.match(re)) && ls.setItem(match[1] + ':' + dest.nativePath + slash + match[2], ls.getItem(key) || '');
			}
			return true;
		}

		return false;
	}

	function purgeTemp() {
		var re = /^ti:fs:tmp:\/\//,
			i = 0,
			len = ls.length,
			key;
		while (i < len) {
			key = ls.key(i++);
			re.test(key) && ls.removeItem(key);
		}
	}
	purgeTemp();
	require.on(window, "beforeunload", purgeTemp);

	(function(paths, now) {
		for (var p in paths) {
			getLocal(p, 1) || setLocal(p, "c" + now + "\nm" + now + "\ntD\ne0\nx0\nl0\nh0\nr" + paths[p], 1);
		}
	}({
		"appdata://": 0,
		"/": 1,
		"tmp://": 0
	}, (new Date()).getTime()));

	return File = declare("Ti._.Filesystem.Local", null, {

		constructor: function(path) {
			if (require.is(path, "String")) {
				var match = path.match(pathRegExp),
					b = !match[1] && match[3];

				if (/^\.\./.test(path = b ? match[4] : match[2])) {
					throw new Error('Irrational path "' + path + '"');
				}

				this.constants.__values__.nativePath = (b ? match[2] + "://" : slash) + path;
			}

			this._type = !path || path._type === 'D' ? 'D' : 'F';
		},

		postscript: function(args) {
			var c = this.constants,
				path = this.nativePath,
				metaData = path && getLocal(path, 1) || registry(path),
				match = path.match(pathRegExp),
				prefix = (match[1] ? match[1] : match[2] + match[3]) || slash,
				parentPath,
				parent;

			metaData && (this._exists = 1) && metaData.split('\n').forEach(function(line) {
				var fieldInfo = metaMap[line.charAt(0)],
					field = fieldInfo.substring(1),
					value = metaCast[fieldInfo.charAt(0)](line.substring(1));
				(c.hasOwnProperty(field) ? c.__values__ : this)[field] = value;
			}, this);

			path = match[1] ? match[2] : match[4];
			parentPath = path.split(slash);
			c.name = parentPath.pop();
			parentPath = parentPath.join(slash);
			parent = c.parent = path ? new File(prefix + parentPath) : null;

			(parent && parent.readonly) || (match && match[1]) && (c.readonly = true);
		},

		constants: {
			name: "",
			executable: false,
			readonly: false,
			size: 0,
			symbolicLink: false,
			nativePath: "",
			parent: null,
			writable: {
				get: function() {
					return !this.readonly;
				},
				set: function(value) {
					return this.constants.__value__.readonly = !value;
				},
				value: true
			}
		},

		properties: {
			hidden: false
		},

		append: function(/*Ti.Blob|Ti.Filesystem.File*/data) {
			if (this.isFile()) {
				switch (data && data.declaredClass) {
					case "Ti.Filesystem.File":
						data = data.read();
					case "Ti.Blob":
						this._mimeType = data.mimeType;
						data = data.text;
				}
				var blob = this.read();
				blob.append(data);
				return this.write(blob);
			}
			return false;
		},

		copy: function(dest) {
			if (this.exists && dest) {
				var fs = filesystem(),
					dest = dest.declaredClass === "Ti.Filesystem.File" ? dest : fs.getFile.apply(null, arguments),
					p = dest.parent,
					isFile = this.isFile();
				if (dest.exists()) {
					if (dest.readonly) {
						return false;
					}
					if (dest.isFile()) {
						if (!isFile) {
							Ti.API.error("Destination is not a directory");
							return false;
						}
						return dest.write(this.read());
					} else {
						return isFile ? fs.getFile(dest.nativePath, this.name).write(this.read()) : cpdir(this, dest);
					}
				} else {
					if (p) {
						p.createDirectory();
						if (!p.exists() || p.readonly || (!isFile && !dest.createDirectory())) {
							return false;
						}
					}
					return isFile ? dest.write(this.read()) : cpdir(this, dest);
				}
			}
			return false;
		},

		createDirectory: function() {
			return this._create('D');
		},

		createFile: function() {
			return this._create('F');
		},

		createTimestamp: function() {
			return this._created || null;
		},

		deleteDirectory: function(recursive) {
			if (this.isDirectory() && !this.readonly) {
				var path = this.nativePath,
					re = new RegExp("^ti:fs:(meta|blob):" + path + (/\/$/.test(path) ? '' : slash) + ".*"),
					i = 0,
					len = ls.length;
				while (i < len) {
					if (re.test(key = ls.key(i++))) {
						if (!recursive) {
							Ti.API.error('Directory "' + path + '" not empty');
							return false;
						}
						ls.removeItem(key);
					}
				}
				ls.removeItem(metaPrefix + path);
				ls.removeItem(blobPrefix + path);
				return true;
			}
			return false;
		},

		deleteFile: function() {
			if (this.exists() && this.isFile() && !this.readonly) {
				var path = this.nativePath;
				ls.removeItem(metaPrefix + path);
				ls.removeItem(blobPrefix + path);
				return true;
			}
			return false;
		},

		exists: function() {
			return !!this._exists;
		},

		extension: function() {
			var m = this.name.match(/\.(.+)$/);
			return m ? m[1] : "";
		},

		getDirectoryListing: function() {
			var files = [];
			if (this.isDirectory()) {
				var path = this.nativePath + (/\/$/.test(this.nativePath) ? '' : slash),
					lsRegExp = new RegExp("^" + metaPrefix + path + "(.*)"),
					regRegExp = new RegExp("^" + path + "(.*)"),
					i = 0,
					len = ls.length;

				function add(s, re) {
					var file, match = s.match(re);
					match && match[1] && files.indexOf(file = match[1].split(slash)[0]) < 0 && files.push(file);
				}

				// check local storage
				while (i < len) {
					add(ls.key(i++), lsRegExp);
				}

				// check remote storage
				for (i in reg) {
					add(i, regRegExp);
				}
			}
			return files.sort();
		},

		isDirectory: function() {
			return this._type === 'D';
		},

		isFile: function() {
			return this._type === 'F';
		},

		modificationTimestamp: function() {
			return this._modified || null;
		},

		move: function() {
			return this.copy.apply(this, arguments) && this[this.isFile() ? "deleteFile" : "deleteDirectory"](1);
		},

		open: function(mode) {
			var FileStream = require("Ti/Filesystem/FileStream");
			return this.exists() && this.isFile() ? new FileStream({
				mode: mode,
				data: this.read().text
			}) : null;
		},

		read: function() {
			if (this.exists() && this.isFile()) {
				var path = this.nativePath,
					obj,
					data = this._remote ? (obj = getRemote(path)).data : getLocal(path) || "",
					defaultMimeType =  mimeTypes[mimeExtentions[this.extension()] || 0],
					type = obj && obj.mimeType || this._mimeType || defaultMimeType,
					i = 0,
					len = data.length,
					binaryData = '',
					params = {
						file: this,
						data: data,
						length: len,
						mimeType: type = type === "application/octet-stream" && type !== defaultMimeType ? defaultMimeType : type,
						nativePath: path
					};

				if (this._remote && /^(application|image|audio|video)\//.test(type)) {
					while (i < len) {
						binaryData += String.fromCharCode(data.charCodeAt(i++) & 0xff);
					}
					params.data = btoa(binaryData);
				}

				return new Blob(params);
			}
			return null;
		},

		rename: function(name) {
			if (this.exists && !this.readonly) {
				var origPath = this.nativePath,
					path = origPath,
					blob = ls.getItem(blobPrefix + path),
					re = new RegExp("^ti:fs:(meta|blob):" + path + (/\/$/.test(path) ? '' : slash) + "(.*)"),
					match = path.match(pathRegExp),
					prefix = (match[1] ? match[1] : match[2] + match[3]) || slash,
					i = 0,
					len = ls.length,
					c = this.constants.__values__,
					dest,
					key;

				path = match[1] ? match[2] : match[4];

				if (!path) {
					Ti.API.error('Can\'t rename root "' + prefix + '"');
					return false;
				}

				path = path.split(slash);
				path.pop();
				path.push(name);

				dest = new File(path = prefix + path.join(slash));
				if (dest.exists() || dest.parent.readonly) {
					return false;
				}

				if (this._type === 'D') {
					while (i < len) {
						key = ls.key(i++);
						if (match = key.match(re)) {
							ls.setItem("ti:fs:" + match[1] + ":" + path + slash + match[2], ls.getItem(key));
							ls.removeItem(key);
						}
					}
				}

				this._save(path, name);
				blob && ls.setItem(blobPrefix + path, blob);
				ls.removeItem(metaPrefix + origPath);
				ls.removeItem(blobPrefix + origPath);

				return true;
			}
			return false;
		},

		resolve: function() {
			return this.nativePath;
		},

		spaceAvailable: function() {
			return "remainingSpace" in ls ? ls.remainingSpace : null;
		},

		write: function(/*String|File|Blob*/data, append) {
			var path = this.nativePath;
			if (path && this.isFile() && !this.readonly && this.parent && !this.parent.readonly) {
				switch (data && data.declaredClass) {
					case "Ti.Filesystem.File":
						data = data.read();
					case "Ti.Blob":
						this._mimeType = data.mimeType;
						data = data._data || "";
				}
				this._exists = true;
				this._modified = (new Date()).getTime();
				this._created || (this._created = this._modified);
				this.constants.__values__.size = setLocal(path, append ? this.read() + data : data);
				return this._save();
			}
			return false;
		},

		_create: function(type) {
			if (!this.exists() && this.parent && !this.parent.readonly && mkdirs(this.parent.nativePath)) {
				this._created = this._modified = (new Date()).getTime();
				this._exists = true;
				this._type = type;
				return this._save();
			}
			return false;
		},

		_save: function(path, name) {
			var path = path || this.nativePath,
				meta;
			if (path) {
				meta = ["n", name || this.name, "\nc", this._created, "\nm", this._modified, "\nt", this._type, "\ne0\nx0\nr", this.readonly|0, "\nl", this.symbolicLink|0, "\nh", this.hidden|0];
				this._type === 'F' && meta.push("\ns" + this.size);
				this._mimeType && meta.push("\ny" + this._mimeType);
				setLocal(path, meta.join(''), 1);
				return true;
			}
			return false;
		}

	});

});
},
"Ti/Yahoo":function(){
/* /titanium/Ti/Yahoo.js */

define(["Ti/_/Evented", "Ti/_/lang"],
	function(Evented, lang) {

	return lang.setObject("Ti.Yahoo", Evented, {

		yql: function(query, callback) {
			require([
				"http://query.yahooapis.com/v1/public/yql?format=json&callback=define&q="
					+ encodeURIComponent(query)
					.replace(/!/g,'%21')
					.replace(/'/g,'%27')
					.replace(/\(/,'%28')
					.replace(/\)/,'%29')
			], function(data) {
				var data = data || {},
					results = data.query && data.query.results;
				require.is(callback, "Function") && callback({
					success: !!results,
					data: results,
					message: data.error && data.error.description
				});
			});
		}

	});

});

},
"Ti/Geolocation":function(){
/* /titanium/Ti/Geolocation.js */

define(["Ti/_/Evented", "Ti/_/lang", "Ti/Network"], function(Evented, lang, Network) {
	
	var api,
		on = require.on,
		compassSupport = false,
		currentHeading,
		removeHeadingEventListener,
		locationWatchId,
		currentLocation,
		numHeadingEventListeners = 0,
		numLocationEventListeners = 0,
		isDef = lang.isDef;
	
	function singleShotHeading(callback) {
		var removeOrientation = on(window,"deviceorientation",function(e) {
			removeOrientation();
			callback(e);
		});
	}
	singleShotHeading(function(e) {
		isDef(e.webkitCompassHeading) && (compassSupport = true);
	});
	function createHeadingCallback(callback) {
		return function(e) {
			currentHeading = {
				heading: {
					accuracy: e.webkitCompassAccuracy,
					magneticHeading: e.webkitCompassHeading
				},
				success: true,
				timestamp: (new Date()).getTime()
				
			};
			api.fireEvent("heading", currentHeading);
			callback && callback(currentHeading);
		}
	}
	
	function createLocationCallback(callback) {
		return function(e) {
			var success = "coords" in e;
			currentLocation = {
				success: success
			};
			success ? (currentLocation.coords = e.coords) : (currentLocation.code = e.code);
			api.fireEvent("location", currentLocation);
			callback && callback(currentLocation);
		}
	}
	function createLocationArguments() {
		return {
			enableHighAccuracy: api.accuracy === api.ACCURACY_HIGH,
			timeout: api.MobileWeb.locationTimeout,
			maximumAge: api.MobileWeb.maximumLocationAge
		}
	}
	
	api = lang.setObject("Ti.Geolocation", Evented, {
		
		getCurrentPosition: function(callback) {
			if (api.locationServicesEnabled) {
				navigator.geolocation.getCurrentPosition(
					createLocationCallback(callback),
					createLocationCallback(callback),
					createLocationArguments()
				);
			}
		},
		
		getCurrentHeading: function(callback) {
			if (compassSupport) {
				if (currentHeading && (new Date()).getTime() - currentHeading.timestamp < api.maximumHeadingAge) {
					callback(currentHeading);
				} else {
					singleShotHeading(createHeadingCallback(callback));
				}
			}
		},
		
		forwardGeocoder: function(address, callback) {
			if (!require.is(address,"String")) {
				return;
			}
			var client = Ti.Network.createHTTPClient({
				onload : function(e) {
					var responseParts = this.responseText.split(",");
					callback({
						success: true,
						places: [{
							latitude: parseFloat(responseParts[2]),
							longitude: parseFloat(responseParts[3])
						}]
					});
				},
				onerror : function(e) {
					callback({
						success: false
					});
				},
				timeout : api.MobileWeb.forwardGeocoderTimeout
			});
			client.open("GET", "http://api.appcelerator.net/p/v1/geo?d=f&" + 
				// TODO "c=" + Locale.getCurrentCountry() + 
				"q=" + escape(address));
			client.send();
		},
		
		reverseGeocoder: function(latitude, longitude, callback) {
			if (!isDef(latitude) || !isDef(longitude)) {
				return;
			}
			var client = Ti.Network.createHTTPClient({
				onload : function(e) {
					callback(JSON.parse(this.responseText));
				},
				onerror : function(e) {
					callback({
						success: false
					});
				},
				timeout : api.MobileWeb.forwardGeocoderTimeout
			});
			client.open("GET", "http://api.appcelerator.net/p/v1/geo?d=r&" + 
				// TODO "c=" + Locale.getCurrentCountry() + 
				"q=" + latitude + "," + longitude);
			client.send();
		},
		
		// Hook in to add/remove event listener so that we can disable the geo and compass intervals
		addEventListener: function(name, handler) {
			switch(name) {
				case "heading": 
					if (compassSupport) {
						numHeadingEventListeners++;
						if (numHeadingEventListeners === 1) {
							removeHeadingEventListener = on(window,"deviceorientation",createHeadingCallback());
						}
					}
					break;
				case "location": {
					if (api.locationServicesEnabled) {
						numLocationEventListeners++;
						if (numLocationEventListeners === 1) {
							locationWatchId = navigator.geolocation.watchPosition(
								createLocationCallback(),
								createLocationCallback(),
								createLocationArguments()
							);
						}
					}
					break;
				}
			}
			Evented.addEventListener.call(this,name,handler);
		},
		
		removeEventListener: function(name, handler) {
			switch(name) {
				case "heading": 
					if (compassSupport) {
						numHeadingEventListeners--;
						if (numHeadingEventListeners === 0) {
							removeHeadingEventListener();
						}
					}
					break;
				case "location": {
					if (api.locationServicesEnabled) {
						numLocationEventListeners--;
						if (numHeadingEventListeners < 1) {
							navigator.geolocation.clearWatch(locationWatchId);
						}
					}
					break;
				}
			}
			Evented.removeEventListener.call(this,name,handler);
		},
		
		constants: {
			
			ACCURACY_HIGH: 1,
			
			ACCURACY_LOW: 2,
			
			ERROR_DENIED: 1,
			
			ERROR_LOCATION_UNKNOWN: 2,
			
			ERROR_TIMEOUT: 3,
			
			locationServicesEnabled: {
				get: function() {
					return !!navigator.geolocation;
				}
			},
			
			MobileWeb: {
				locationTimeout: Infinity,
				maximumLocationAge: 0,
				maximumHeadingAge: 1000,
				forwardGeocoderTimeout: void 0,
				reverseGeocoderTimeout: void 0
			}
			
		},
	
		properties: {
			accuracy: 2
		}
	
	});
	return api;

});
},
"Ti/Facebook/LoginButton":function(){
/* /titanium/Ti/Facebook/LoginButton.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/UI/Button", "Ti/Facebook", "Ti/_/lang"], function(declare, Evented, Button, Facebook, lang) {
	
	var imagePrefix = "themes/" + require.config.ti.theme + "/Facebook/",
		buttonImages = [
			"login.png", // Login normal
			"logout.png", // Logout normal
			"loginWide.png", // Login wide
			"logout.png" // Logout "wide" (really just normal)
		],
		pressedButtonImages = [
			"loginPressed.png", // Login normal pressed
			"logoutPressed.png", // Logout normal pressed
			"loginWidePressed.png", // Login wide pressed
			"logoutPressed.png" // Logout "wide" pressed (really just normal)
		];
	
	return declare("Ti.Facebook.LoginButton", Button, {
		
		constructor: function() {
			
			this._clearDefaultLook();
			this._updateImages();
			
			this._loggedInState = Facebook.loggedIn;
			
			this.addEventListener("singletap", function() {
				if (Facebook.loggedIn) {
					Facebook.logout();
				} else {
					Facebook.authorize();
				}
			});
			Facebook.addEventListener("login", lang.hitch(this,"_updateImages"));
			Facebook.addEventListener("logout", lang.hitch(this,"_updateImages"));
		},
		
		_updateImages: function() {
			this._loggedInState = Facebook.loggedIn;
			var imageIndex = 0;
			Facebook.loggedIn && (imageIndex++);
			this.style === Facebook.BUTTON_STYLE_WIDE && (imageIndex += 2);
			this.backgroundImage = imagePrefix + buttonImages[imageIndex];
			this.backgroundSelectedImage = imagePrefix + pressedButtonImages[imageIndex];
			this._hasSizeDimensions() && this._triggerLayout();
		},
		
		_getContentSize: function() {
			// Heights and widths taken directly from the image sizes.
			return {
				width: !Facebook.loggedIn && this.style === Facebook.BUTTON_STYLE_WIDE ? 318 : 144,
				height: 58
			};
		},
		
		properties: {
			style: {
				post: function() {
					this._updateImages();
				},
				value: Facebook.BUTTON_STYLE_NORMAL
			}
		}
		
	});

});
},
"Ti/UI/Clipboard":function(){
/* /titanium/Ti/UI/Clipboard.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var storageKey = "ti:clipboard",
		plainText = "text/plain",
		error = 'Missing required argument "type"',
		value = localStorage.getItem(storageKey),
		cache = (require.is(value, "String") && JSON.parse(value)) || {};

	function get(type) {
		if (!type) {
			throw new Error(error);
		}
		return cache[type];
	}

	function set(type, data) {
		if (!type) {
			throw new Error(error);
		}
		if (data) {
			cache[type] = data;
		} else {
			delete cache[type];
		}
		save()
	}

	function save() {
		localStorage.setItem(storageKey, JSON.stringify(cache));
	}

	return lang.setObject("Ti.UI.Clipboard", Evented, {

		clearData: function() {
			cache = {};
			save();
		},

		clearText: function() {
			set(plainText);
		},

		getData: function(type) {
			return get(type) || null;
		},

		getText: function() {
			return get(plainText) || null;
		},

		hasData: function(type) {
			return !!get(type);
		},

		hasText: function() {
			return !!get(plainText);
		},

		setData: function(type, data) {
			set(type, data);
		},

		setText: function(text) {
			set(plainText, text);
		}

	});

});
},
"Ti/_/event":function(){
/* /titanium/Ti/_/event.js */

define({
	stop: function(e) {
		if (e) {
			e.preventDefault && e.preventDefault();
			e.stopPropagation && e.stopPropagation();
		}
	},
	off: function(handles) {
		handles = require.is(handles, "Array") ? handles : [handles];
		handles.forEach(function(h) {
			h && h();
		});
		handles.splice(0);
	}
});
},
"Ti/_/Layouts/Vertical":function(){
/* /titanium/Ti/_/Layouts/Vertical.js */

define(["Ti/_/Layouts/Base", "Ti/_/declare", "Ti/UI"], function(Base, declare, UI) {

	return declare("Ti._.Layouts.Vertical", Base, {

		_doLayout: function(element, width, height, isWidthSize, isHeightSize) {
			var computedSize = this._computedSize = {width: 0, height: 0},
				currentTop = 0,
				children = element.children,
				availableHeight = height,
				childrenWithFillHeight = false;
				
			// Determine if any children have fill height
			for (var i = 0; i < children.length; i++) {
				children[i]._hasFillHeight() && (childrenWithFillHeight = true);
			}
				
			// Measure the children
			if (childrenWithFillHeight) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];
					if (this.verifyChild(child,element) && !child._hasFillHeight()) {
						var childHeight;
						if (child._markedForLayout) {
							childHeight = child._doLayout({
								origin: {
							 		x: 0,
							 		y: 0
							 	},
							 	isParentSize: {
							 		width: isWidthSize,
							 		height: isHeightSize
							 	},
							 	boundingSize: {
							 		width: width,
							 		height: height
							 	},
							 	alignment: {
							 		horizontal: this._defaultHorizontalAlignment,
							 		vertical: this._defaultVerticalAlignment
							 	},
							 	bottomIsMargin: true,
								positionElement: false,
						 		layoutChildren: true
							}).effectiveHeight;
						} else {
							childHeight = child._measuredEffectiveHeight;
						}
						availableHeight -= childHeight;
					}
				}
			}
			
			// Layout the children
			for(var i = 0; i < children.length; i++) {
				
				// Layout the child
				var child = children[i],
					isHeightFill = child._hasFillHeight();
				if (child._markedForLayout) {
					child._doLayout({
					 	origin: {
					 		x: 0,
					 		y: currentTop
					 	},
					 	isParentSize: {
					 		width: isWidthSize,
					 		height: isHeightSize
					 	},
					 	boundingSize: {
					 		width: width,
					 		height: isHeightFill ? availableHeight : height
					 	},
					 	alignment: {
					 		horizontal: this._defaultHorizontalAlignment,
					 		vertical: this._defaultVerticalAlignment
					 	},
						bottomIsMargin: true,
					 	positionElement: true,
					 	layoutChildren: !childrenWithFillHeight || isHeightFill
				 	});
				 }
				
				// Update the size of the component
				var rightMostEdge = child._measuredWidth + child._measuredLeft + child._measuredBorderSize.left + child._measuredBorderSize.right + child._measuredRightPadding;
				currentTop = child._measuredHeight + child._measuredTop + child._measuredBorderSize.top + child._measuredBorderSize.bottom + child._measuredBottomPadding;
				rightMostEdge > computedSize.width && (computedSize.width = rightMostEdge);
				currentTop > computedSize.height && (computedSize.height = currentTop);
			}
			return computedSize;
		},
		
		_defaultHorizontalAlignment: "center",
		
		_defaultVerticalAlignment: "top"

	});

});

},
"Ti/Map/Annotation":function(){
/* /titanium/Ti/Map/Annotation.js */

define(["Ti/_/declare", "Ti/_/Evented", "Ti/Locale"], function(declare, Evented, Locale) {

	var updateHook = {
		post: function(newValue, oldValue, prop) {
			this.fireEvent("update", {
				property: prop,
				value: newValue
			});
		}
	};

	return declare("Ti.Map.Annotation", Evented, {

		_onclick: function(mapview, idx, src) {
			this.fireEvent("click", {
				annotation: this,
				clicksource: src,
				index: idx,
				map: mapview,
				title: this.title
			});
		},

		_update: function() {},

		_getTitle: function() {
			return Locale._getString(this.titleid, this.title);
		},

		_getSubtitle: function() {
			return Locale._getString(this.subtitleid, this.subtitle);
		},

		properties: {
			animate: false,
			image: updateHook,
			latitude: updateHook,
			longitude: updateHook,
			leftButton: updateHook,
			pincolor: updateHook,
			rightButton: updateHook,
			subtitle: updateHook,
			subtitleid: updateHook,
			title: updateHook,
			titleid: updateHook
		}

	});

});

},
"Ti/App":function(){
/* /titanium/Ti/App.js */

define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	return lang.mixProps(lang.setObject("Ti.App", Evented), {
		constants: require.config.app,
		
		getID: function() {
			return this.id;
		},
		
		getURL: function() {
			return this.url;
		},
		
		getGUID: function() {
			return this.guid;
		}
	}, true);

});
},
"Ti/_/Promise":function(){
/* /titanium/Ti/_/Promise.js */

/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(["./declare", "./lang"], function(declare, lang) {

	var is = require.is,
		Promise = declare("Ti._.Promise", null, {

			constructor: function(canceller) {
				this._canceller = canceller;
			},

			resolve: function(value) {
				this._complete(value, 0);
			},

			reject: function(error) {
				this._complete(error, 1);
			},

			then: function(resolvedCallback, errorCallback) {
				var listener = {
						resolved: resolvedCallback,
						error: errorCallback,
						promise: new Promise(this.cancel)
					};
				if (this._nextListener) {
					this._head = this._head.next = listener;
				} else {
					this._nextListener = this._head = listener;
				}
				this._finished && this._notify(this._fired);
				return listener.returnPromise; // this should probably be frozen
			},

			cancel: function() {
				if (!this._finished) {
					var error = this._canceller && this._canceller(this);
					if (!this._finished) {
						error instanceof Error || (error = new Error(error));
						error.log = false;
						this.reject(error);
					}
				}
			},

			_fired: -1,

			_complete: function(value, isError) {
				this._fired = isError;
				if (this._finished) {
					throw new Error("This promise has already been resolved");
				}
				this._result = value;
				this._finished = true;
				this._notify(isError);
			},

			_notify: function(isError) {
				var fn,
					listener,
					newResult;
				while (this._nextListener) {
					listener = this._nextListener;
					this._nextListener = this._nextListener.next;
					if (fn = listener[isError ? "error" : "resolved"]) {
						try {
							newResult = fn(this._result);
							if (newResult && is(newResult.then, "Function")) {
								newResult.then(lang.hitch(listener.promise, "resolve"), lang.hitch(listener.promise, "reject"));
							} else {
								listener.promise.resolve(newResult);
							}
						} catch(e) {
							listener.promise.reject(e);
						}
					} else {
						listener.promise[isError ? "reject" : "resolve"](result);
					}
				}
			}

		});

	Promise.when = function(promiseOrValue, callback, errback, progressHandler) {
		return promiseOrValue && is(promiseOrValue.then, "function")
			? promiseOrValue.then(callback, errback, progressHandler)
			: callback
				? callback(promiseOrValue)
				: promiseOrValue;
	};

	return Promise;

});
},
"Ti/_/analytics":function(){
/* /titanium/Ti/_/analytics.js */

define(["Ti/_", "Ti/_/dom", "Ti/_/lang", "Ti/App", "Ti/Platform"], function(_, dom, lang, App, Platform) {

	var global = window,
		sessionId = sessionStorage.getItem("ti:sessionId"),
		is = require.is,
		cfg = require.config,
		analyticsEnabled = App.analytics,
		analyticsStorageName = "ti:analyticsEvents",
		analyticsEventSeq = 0,
		analyticsLastSent = null,
		analyticsUrl = "https://api.appcelerator.net/p/v2/mobile-web-track",
		pending = {};

	sessionId || sessionStorage.setItem("ti:sessionId", sessionId = _.uuid());

	function getStorage() {
		var s = localStorage.getItem(analyticsStorageName);
		return s ? JSON.parse(s) : []
	}

	function setStorage(data) {
		localStorage.setItem(analyticsStorageName, JSON.stringify(data));
	}	

	function onSuccess(response) {
		if (is(response.data, "Object") && response.data.success) {
			var ids = pending[response.data.callback],
				keepers = [];
			if (ids) {
				getStorage().forEach(function(evt) {
					~ids.indexOf(evt.id) || keepers.push(evt);
				});
				setStorage(keepers);
			}
		}
	}

	require.on(global, "message", onSuccess);

	return _.analytics = {

		add: function(type, event, data, isUrgent) {
			if (analyticsEnabled) {
				// store event
				var storage = getStorage();
					now = new Date(),
					tz = now.getTimezoneOffset(),
					atz = Math.abs(tz),
					formatZeros = function(v, n){
						var d = (v+'').length;
						return (d < n ? (new Array(++n - d)).join("0") : "") + v;
					};

				storage.push({
					id: _.uuid(),
					type: type,
					evt: event,
					ts: now.toISOString().replace('Z', (tz < 0 ? '-' : '+') + (atz < 100 ? "00" : (atz < 1000 ? "0" : "")) + atz),
					data: data
				});

				setStorage(storage);
				this.send(isUrgent);
			}
		},

		send: function(isUrgent) {
			if (analyticsEnabled) {
				var rand = Math.floor(Math.random() * 1e6),
					now = (new Date()).getTime(),
					ids = [],
					jsonStrs = [];

				if (!isUrgent && analyticsLastSent !== null && now - analyticsLastSent < 60000 /* 1 minute */) {
					return;
				}

				analyticsLastSent = now;

				getStorage().forEach(function(evt) {
					ids.push(evt.id);
					jsonStrs.push(JSON.stringify({
						id: evt.id,
						mid: Platform.id,
						rdu: null,
						type: evt.type,
						aguid: App.guid,
						event: evt.evt,
						seq: analyticsEventSeq++,
						ver: "2",
						deploytype: cfg.app.deployType,
						sid: sessionId,
						ts: evt.ts,
						data: /(Array|Object)/.test(is(evt.data)) ? JSON.stringify(evt.data) : evt.data
					}));
				});

				pending[rand] = ids;

				if (require.has("analytics-use-xhr")) {
					var xhr = new XmlHttpRequest;
					xhr.onreadystatechange = function() {
						if (xhr.readyState === 4 && xhr.status === 200) {
							try {
								onSuccess({ data: eval('(' + xhr.responseText + ')') });
							} catch (e) {}
						}
					};
					xhr.open("POST", analyticsUrl, true);
					xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
					xhr.send(lang.urlEncode({ content: jsonStrs }));
				} else {
					var body = document.body,
						iframeName = "analytics" + rand,
						iframe = dom.create("iframe", {
							id: iframeName,
							name: iframeName,
							style: {
								display: "none"
							}
						}, body),
						form = dom.create("form", {
							action: analyticsUrl + "?callback=" + rand + "&output=html",
							method: "POST",
							style: {
								display: "none"
							},
							target: iframeName
						}, body);

					dom.create("input", {
						name: "content",
						type: "hidden",
						value: "[" + jsonStrs.join(",") + "]"
					}, form);

					// need to delay attaching of iframe events so they aren't prematurely called
					setTimeout(function() {
						function onIframeLoaded() {
							setTimeout(function() {
								dom.destroy(form);
								dom.destroy(iframe);
							}, 1);
						}
						iframe.onload = onIframeLoaded;
						iframe.onerror = onIframeLoaded;
						form.submit();
					}, 25);
				}
			}
		}

	};

});
},
"Ti/_/Gestures/Swipe":function(){
/* /titanium/Ti/_/Gestures/Swipe.js */

define(["Ti/_/declare", "Ti/_/lang","Ti/_/Gestures/GestureRecognizer"], function(declare,lang,GestureRecognizer) {

	return declare("Ti._.Gestures.Swipe", GestureRecognizer, {
		
		name: "swipe",
		
		_touchStartLocation: null,
		_distanceThresholdPassed: false,
		
		// This specifies the minimum distance that a finger must travel before it is considered a swipe
		_distanceThreshold: 25,
		
		// The masimum angle, in radians, from the axis a swipe is allowed to travel before it is no longer considered a swipe
		_angleThreshold: Math.PI/12, // 15 degrees
		
		processTouchStartEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._distanceThresholdPassed = false;
				this._touchStartLocation = {
					x: e.changedTouches[0].clientX,
					y: e.changedTouches[0].clientY
				}
			} else {
				this._touchStartLocation = null;
			}
		},
		
		processTouchEndEvent: function(e, element){
			if (e.touches.length == 0 && e.changedTouches.length == 1) {
				this._processSwipeEvent(e,element,true);
			}
			this._touchStartLocation = null;
		},
		
		processTouchMoveEvent: function(e, element){
			if (e.touches.length == 1 && e.changedTouches.length == 1) {
				this._processSwipeEvent(e,element,false);
			}
		},
		
		processTouchCancelEvent: function(e, element){
			this._touchStartLocation = null;
		},
		
		_processSwipeEvent: function(e,element,finishedSwiping) {
			var x = e.changedTouches[0].clientX,
				y = e.changedTouches[0].clientY;
			if (this._touchStartLocation) {
				var xDiff = Math.abs(this._touchStartLocation.x - x),
					yDiff = Math.abs(this._touchStartLocation.y - y),
					distance = Math.sqrt(Math.pow(this._touchStartLocation.x - x,2) + Math.pow(this._touchStartLocation.y - y,2)),
					angleOK;
				!this._distanceThresholdPassed && (this._distanceThresholdPassed = distance > this._distanceThreshold);
				
				if (this._distanceThresholdPassed) {
					// If the distance is small, then the angle is way restrictive, so we ignore it
					if (distance <= this._distanceThreshold || xDiff === 0 || yDiff === 0) {
						angleOK = true;
					} else if (xDiff > yDiff) {
						angleOK = Math.atan(yDiff/xDiff) < this._angleThreshold;
					} else {
						angleOK = Math.atan(xDiff/yDiff) < this._angleThreshold;
					}
					if (!angleOK) {
						this._touchStartLocation = null;
					} else {
						
						if (!element._isGestureBlocked(this.name)) {
							
							// Calculate the direction
							var direction;
							if (xDiff > yDiff) {
								direction =  this._touchStartLocation.x - x > 0 ? "left" : "right";
							} else {
								direction =  this._touchStartLocation.y - y > 0 ? "down" : "up";
							}
							
							// Right now only left and right are supported
							if (direction === "left" || direction === "right") {
								lang.hitch(element,element._handleTouchEvent(this.name,{
									x: x,
									y: y,
									direction: direction,
									_distance: x - this._touchStartLocation.x,
									_finishedSwiping: finishedSwiping,
									source: this.getSourceNode(e,element)
								}));
							}
						}
					}
				}
			}
		}
		
	});
	
});
},
"Ti/_/ready":function(){
/* /titanium/Ti/_/ready.js */

/**
 * ready() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(function() {
	var doc = document,
		readyStates = { "loaded": 1, "complete": 1 },
		isReady = !!readyStates[doc.readyState],
		readyQ = [];

	if (!isReady) {
		function detectReady(evt) {
			if (isReady || (evt && evt.type == "readystatechange" && !readyStates[doc.readyState])) {
				return;
			}
			while (readyQ.length) {
				(readyQ.shift())();
			}
			isReady = 1;
		}

		readyQ.concat([
			require.on(doc, "DOMContentLoaded", detectReady),
			require.on(window, "load", detectReady)
		]);

		if ("onreadystatechange" in doc) {
			readyQ.push(require.on(doc, "readystatechange", detectReady));
		} else {
			function poller() {
				readyStates[doc.readyState] ? detectReady() : setTimeout(poller, 30);
			}
			poller();
		}
	}

	function ready(priority, context, callback) {
		var fn, i, l;
		if (!require.is(priority, "Number")) {
			callback = context;
			context = priority;
			priority = 1000;
		}
		fn = callback ? function(){ callback.call(context); } : context;
		if (isReady) {
			fn();
		} else {
			fn.priority = priority;
			for (i = 0, l = readyQ.length; i < l && priority >= readyQ[i].priority; i++) {}
			readyQ.splice(i, 0, fn);
		}
	}

	ready.load = function(name, require, onLoad) {
		ready(onLoad);
	};

	return ready;
});
},
"Ti/_/image":function(){
/* /titanium/Ti/_/image.js */

define(function() {
	return {
		normalize: function(name) {
			return name;
		},

		load: function(name, require, onLoad, config) {
			var img = new Image();
			img.onload = img.onerror = function() {
				onLoad(img);
				delete img.onload;
				delete img.onerror;
			};
			img.src = require.toUrl(name);
		}
	};
});

},
"Ti/_/include":function(){
/* /titanium/Ti/_/include.js */

define(function() {
	var cache = {},
		stack = [];

	return {
		dynamic: true, // prevent the loader from caching the result

		normalize: function(name, normalize) {
			var parts = name.split("!"),
				url = parts[0];
			parts.shift();
			return (/^\./.test(url) ? normalize(url) : url) + (parts.length ? "!" + parts.join("!") : "");
		},

		load: function(name, require, onLoad, config) {
			var c,
				x,
				parts = name.split("!"),
				len = parts.length,
				url,
				sandbox;

			if (sandbox = len > 1 && parts[0] === "sandbox") {
				parts.shift();
				name = parts.join("!");
			}

			url = require.toUrl(/^\//.test(name) ? name : "./" + name, stack.length ? { name: stack[stack.length-1] } : null);
			c = cache[url] || require.cache(url);

			if (!c) {
				x = new XMLHttpRequest();
				x.open("GET", url, false);
				x.send(null);
				if (x.status === 200) {
					c = x.responseText;
				} else {
					throw new Error("Failed to load include \"" + url + "\": " + x.status);
				}
			}

			stack.push(url);
			try {
				require.evaluate(cache[url] = c, 0, !sandbox);
			} catch (e) {
				throw e;
			} finally {
				stack.pop();
			}

			onLoad(c);
		}
	};
});

}});
require("Ti/App/Properties", function(p) {
p.setString("acs-api-key-production","2htjyqaU0tp37ttQkK2AmZJaHt3AKzzU");
p.setString("acs-api-key-development","JbAW4XeogbsGCxejbWUFQbf5Y899EW36");
p.setString("acs-oauth-secret-development","dohl4S4bUTl8Qf2JjiEto7WQfVKDa7E5");
p.setString("ti.map.apikey","");
p.setString("ti.ui.defaultunit","system");
p.setString("acs-oauth-secret-production","LC2xxZwFo8YZmvmo1FEOvkK0r8hK2zTb");
p.setString("acs-oauth-key-development","cXlcybefXUe2xmPja76JKzf8ho10B7iH");
p.setString("ti.map.backend","Ti/_/Map/Google");
p.setString("ti.fs.backend","Ti/_/Filesystem/Local");
p.setString("acs-oauth-key-production","kSE7NiKMMsah2cTVQ2QGnaRinLPfmMp0");
});
require(["Ti", "Ti/Accelerometer", "Ti/Analytics", "Ti/Facebook/LoginButton", "Ti/Filesystem/FileStream", "Ti/Map/Annotation", "Ti/Map/View", "Ti/Media/VideoPlayer", "Ti/Network/HTTPClient", "Ti/Platform/DisplayCaps", "Ti/UI/2DMatrix", "Ti/UI/ActivityIndicator", "Ti/UI/AlertDialog", "Ti/UI/Animation", "Ti/UI/Clipboard", "Ti/UI/EmailDialog", "Ti/UI/ImageView", "Ti/UI/Label", "Ti/UI/MobileWeb", "Ti/UI/OptionDialog", "Ti/UI/Picker", "Ti/UI/PickerColumn", "Ti/UI/PickerRow", "Ti/UI/ProgressBar", "Ti/UI/ScrollView", "Ti/UI/ScrollableView", "Ti/UI/Slider", "Ti/UI/Switch", "Ti/UI/Tab", "Ti/UI/TabGroup", "Ti/UI/TableView", "Ti/UI/TableViewRow", "Ti/UI/TableViewSection", "Ti/UI/TextArea", "Ti/UI/TextField", "Ti/UI/WebView", "Ti/UI/Window", "Ti/XML", "Ti/Yahoo", "Ti/_/text", "Ti/_/text!Ti/_/UI/WebViewBridge.js"]);