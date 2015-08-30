---
layout: post.hbt
title: "Building a GitHub Activity Feed"
date: 2011-10-31 12:00:00
comments: true
categories: 
---
When I set out to come up with a cool design for my site, I wasn't really sure what I was shooting for. I just downloaded Twitter Bootstrap and went to work throwing DIVs around. I'm pretty happy with how it came out, but one part that I really like a lot is the GitHub feed you see in the right hand column. I haven't ever seen a site with one and there weren't any tutorials on how to make one, so I figured I'd jump right in.

<!-- more -->

From my GitHub profile, I could see that there was an easy way to pull an RSS feed of my Public Activity, so I figured I'd start there. Clicking the icon returns an Atom feed with a lot of (unnecessary, in my opinion) mark-up. The DOM for a single push looked like this:

``` html
<div base="https://github.com/s992.atom" class="feedEntryContent"><div class="details">
	<div class="commits">
		<ul>
			<li>
				<a class="committer" href="/s992">s992</a> committed <a href="/s992/tweet-this/commit/c96859cf3930d33ace3e23783d17a186af96dce0">c96859c</a>

				<div class="message">
					<blockquote>Allow for configuration of content types to Tweet from, updated readme accordingly.</blockquote>
				</div>
			</li>
		</ul>
	</div>
</div>
```

That's a lot of divs for a simple display that was going to be a pain in the ass to style. I was a little disappointed and the thought of trying to parse it with regex sounded miserable(on a related note, is there a decent DOM parser for CF?). I remembered that Twitter will give you your activity stream in different formats by specifying them in the URL, a la http://api.twitter.com/1/statuses/user_timeline.rss?screen_name=theseanwalsh. I decided to give it a shot and change the URL I was pinging to https://www.github.com/s992.json instead of s992.atom. Lo and behold, it worked! I had something to start with...

Reading over the JSON that was returned, it quickly became apparent that I was not going to be able to just take what GitHub gave me and loop over it unless I wanted a lot of logic in my view. Each "event" - Push, Pull, Fork, Follow, Watch, etc. - had a slightly different JSON structure. Well, I love writing cfscript and I love writing components, so I figured I'd try my hand at writing a component to parse the JSON into a more usable format.

For each item that I wanted to display, I knew I wanted to follow the same general format: [actor] did [action] to [target]. The date, URL, and repository description or commit message wouldn't hurt either. So, I got to work.

The first thing I needed to do was make the request to GitHub and turn that into some JSON:

```java
private array function makeHttpRequestAndReturnJSON() {
	var httpSvc = new http();
	var json = '';
	
	httpSvc.setUrl( variables.jsonURL );
	httpSvc.addParam( type='CGI', name='accept', value='text/json', encoded='no' );

	json = httpSvc.send().getPrefix().filecontent;
	json = deSerializeJSON( json );

	return json;
}
```

This code is pretty self explanatory. Once I had the JSON, I needed to mold it into something that I was ready to use in my view, so I wrote a method to loop over it and call some other methods depending on the type of event that GitHub said it was.

```java
private array function makeCleanJSON() {
	var rArray = arrayNew( 1 );
	//Don't worry about this, I just went overboard with getters and setters
	var json = getDirtyJSON();
	var i = 1;
	
	//Because of potential missing events, I have to keep an "actual count" of
	//items inserted into the struct so that my feed isn't shorter than I want
	//it to be.
	var actualCount = 1;
	
	for(i = 1; actualCount <= variables.itemLimit; i++) {
		//json[i].type contains the type of event for each item
		switch(json[i].type) {
			//Depending on the event, we'll call the correct method and pass it the item in question
			case "PushEvent":
				rArray[ actualCount ] = handlePushEvent( json[i] );
				actualCount++;
				break;
			case "WatchEvent":
				rArray[ actualCount ] = handleWatchEvent( json[i] );
				actualCount++;
				break;
			case "CreateEvent":
				rArray[ actualCount ] = handleCreateEvent( json[i] );
				actualCount++;
				break;
			case "ForkEvent":
				rArray[ actualCount ] = handleForkEvent( json[i] );
				actualCount++;
				break;
			case "FollowEvent":
				rArray[ actualCount ] = handleFollowEvent( json[i] );
				actualCount++;
				break;
			default:
				break;
		}
		
	}

	return rArray;
}
```

I played around with the idea of dynamically making the method calls(and getting rid of that ugly switch/case block) by using evaluate, but I don't have a comprehensive list of the potential events - meaning that if GitHub tosses me an event that I haven't written a method for, I'll get a big ugly CF error due to a missing method. If anyone can suggest a better way to do this, I'm all ears! You'll also see that I keep two counters - one for the loop through the JSON and another that counts how many items I've actually put into my returned array. The reason for this is that if I hit an event that I haven't accounted for, I will end up with a struct that is missing some keys.

Each method called is pretty similar(and you can check out the full CFC by hitting the download link at the bottom of the post), so I'll just give an example of one of them - handlePushEvent:

```java
private struct function handlePushEvent( required struct event ) {
	//My cleverly named return struct
	var rStruct = structNew();
	//We'll need the branch and the repository to build the target string
	var branch = listGetAt( arguments.event.payload.ref, 3, "/" );
	var repository = event.repository.owner & "/" & event.repository.name;
	var target = '';
	
	//For my site, I didn't want to include the branch in push events because
	//the string was too long, so I wrote in a little option that can be set
	//to keep it short
	if(variables.targetType EQ "short") {
		target = repository;
	} else {
		target = branch & " at " & repository;
	}
	
	//I use the event field to style the li in the view
	structInsert( rStruct, "event", "push" );
	structInsert( rStruct, "url", arguments.event.url );
	//GitHub's date format is 2011/09/01 19:38:47, which CF didn't want to work with,
	//so I'm going to pass it on to another method to format it.
	structInsert( rStruct, "date", formatGitHubDateString( arguments.event.created_at ) );
	structInsert( rStruct, "actor", arguments.event.actor );
	structInsert( rStruct, "action", "pushed to" );
	structInsert( rStruct, "target", target );
	
	if(arraylen( arguments.event.payload.shas ) GT 1) {
		structInsert( rStruct, "description", 
	               buildArrayForMultipleCommits( arguments.event.payload.shas ) );
	} else {
		structInsert( rStruct, "description", arguments.event.payload.shas[1][3] );
	}

	return rStruct;
}
```

If you're still paying attention, you'll notice that I make a call to buildArrayForMultipleCommits() in there. The reason for this is that GitHub passes all commits for a specific event in an array. There is a lot of stuff in there I don't care about, like the SHA, the author e-mail, and the author name - all I care about is the commit message right now. So, I just loop over the array and return an array that only has the commit messages:

```java
private array function buildArrayForMultipleCommits( required array commits ) {
	var rArray = arrayNew( 1 );
	var i = 1;
	
	for(i = 1; i <= arraylen( arguments.commits ); i++) {
		rArray[i] = arguments.commits[i][3];
	}

	return rArray;
}
```

Alright, we're ready to go! Now all I have to do in my view is grab the "clean" JSON and loop over it, formatting it how I want it:

```html
<ul class="feed" >
	<cfset myJSON = new GitHubJSONParser( 'https://github.com/s992.json' ).getCleanJSON() />
	<cfloop from="1" to="#arrayLen(myJSON)#" index="i">
		<li class="feedItem #myJSON[i].event#" >
			<a href="#myJSON[i].url#" class="updateLink" >
				#myJSON[i].actor# 
				#myJSON[i].action# 
				#myJSON[i].target#
			</a>
			<p class="updateMessage" >
				<cfif isArray( myJSON[i].description ) >
					Multiple commits:
					<ul class="commits" >
						<cfloop array="#myJSON[i].description#" index="commit" >
							<li>
								#commit#
							</li>
						</cfloop>
					</ul>
				<cfelse>
				#myJSON[i].description#
			</cfif>
		</p>
		<div class="lastUpdated" >
			#myJSON[i].date#
		</div>
	    </li>
    </cfloop>
</ul>
```

I've uploaded the CFC as well as my Mura display object to GitHub, so please feel free to check it out and give me some feedback! You can find it at https://github.com/s992/github-feed-widget