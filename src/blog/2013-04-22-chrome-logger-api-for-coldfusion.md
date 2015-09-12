---
layout: post.hbt
title: "Chrome Logger API for ColdFusion"
date: 2013-04-22 12:00:00
comments: true
categories: 
---
About two weeks ago, I spotted a link on either Reddit or Hacker News to a Google Chrome extension called [Chrome Logger](http://www.chromelogger.com/). I immediately saw the potential, because I frequently want to `cfdump` something but have to either abort immediately after or worry about my dump disappearing into a thread, screwing up my layout, etc., etc. There were libraries available for PHP, Python, and Ruby at the time (Node was added recently as well), so I figured I may as well jump on board and put one together for CF.

I finished my preliminary work on the component last weekend and used it at work all week, fixing bugs as I came across them. I'm now reasonably confident that it can be put into the wild, so I'm pleased to announce version 0.1 of chromelogger-cf, hosted at http://www.github.com/s992/chromelogger-cf

In addition to logging simple values, structs, arrays, and queries, I've also added a method to convert objects (primarily ORM entities) into a struct representation, including relationships.

<!-- more -->

In addition to logging simple values, structs, arrays, and queries, I've also added a method to convert objects (primarily ORM entities) into a struct representation, including relationships. I imagine this is where most of the bugs will surface, so please don't hesitate to open an issue if you run into some weirdness.

Ok, enough of the boring stuff - let's see how this thing actually works!

The most basic logging is accomplished via `chromelogger.log()`. Simply pass in any number of arguments and check the Chrome console.

<script src="https://gist.github.com/s992/5431987.js?file=chromelogger1.cfc"></script>

This results in the following output to the console:

<a href="assets/images/chromelogger/scrn1.png" target="_blank"><img src="/assets/images/chromelogger/scrn1.png"></a>

Of course, if you don't want all your logged items on one line, you can call log() as many times as you want:

<script src="https://gist.github.com/s992/5431987.js?file=chromelogger2.cfc"></script>

<a href="assets/images/chromelogger/scrn2.png" target="_blank"><img src="/assets/images/chromelogger/scrn2.png"></a>

In addition to `log()`, you also have the option to `warn()` and `error()`:

<script src="https://gist.github.com/s992/5431987.js?file=chromelogger3.cfc"></script>

<a href="assets/images/chromelogger/scrn3.png" target="_blank"><img src="/assets/images/chromelogger/scrn3.png"></a>

Don't forget about objects and exceptions (note that the recursion between User and Address is caught and handled):

<script src="https://gist.github.com/s992/5431987.js?file=chromelogger4.cfc"></script>

<a href="assets/images/chromelogger/scrn4.png" target="_blank"><img src="/assets/images/chromelogger/scrn4.png"></a>

Stucts, arrays, and queries are supported too:

<script src="https://gist.github.com/s992/5431987.js?file=chromelogger5.cfc"></script>

<a href="assets/images/chromelogger/scrn5.png" target="_blank"><img src="/assets/images/chromelogger/scrn5.png"></a>

So, there you have it. Check out the project on GitHub for (a little) more documentation and to get started!