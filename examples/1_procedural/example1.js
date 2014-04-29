var timesLoaded;

$(document).ready(function()
{
	$("#pulseButton").click(function()
	{
		pulsateElement($("#element1"));
	});

	$("#hotloadButton").click(function()
	{
		Hotcake.hotswap();
	});
});

// if this is the first time we've loaded this script, reflect that in [timesLoaded].
// if this is not the first time, this will not be run.
if(typeof(timesLoaded) !== "undefined")
{
	// if this is the first time this script is loaded, this function will be used to do the pulsating.
	pulsateElement = function($selector)
	{
		$selector.css("background-color", "red");
		for(var i = 0; i < 3; i++)
			$selector.fadeOut(500).fadeIn(500);
	}
}
else
{
	timesLoaded = true;

	// otherwise, if this is not the first hotload, have "pulsateElements"
	pulsateElement = function($selector)
	{
		for(var i = 0; i < 5; i++)
			$selector.fadeOut(50).fadeIn(50);
	}
}

/**
	Note that it's not recommended to use Hotcake like this. You shouldn't have any extra logic that depends on a hotload.
	But this, at least, gives a brief overview of the ramifications of using Hotcake.
*/