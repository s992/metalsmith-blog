---
layout: post.hbt
title: "File Uploads with AngularJS and Ratpack: Part 1"
date: 2014-09-16 18:22:39
comments: true
categories: 
---
Before I start this blog post, I just want to give a shout out to the [Ratpack forum](http://forum.ratpack.io/) and especially the users that contribute to the forum. When I finished my code for this post, I [posted](http://forum.ratpack.io/AngularJS-Ratpack-File-Upload-td655.html) it to the forum in hopes of receiving some criticism so that I could tweak it before writing an article about. At most, I expected a comment or two along the lines of, "Yah, XYZ is OK but you could maybe try it this way instead." In other words, helpful but not _too_ helpful. 

The next day, [Luke Daley](https://twitter.com/ldaley) had forked my project (his fork is [here](https://github.com/alkemist/angular-ratpack-upload)) and made some major improvements. He was also available to answer a few questions I had about his changes. I already thanked him profusely on the forum, but I just wanted to offer my thanks again - it's communities like this that make me really enjoy working with new (to me) technology. So, without further ado, let's get into it..

<!-- more -->

_This article is running a lot longer than I expected it to, so I'm going to break it into two parts. The first (this one) will be about the Ratpack application and the second will describe the AngularJS side of things. You can find the Angular portion of this series [here](/blog/2014/09/17/file-uploads-with-angularjs-and-ratpack-part-2)._

## The Application

The end result of this series is a simple image upload application. The Angular powered front-end will send images to Ratpack, where they'll be written to disk along with thumbnails. The full project code can be found [here](https://github.com/s992/angular-ratpack-upload). This is what the final application will look like:

<a href="assets/images/angular-ratpack-upload/scrn1.png" target="_blank"><img src="assets/images/angular-ratpack-upload/scrn1.png"></a>

It's not pretty, but if you're looking for an article on design, you've come to the wrong place! :)

## Ratpack

We'll start with the server side and move on to the Angular stuff once our API is ready to go. Our Ratpack app is going to be very simple: we'll serve up the Angular app via a simple `index.html` and provide two endpoints for Angular to interact with:

* `GET /image` to retrieve a list of uploaded images
* `POST /image/upload` to upload an image

### Project Structure

Our project structure is standard for a Gradle Ratpack app. Within the `src` directory, we have two directories: `main` and `ratpack`. `main` has plenty of subdirectories, but only one actual file - our service for processing the uploaded images. In `ratpack/public`, we have everything we need for the Angular app. And finally, in the root of `ratpack`, we have our `Ratpack.groovy` and `ratpack.properties` files.

```
/src/main/groovy/org/swalsh/image/ImageService.groovy

/src/ratpack/public/css
/src/ratpack/public/js
/src/ratpack/public/index.html

/src/ratpack/Ratpack.groovy
/src/ratpack/ratpack.properties

build.gradle
```

### build.gradle

The `build.gradle` script is pretty standard in this project, so I'm not going to go through it step by step. You can [click here](https://github.com/s992/angular-ratpack-upload/blob/master/build.gradle) to view the file in its entirety.

The only important dependencies that we're pulling in (aside from the standard Ratpack stuff) are Ratpack's Jackson module and the [imgscalr](http://www.thebuzzmedia.com/software/imgscalr-java-image-scaling-library/) library. The former is used for working with JSON, while the latter will be used to create thumbnail versions of the uploaded images. These are included in the build script like this:

``` groovy
dependencies {
	compile ratpack.dependency("jackson")
	compile "org.imgscalr:imgscalr-lib:4.2"
}
```

### ratpack.properties

Just a one liner here:

``` groovy
maxContentLength = 5000000
```

As far as I can tell, Netty's default maximum content length - that is, the amount of data we can send in a request - is 1,048,576 bytes. This would limit us to just about 1 MB file sizes for image uploads. By changing this setting, we're bumping the maximum content length to about 5 MB, allowing us to send some bigger photos along.

### Ratpack.groovy

Finally, some actual code! We'll start off with some basic imports.

``` groovy
import org.swalsh.image.ImageService
import ratpack.form.Form
import ratpack.jackson.JacksonModule

import static ratpack.groovy.Groovy.ratpack
import static ratpack.jackson.Jackson.json
```

Here's the rundown on what each import is for:

* The ImageService class is used for both processing the uploaded images as well as providing a list of currently available images. 
* Form is used by Ratpack to (you guessed it!) parse incoming form data. 
* JacksonModule and Jackson.json will be used to render JSON for the client.
* Finally, ratpack.groovy.Groovy.ratpack is required for us to actually build the app.

Next up, we have some variables that will be used throughout our handlers to tell ImageService where to put uploaded files and to tell Angular where it can find the files. I'm not exactly excited about storing these config options here, but for the purposes of this project, it works.

``` groovy
def assetsPath = "public"
def imageDirName = "uploaded-files"
def imagePath = "$assetsPath/$imageDirName"
def thumbPath = "$imagePath/thumb"
```

One important thing to note about these folder paths is that they are _relative to Ratpack.groovy_. Our full path to the uploaded-files directory is `/src/ratpack/public/uploaded-files`, but we only need to specify `/public/uploaded-files`.

Now that the boring stuff is out of the way, we can move on to the fun stuff - Ratpack's Groovy DSL. Our app is kicked off via the `ratpack` method, with the app itself being defined within the closure:

``` groovy
ratpack {
	// stuff!
}
```

Within the `ratpack` closure, we first need to tell Guice (the DI framework) about the modules and bindings we're going to be using. In this case, we only need to add one module. The ImageService class will also be managed by Guice, but it does not have its own module - that will be explained a little bit later in the article.

``` groovy
bindings {
	add new JacksonModule()
}
```

In addition to the module binding, we can include an `init` closure to execute action(s) once the injector has been finalized ([source](http://forum.ratpack.io/What-does-init-do-in-modules-tp577p578.html)). Basically, the `init` block will only run a single time once the application has started. In this case, we're going to use it to create our upload directory if it doesn't already exist.

``` groovy
bindings {
	add new JacksonModule()

	init {
		launchConfig.baseDir.file( thumbPath ).toFile().mkdirs()
	}
}
```

[LaunchConfig](http://www.ratpack.io/manual/current/api/ratpack/launch/LaunchConfig.html) has a lot of useful information about our application, and here we're using it to grab the base directory.

Ratpack's `handlers` closure allows us to quickly and concisely define our available endpoints. We'll scaffold out our application like this:

``` groovy
handlers {
	assets assetsPath, "index.html"

	prefix("image") {
		get {
			// do stuff!
		}
		post("upload") {
			// do other stuff!
		}
	}
}
```

We're now serving up our assets directory, complete with an index file, and our two API endpoints.

The `assets` method tells Ratpack to servce static assets from the assetsPath (defined as `"public"`) and to serve the index.html file as the index for that directory. Put simply, it lets us navigate to http://localhost:5050 (or wherever you're hosting) and have index.html delivered right to us.

Our endpoints are configured using the `prefix` closure, which allows us to nest handlers that should be prefixed by whatever we've defined as the prefix. Our prefix is "image," so every handler defined inside the closure will be accessed via `http://localhost:5050/image/`, followed by the handler's path. 

The first handler within the prefix closure is a `get` handler. With no path defined, the URL for this endpoint will be http://localhost:5050/image. The endpoint will only respond to GET requests - anything else will result in Ratpack returning a 405 (Method Not Allowed) status. Later, we'll populate this handler with a call to ImageService to grab a list of all the uploaded images and send them to the client.

The second handler is a `post` handler with a path defined. It functions similarly to the `get` handler, except it will only accept POST requests. Additionally, because we defined a path ("upload"), the endpoint will be http://localhost:5050/image/upload. We'll use this handler to send the uploaded image to ImageService for processing.

So, how do we get access to ImageService within our handlers? If you remember from earlier in the post, we don't have a module for it so we were unable to add it in the bindings closure. We could always just new it up, but that's not necessary - the `prefix` handler uses Guice's just-in-time bindings, which means that injecting the service is as simple as declaring it as an argument to the closure.

``` groovy
prefix("image") { ImageService imageService ->
	// handlers and stuff
}
```

One caveat to the JIT bindings is that they are only availabe on the `prefix` handler ([source](http://forum.ratpack.io/AngularJS-Ratpack-File-Upload-tp655p659.html)) - you won't be able to use them on any of the other handlers such as `get` or `post`.

Before we start filling out our handlers, we need to grab a reference to the image and thumbnail directories because we'll be passing them in to ImageService.

``` groovy
prefix("image") { ImageService imageService ->
	def baseDir = launchConfig.baseDir
	def imageDir = baseDir.file( imagePath ).toFile()
	def thumbDir = baseDir.file( thumbPath ).toFile()

	get {
		// do stuff!
	}

	post("upload") {
		// do other stuff!
	}
}
```

The `get` handler is nice and easy - we'll just make a call to `getUploadedImages`, which returns a promise. Once the promise is resolved, we'll receive a list of image filenames. We'll use the Ratpack `context.render` method to send the list of filenames and the location of the files back to the client.

Promises are important to Ratpack because it's [designed to function asynchronously](http://www.ratpack.io/manual/current/async.html#asynchronous__non_blocking). By wrapping our blocking code - such as file or database operations - in a promise, we can take advantage of the performance gains inherent to Ratpack's asynchronous design.

``` groovy
get {
	imageService.getUploadedImages( imageDir ).then {
		render json( imagePath: imageDirName, images: it )
	}
}
```

The JSON generated by the `get` handler will look something like this:

``` json
{
	"imagePath": "uploaded-files",
	"images": [
		"image1.png",
		"image2.png",
		"image3.png"
	]
}
```

Our `post` handler will use the `context.parse` method to read the incoming POST request into a [Form](http://www.ratpack.io/manual/current/api/ratpack/form/Form.html). The Form class is basically a map with a handful of convenience methods for working with uploaded files. Once we've parsed the form, we can use `form.file( formFieldName )` to grab a reference to the uploaded file (represented as an [UploadedFile](http://www.ratpack.io/manual/current/api/ratpack/form/UploadedFile.html)).

``` groovy
post("upload") {
	def form = parse Form
	def uploaded = form.file( "fileUpload" )
}
```

Once we've got the file, we need to verify that the file being uploaded is an image and, if it is an image, process it, and if not, return an error to the client.

``` groovy
post("upload") {
	def form = parse Form
	def uploaded = form.file( "fileUpload" )

	if( imageService.isImageFile( uploaded ) ) {
		imageService.process( uploaded, imageDir, thumbDir ).then {
			render json( fileName: it.name )
		}
	} else {
		response.status(400).send "Invalid file type. Images only!"
	}
}
```

And with that, our Ratpack configuration is complete. You can view Ratpack.groovy in its entirety [here](https://github.com/s992/angular-ratpack-upload/blob/master/src/ratpack/Ratpack.groovy).

### ImageService.groovy

ImageService only has a handful of methods, so we'll just run through them quickly. As always, you can view the entire file [here](https://github.com/s992/angular-ratpack-upload/blob/master/src/main/groovy/org/swalsh/image/ImageService.groovy).

First up is the constructor, which is annotated with `@Inject` and expecting a single argument: an instance of [ExecControl](http://www.ratpack.io/manual/current/api/ratpack/exec/ExecControl.html) that will be injected by Guice. ExecControl is what gives us the ability to use Ratpack's promises.

``` groovy
@Inject
ImageService( ExecControl execControl ) {
	this.execControl = execControl
}
```

There are also a few convenience methods that probably don't require an explanation. I suppose there are two things to note here:

1. The [UploadedFile](http://www.ratpack.io/manual/current/api/ratpack/form/UploadedFile.html) class provides us with easy access to the content type (e.g. "image/jpeg") which makes it very easy to do a simple type check.
2. UploadedFile (via [TypedData](http://www.ratpack.io/manual/current/api/ratpack/http/TypedData.html)) provides a few ways for us to access the file contents: as raw data in a [ByteBuf](http://netty.io/4.0/api/io/netty/buffer/ByteBuf.html?is-external=true), as raw data as bytes (`byte[]`), or as an InputStream. In this case, we're using the input stream to read the file into a BufferedImage.

``` groovy
Boolean isImageFile( UploadedFile file ) {
	file.contentType.type.contains( "image" )
}

String getUniqueFileName( String extension ) {
	"${randomUUID()}.$extension"
}

BufferedImage readImage( UploadedFile file ) {
	ImageIO.read( file.inputStream )
}
```

Next up, we'll use ExecControl to wrap a blocking interaction with a promise in `getUploadedImages`. This method returns a list of all the file names found in the application's image directory. As an aside, Groovy is freakin' awesome: look at that one liner to get the list. The code to retrieve the list was five lines long before Luke got his hands on it, and I can't complain.

``` groovy
Promise<List<String>> getUploadedImages( File imageDirectory ) {

	execControl.blocking {
		imageDirectory.listFiles( { it.isFile() } as FileFilter ).sort { it.lastModified() }*.name
	}

}
```

Processing the image consists of grabbing a unique file name and then saving off both the full size image and the thumbnail. Once again, we're utilizing promises.

``` groovy
Promise<File> process( UploadedFile file, File imageDirectory, File thumbDirectory ) {

	String fileName = getUniqueFileName( "png" )
	BufferedImage image = readImage( file )

	execControl.blocking {
		saveThumb( image, fileName, thumbDirectory )
		saveImage( image, fileName, imageDirectory )
	}

}
```

The actual saving is pretty boring - we just use ImageIO to write the image file to disk. In the case of the thumbnail, we use imgscalr to resize it by setting the height to 100 pixels and then turn around and call `saveImage()` with the thumbnail.

``` groovy
File saveImage( BufferedImage image, String fileName, File directory ) {

	File file = new File( directory, fileName )
	ImageIO.write( image, "png", file )

	file

}

File saveThumb( BufferedImage image, String fileName, File directory ) {

	BufferedImage thumb = Scalr.resize( image, Mode.FIT_TO_HEIGHT, 100 )
	saveImage( thumb, fileName, directory )

}
```

## Conclusion

That concludes the Ratpack/Groovy portion of our application. I'll describe the AngularJS app in part two, [here](/blog/2014/09/17/file-uploads-with-angularjs-and-ratpack-part-2). As always, please feel free to leave your comments and criticisms below!