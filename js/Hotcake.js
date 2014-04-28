var Hotcake;

if(typeof(Hotcake) === "undefined")
{
	Hotcake = (function()
	{
	    var copyKeys, delegateKeys, delegateKeysSkip, isRelativeScript, pushScriptHotload, evaluateHotload, resumeJQueryReady, suspendJQueryReady, hotloadScript;
	    var hotswapStyles, hotswapStyle;
	    var readyFunction;
	    var loadedScripts, respondedScripts, totalScripts;
	    var onswapped, hotswapping;
	    var handlebarsCache;

	    Hotcake = new Object();
	    loadedScripts = new Array();
	    var handlebarsCache = new Object();

		copyKeys = function(to, from)
		{
			var fkeys, key;
		
			fkeys = Object.keys(from);
			for(var i = 0; i < fkeys.length; i++)
			{
				key = fkeys[i];
				to[key] = from[key];
			}
		};

	    /**
			Given a reference to the potential class to be extended [self], and the list of [members] to be added,
			returns a class definition. If [self] exists, the up to date definitions will be copied to [self], instead of a new class being created.
		*/
		Hotcake.extend = function (self, members)
		{
		    var HotcakeSurrogate;

		    if (self)
		    {
		        if (members)
		            copyKeys(self.prototype, members);
		        return self;
		    }

		    HotcakeSurrogate = function ()
		    {
		        if (this.ctor && typeof (this.ctor) === "function")
		            this.ctor.apply(this, arguments);
		    }

		    if (members)
		        copyKeys(HotcakeSurrogate.prototype, members);
		    return HotcakeSurrogate;
		};

		Hotcake.extendClass = function (self, members)
		{
		    var HotcakeSurrogate;

		    HotcakeSurrogate = function ()
		    {
		        if (typeof (members) === "function")
		            members.apply(this, arguments);
		        if (this.ctor && typeof (this.ctor) === "function")
		            this.ctor.apply(this, arguments);
		    }

		    if (members)
		        copyKeys(HotcakeSurrogate.prototype, members);

		    delegateKeys(HotcakeSurrogate.prototype);

		    if (self)
		        delegateKeysReplace(self.prototype, HotcakeSurrogate.prototype);
		    return HotcakeSurrogate;
		};

	    /**
            Wraps all functions in the given [target] with delegate replacements.
        */
		delegateKeys = function (target)
		{
		    var fkeys, key, replacement;

		    fkeys = Object.keys(target);
		    for (var i = 0; i < fkeys.length; i++)
		    {
		        key = fkeys[i];
		        replacement = target[key];

		        target[key] = function ()
		        {
		            if (this[key]._hotcakeReplacement)
		            {
		                while (this[key]._hotcakeReplacement)
		                    this[key] = this[key]._hotcakeReplacement;

		                this[key].apply(this, arguments);
		            }
		            else
		                replacement.apply(this, arguments);
		        }
		    }
		};

		delegateKeysReplace = function (to, from)
		{
		    var fkeys, key;

		    fkeys = Object.keys(from);
		    for (var i = 0; i < fkeys.length; i++)
		    {
		        key = fkeys[i];
		        to[key]._hotcakeReplacement = from[key];
		    }
		};
        
	    /**
			Searches for any scripts defined on the head of the page, whose source paths are relative.
			Requests and reloads each of those scripts.

            If "filterArray" is specified as an Array, any script whose name matches a value inside that array will not be hotloaded.
            If "loadForeign" is truthy, then non-relative scripts will be loaded. Generally, non-relative scripts are things like CloudFlare-hosted libraries that you
                            don't want to load anyway.
            If "include" is specified as an Array, this will also attempt to load all scripts named inside the array.
            If "loadStyles" is truthy, a call to "Hotcake.hotswapStyles" will also be made.
            If "onswapped" is defined as a function, it will be called after all the scripts have been hotloaded.
		*/
		Hotcake.hotswap = function (options)
		{
		    var scripts, script, src;
		    var toLoad;

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

		    if(typeof(options.loadStyles) === "undefined")
		        options.loadStyles = true;

		    // If [filterArray] is specified, any scripts matching the names given in [filterArray] will NOT be hotloaded.
		    // This is useful to prevent repeat requests of library files with include guards, like jQuery or MooTools.
		    if (!options.filterArray)
		        options.filterArray = new Array();

		    // reset total number of requested scripts.
		    toLoad = new Array();

		    for (var i = 0; i < scripts.length; i++)
		    {
		        script = scripts[i];
		        src = script.attributes["src"];

		        if (src && src.value && (options.loadForeign || (options.loadForeign || isRelativeScript(src.value))) && !isIgnoredScript(options.filterArray, src.value))
		            toLoad.push(src.value);
		    }

            // deal with any includes
		    if (options.include && options.include.length && options.include.length > 0)
		        for (var i = 0; i < options.include.length; i++)
		            toLoad.push(options.include[i]);

		    totalScripts = toLoad.length;
		    loadedScripts.splice(0);
		    respondedScripts = 0;

		    for(var i = 0; i < toLoad.length; i++)
		        hotloadScript(toLoad[i], options.async);

		    // load any stylesheets.
		    if (options.loadStyles)
		        Hotcake.hotswapStyles
                ({
                    include: options.includeStyles
                });
		}

		/**
			Returns true if this script is a relatively-pathed script.
			False if it comes from another domain.
		*/
		isRelativeScript = function(scriptPath)
		{
			if((scriptPath.charAt(0) == "/" && scriptPath.charAt(1) == "/") || scriptPath.indexOf("://") >= 0)
				return false;
			return true;
		};

		/**
			Given an unescaped [target] string, returns a properly escaped version that is suitable for use with regex testing.
			e.g., given "[stuff]", this returns a string suitable for testing for the literal string "[stuff]". 
		*/
		escapeRegex = function(target)
		{
		    return String(target).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
		}

		isIgnoredScript = function(filterArray, name)
		{
			var regex;

			for(var i = 0; i < filterArray.length; i++)
			{
				regex = new RegExp("^" + escapeRegex(filterArray[i]), "i");
				if(regex.test(name))
					return true;
			}
			return false;
		};

	    /**
			Forms and sends an XMLHTTPRequest which pulls the given [url], then evaluates it as a script file.
		*/
		hotloadScript = function (url, async)
		{
		    var request;
            
		    request = new XMLHttpRequest();
		    request.onload = pushScriptHotload;
		    request.open("GET", url, async);

		    // try to send the request. If it errors or fails, do not interrupt our execution.
		    try
		    {
		        request.send();
		    }
		    catch (exception)
		    {
		        console.error(exception);
		    }
		};

	    /**
            When a script has been returned as part of an ajax response, this is called.
        */
		pushScriptHotload = function (response)
		{
		    respondedScripts++;

		    if (response.target.responseText)
		        loadedScripts.push(response.target.responseText);

		    if (respondedScripts == totalScripts)
		        evaluateHotload();
		};

	    /**
            Evaluates all scripts in the "loadedScripts" array.
        */
		evaluateHotload = function()
		{
		    for (var i = 0; i < loadedScripts.length; i++)
		        try
		        {
		            suspendJQueryReady();
		            eval.call(window, loadedScripts[i]);
		        }
                catch (exception)
		        {
		            console.error(exception);
		        }

		    resumeJQueryReady();

		    hotswapping = false;
		    if (onswapped && typeof(onswapped) === "function")
		        onswapped();
		};

		noop = function()
		{};

	    /**
            Suspends jQuery's "document.ready" behavior. "ready" is called *anytime after DOM load*, not just the start of a page.
            This can lead to cases where hotloaded code runs its initilization routines when they aren't supposed to.
        */
		suspendJQueryReady = function()
		{
		    if ($.prototype.ready !== noop)
		    {
		        readyFunction = $.prototype.ready;
		        $.prototype.ready = $.ready = noop;
		    }
		};

		resumeJQueryReady = function()
		{
			$.prototype.ready = $.ready = readyFunction;
		};

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
		        hotswapStyle(style.href, style.ownerNode);
		    }
		};

		hotswapStyle = function (href, ownerNode)
		{
		    var head, link;

		    head = document.getElementsByTagName("head")[0];

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
		        request.open("GET", href, true);

		        // try to send the request. If it errors or fails, do not interrupt our execution.
		        try
		        {
		            request.send();
		        }
		        catch (exception)
		        { }
		    }
		}

	    // What follows is not required for Hotcake to function.
	    // The "Handlebars" integration is a reference implementation for how one *might* go about hotloading HTML fragments.

	    /**
            Returns a compiled Handlebars template for the given name.
            If the template has not yet been loaded, this makes a synchronous request for it, compiles it, and caches the result.
            Any subsequent calls to this function with the same template name will return the same compiled template (without making more requests).
        */
		Hotcake.getHandlebarsTemplate = function(templateName, async)
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
}