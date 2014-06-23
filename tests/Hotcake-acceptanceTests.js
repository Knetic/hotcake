$(document).ready(function ()
{
    test("example1, window level replacements", function ()
    {
        Hotcake.hotswap({ async: false });

        deepEqual(testReturnValue(), 1, "Test function at window level returns original value");
        Hotcake.hotswap({ async: false, include: ["tests/acceptanceTest_1.js"] });
        deepEqual(testReturnValue(), 2, "Test function at window level is correctly hotswapped");
    });

    test("example2, simple class replacements", function ()
    {
        var testInstance;

        Hotcake.hotswap({ async: false });
        testInstance = new SimpleClass();

        deepEqual(testInstance.testReturnValue(), 100, "Test class instance returns original value");
        Hotcake.hotswap({ async: false, include: ["tests/acceptanceTest_2.js"] });
        deepEqual(testInstance.testReturnValue(), 200, "Test class instance returns replaced value");

        testInstance = new SimpleClass();
        deepEqual(testInstance.testReturnValue(), 200, "New instance of test class (post-replacement) returns replaced value");
    });

    test("example3, class inheritance and relacement", function ()
    {
        var testInstance;

        Hotcake.hotswap({ async: false });
        testInstance = new SimpleSubclass2();

        deepEqual(testInstance.returnNothing(), null, "Test instance has its own members");
        deepEqual(testInstance.returnValue(), 0, "Test instance has its immediate superclass members");
        deepEqual(testInstance.incrementReturn(), 1, "Test instance inherits all parent members");

        deepEqual(typeof (new SimpleSuperclass()._class._baseClass), "undefined", "Instance of class with no superclass doesn't have 'baseClass' defined");
        ok(testInstance._class._baseClass, "Instance of subclass contains a base class");
        deepEqual(testInstance._class._baseClass, SimpleSubclass, "Instance of subclass's base class is set to immediate superclass");

        Hotcake.hotswap({ async: false, include: ["tests/acceptanceTest_3.js"] });
        
        deepEqual(testInstance.returnNothing(), -999, "Test instance has its own members replaced");
        deepEqual(testInstance.returnValue(), -1, "Test instance had subclass member replaced");
        deepEqual(testInstance.incrementReturn(), 11, "Test instance had superclass member replaced");

        Hotcake.hotswap({ async: false, include: ["tests/acceptanceTest_3_2.js"] });

        deepEqual(testInstance.returnNothing(), -1999, "Test instance has its own members replaced after multiple hotswaps");
        deepEqual(testInstance.returnValue(), -11, "Test instance had subclass member replaced after multiple hotswaps");
        deepEqual(testInstance.incrementReturn(), 111, "Test instance had superclass member replaced after multiple hotswaps");
    });

    test("example4, backbone inheritance and replacement", function ()
    {
        var testInstance;

        Hotcake.hotswap({ async: false });
        testInstance = new SimpleBackboneSubclass2();

        deepEqual(testInstance.returnNothing(), null, "Test instance has its own members");
        deepEqual(testInstance.returnValue(), 0, "Test instance has its immediate superclass members");
        deepEqual(testInstance.incrementReturn(), 1, "Test instance inherits all parent members");

        notEqual(SimpleBackboneSuperclass, SimpleBackboneSubclass, "Subclasses of a class are not identical to their base class");
        notEqual(SimpleBackboneSubclass, SimpleBackboneSubclass2, "Subclasses of a class are not identical to their base class");

        ok(SimpleBackboneSubclass2.__super__, "Backbone subclass has a backbone superclass listed");
        deepEqual(SimpleBackboneSuperclass.__super__, Backbone.Model.prototype, "Backbone subclass's superclass is listed as the correct class");
        deepEqual(SimpleBackboneSubclass2.__super__, SimpleBackboneSubclass.prototype, "Backbone subclass's superclass is listed as the correct class");
        deepEqual(SimpleBackboneSubclass.__super__, SimpleBackboneSuperclass.prototype, "Backbone subclass's superclass is listed as the correct class");

        Hotcake.hotswap({ async: false, include: ["tests/acceptanceTest_4.js"] });

        deepEqual(testInstance.returnNothing(), -999, "Test instance has its own members replaced");
        deepEqual(testInstance.returnValue(), -1, "Test instance had subclass member replaced");
        deepEqual(testInstance.incrementReturn(), 11, "Test instance had superclass member replaced");

        Hotcake.hotswap({ async: false, include: ["tests/acceptanceTest_4_2.js"] });

        deepEqual(testInstance.returnNothing(), -1999, "Test instance has its own members replaced after multiple hotswaps");
        deepEqual(testInstance.returnValue(), -11, "Test instance had subclass member replaced after multiple hotswaps");
        deepEqual(testInstance.incrementReturn(), 111, "Test instance had superclass member replaced after multiple hotswaps");
    });
});