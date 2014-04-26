var Hotcake;

if(typeof(Hotcake) === "undefined")
{
	Hotcake = (function()
	{
		var copyKeys, delegateKeys, isRelativeScript, evaluateHotload, resumeJQueryReady, suspendJQueryReady, synchronousHotload;
		var readyFunction;

		Hotcake = new Object();

		copyKeys = function(to, from)
		{
			var fkeys, key;
		
			if(!to || !from)
				return;
			
			fkeys = Object.keys(from);
		
			for(var i = 0; i < fkeys.length; i++)
			{
				key = fkeys[i];
				to[key] = from[key];
			}
		
			return to;
		};

		delegateKeys = function(to, from)
		{
			var fkeys, key;
		
			if(!to || !from)
				return;
			
			fkeys = Object.keys(from);
		
			for(var i = 0; i < fkeys.length; i++)
			{
				key = fkeys[i];

				if(typeof(from[key]) === "function")
				{
					to[key] = function()
					{
						this.__proto__ = from;
						from[key].apply(this, arguments);
					}					
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

		evaluateHotload = function(response)
		{
			suspendJQueryReady();
			eval.call(window, response.target.responseText);
			resumeJQueryReady();
		};

		/**
			Forms and sends an XMLHTTPRequest which pulls the given [url], then evaluates it as a script file.
		*/
		synchronousHotload = function(url)
		{
			var request;

			request = new XMLHttpRequest();

			request.onload = evaluateHotload;
			request.open("GET", url, true);
			request.send();
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
			returns an up-to-date definition of the class. Any old instances of the class will also use the new definition.
		*/
		Hotcake.extend = function(self, members)
		{
			var Surrogate;			
		
			Surrogate = function(options)
			{
				if(this.ctor)
					this.ctor(options);
			}

			if(members)
				copyKeys(Surrogate.prototype, members);
	
			if(self)
				delegateKeys(self.prototype, Surrogate.prototype);
		
			return Surrogate;
		};

		/**
			Searches for any scripts defined on the head of the page, whose source paths are relative.
			Requests and reloads each of those scripts.
			If [filterArray] is specified, any scripts matching the names given in [filterArray] will NOT be hotloaded.
			This is useful to prevent repeat requests of library files with include guards, like jQuery or MooTools.
		*/
		Hotcake.hotswap = function(filterArray)
		{
			var scripts, script, src;

			scripts = document.getElementsByTagName("script");

			for(var i = 0; i < scripts.length; i++)
			{
				script = scripts[i];
				src = script.attributes["src"];

				if(src && src.value && isRelativeScript(src.value) && !isIgnoredScript(filterArray, src.value))
					synchronousHotload(src.value);
			}				
		}

		return Hotcake;
	})();
}