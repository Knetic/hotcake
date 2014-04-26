# Hotswapping for browsers: sweet and lightweight 

###What is it?

Hotcake (www.hotcakejs.com) is a library which allows you to hotload and hotswap your code on-demand, within a browser.

###Why?

Often, you'll deploy new code to production, but users won't receive script or stylesheet updates until they refresh their browser. This can be problematic with single-page setups, because some users may NEVER try to refresh the page. Some users leave sessions open for weeks at a time, meaning that they don't receive critical client updates until too late.A worse case might be that your page runs on a read-only monitor or dashboard. In that case, nobody should need to manually refresh that, and it's up to you to hotswap the relevant code and styles.

And finally, if you do a large enough back-end deployment (and either don't want to have a versioned API, or have an "edge" API), it may change the structure of expected client requests. If a user is in the process of making a request, but it fails due to old code on their side, wouldn't it be nice if their code could hotswap and re-make the request with the newer, correct, code?

###Aren't there other libraries that do this?

Sorta. All of the libraries that I found which claim to do hotswapping only do so on a superficial level. They just re-request every script file. This works if you have a simple application with absolutely no classes or objects, but if you take advantage of classes or long-lived objects at all (such as you would if using Backbone or Ember), they fall apart. For advanced developers, this just isn't enough - you need to do a true hotswap, with all functions in all existing objects replaced. You need to have the client act as if a full refresh had happened, without needing to interrupt the user with a forced refresh.

###Why can't i just force the user to refresh?

Besides the fact that most users complain when forced to do favors for their software, refreshes can be dangerous. What if your user loses his data? And are you willing to guarantee that a refresh will put the user *exactly* where they left off? Can the user's connection load the page (and all assets) quickly enough to be imperceptible? What happens if the user lost connection briefly, and you forced a refresh? It's all sounding like too much work, with too much room for error.

###How do I use it?

Hotcake wraps around any existing model/collection/view library you care to use.

###Is there any overhead I should know about?

Hotcake doesn't do a lot of work - but you will need to bear in mind that your scripts will be reloaded all at once. If you have scripts which take a long time to interpret and optimize, you'll face that performance penalty again with every Hotcake hotswap.

###How does it work?

The full explanation of how Hotcake came about, and how it works, can be found on www.hotcakejs.com