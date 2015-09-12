---
layout: post.hbt
title: "Ratpack: First Impressions"
date: 2014-08-26 17:21:28
comments: true
categories: 
---
I first heard about [Ratpack](http://www.ratpack.io/) about a month ago at Gr8Conf US. I didn't make room in my schedule to go to any of the sessions, but I did add it to my (long) list of stuff to check out. Most things that end up on that list have a 50/50 chance of ever making it into my editor. 

Luckily, I found an excuse to check it out - and I'm glad I did. My current project at work requires me to interface with a third party web based API, but that API doesn't actually exist just yet. Using Ratpack, I was able to quickly mock up the API and then code against my mock. Unfortunately (or maybe fortunately!), the application _is_ for work and I can't share it. What I can share, however, is my first impression of Ratpack.

<!-- more -->

### Documentation
The first thing I do when I'm checking out a new library or framework is head straight to the documentation. Ratpack has a [manual](http://www.ratpack.io/manual/current/index.html) as well as [API docs](http://www.ratpack.io/manual/current/api/). The manual (as described in the ["How to read the documentation"](http://www.ratpack.io/manual/current/intro.html#how_to_read_the_documentation) section) features a high level overview of Ratpack concepts.

Looking through the manual, it's obvious that Ratpack is a work in progress. Several sections are missing entirely and replaced by "TODO" blocks. This was a point of frustration, but between the manual and the API docs I was able to get enough of an understanding to cobble a workable application together. Building a Ratpack application today requires some research and frustrated Googling, but ultimately I was able to find everything I needed. 

I imagine the manual in its current state will be more useful for non-Groovy projects, as it seems that a majority of the "TODO" blocks are located in the [Groovy section](http://www.ratpack.io/manual/current/groovy.html#groovy).

### Examples
After I'm done scanning the documentation, I like to check out examples of the codebase. There's no shortage of example Ratpack applications: you can find five examples [here](https://github.com/ratpack), three of which are Groovy based - example-books, example-ratpack-gradle-groovy-app, and example-ratpack-standalone-groovy-script.

I was working with Gradle, so I checked out example-ratpack-gradle-groovy-app first. Unfortunately, it hasn't been touched in eight months and seems to have stopped working. I was unable to build it, so I moved on to example-books, which is also Gradle based. This one ran, and I was able to poke around a little bit and get a feel for it.

I should note that at this time I didn't really have a strong understanding of how a Ratpack application is structured. There's a lot of stuff going on in example-books, and most of it went right over my head. I ultimately ended up cutting down example-books to create a completely barebones Ratpack example that doesn't really do anything, but writing it helped me get a better grasp on what exactly was necessary to get a Ratpack application started. You can find that example [here](https://github.com/ratpack/example-books.git).

### Setup
The manual lists two options under the "Setup" heading: the Gradle plugin and Lazybones project templates. At this point, I had no desire to look into Lazybones (which, by the way, seems like a fine project - you can find it right [here](https://github.com/pledbrook/lazybones) on GitHub), so I headed to the [Gradle section](http://www.ratpack.io/manual/current/setup.html#using_the_gradle_plugins). Unfortunately, it's one of the sections that has nothing but a "TODO."

There is another section of the manual dedicated to [building with Gradle](http://www.ratpack.io/manual/current/gradle.html#building_with_gradle), so I'm not really sure what the maintainers are planning to add to the Setup > Gradle section. Regardless, I was able to find what I was looking for in this section and it was trivial to create a Gradle build file that would run my (not yet created) Ratpack application.

### Coding
One of my favorite things about Groovy is how easy an API can be to work with when using DSLs. Ratpack is no exception: all of your endpoints are configured via the handlers DSL. Here's an example of an application with two endpoints: `/hello` and `/goodbye`.

``` groovy
ratpack {
	handlers {
		get("hello") {
			render "Hello, World!"
		}

		get("goodbye") {
			render "Goodbye, World!"
		}
	}
}
```

It works exactly as you would expect it to - when navigating to example.com/hello, "Hello, World!" is sent to the browser. And, of course, navigating to example.com/goodbye results in "Goodbye, World!"

Later this week, I'll be writing another post that looks at the code behind a Ratpack application more in depth. For now, I'll just say that I found Ratpack's DSL very intuitive and I enjoyed writing code with it.

### Community
This is a short bullet point, but I just wanted to point out that there is a [forum](http://forum.ratpack.io/) for discussing Ratpack. The forum seems fairly active and I was able to find some very helpful information there.

### Final Thoughts
I found Ratpack to be an enjoyable framework to work with. If you don't mind referencing a few different sources of documentation (and probably a bit of trial and error), I would highly recommend checking it out.