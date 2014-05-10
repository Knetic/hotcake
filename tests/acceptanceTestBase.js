/**
    Test gate 1; ensure that this function is replaced inline.
*/
function testReturnValue()
{
    return 1;
}

/**
    Test gate 2; ensure that simple classes (defined via Hotcake.define) have their members correctly redefined.
*/
var SimpleClass = Hotcake.define(SimpleClass,
{
    testReturnValue: function ()
    {
        return 100;
    }
});

/**
    Test gate 3; ensure that hotcake class inheritance member correctly inherit, as well as correctly redefined.
*/
var SimpleSuperclass = Hotcake.define(SimpleSuperclass,
{
    ctor: function ()
    {
        this.value = 0;
    },

    incrementReturn: function ()
    {
        this.value++;
        return this.value;
    }
});

var SimpleSubclass = Hotcake.define(SimpleSubclass,
{
    returnValue: function ()
    {
        return this.value;
    }

}, SimpleSuperclass);

var SimpleSubclass2 = Hotcake.define(SimpleSubclass,
{
    returnNothing: function ()
    {
        return null;
    }

}, SimpleSubclass2);

/**
    Test gate 4; ensure that Backbone classes are correctly inherited, called, and replaced.
*/
var SimpleBackboneSuperclass = Hotcake.define(SimpleBackboneSuperclass, Backbone.Model.extend
({
    defaults:
    {
        value: 0
    },

    incrementReturn: function()
    {
        var value;

        value = this.get("value");
        value++;
        this.set("value", value);

        return this.get("value");
    }
}));

var SimpleBackboneSubclass = Hotcake.define(SimpleBackboneSubclass, SimpleBackboneSuperclass.extend
({
    returnValue: function ()
    {
        return this.get("value");
    }
}));

var SimpleBackboneSubclass2 = Hotcake.define(SimpleBackboneSubclass2, SimpleBackboneSubclass.extend
({
    returnNothing: function ()
    {
        return null;
    }
}));