var AppleModel, AppleView, AppleEditor;
var honeycrisp, appleRenderer, appleEditor;

$(document).ready(function()
{
	$("#hotloadButton").click(function()
	{
		// by having "upgrade.js" included in our included script list, it will be downloaded and evaluated.
		// within this file, we change our data models between hotswaps - thus mitigating the problem of changing data models.
		Hotcake.hotswap({include: ["example_v2.js", "upgrade.js"], filterArray: ["example_v1"]});
	});

	honeycrisp = new AppleModel();
	appleRenderer = new AppleView($("#element1"), honeycrisp);
	appleEditor = new AppleEditor($("#seedAddButton"), honeycrisp, appleRenderer);
});

AppleModel = Hotcake.define(AppleModel,
{
	// Put any constructor logic into a "ctor" function.
	ctor: function()
	{
		this.seeds = 0;
		this.color = "";
	},

	addSeed: function(seeds)
	{
		this.seeds += seeds;
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
		this.$el.text("seeds: " + this.model.seeds);
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
		this.model.addSeed(1);
		this.view.render();
	}
});