$(document).ready(function()
{
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
	for(var i = 0; i < 5; i++)
		$selector.fadeOut(50).fadeIn(50);
}