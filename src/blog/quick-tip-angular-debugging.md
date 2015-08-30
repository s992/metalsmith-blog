---
layout: post.hbt
title: "Quick Tip: Angular Debugging"
date: 2014-07-01 18:34:40
comments: true
categories: 
excerpt: false
---
Occasionally I'll run into someone who is having trouble debugging their Angular application and their first complaint is almost always the incomprehensible error messages. You know the type, they look like this:

{% img /images/angulardebug/angular-minified-error.png %}

You'll see ugly error messages like that when you are using the *minified* version of Angular. But, don't lose hope! You can find a full error message with a (sometimes) helpful explanation by just hitting the link immediately following `Error: [$injector:unpr]`. I find that a lot of people tend to gloss over that URL when confronted with the ugly error. For an example of where that link takes you, you can try this one from the screenshot: [https://docs.angularjs.org/error/$injector/unpr?p0=iDontExistProvider%20%3C-%20iDontExist](https://docs.angularjs.org/error/$injector/unpr?p0=iDontExistProvider%20%3C-%20iDontExist). It's obviously a contrived error for the sake of this post, but it will give you an idea of what to expect.

Now, if you're working in a development environment and battling ugly error messages, you can swap out your minified Angular for the unminified version and get a nicer error:

{% img /images/angulardebug/angular-unminified-error.png %}

Now we can see what's going on at a glance (in this case, Angular's dependency injection can't find `iDontExist`), but we still have access to the URL in case we need more information.