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

	increment: function()
	{
		var counter;

		counter = this.get("counter");
		counter++;
		this.set("counter", counter);
	}
}));

CounterView = Hotcake.define(CounterView, Backbone.View.extend
({
	render: function()
	{
		this.$el.find(".counterContainer").text(this.model.get("counter"));
	},

	incrementModel: function()
	{
		this.model.increment(5);
		this.render();
	},

	events:
	{
		"click .incrementButton": "incrementModel"
	}
}));