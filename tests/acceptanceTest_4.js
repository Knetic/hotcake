var SimpleBackboneSuperclass = Hotcake.define(SimpleBackboneSuperclass, Backbone.Model.extend
({
    defaults:
    {
        value: 0
    },

    incrementReturn: function ()
    {
        var value;

        value = this.get("value");
        value += 10;
        this.set("value", value);

        return this.get("value");
    }
}));

var SimpleBackboneSubclass = Hotcake.define(SimpleBackboneSubclass, SimpleBackboneSuperclass.extend
({
    returnValue: function ()
    {
        return -1;
    }
}));

var SimpleBackboneSubclass2 = Hotcake.define(SimpleBackboneSubclass2, SimpleBackboneSubclass.extend
({
    returnNothing: function ()
    {
        return -999;
    }
}));