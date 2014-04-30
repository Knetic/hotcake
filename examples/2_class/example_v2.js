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
		this.$affectedElement.css("background-color", "red");
		for(var i = 0; i < 3; i++)
			this.$affectedElement.fadeOut(500).fadeIn(500);
	}
});