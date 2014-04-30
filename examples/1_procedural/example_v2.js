$(document).ready(function()
{
	// note that any document.ready() callbacks are not executed after a hotload.
	// this code will not be run once the hotload completes.

	$("#hotloadButton").click(function()
	{
		Hotcake.hotswap({include: ["example_v2.js"], filterArray: ["jquery", "Hotcake", "example_v1"]});
	});

	$("#pulseButton").click(function()
	{
		pulsateElement($("#element1"));
	});
});

function pulsateElement($selector)
{
	$selector.css("background-color", "red");
	for(var i = 0; i < 3; i++)
		$selector.fadeOut(500).fadeIn(500);
}