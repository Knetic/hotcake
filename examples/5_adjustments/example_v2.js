var AppleModel, AppleView, AppleEditor;
var honeycrisp, appleRenderer, appleEditor;

$(document).ready(function()
{
	$("#hotloadButton").click(function()
	{
		Hotcake.hotswap({include: ["example_v2.js", "upgrade.js"], filterArray: ["example_v1"]});
	});

	honeycrisp = new AppleModel();
	appleRenderer = new AppleView($("#element1"), honeycrisp);
	appleEditor = new AppleEditor($("#seedAddButton"), honeycrisp, appleRenderer);

	honeycrisp.addSeed
	({
		texture: "grainy",
		size: "impressive",
		weight: .24
	});
});

AppleModel = Hotcake.define(AppleModel,
{
	// Put any constructor logic into a "ctor" function.
	ctor: function()
	{
		this.seeds = new Array();
		this.color = "";
	},
	addSeed: function(seed)
	{
		this.seeds.push(seed);
	}
});

AppleView = Hotcake.define(AppleView,
{
	ctor: function($el, model)
	{
		this.model = model;
		this.$el = $el;	
	},
	render: function()
	{
		var seedText;

		seedText = "";
		for(var i = 0; i < this.model.seeds.length; i++)
		{
			seedText = seedText + "<br>Seed " + i +": " + this.model.seeds[i].weight + "g, ";
			seedText = seedText + "with a " + this.model.seeds[i].texture + " texture, ";
			seedText = seedText + "and its size is " + this.model.seeds[i].size;

		}
		this.$el.html(seedText);
	}
});

AppleEditor = Hotcake.define(AppleEditor,
{
	ctor: function($el, model, view)
	{
		var self;

		this.$el = $el;
		this.model = model;
		this.view = view;
		
		self = this;

		this.$el.click(function()
		{
			self.clicked.apply(self, arguments);
		});
	},
	clicked: function()
	{
		this.model.addSeed
		({
			texture: "grainy",
			size: "mediocre",
			weight: (Math.random() * 2).toFixed(2)
		});

		this.view.render();
	}
});