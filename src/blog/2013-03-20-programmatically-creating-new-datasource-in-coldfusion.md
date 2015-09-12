---
layout: post.hbt
title: "Programmatically Creating New Datasource in Coldfusion"
date: 2013-03-20 14:23:15
comments: true
categories: 
---
I got a new laptop at work. Awesome, right? This thing is blazing fast and a huge upgrade. Unfortunately, I needed to set up my entire local development environment all over again. I managed it with some quick and dirty batch scripts, but I was still left with the tedious task of creating datasources for each of the 40ish MySQL databases that I had imported. Each datasource entry is identical except for the database name, so I figured there must be a better way of doing it than manually creating each entry. Sure enough, there is...

<!-- more -->

The ColdFusion administrator offers a pretty nice [API](http://help.adobe.com/en_US/ColdFusion/9.0/Admin/WSc3ff6d0ea77859461172e0811cbf364104-7fcf.html) that you can interact with to do things such as create mappings, manage debug settings, and a plethora of other stuff. Of course, you can also create datasources with it and it is dead simple to do. For my method to work, you do have to have at least one existing datasource, but I'm sure you could just create that programmatically as well.

The code below uses the SHOW DATABASES command to get a list of all MySQL databases, and then creates a datasource for each. It will create datasources for stuff like information_schema and performance_schema, so you will have to manually delete those if you don't want them.

<script src="https://gist.github.com/2141097.js"> </script>

This isn't really something that I'll be using all that frequently, but I figured I'd share it in case anyone else wanted to save themselves half an hour of setting up datasources.