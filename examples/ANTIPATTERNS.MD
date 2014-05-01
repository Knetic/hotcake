# Patterns to use when designing for hotswapping

Hotswapping is largely hands-off; you write the code, you swap it out, end of story. But unfortunately, hotswapping isn't *entirely* magical - there are certain patterns which will prevent you from being able to hotswap your code effectively. This page describes those patterns, and how to get around them.
Don't worry, it's not a big deal. This is more of a primer for what to expect.

###Backbone view delegation

When using Hotcake with Backbone, don't use anonymous functions in your events hash. Here's an example of what *not* to do:

    Backbone.View.extend
    ({
        events:
        {
            "click .something": function()
            {
                // this is an anonymous function.
                console.log("doing all the things");
            }
        }
    });
    
Seems fine, right? Nope! Remember, every handler in the "events" object is bound to the DOM when the view is created. This means that *this specific anonymous function* is bound to the DOM events. It cannot be easily hotswapped - you'd need to undelegate the whole view, and rebuild it. Way too hard. Instead, do this:

    Backbone.View.extend
    ({
        allTheThings: function()
        {
            console.log("doing all the things");
        },
        events:
        {
            "click .something": "allTheThings"
        }
    });

This way, when the click handler is fired, the View object will search its prototype for the "allTheThings" function, and call it. Your logic is not wrapped up in the DOM click event, but is stored directly in the View, capable of being hotswapped.

####Getters/Setters

Invariably, you'll change your data model. It happens, it's nothing to shy away from. And you ought to be able to hotswap changes to your data model as well. Unfortunately, this can make hotswapping perilous. Let's take the following example:

    // version 1
    var Apple = Hotcake.define(Apple,
    {
        ctor: function(seedCount)
        {
            this.seeds = seedCount;
        }
    });
    
    var honeycrisp = new Apple(5); // new apple with five seeds.
So we define an Apple which has a single integer, the number of seeds, as its data model. But what if we want to implement a feature which does more work with the seeds? Like this?
    
    // version 2
    var Apple = Hotcake.define(Apple,
    {
        ctor: function()
        {
            this.seeds = new Array();
        }
    });
    
    // create a new apple, push some seeds into its data model.
    var honeycrisp = new Apple();
    
    // what happens if an Apple with the integer data model is created, but this logic (which relies on the array data model) is used? Errors everywhere.
    honeycrisp.seeds.push 
    ({
        thickness: .2,
        grain: "fine",
        genetics: {...}
    });
As you can probably guess, if a client has the first version of the Apple class loaded, any Apple objects will have an integer for their "seeds" property. But version 2 of the Apple class uses an array to represent its seeds - we've adjusted the data model. But if a client with an old data model tries to use the new logic, we're in trouble.

This is easily solved by using a getter/setter pattern, like so.

    var Apple = Hotcake.define(Apple,
    {
        _convertSeedToArray: function()
        {
            this.seeds = new Array();
        },
        
        getSeedCount: function()
        {
            // version 1 would do:
            return this.seeds;
            
            // version 2 would check to make sure that the client isnt using
            // the version 1 data format. If it is, it upgrades the data.
            if(typeof(this.seeds) === "int")
                this._convertSeedToArray();
                
            return this.seeds.length;
        },
        
        addSeed: function(seed)
        {
            // version 1:
            this.seeds += seed;
            
            // version 2:
            if(typeof(this.seeds) === "int")
                this._convertSeedToArray();
                
            this.seeds.push(seed);
        }
    });

This solves our problem, and makes our data much more encapsulated - which is a good thing for manageability and collaboration. But you might be thinking "that could be a lot of code getting in the way of my logic - shouldn't i only upgrade the data model once?" And you'd probably be right. It's best to upgrade the data model and the logic at the exact same time. Hotcake doesn't provide a built-in way to do this, so you may feel a little trapped. But there is a pattern which can quickly save you; the upgrade script.

Hotcake can "include" scripts to hotload, and those "included" scripts are hotloaded *last*, after all of your other scripts are loaded. So all you need to do is keep an "upgrade.js" file in your scripts directory, and include it in every hotswap you do; like this

    Hotcake.hotswap({include: "upgrade.js"});

The contents of "upgrade.js" will be executed every hotswap. The contents of your upgrade.js may look like this:

    // upgrade.js
    if(honeycrisp)
    {
        // check to see if this object needs to go from version 1 to 2.
        if(typeof(honeycrisp.seeds) === "int")
            honeycrisp.seeds = new Array();
    }

You'd just keep adding to this upgrade.js file, detecting old versions and replacing them as required. Not a bad solution - the main body of your code can stay exactly the same as it was, but you still get the data model upgrades - and it's much more efficient than checking for new versions upon every data model query.

The only other concern, at this point, is that you might not be able to reach all of your models from a global context; see the following.

    