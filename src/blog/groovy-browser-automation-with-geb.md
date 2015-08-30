---
layout: post.hbt
title: "Groovy Browser Automation with Geb"
date: 2014-06-25 18:06:22
comments: true
categories: 
---
As I was going over my tentative itinerary for [GR8Conf](http://gr8conf.us) (my first Groovy conference!), I spotted a session titled, "Functional testing your Grails app with GEB." The session, given by [Colin Harrington](https://twitter.com/ColinHarrington), will be covering "...what it takes to test your grails application with Geb." According to the [Geb website](http://www.gebish.org/), Geb (pronounced "jeb") is a browser automation solution for Groovy. I've always been curious about browser automation, and Geb's easy-to-read syntax really piqued my interest. I decided to dive in to the documentation - [The Book of Geb](http://www.gebish.org/manual/current/) - and see if I could take some of their examples and translate them over to my site.

<!-- more -->

I'm running each of these scripts in the GroovyConsole with Groovy version 2.3.3. Unless otherwise noted, you can assume the code samples here are prepended with this `@Grab` from the [installation and usage](http://www.gebish.org/manual/current/intro.html#installation__usage) section of the docs:

``` groovy
@Grapes([
	@Grab("org.gebish:geb-core:0.9.3"),
	@Grab("org.seleniumhq.selenium:selenium-firefox-driver:2.41.0"),
	@Grab("org.seleniumhq.selenium:selenium-support:2.41.0")
])
```

This first script is just basic Geb - it navigates to my home page and then clicks through to the other two pages on my site - Archives and About - and verifies that we're navigating to where we think we're navigating to.

``` groovy
import geb.Browser

Browser.drive {

	// navigate to my site
	go "http://swalsh.org"

	// make sure we made it to my site
	assert title == "Sean Walsh"

	// grab the "Archives" link...
	def archivesLink = $("ul.main-navigation").find("li", 1).find("a")

	// ...and then click it
	archivesLink.click()

	// did we make it?
	assert title == "Blog Archive - Sean Walsh"

	// grab the "About" link...and click it
	def aboutLink = $("a", href:"http://swalsh.org/about").click()

	// success!
	assert title == "About - Sean Walsh"

}
```

When I kick off the script, it takes about five seconds to run through my site - the delay is due to Geb waiting for each page to load before moving on to the next action.

So, that was pretty cool, but it really only scratched the surface of what we can do. Geb also allows us to model our pages and even fragments of those pages (via the `Page` and `Module` objects, respectively). First, I decided to model out a navigation link and and the navigation bar as modules. These modules can be included into page objects and other modules. Additionally, you can define parameters - such as `linkText` in `NavigationLink` - that will be populated when the module is included. Finally (at least for this example), the module's properties are defined in the content DSL. You'll see how these properties are used in a later example.

```groovy
class NavigationLink extends Module {

	def linkText

	static content = {
		link { $("a", text: linkText) }
	}

}

class NavigationBar extends Module {

	static content = {
		homeLink { module NavigationLink, linkText: "Home" }
		archiveLink { module NavigationLink, linkText: "Archives" }
		aboutLink { module NavigationLink, linkText: "About" }
	}

}
```

Now that we've got our navigation modeled, we can move on to modeling out the pages. I have a parent class, `SwalshPage`, that includes the `NavigationBar` module as `navBar` so that I can extend `SwalshPage` from each of my pages and I don't have to include the navigation bar module in each of them (yay inheritance!). In each of the actual pages, I've added a `url` and a static `at` method for making sure we've navigated to where we want to go.

```groovy
class SwalshPage extends Page {

	static content = {
		navBar { module NavigationBar }
	}

}

class HomePage extends SwalshPage {

	static url = "http://swalsh.org"
	static at = { title == "Sean Walsh" }

}

class ArchivesPage extends SwalshPage {

	static url = "http://swalsh.org/archives"
	static at = { title == "Blog Archive - Sean Walsh" }

}

class AboutPage extends SwalshPage {

	static url = "http://swalsh.org/about"
	static at = { title == "About - Sean Walsh" }

}
```

Finally, we can kick off the actual test. This code will move us to the home page and then click through to both the blog archives and the about page, stopping just long enough to verify we're in the correct location:

```groovy
Browser.drive {

	to HomePage
	assert at( HomePage )

	navBar.archiveLink.link.click()
	assert at( ArchivesPage )

	navBar.aboutLink.link.click()
	assert at( AboutPage )

}
```

You can find the full code for the last three blocks on [this gist](https://gist.github.com/s992/a935c39fa2c600cee740).

As I said before, we're only just barely scratching the surface of the functionality available in Geb. The documentation has 18 chapters, and this code has only touched on the features described in the chapter 1.4 examples. I don't know if the rest of Geb is as easy and intuitive as the (very simple) examples I've provided, but I will definitely be heading to Colin's session at GR8Conf to find out!