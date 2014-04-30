var PulsateView;
var pulsator;

$(document).ready(function()
{
	$("#hotloadButton").click(function()
	{
		Hotcake.hotswap({include: ["example_v2.js"], filterArray: ["jquery", "Hotcake", "example_v1"]});
	});

	pulsator = new PulsateView($("#element1"), $("#pulseButton"));
});

// This is the crux of how Hotcake works. Wrap classes with Hotcake.extend. 
// Be sure to set the class object to the return value of "extend", and to also PASS the current class object into "extend"
// Hotcake will make sure that your old definition's prototype is updated, and that the current class object is current.
PulsateView = Hotcake.define(PulsateView,
{
	// Put any constructor logic into a "ctor" function.
	ctor: function($affectedElement, $pulsateButton)
	{
		var self;

		this.$affectedElement = $affectedElement;
		self = this;

		$pulsateButton.click(function()
		{
			self.pulsate();
		});
	},

	pulsate: function()
	{
		for(var i = 0; i < 5; i++)
			this.$affectedElement.fadeOut(50).fadeIn(50);
	}
});