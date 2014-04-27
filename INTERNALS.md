# Hotswapping for browsers: sweet and lightweight 

###I know how JS works internally, so tell me - how does Hotcake work?

Hotcake takes a definition of a class (as an object, similar to how Backbone does), plus a parameter to the current class object. If the current class isn't yet defined, Hotcake creates a definition for it, and returns. If there is already a current definition for the class, Hotcake edits its prototype to match the new definition. If you need to edit the constructor of a class, Hotcake also has a method which allows for optimistic class definition recursion.

###That was over my head, walk me through it

Let's take the following code, it's emblematic of how Hotcake operates.
    
    var obj;
    
    // this is our test class
    function Test1()
    {}
    
    Test1.prototype.foo = function()
    {
        console.log("version 1");
    }
    
    obj = new Test1();
    obj.foo(); // should echo "version 1" to console.
    
    // we want to replace "foo" with this new function.
    Test1.prototype.foo = function()
    {
        console.log("version 2");
    }
    
    obj.foo(); // should echo "version 2" to console.
    
In this example, we define a class, create an instance of it, and use a function. But note that by editing the function in the class prototype ("Test1.prototype.foo"), it also changes the behavior of the instantiated object.

This is because objects instantiated from a class don't possess copies of that class's functions, they instead call their class prototype's functions. So internally, you might think of an object's "foo" method like this:

    obj.foo = function()
    {
        // note it doesn't actually look like this, 
        // but for the purposes of demonstrating why prototype editing works, 
        // this is more or less how it behaves.
        Test1.prototype.foo.apply(this, arguments);
    }

This is done for a multitude of reasons, not the least of which is to preserve memory. In JS, every function that is defined has a memory cost (you have to store it like any other object). If we have big functions copied to every instantiated object, we're wasting memory. Instead, JS point to *one* function definition, via the prototype.

This behavior makes it very easy for libraries like Hotcake to step in and edit that prototype, causing any already-instantiated objects to instantly modify their behavior to use the new code.

###Is that all Hotcake does?

No. There's a catch. In our example above, if we wanted to change the constructor code, we'd be out of luck. You cannot modify the constructor of a JS class after the class is defined. This means that if  we wanted to hotswap the constructor for Test1 to look like this:

    function Test1()
    {
        this.things = new Array();
        this.stuff = 5;
    }
We wouldn't be able to. We have to define *a new class* to get a new constructor. This unfortunate situation is one of many reasons not to do too much work in the constructor of a class - something you probably found while writing in other languages too.

Hotcake's "extend" method does not try to change the constructor, it just edits the prototype. If your code avoids constructors, you can safely use "extend" to hotswap new code. This is the "recommended" mode, because it has absolute certainty that hotswapping will work without any ill effect. But if you want to have any logic in the constructor of your class, it also requires you to write either a "ctor" or  "initialize" function in the definition of your class, like this.

    Test1 = Hotcake.extend(Test1, 
    {
        // hotcake ensures that this function is called whenever a new "Test1"
        // is instantiated.
        ctor: function()
        {
            // For all practical purposes, this serves as your constructor.
            console.log("I am creating a new instance of Test1");
        }
    });

###I want to hotswap my constructor, can I use Hotcake?

Yes. But before you try to do that, please understand that trying to hotswap constructors leads to very ugly solutions. **You are much better off using "extend" and "ctor" than trying to hotswap actual constructors**. 

**Seriously.** If you're writing new code, or able to refactor your current codebase, use "extend" and "ctor".

But if you really, really, really need to; Hotcake also has an "extendClass" function which is more advanced, but also less elegant. It works by "chaining" class definitions together with the use of surrogates. It does what it can to make sure that unused class definitions get garbage collected, and to make sure no call stack size limits are reached.

To explain how this works, let's keep using our original example, but try to edit the constructor. This means that if we want to hotswap the constructor, we need to create a new class, and point the old class prototypes to use the new class prototype.

    function extendClass = function(originalClass, newClassDefinition)
    {
        var fkeys, key, Surrogate;
        
        // create a new class, which will be returned.
        Surrogate = function()
        {
            newClassDefinition.apply(this, arguments);
        }
        
        // copy the definition of "newClassDefinition" into the old class' prototype,
        // and the surrogate class.
        fkeys = Object.keys(originalClass.prototype);
        for(var i = 0; i < fkeys.length; i++)
        {
            key = fkeys[i];
            Surrogate.prototype[key] = newClassDefinition[key];
            originalClass.prototype[key] = newClassDefinition[key];
        }
        
        return Surrogate;
    }
    
That edits the original class's prototype to use the new code given by "newClassDefinition". Great! But what happens when we do that again? Let's say we hotswap a third version of the class, will the *original* class prototype get changed? It can't, because we overrode our reference to the original class by returning "Surrogate". It would look like this:

    var Test, obj;
    
    // first definition
    Test = extendClass(Test, 
    {
        foo: function()
        {
            console.log("version 1");
        }
    }
    
     obj = new Test();
     obj.foo(); // prints "version 1"
     
    Test = extendClass(Test, 
    {
        foo: function()
        {
            console.log("version 2");
        }
    }
    // prints "version 2", because we edited the original class definition 
    // in "extendClass"
    obj.foo();
    
    // but now, "Test" refers to the Surrogate returned 
    // from our second call to "extendClass". 
    // We no longer have any way to change the prototype of the original "Test",
    // so "obj" (which was instantiated with the first version of "Test")
    // is stuck using the functions from our second version - never to be updated again
    Test = extendClass(Test, 
    {
        foo: function()
        {
            console.log("version 3");
        }
    }
    
    // still prints "version 2".
    obj.foo();

So, instead of replacing our original class's prototypes with the new definition, we wrap the new definitions with logic that tells any object using them to update its own functions to use the new definitions. This is what is meant by "prototype chaining".

Doing this is a relatively quick change to the "extendClass" function to look like this:

    function extendClass = function(originalClass, newClassDefinition)
    {
        /* create Surrogate just like before */
        
        fkeys = Object.keys(originalClass.prototype);
        for(var i = 0; i < fkeys.length; i++)
        {
            key = fkeys[i];
            Surrogate.prototype[key] = newClassDefinition[key];
            
            originalClass.prototype[key] = function()
            {
                // override our usage of this function to instead
                // call the new definition.
                // If the new definition is replaced by another definition,
                // this function will walk through all the different versions
                // until it arrives at the most recent one, with the actual code.
                newClassDefinition[key].apply(this, arguments);
            }
        }
        
        return Surrogate;
    }
    
Now, no matter how many versions of "foo" we edit in our example, our "obj" will always use the most up-to-date version.

###Won't using functions this way cause problems?

Yes, it absolutely will. If you use "extendClass" more than a few thousand times, you'll hit the call stack limit of your browser (not to mention you'll be using functions to call other functions a few thousand times, which isn't cheap for performance).

But there is another way, which allows us to hotswap constructors *and* not incur the wicked penalties of calling so many anonymous functions in sequence. Unfortunately, there are edge cases where you'll still encounter call stack size problems, and this falls firmly in the realm of "unsupported behavior" - meaning that while major browsers support it, they're under no obligation to do so, and using that behavior can be unpredictable. We're going to use the \_\_proto\_\_ object (this is what Hotcake's "extendProto" does).

    function extendClass = function(originalClass, newClassDefinition)
    {
        /* create Surrogate just like before */
        
        fkeys = Object.keys(originalClass.prototype);
        for(var i = 0; i < fkeys.length; i++)
        {
            key = fkeys[i];
            Surrogate.prototype[key] = newClassDefinition[key];
            
            originalClass.prototype[key] = function()
            {
                // replace our current prototype with the Surrogate's.
                // any object using any of its functions will now
                // automatically update its prototype to point
                // to the most recent loaded prototype.
                this.__proto__ = Surrogate.prototype;
                
                newClassDefinition[key].apply(this, arguments);
            }
        }
        
        return Surrogate;
    }

This technique allows us to keep every object's prototype pointing at the most recent definition of its class, meaning a call to "foo" will only need to walk through every version of the "Test" class before executing *once*, not every time it executes.

That definitely seems to fix our problems. But there is still an edge case which can cause us to hit the call stack limit; If we create an object, then leave it completely alone for a few thousand iterations of hotswapping, then it will hit the call stack limit once we finally *do* try to use it. See the example below:

    var obj;
    
    obj = new Test();
    
    // pretend that this loop represents one million hotswap iterations.
    for(var i = 0; i < 1000000000; i++)
    {
        Test = Hotcake.extendProto(Test,
        {
            foo: function()
            {
                console.log("version " + i);
            }
        });
    }
    
    // will probably hit the call stack limit, since it needs to walk through
    // the definition for "foo" of one million different versions of "Test".
    obj.foo();
    
In the above example, you will probably hit the call stack limit. If your browser supports more than a million call stack entries, you may not hit the limit. But hopefully you can see the danger of doing this; you're now playing a "numbers game" with your call stack limit, and hoping that every object that you create has *some method* called from it before you update your class definition too many times.

This is a **very dangerous game**. Not only would you be relying on unsupported behavior (\_\_proto\_\_), but you're also trusting that every single one of your objects will not lie dormant for too long as to cause a stack size breach. It may sound ludicrous that you'd go through ten thousand versions of code without touching an object, but would you bet your career on it?

###If "extendClass" and "extendProto" are so dangerous, why include them?

Hotcake was designed to offer a full array of hotswapping options. Not everyone is working on brand new code which can be structured to accomodate Hotcake, so Hotcake supports a few other ways to do hotswapping for existing codebases.

