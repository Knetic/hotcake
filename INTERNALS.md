# Hotswapping for browsers: sweet and lightweight 

###I know how JS works internally, so tell me - how does Hotcake work?

Hotcake takes a definition of a class (as an object, similar to how Backbone does), plus a parameter to the current class object. If the current class isn't yet defined, Hotcake creates a definition for it, and returns that. If there is already a definition for the class, Hotcake edits its prototype to match the new definition. If you need to edit the constructor of a class, Hotcake also has a method which allows for old versions of class prototypes to "chain" together, like a singly linked list, and have every object use the most recent protoype - plus any new object use the most recent version of the constructor.

###That was over my head, walk me through it

Before we get into how Hotcake works, you ought to have some knowledge about how class prototypes work in JS. Ideally, you'll already have done class inheritance "by hand" (without using Backbone or something like it), and have a cursory understanding of what processes JS goes through when trying to call a function. If you don't know about that, I think you're brave and I like your style.

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
    
In this example, we define a class, create an instance of it, and use one of its functions. But note that by editing the function in the class prototype ("Test1.prototype.foo"), it also changes the behavior of the instantiated object.

This is because objects instantiated from a class don't possess copies of that class's functions, they instead call their class prototype's functions. So internally, you might think of an object's "foo" method like this:

    obj.foo = function()
    {
        // note it doesn't actually look like this, 
        // but for the purposes of demonstrating why prototype editing works, 
        // this is more or less how it behaves.
        Test1.prototype.foo.apply(this, arguments);
    }

This is done for a multitude of reasons, not the least of which is to preserve memory. In JS, every function that is defined has a memory cost (you have to store it like any other object). If we have big functions copied to every instantiated object, we're wasting memory. Instead, JS point to *one* function definition, via the prototype.

This behavior makes it very easy for libraries like Hotcake to step in and edit that prototype, causing any already-instantiated objects to instantly modify their behavior to use the new code - commonly known as hotloading.

###Is that all Hotcake does?

No. There's a catch. In our example above, if we wanted to change the constructor code, we'd be out of luck. You cannot modify the constructor of a JS class after the class is defined. This means that if  we wanted to hotswap the constructor for Test1 to look like this:

    function Test1()
    {
        this.things = new Array();
        this.stuff = 5;
    }
We wouldn't be able to. We have to define *an entirely new class* to get a new constructor. This unfortunate situation is one of many reasons not to do too much work in the constructor of a class - something you probably found while writing in other languages too.

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

Yes. But before you try to do that, please understand that trying to hotswap constructors leads to moderately ugly solutions. **You are much better off using "extend" and "ctor" than trying to hotswap actual constructors**. 

**Seriously.** If you're writing new code, or able to refactor your current codebase, use "extend" and "ctor".

But if you really, really, really need to; Hotcake also has an "extendClass" function which is more advanced. It works by "chaining" class definitions together with the use of surrogates.

To explain how this works, let's keep using our original example, but try to edit the constructor. This means that if we want to hotswap the constructor, we need to create a new class, and point the old class prototypes to use the new class prototype.

    function extendClass = function(originalClass, newClassDefinition)
    {
        var fkeys, key, Surrogate;
        
        // create a new class, which will be returned.
        Surrogate = function()
        {
            // call the new constructor whenever this class creates a new object.
            newClassDefinition.apply(this, arguments);
        }
        
        // copy the definition of "newClassDefinition" into the old class' prototype,
        // and to the new surrogate class.
        // this way, anything using the old class' methods will be updated to
        // use the new methods, just like with "extend".
        fkeys = Object.keys(originalClass.prototype);
        for(var i = 0; i < fkeys.length; i++)
        {
            key = fkeys[i];
            Surrogate.prototype[key] = newClassDefinition[key];
            originalClass.prototype[key] = newClassDefinition[key];
        }
        
        // this overwrites our reference to the original class - we can never reach
        // it again. In our example above, the original Test1 is now gone, and Test1
        // refers to this surrogate class.
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
                // override this function to instead call the new definition.
                // If the new class' definition is replaced by another definition,
                // this function will walk through all the different versions
                // until it arrives at the most recent one, with the actual code.
                newClassDefinition[key].apply(this, arguments);
            }
        }
        
        return Surrogate;
    }
    
Now, no matter how many versions of "foo" we edit in our example, our "obj" will always use the most up-to-date version.

Unfortunately, we've now introduced a potentially fatal mistake. We've made it so that any call to a class' function will walk through an unknown number of anonymous functions, each getting us one step closer to the actual logic we want to use. We've made a very roundabout form of a singly-linked list, and anytime we call a class function, we end up recursing through the whole thing. This means that if we hotswap a few thousand times, then call one of our class functions, we will hit the call stack size limit, and all of our code will fail.

No problem! We're professionals. Since we can edit an old function prototype, we can just indicate that it's out of date, and give it a pointer to the next prototype in the chain - without needing to use recursion.

    /* create Surrogate just like before */
    for(var i = 0; i < fkeys.length; i++)
    {
        // bear in mind, this protoype is the most recent code - it's not old yet,
        // it's just preparing itself for what happens when it becomes outdated.
        Surrogate.prototype[key] = function ()
        {
            // if this function has a member indicating that 
            // our definition is out of date, and ought to be
            // replaced ("_replacement")
            if (this[key]._replacement)
            {
                // then traverse through the list of functions until
                // we find the most recent one, and use that in this object.
                while (this[key]._replacement)
                    this[key] = this[key]._replacement;
                
                // and finally call the updated function.
                this[key].apply(this, arguments);
            }
            // otherwise, if this is the most updated function,
            // just call it.
            else
                newClassDefinition[key].apply(this, arguments);
        }
        
        // this is the old code, which we want to replace.
        // we just link the most recentversion of the function,
        // and let the original function pick it up whenever the old function is called
        originalClass.prototype[key]._replacement = newClassDefinition;
    }

This solves all of our problems - it allows us to use whatever constructors we want, ensures that all objects use the most up-to-date function definitions, and is low-impact. This solution is how Hotcake implements "extendClass".

###If i can use "extendClass", why should i limit myself to "extend"?

"extendClass" is a very sideways solution. It involves creating a lot of classes, and holding references between their prototypes. Remember, once you instantiate an object, the class you use to instantiate it will stick around in memory until (at least) the object is deleted. If you create and hold a lot of objects, but don't destroy them after you're done with the, you can wind up with memory leaks. That sort of scenario isn't possible with "extend".

###How does Hotcake hotswap stylesheets?

In contrast to the lengths Hotcake goes through to replace code, stylesheets are dead simple. Browsers entirely rely on the "link" elements found within the "head" of the DOM. If you remove any of those "link" elements, its style rules are automatically removed from the page.

This makes it trivial to go through every "link" element, delete the element, and recreate the element exactly as it was. This causes the browser to re-request the same stylesheet, and to replace all styles in the page with the updated versions.