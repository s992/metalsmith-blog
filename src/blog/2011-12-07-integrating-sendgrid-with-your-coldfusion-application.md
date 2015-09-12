---
layout: post.hbt
title: "Integrating SendGrid With Your ColdFusion Application"
date: 2011-12-07 14:23:33
comments: true
categories: 
---
The majority of my day today was spent evaluating [SendGrid](http://sendgrid.com/) and fiddling around with the API. For those of you unfamiliar with SendGrid, it's a hosted e-mail delivery service. At the very (very!) basic level, they provide a mailserver that you can use for your application. Of course, it's much more than that - the reason I was looking into it today is because we need a solid e-mail provider for e-mail newsletters for our clients. Currently, we are using an incredibly outdated version of Lyris List Manager and it's right about time that we replace it. Now, SendGrid doesn't provide any list management, that will have to be done in the application. What I'm about to show you is how to interface with SendGrid to send (potentially) copious amounts of e-mail very, very easily.

<!-- more -->

### Getting Started

Your first step is to sign up for an account. Luckily for us, SendGrid offers a free plan that allows you to send up to 200 e-mails per day - perfect for our testing environment! You can find the sign-up link at the very bottom of their [product pricing page](http://sendgrid.com/pricing.html). Once you sign up, it will take a few minutes before they get you up and running because they apparently verify each account by hand. I'm not sure if this is actually true, but that's what they say.

Once you're set up, you can start using their service right away if you want. Just plug the SMTP settings into your mail client or CF application and you'll be eating away at those precious 200-daily e-mails. But we want to do something more interesting...

### The Fun Stuff

SendGrid will allow you to send mail in three ways - normal SMTP, the Web API, and the SMTP API. We're going to be using the Web API for this demonstration, but the SMTP API is very, very similar.

X-SMTPAPI is where the real fun stuff comes into play. It's a JSON-encoded associative array that is inserted as a custom header in the SMTP API and as a URL parameter in the Web API. The array can contain any of the following keys(pulled from the [documentation](http://docs.sendgrid.com/documentation/api/smtp-api/developers-guide/)):

 - "to" - An address or list of addresses for the message to be sent to.
 - "sub" - An associative array of substitution tags, where each tag is associated with a list of replacement text for the tag in the body text. Each Substitution value corresponds to an email in the “To” section of the JSON string. Yah, it's mail merge.
 - "section" - Sections can be used to simplify substitution values that are common to many recipients. This is an associative array of sections that can be used in substitution values.
 - "category" - Associates the category of email this should be logged as. You may insert up to 10 categories as an array, these categories are not predefined.
 - "unique_args" - An associative array of arguments and their values to be applied to all emails sent in this SMTP API transaction.
 - "filter" - An associative array of filters and their settings, used to override filter settings already setup for your account. Settings are an associative array of the setting names and their values.

SendGrid offers a few examples of code to build this JSON string in Perl, PHP, Python, and Ruby. I'm most familiar with PHP, so I went ahead and grabbed the [PHP version](http://docs.sendgrid.com/documentation/api/smtp-api/php-example/) and started converting it. I ended up with the following code, which works fine in my testing but has not yet been tested in a production setting - so use it at your own risk!

<script src="https://gist.github.com/1445942.js?file=smtpApiHeader.cfc"></script>

Now that we have the hard stuff out of the way, I'm going to put together a simple form and processing page that will take a comma delimited list of e-mail addresses and a comma delimited list of user names and then send out a batch e-mail via SendGrid's Web API.

<script src="https://gist.github.com/1445942.js?file=index.cfm"></script>

Yah, it's an ugly form but it gets what we need. So, onward! Time to process the data from this form, translate it into a JSON string, and then ship it off to SendGrid.

<script src="https://gist.github.com/1445942.js?file=process.cfm"></script>

As you can see, this is a really simple process and I've only just begun to scratch the surface.

Once again - I need to stress that none of this has been tested in production, so use my code at your own risk! You can grab the full source on my Gist at https://gist.github.com/1445942