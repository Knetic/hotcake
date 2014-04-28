# Hotswapping for browsers: sweet, fluffy, and lightweight 

###What is it?

Hotcake (www.hotcakejs.com) is a library which allows you to hotload and hotswap your code and stylesheets on-demand, within a browser.

###Why?

Often, you'll deploy new code to production, but users won't receive script or stylesheet updates until they refresh their browser. This can be problematic with single-page setups, because some users may NEVER try to refresh the page. Some users (you know who you are) leave their browser tabs open for weeks at a time, meaning that they don't receive critical client updates for weeks. Worse, your page might run on a read-only monitor or dashboard. In that case, nobody should need to manually refresh that, and it's up to you to hotswap the relevant code and styles.

If you do a large enough back-end deployment, it may change the structure of expected client requests. If a user is in the process of making a request, but it fails due to old code on their side, wouldn't it be nice if their code could hotswap and re-make the request with the newer, correct, code?

###Aren't there other libraries that do this?

Sorta. All of the libraries that I found which claim to do hotswapping only do so on a superficial level. They just re-request and eval() every script file. This works if you have a simple application with absolutely no classes or objects, but if you take advantage of classes or long-lived objects at all (such as you would if using Backbone or Ember), they fall apart. For advanced developers, this just isn't enough - you need to do a true hotswap, with all functions in all existing objects replaced. You need all of your code to be updated without any fuss, and without needing to write any extra code to deal with it.

###Why can't i just force the user to refresh?

Besides the fact that most users complain when forced to do favors for their software, refreshes can be dangerous. What if your user loses his data? And are you willing to guarantee that a refresh will put the user *exactly* where they left off? Can the user's connection load the page (and all assets) quickly enough to be imperceptible? What happens if the user lost connection briefly, and you forced a refresh?

Nobody is stopping you from hard refreshing a user's browser, but it doesn't seem like an elegant solution to me.

###How do I use it?

Hotcake can be used in a lot of ways, it's probably best if you took a look at the /examples/ folder, or went to www.hotcakejs.com and just read the docs listed there.

###How does it work?

The full explanation of how Hotcake came about, and how it works, can be found on www.hotcakejs.com, or in the "INTERNALS.MD" file in this repository. And, I mean, it's open source. You could just look at the source.

###Can I contribute?

I'm down to accept pull requests, if they're in the spirit of the project. If you have ideas, concerns, or comments about the project - email me. Seriously, do it. I don't mind emails from out of the blue - I prefer them to the spam that usually finds its way into my inbox.