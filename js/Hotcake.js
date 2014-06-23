var Hotcake;

if(typeof(Hotcake) === "undefined")
{
    (function ()
    {
        var _private;
        var readyFunction;
        var loadScripts, respondedScripts, totalScripts;
        var onswapped, hotswapping;
        var handlebarsCache;

        // defines all private members for Hotcake.
        // in debug mode, these members are exposed through Hotcake._private, ready for testing.
        _private = new Object();
        
        Hotcake = (function ()
        {
            Hotcake = new Object();
            loadScripts = new Array();
            var handlebarsCache = new Object();

            /**
			    Given a reference to the potential class to be extended [self], and the list of [members] to be added,
			    returns a class definition. If [self] exists, the up to date definitions will be copied to [self], instead of a new class being created.
		    */
            Hotcake.define = function (self, members, base)
            {
                if (typeof (members) === "function")
                    return _private.defineLinkedClass(self, members, base);
                return _private.defineSingleClass(self, members, base);
            };

            /**
			    Searches for any scripts defined on the head of the page, whose source paths are relative.
			    Requests and reloads each of those scripts.

			    If "filter" is specified as an Array, any script whose name matches a value inside that array will not be hotloaded.
			    If "loadForeign" is truthy, then non-relative scripts will be loaded. Generally, non-relative scripts are things like CloudFlare-hosted libraries that you
							    don't want to load anyway.
			    If "include" is specified as an Array, this will also attempt to load all scripts named inside the array.
			    If "loadStyles" is truthy, a call to "Hotcake.hotswapStyles" will also be made.
			    If "onswapped" is defined as a function, it will be called after all the scripts have been hotloaded.
		    */
            Hotcake.hotswap = function (options)
            {
                var scripts, script, src;

                if (hotswapping)
                {
                    console.error("Hotcake can only perform one hotswap at a time.");
                    return;
                }

                hotswapping = true;
                scripts = document.getElementsByTagName("script");

                if (!options)
                    options = new Object();

                onswapped = options.onswapped;

                if (typeof (options.loadStyles) === "undefined")
                    options.loadStyles = true;

                // If [filter] is specified, any scripts matching the names given in [filter] will NOT be hotloaded.
                // This is useful to prevent repeat requests of library files with include guards, like jQuery or MooTools.
                if (!options.filter)
                    options.filter = new Array();

                // reset total number of requested scripts.
                loadScripts.splice(0);

                for (var i = 0; i < scripts.length; i++)
                {
                    script = scripts[i];
                    src = script.attributes["src"];

                    if (src && src.value && (options.loadForeign || (options.loadForeign || _private.isRelativeScript(src.value))) && !_private.isIgnoredScript(options.filter, src.value))
                        loadScripts.push({ name: src.value });
                }

                // deal with any includes
                if (options.include && options.include.length && options.include.length > 0)
                    for (var i = 0; i < options.include.length; i++)
                        loadScripts.push({ name: options.include[i] });

                totalScripts = loadScripts.length;
                respondedScripts = 0;

                for (var i = 0; i < loadScripts.length; i++)
                    _private.hotloadScript(loadScripts[i], options.async);

                // load any stylesheets.
                if (options.loadStyles)
                    Hotcake.hotswapStyles
				    ({
				        include: options.includeStyles
				    });

                if (options.loadFragments)
                    Hotcake.hotloadHandlebarsTemplates
				    ({
				        include: options.includeFragments
				    });
            }

            /**
			    Runs through all stylesheets and reloads them, replacing any existing stylesheets.
		    */
            Hotcake.hotswapStyles = function (options)
            {
                var style;

                for (var i = 0; i < document.styleSheets.length; i++)
                {
                    // load new style
                    style = document.styleSheets[i];
                    _private.hotswapStyle(style.href, style.ownerNode);
                }
            };

            // What follows is not required for Hotcake to function.
            // The "Handlebars" integration is a reference implementation for how one *might* go about hotloading HTML fragments.

            /**
			    Returns a compiled Handlebars template for the given name.
			    If the template has not yet been loaded, this makes a synchronous request for it, compiles it, and caches the result.
			    Any subsequent calls to this function with the same template name will return the same compiled template (without making more requests).
		    */
            Hotcake.getHandlebarsTemplate = function (templateName, async)
            {
                var compiledTemplate, responseText;

                if (handlebarsCache[templateName])
                    return handlebarsCache[templateName];

                request = new XMLHttpRequest();
                request.onload = function (response)
                {
                    responseText = response.target.responseText;
                    if (responseText)
                    {
                        compiledTemplate = Handlebars.compile(responseText);
                        handlebarsCache[templateName] = compiledTemplate;
                    }
                };
                request.open("GET", templateName, async);

                // try to send the request. If it errors or fails, do not interrupt our execution.
                try
                {
                    request.send();
                }
                catch (exception)
                {
                    console.error(exception);
                }
                return compiledTemplate;
            }

            /**
			    Reloads any templates that are currently loaded.
			    If "async" is specified as truthy, this will perform an asynchronous hotload. The default behavior is to synchronously load.
		    */
            Hotcake.hotloadHandlebarsTemplates = function (options)
            {
                var templateNames, request;
                var name;

                templateNames = Object.keys(handlebarsCache);

                for (var i = 0; i < templateNames.length; i++)
                {
                    name = templateNames[i];
                    handlebarsCache[name] = null;
                    getHandlebarsTemplate(name, (options && options.async));
                }
            }

            return Hotcake;
        })();

        // if window._hotcakeDebug is true, then the private members of Hotcake are exposed.
        // this should only be done when using testing suites, it should NEVER be done in production.
        if (typeof (window._hotcakeDebug) !== "undefined" && window._hotcakeDebug === true)
            Hotcake._private = _private;

        // private members.
        _private.copyKeys = function (to, from)
        {
            var fkeys, key;

            if (from.prototype)
                _private.copyKeys(to, from.prototype);

            fkeys = Object.getOwnPropertyNames(from);
            for (var i = 0; i < fkeys.length; i++)
            {
                key = fkeys[i];
                to[key] = from[key];
            }
        };

        _private.defineSingleClass = function (self, members, base)
        {
            var HotcakeSurrogate;

            if (self)
            {
                if (base)
                {
                    _private.copyKeys(self.prototype, base);
                    self._baseClass = base;
                }

                if (members)
                    _private.copyKeys(self.prototype, members);
                return self;
            }

            HotcakeSurrogate = function ()
            {
                this._class = HotcakeSurrogate;

                if (this.ctor && typeof (this.ctor) === "function")
                    this.ctor.apply(this, arguments);
                else
                    if (base && base.ctor && typeof (base.ctor) === "function")
                        base.ctor.apply(this, arguments);
            }

            if (base)
            {
                _private.copyKeys(HotcakeSurrogate.prototype, base.prototype);
                HotcakeSurrogate._baseClass = base;
            }

            if (members)
                _private.copyKeys(HotcakeSurrogate.prototype, members);
            return HotcakeSurrogate;
        };

        _private.defineLinkedClass = function (self, members, base)
        {
            var HotcakeSurrogate, backboneSuper;

            HotcakeSurrogate = function ()
            {
            	this._class = HotcakeSurrogate;

                if (typeof (members) === "function")
                {
                    this.constructor = members.constructor;
                    members.apply(this, arguments);
                }

                if (this.ctor && typeof (this.ctor) === "function")
                    this.ctor.apply(this, arguments);
                else
                    if (base && base.ctor && typeof (base.ctor) === "function")
                        base.ctor.apply(this, arguments);
            }

            if (base)
            {
                _private.copyKeys(HotcakeSurrogate.prototype, base.prototype);
                HotcakeSurrogate._baseClass = base;
            }

            if (members)
            {
                // if this is a class, copy it all over.
                if (typeof (members) === "function")
                {
                    // this might be a Backbone class. If it contains __super__, copy all of that too.
                    if (members.__super__)
                        _private.copyBackboneSuperKeys(HotcakeSurrogate.prototype, members.__super__);

                    _private.copyKeys(HotcakeSurrogate.prototype, members);
                }

                // and copy any fields.
                _private.copyKeys(HotcakeSurrogate, members);
            }

            // set up key delegates so that when/if this class gets hotloaded, the new version can set this class up with replacements.
            _private.delegateKeys(HotcakeSurrogate.prototype);

            if (self)
                _private.delegateKeysReplace(self.prototype, HotcakeSurrogate.prototype);
            return HotcakeSurrogate;
        };

        /**
            Wraps all functions in the given [target] with delegate replacements.
        */
        _private.delegateKeys = function (target)
        {
            var fkeys, key, replacement;

            fkeys = Object.getOwnPropertyNames(target);
            for (var i = 0; i < fkeys.length; i++)
            {
                key = fkeys[i];
                replacement = target[key];

                if (typeof (target[key]) === "function")
                    target[key] = _private.delegateForwardFunction(key, replacement);
            }
        };

        _private.delegateForwardFunction = function (key, replacement)
        {
            return function ()
            {
                if (this[key]._hotcakeReplacement)
                {
                    while (this[key]._hotcakeReplacement)
                        this[key] = this[key]._hotcakeReplacement;

                    return this[key].apply(this, arguments);
                }

                return replacement.apply(this, arguments);
            }
        };

        _private.copyBackboneSuperKeys = function (to, from)
        {
            if (from.__super__)
                _private.copyBackboneSuperKeys(to, from.__super__);

            _private.copyKeys(to, from);
        };

        _private.delegateKeysReplace = function (to, from)
        {
            var fkeys, key;

            fkeys = Object.keys(from);
            for (var i = 0; i < fkeys.length; i++)
            {
                key = fkeys[i];

                if (to[key])
                    to[key]._hotcakeReplacement = from[key];
            }
        };

        /**
			    Returns true if this script is a relatively-pathed script.
			    False if it comes from another domain.
		    */
        _private.isRelativeScript = function (scriptPath)
        {
            if ((scriptPath.charAt(0) == "/" && scriptPath.charAt(1) == "/") || scriptPath.indexOf("://") >= 0)
                return false;
            return true;
        };

        /**
            Given an unescaped [target] string, returns a properly escaped version that is suitable for use with regex testing.
            e.g., given "[stuff]", this returns a string suitable for testing for the literal string "[stuff]". 
        */
        _private.escapeRegex = function (target)
        {
            return String(target).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
        }

        _private.isIgnoredScript = function (filter, name)
        {
            var regex;

            for (var i = 0; i < filter.length; i++)
            {
                regex = new RegExp("^" + _private.escapeRegex(filter[i]), "i");
                if (regex.test(name))
                    return true;
            }
            return false;
        };

        /**
            Forms and sends an XMLHTTPRequest which pulls the given [url], then evaluates it as a script file.
        */
        _private.hotloadScript = function (loadScript, async)
        {
            var request;
            var url;

            url = _private.appendGUID(loadScript.name);

            request = new XMLHttpRequest();
            request.onload = function (response)
            {
                _private.pushScriptHotload(response, loadScript);
            };
            request.open("GET", url, async);

            // try to send the request. If it errors or fails, do not interrupt our execution.
            try
            {
                request.send();
            }
            catch (exception)
            {
                console.error("Error while loading or evaluating script file '" + url + "':");
                console.error(exception);
            }
        };

        /**
            When a script has been returned as part of an ajax response, this is called.
        */
        _private.pushScriptHotload = function (response, loadScript)
        {
            respondedScripts++;

            if (response.target.responseText)
                loadScript.body = response.target.responseText;

            if (respondedScripts == totalScripts)
                _private.evaluateHotload();
        };

        /**
            Evaluates all scripts in the "loadedScripts" array.
        */
        _private.evaluateHotload = function ()
        {
            for (var i = 0; i < loadScripts.length; i++)
                try
                {
                    _private.suspendJQueryReady();
                    eval.call(window, loadScripts[i].body);
                }
                catch (exception)
                {
                    console.error(exception);
                }

            _private.resumeJQueryReady();

            hotswapping = false;
            if (onswapped && typeof (onswapped) === "function")
                onswapped();
        };

        _private.noop = function ()
        { };

        /**
            Suspends jQuery's "document.ready" behavior. "ready" is called *anytime after DOM load*, not just the start of a page.
            This can lead to cases where hotloaded code runs its initilization routines when they aren't supposed to.
        */
        _private.suspendJQueryReady = function ()
        {
            if (typeof ($) !== "undefined" && $.prototype.ready !== _private.noop)
            {
                readyFunction = $.prototype.ready;
                $.prototype.ready = $.ready = _private.noop;
            }
        };

        _private.resumeJQueryReady = function ()
        {
            if (typeof ($) !== "undefined")
                $.prototype.ready = $.ready = readyFunction;
        };

        _private.hotswapStyle = function (href, ownerNode)
        {
            var head, link;

            head = document.getElementsByTagName("head")[0];

            href = _private.appendGUID(href);

            link = document.createElement("link");
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("href", href);
            head.appendChild(link);

            if (ownerNode)
            {
                // make an identical AJAX request to the server. When that requests finishes, remove the original stylesheet declaration.
                request = new XMLHttpRequest();
                request.onload = function ()
                {
                    ownerNode.remove();
                }
                request.open("GET", _private.appendGUID(href), true);

                // try to send the request. If it errors or fails, do not interrupt our execution.
                try
                {
                    request.send();
                }
                catch (exception)
                { }
            }
        };

        _private.guid_p8 = function (s)
        {
            var p = (Math.random().toString(16) + "000000000").substr(2, 8);
            return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
        };

        _private.generateGUID = function ()
        {
            return _private.guid_p8() + _private.guid_p8(true) + _private.guid_p8(true) + _private.guid_p8();
        };

        /**
            appends a hotcake guid querystring to the given [url].
            This prevents browsers from erroneously caching scripts/styles/fragments that should be hotswapped.
            If the given url already has a querystring, this appends a _hotcakeGUID argument to it. Otherwise, it sets the querystring.
        */
        _private.appendGUID = function (url)
        {
            if (url.indexOf("?") > 0)
                url += "&";
            else
                url += "?";

            return url + "__hotcakeGUID=" + _private.generateGUID();
        };
    })();
}
