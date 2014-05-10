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
        var filterArray;

        filterArray = ["filtered.js"];
        ok(!Hotcake._private.isIgnoredScript(filterArray, "abc.js"), "Doesn't pick up unrelated scripts");
        ok(!Hotcake._private.isIgnoredScript(filterArray, "unfiltered.js"), "Only checks from beginning of name. Substrings don't trip it");
        ok(!Hotcake._private.isIgnoredScript(filterArray, "js/filtered.js"), "Doesn't pick up scripts whose name matches, but are within a subfolder");
        ok(!Hotcake._private.isIgnoredScript(filterArray, "filtered.css"), "Doesn't pick up files with different extensions");
        ok(Hotcake._private.isIgnoredScript(filterArray, "filtered.js"), "Correctly picks up a single matching filename");

        filterArray = ["filtered.js", "anotherFilter.js", "moreFilter", "/js/"];
        ok(!Hotcake._private.isIgnoredScript(filterArray, "abc.js"), "Multiple filters don't pick up unrelated scripts");
        ok(!Hotcake._private.isIgnoredScript(filterArray, "unfiltered.js"), "Multiple filters only checks from beginning of name. Substrings don't trip it");
        ok(!Hotcake._private.isIgnoredScript(filterArray, "js/filtered.js"), "Multiple filters don't pick up scripts whose name matches, but are within a subfolder");
        ok(!Hotcake._private.isIgnoredScript(filterArray, "filtered.css"), "Multiple filters don't pick up files with different extensions");
        ok(Hotcake._private.isIgnoredScript(filterArray, "filtered.js"), "Multiple filters correctly picks up a single matching filename");
        ok(Hotcake._private.isIgnoredScript(filterArray, "moreFilter.js"), "Multiple filters correctly picks up a single matching filename that isn't the first index");
        ok(Hotcake._private.isIgnoredScript(filterArray, "anotherFilter.js"), "Multiple filters correctly picks up a single matching filename that isn't the first index");

        ok(Hotcake._private.isIgnoredScript(filterArray, "/js/someFile.js"), "Filters correctly picks up scripts who are in subfolders marked as filtered.");
    });

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