---
layout: post.hbt
title: "Running the Groovy Console from Gradle"
date: 2014-07-17 19:47:43
comments: true
categories: 
---
I tend to write stuff iteratively. I'll write a little chunk, then poke at it a bit, then write some more, and so on. The Groovy Console is a great tool for doing so, but one thing that just hasn't "clicked" with me yet is the concept of dependencies, classpaths, and all the dependency management stuff in between (Maven, Gradle, Ivy, etc.). 

I quickly found myself frustrated with my lack of understanding, so I got in to the bad habit of just pasting all my classes right into the Groovy Console window and playing around with them right there. As my toy projects grew larger (and especially once they started relying on external dependencies), this became unworkable. 

I did some poking around and found three ways to run the Groovy Console from Gradle, which (as far as I can tell) populates the Groovy Console classpath with everything I need for my project.

<!-- more -->

The first option I found is a quick snippet from [Mike Hugo's blog](http://piraguaconsulting.blogspot.com/2012/02/gradle-groovy-console.html):

``` groovy
task( console, dependsOn: "classes", type: JavaExec ) {
	main = "groovy.ui.Console"
	classpath = sourceSets.main.runtimeClasspath
}
```

This works great and can just be dropped in to your `build.gradle`, like this:

``` groovy
apply plugin: "groovy"

task( console, dependsOn: "classes", type: JavaExec ) {
	main = "groovy.ui.Console"
	classpath = sourceSets.main.runtimeClasspath
}

repositories {
	mavenCentral()
}

dependencies {
	compile 'org.codehaus.groovy:groovy-all:2.3.4'
}
```

You can just run `gradle console` from the project root to fire up the Groovy Console.

I didn't have to look far for the next option - it was right in the comments on Mike's blog! Inspired by the post, Carlos Souza created a [Gradle plugin](https://github.com/carlosgsouza/gradle-console) to add the `console` task to your project:

``` groovy
apply plugin: "groovy"
apply plugin: "console"

repositories {
	mavenCentral()
}

dependencies {
	compile 'org.codehaus.groovy:groovy-all:2.3.3'
}

buildscript {

	repositories {
		mavenCentral()
	}

	dependencies {
		classpath "net.carlosgsouza:gradle-console:1.0"
	}

}
```

This plugin works the same way as Mike's does, but I did run into a bit of an issue. If you've been reading (very) closely, you'll notice that in this version of my build script I dropped the version of my Groovy dependency from 2.3.4 to 2.3.3. When running `gradle console` with 2.3.4, I received this exception:

`Conflicting module versions. Module groovy-all is loaded in version 2.3.3 and you are trying to load version 2.3.4`

I couldn't find much info on the error, but, as far as I can tell, I probably have multiple versions of Groovy in my classpath. I do have both 2.3.3 and 2.3.4 on my system, so I'll just chalk it up to poor configuration on my part.

The final option is the [application plugin](http://www.gradle.org/docs/current/userguide/application_plugin.html). By applying the plugin and setting `mainClassName = "groovy.ui.Console"`, we can use `gradle run` to launch the Groovy Console.

``` groovy
apply plugin: "groovy"
apply plugin: "application"

mainClassName = "groovy.ui.Console"

repositories {
	mavenCentral()
}

dependencies {
	compile 'org.codehaus.groovy:groovy-all:2.3.4'
}
```

Each option seems to work just as well as the others, but I prefer the application plugin simply because it requires fewer lines than the other two.