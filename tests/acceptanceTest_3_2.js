var SimpleSuperclass = Hotcake.define(SimpleSuperclass,
{
    ctor: function ()
    {
        this.value = 100;
    },

    incrementReturn: function ()
    {
        this.value += 100;
        return this.value;
    }
});

var SimpleSubclass = Hotcake.define(SimpleSubclass,
{
    returnValue: function ()
    {
        return -11;
    }

}, SimpleSuperclass);

var SimpleSubclass2 = Hotcake.define(SimpleSubclass,
{
    returnNothing: function ()
    {
        return -1999;
    }

}, SimpleSubclass2);