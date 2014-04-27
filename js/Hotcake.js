var Hotcake;

if(typeof(Hotcake) === "undefined")
{
	Hotcake = (function()
	{
	    var copyKeys, delegateKeys, delegateKeysSkip, isRelativeScript, pushScriptHotload, evaluateHotload, resumeJQueryReady, suspendJQueryReady, hotloadScript;
	    var readyFunction;
	    var loadedScripts, respondedScripts, totalScripts;

	    Hotcake = new Object();
	    loadedScripts = new Array();

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
            Wraps all functions in the given [target] with delegate replacements.
            If any of these 
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

	    // original implementation for "extendClass", this made a giant linked list of function calls
        // which chained together to form the correct behavior.
		/*delegateKeys = function (to, from)
		{
		    var fkeys, key;

		    fkeys = Object.keys(from);
		    for (var i = 0; i < fkeys.length; i++)
		    {
		        key = fkeys[i];
		        to[key] = function()
		        {
		            from[key].apply(this, arguments);
		        }
		    }
		};*/

		protoDelegateKeys = function (to, from)
		{
		    var fkeys, key;

		    fkeys = Object.keys(from);
		    for (var i = 0; i < fkeys.length; i++)
		    {
		        key = fkeys[i];
		        to[key] = function ()
		        {
		            this.__proto__ = from;
		            delete this[key];
		            from[key].apply(this, arguments);                    
		        }
		    }
		};
        
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
            Evaluates all scripts in the "loadedScripts" array.
        */
		evaluateHotload = function()
		{
		    suspendJQueryReady();

		    for (var i = 0; i < loadedScripts.length; i++)
		        eval.call(window, loadedScripts[i]);

			resumeJQueryReady();
		};

	    /**
            When a script is finished 
        */
		pushScriptHotload = function (response)
		{
		    respondedScripts++;

            if(response.target.responseText)
		        loadedScripts.push(response.target.responseText);

		    if (respondedScripts == totalScripts)
		        evaluateHotload();
		};

		/**
			Forms and sends an XMLHTTPRequest which pulls the given [url], then evaluates it as a script file.
		*/
		hotloadScript = function(url, async)
		{
			var request;

            // clear any straggling scripts
			loadedScripts.splice(0);
			respondedScripts = 0;

            // if this is not asynchronous, immediately evaluate any scripts.
			if (!async)
			    totalScripts = 1;
			else
			    totalScripts++;

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

		noop = function()
		{};

		suspendJQueryReady = function()
		{
			readyFunction = $.prototype.ready;
			$.prototype.ready = $.ready = noop;
		};

		resumeJQueryReady = function()
		{
			$.prototype.ready = $.ready = readyFunction;
		};
		
		/**
			Given a reference to the potential class to be extended [self], and the list of [members] to be added,
			returns a class definition. If [self] exists, the up to date definitions will be copied to [self], instead of a new class being created.
		*/
		Hotcake.extend = function(self, members)
		{
		    var HotcakeSurrogate;
		
			if (self)
			{
                if(members)
			        copyKeys(self.prototype, members);
			    return self;
			}
            
			HotcakeSurrogate = function ()
			{
				if(this.ctor && typeof(this.ctor) === "function")
					this.ctor.apply(this, arguments);
			}

            if(members)
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

	    // No-longer-needed implementation of "extendProto", which used the hidden __proto__ property
	    // of instantiated hotswapped classes in order to update their references.
        // Functionally replaced by "extendClass", with the use of "delegateKeys" and "delegateKeysReplace".
		/*Hotcake.extendProto = function (self, members)
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

		    if (self)
		        protoDelegateKeys(self.prototype, HotcakeSurrogate.prototype);
		    return HotcakeSurrogate;
		};*/

		/**
			Searches for any scripts defined on the head of the page, whose source paths are relative.
			Requests and reloads each of those scripts.

            If "filterArray" is specified as an Array, any script whose name matches a value inside that array will not be hotloaded.
            If "loadForeign" is truthy, then non-relative scripts will be loaded. Generally, non-relative scripts are things like CloudFlare-hosted libraries that you
                            don't want to load anyway.
            If "include" is specified as an Array, this will also attempt to load all scripts named inside the array.
		*/
		Hotcake.hotswap = function(options)
		{
			var scripts, script, src;

			scripts = document.getElementsByTagName("script");

			if(!options)
			    options = new Object();

			// If [filterArray] is specified, any scripts matching the names given in [filterArray] will NOT be hotloaded.
			// This is useful to prevent repeat requests of library files with include guards, like jQuery or MooTools.
			if (!options.filterArray)
			    options.filterArray = new Array();

            // reset total number of requested scripts.
			totalScripts = 0;

			for(var i = 0; i < scripts.length; i++)
			{
				script = scripts[i];
				src = script.attributes["src"];

				if(src && src.value && (options.loadForeign || (options.loadForeign || isRelativeScript(src.value))) && !isIgnoredScript(options.filterArray, src.value))
					hotloadScript(src.value, options.async);
			}

            if(options.include && options.include.length && options.include.length > 0)
                for(var i = 0; i < options.include.length; i++)
                    hotloadScript(options.include[i], options.async);
		}

		return Hotcake;
	})();
}