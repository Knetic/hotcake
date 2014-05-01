var CounterModel, CounterView;
var pulsator;

$(document).ready(function()
{
	$("#hotloadButton").click(function()
	{
		Hotcake.hotswap({include: ["example_v2.js"], filterArray: ["jquery", "Hotcake", "example_v1"]});
	});

	counterModel = new CounterModel();
	counterView = new CounterView
	({
		model: counterModel,
		el: "#element1"
	});
});

CounterModel = Hotcake.define(CounterModel, Backbone.Model.extend
({
	defaults:
	{
		counter: 0
	},

	increment: function(count)
	{
		var counter;

		counter = this.get("counter");

		counter += count;
		this.set("counter", counter);
	}
}));

CounterView = Hotcake.define(CounterView, Backbone.View.extend
({
	render: function()
	{
		this.$el.find(".counterContainer").text("Count: " + this.model.get("counter"));
	},

	incrementModel: function()
	{
		this.model.increment(5);
		this.render();
	},

	// You may have noticed this pattern, of using a function tied to the view, instead of defining an anonymous function
	// inside the events property itself. This is intentional.
	// The events bound by the "events" object transcend Hotcake - they're bound on top of the DOM and cannot be hotswapped.
	// If you use this method, the View.incrementModel is called, NOT some anonymous function.
	// TL;DR if you're using Hotcake with Backbone, this is the only thing you'll need to bear in mind.
	events:
	{
		"click .incrementButton": "incrementModel"
	}
}));