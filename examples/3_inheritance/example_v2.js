var PulsateView, SlidePulsateView;
var pulsator;

$(document).ready(function()
{
	$("#hotloadButton").click(function()
	{
		Hotcake.hotswap({include: ["example_v2.js"], filterArray: ["jquery", "Hotcake", "example_v1"]});
	});

	pulsator = new SlidePulsateView($("#element1"), $("#pulseButton"));
});

PulsateView = Hotcake.define(PulsateView,
{
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

// defines a subclass of PulsateView, which extends all of the same members as PulsateView.
SlidePulsateView = Hotcake.define(SlidePulsateView,
{
	pulsate: function()
	{
		this.$affectedElement.css("background-color", "blue");
		for(var i = 0; i < 3; i++)
			this.$affectedElement.slideUp(50).slideDown(50);
	}
}, PulsateView); // note this third argument. This specifies the base class to use.