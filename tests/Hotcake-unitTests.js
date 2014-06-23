window._hotcakeDebug = true;

$(document).ready(function()
{
    // make sure the hotcakeDebug took effect
    test("hotcakeDebug", function ()
    {
        ok(Hotcake, "Hotcake exists");
        ok(Hotcake._private, "Hotcake private members are properly set when in debug mode");
    });

    test("copyKeys", function()
    {
        var classes;
        var testFunctions;
        var isPassing;

        // test copying one test function.
        classes = newClassPair();
        classes[0].prototype.test = testFunction;
        Hotcake._private.copyKeys(classes[1].prototype, classes[0].prototype);
        deepEqual(classes[1].prototype.test, testFunction, "Copying single key");

        // also make sure that no shenanigans were used to make that work (even the ones that seem impossible).
        ok(classes[1] != classes[0], "Ensure that the two classes are not equivalent");
        ok(classes[1].prototype != classes[0].prototype, "Ensure that the two class prototypes are not equivalent");

        classes[0].prototype.foo = function () { };
        deepEqual(typeof(classes[1].prototype.foo), "undefined", "Ensure that a member added to one class is not automatically defined for another one");

        // test copying multiple, distinct, functions
        classes = newClassPair();
        testFunctions = new Array();

        for (var i = 0; i < 20; i++)
            classes[0].prototype["test" + i] = testFunctions[i] = function () { };

        Hotcake._private.copyKeys(classes[1].prototype, classes[0].prototype);
        isPassing = true;

        for (var i = 0; i < 20; i++)
            if (classes[2]["test" + i] !== classes[3]["test" + i])
                isPassing = false;

        ok(isPassing, "Copying multiple distinct functions");

        // test copying multiple, distinct, functions from an implied class.
        classes = newClassPair();
        testFunctions = new Array();

        for (var i = 0; i < 10; i++)
            classes[0].prototype["test" + i] = testFunctions[i] = function () { };

        Hotcake._private.copyKeys(classes[1].prototype, classes[0]);
        isPassing = true;

        for (var i = 0; i < 10; i++)
            if(classes[2]["test" + i] !== classes[3]["test" + i])
                isPassing = false;

        ok(isPassing, "Copying multiple distinct functions without specifying source prototype");
    });

    test("appendGUID", function ()
    {
        var url, targetURL, lastURL;

        url = "http://hotcakejs.com";
        targetURL = Hotcake._private.appendGUID(url);
        ok(targetURL.indexOf(url + "?__hotcakeGUID=") == 0, "Appends new querystring");

        lastURL = targetURL;
        targetURL = Hotcake._private.appendGUID(url);
        ok(targetURL != lastURL, "New querystring does not create duplicates when called twice");

        url = "http://hotcakejs.com?_=123";
        targetURL = Hotcake._private.appendGUID(url);
        ok(targetURL.indexOf(url + "&__hotcakeGUID=") == 0, "Appends to existing querystring");

        lastURL = targetURL;
        targetURL = Hotcake._private.appendGUID(url);
        ok(targetURL != lastURL, "Existing querystring does not create duplicates when called twice");
    });

    test("isRelativeScript", function ()
    {
        ok(!Hotcake._private.isRelativeScript("http://hotcakejs.com"), "Explicit HTTP is not relative");
        ok(!Hotcake._private.isRelativeScript("https://hotcakejs.com"), "Explicit HTTPS is not relative");
        ok(!Hotcake._private.isRelativeScript("file://hotcakejs.com"), "Explicit FILE is not relative");
        ok(!Hotcake._private.isRelativeScript("//hotcakejs.com"), "Implicit protocol is not relative");
        ok(Hotcake._private.isRelativeScript("test.js"), "Relative path is actually considered relative.");
        ok(Hotcake._private.isRelativeScript("js/test.js"), "Relative path with subfolders is actually considered relative.");
        ok(Hotcake._private.isRelativeScript("/test.js"), "Absolute path is considered relative (not foreign)");
    });

    test("isIgnoredScript", function ()
    {
        var filter;

        filter = ["filtered.js"];
        ok(!Hotcake._private.isIgnoredScript(filter, "abc.js"), "Doesn't pick up unrelated scripts");
        ok(!Hotcake._private.isIgnoredScript(filter, "unfiltered.js"), "Only checks from beginning of name. Substrings don't trip it");
        ok(!Hotcake._private.isIgnoredScript(filter, "js/filtered.js"), "Doesn't pick up scripts whose name matches, but are within a subfolder");
        ok(!Hotcake._private.isIgnoredScript(filter, "filtered.css"), "Doesn't pick up files with different extensions");
        ok(Hotcake._private.isIgnoredScript(filter, "filtered.js"), "Correctly picks up a single matching filename");

        filter = ["filtered.js", "anotherFilter.js", "moreFilter", "/js/"];
        ok(!Hotcake._private.isIgnoredScript(filter, "abc.js"), "Multiple filters don't pick up unrelated scripts");
        ok(!Hotcake._private.isIgnoredScript(filter, "unfiltered.js"), "Multiple filters only checks from beginning of name. Substrings don't trip it");
        ok(!Hotcake._private.isIgnoredScript(filter, "js/filtered.js"), "Multiple filters don't pick up scripts whose name matches, but are within a subfolder");
        ok(!Hotcake._private.isIgnoredScript(filter, "filtered.css"), "Multiple filters don't pick up files with different extensions");
        ok(Hotcake._private.isIgnoredScript(filter, "filtered.js"), "Multiple filters correctly picks up a single matching filename");
        ok(Hotcake._private.isIgnoredScript(filter, "moreFilter.js"), "Multiple filters correctly picks up a single matching filename that isn't the first index");
        ok(Hotcake._private.isIgnoredScript(filter, "anotherFilter.js"), "Multiple filters correctly picks up a single matching filename that isn't the first index");

        ok(Hotcake._private.isIgnoredScript(filter, "/js/someFile.js"), "Filters correctly picks up scripts who are in subfolders marked as filtered.");
    });

    test("delegateKeysReplace", function ()
    {
        var classes, testFunctions;
        var isPassing;

        testFunctions = new Array();
        
        // multiple replacement keys
        classes = newClassPair();
        for (var i = 0; i < 10; i++)
            testFunctions[i] = classes[1]["test" + i] = function () { };

        Hotcake._private.copyKeys(classes[0], classes[1]);
        Hotcake._private.delegateKeysReplace(classes[0], classes[1]);
        isPassing = true;

        for (var i = 0; i < testFunctions.length; i++)
            if (!(classes[0]["test" + i] && classes[0]["test" + i]._hotcakeReplacement))
                isPassing = false;

        ok(isPassing, "Multiple replacement keys are given delegates");

        for (var i = 0; i < testFunctions.length; i++)
            if (classes[0]["test" + i]._hotcakeReplacement !== testFunctions[i])
                isPassing = false;

        ok(isPassing, "Multiple replacement keys are given delegates that match the right source functions");

        // multiple replacement of null keys
        classes = newClassPair();
        for (var i = 0; i < 10; i++)
            testFunctions[i] = classes[1]["test" + i] = function () { };

        Hotcake._private.delegateKeysReplace(classes[0], classes[1]);
        isPassing = true;

        for (var i = 0; i < testFunctions.length; i++)
            if (classes[0]["test" + i])
                isPassing = false;

        ok(isPassing, "Multiple replacement doesn't copy keys, it only should delegate them");
    });

    test("delegateForwardFunction", function ()
    {
        var classes;
        var testFunction, testFunction2;

        testFunction = function() { return 1; };
        testFunction2 = function() { return 2; };

        classes = newClassPair();
        classes[0].prototype.test = Hotcake._private.delegateForwardFunction.call(classes[0], "test", testFunction);
        
        equal(classes[2].test(), 1, "Delegating forward function still executes original function");

        classes[0].prototype.test._hotcakeReplacement = testFunction2;

        equal(classes[2].test(), 2, "Delegated forward function correctly replaces itself with new function, immediately");
    });

    /*test("delegateKeys", function ()
    {

    });*/

    // this one is so big that it almost deserves its own test suite.
    // for our purposes, only check the "special" characters, which mean something specific to regex.
    // 
    /*test("regexEscape", function ()
    {

    });*/
});

function testFunction()
{
    console.warn("test function");
}

function newClassPair()
{
    var f1, f2;

    f1 = function () { };
    f2 = function () { };

    return [f1, f2, new f1(), new f2()];
}