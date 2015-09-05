---
layout: post.hbt
title: "File Uploads with AngularJS and Ratpack: Part 2"
date: 2014-09-17 21:25:18
comments: true
categories: 
---
This is a continuation of [this post](/blog/2014/09/16/file-uploads-with-angularjs-and-ratpack-part-1), where I described the Ratpack back end for our file upload application. If you're only interested in the Angular stuff, please keep reading, but otherwise I'd recommend you take a look at part 1 of the series.

<!-- more -->

Before I begin, I just want to offer a big thank you to Jenny Louthan, whose [blog post](http://uncorkedstudios.com/blog/multipartformdata-file-upload-with-angularjs) is where I learned how to do file uploads with Angular. Both the directive and file upload service method described in this article are _very_ slightly modified versions of the ones in her blog post.

## The Application

Here's a quick recap for those of you who chose to skip part 1:

The end result of this series is a simple image upload application. The Angular powered front-end will send images to Ratpack, where they'll be written to disk along with thumbnails. The full project code can be found [here](https://github.com/s992/angular-ratpack-upload). This is what the final application will look like:

<a href="/assets/images/angular-ratpack-upload/scrn1.png" target="_blank"><img src="/assets/images/angular-ratpack-upload/scrn1.png"></a>

It's not pretty, but if you're looking for an article on design, you've come to the wrong place! :)

## AngularJS

Our Angular app will be extremely simple by Angular standards - just a single view and nothing too fancy happening outside of the file upload stuff. One important thing to note is that we'll be using the [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object, which only has IE support in IE10+. It works fine in Chrome and Firefox. If you need support for an earlier IE version, there are a number of directives that make use of a hidden iframe to support file uploads.

### Project Structure

The application will live inside of the assets folder we declared in part one of this series: `/src/ratpack/public`. I've broken the Angular code up so that we have a single file for each controller, service, and directive we'll be using. This is my standard project structure, but it certainly isn't the only way and probably isn't even the "right" way.

```
/src/ratpack/public/js/app.js
/src/ratpack/public/js/controllers/upload.js
/src/ratpack/public/js/directives/fileModel.js
/src/ratpack/public/js/services/imageService.js

/src/ratpack/public/index.html
```

### index.html

The first thing we need to do with this application is add the `ng-app` and `ng-controller` directives to the HTML. In an application with multiple views, you'd likely use `$routeProvider` to configure your controller, but that's not necessary here.

``` html
<!DOCTYPE html>
<html lang="en" ng-app="uploader">
<head>
	<title>AngularJS File Upload with Ratpack</title>
</head>
<body ng-controller="UploadCtrl">
	
	<h1>File Uploader</h1>

</body>
</html>
```

Within our page, we need three things: a container for possible errors, the upload form itself, and the image grid. The error container is quick and easy - just a div that we'll display if `$scope.error` contains a message for us.

``` html
<div ng-show="error.length">
	<p>{{ error }}</p>
</div>
```

Following that is the upload form. We use the `ng-disabled` attribute to disable both the input and the submit button while we're waiting for a response from the back end. In this case, we just use a boolean value sitting on $scope that we'll toggle within the controller. We'll use that same flag to indicate that something is happening by setting the button text to either "Upload!" or "Uploading.." depending on whether we have an open request or not. Finally, we have a container that will be populated with a message when the upload has completed successfuly.

Make a mental note of the `file-model` attribute on the file input - we'll discuss that in the directives section.


``` html
<form>
	<input type="file" file-model="fileToUpload" ng-disabled="uploading">
	<button type="button" ng-click="uploadFile()" ng-disabled="uploading">
		<span ng-show="!uploading">Upload!</span>
		<span ng-show="uploading">Uploading..</span>
	</button>
	<span ng-show="flash.length">{{ flash }}</span>
</form>
```

Our image grid is comprised of image tags wrapped in anchor tags. Here, we're using `ng-repeat` to iterate over the list of image file names we received from the back end. Using the file names and the image path (which we also received from the back end), we build up a collection of thumbnails that link to the full size image.

There's one thing to point out here: when using a dynamic image source, you want to use the ng-src attribute rather than the standard src attribute. With a standard src attribute, the browser will make two HTTP requests. The first will come on initial page load and you will see a 404 because it's requesting the literal `{{ imagePath }}/thumb/{{ image }}`. The second will come once Angular has populated the HTML with the values of imagePath and image and then we'll get the actual image we need. By using ng-src, we won't see a request until Angular has resolved both imagePath and image.


``` html
<h1>{{ images.length }} Uploaded Images</h1>

<div class="images">
	<a ng-repeat="image in images" href="{{ imagePath }}/{{ image }}" target="_blank">
		<img ng-src="{{ imagePath }}/thumb/{{ image }}">
	</a>
</div>
```

Finally, let's make sure we include our JS files:

``` html
<script src="//ajax.googleapis.com/ajax/libs/angularjs/1.2.23/angular.min.js"></script>
<script src="js/app.js"></script>
<script src="js/controllers/upload.js"></script>
<script src="js/services/imageService.js"></script>
<script src="js/directives/fileModel.js"></script>
```

### app.js

This one is short and sweet. We'll just initialize the application (uploader) with its dependencies(uploader.controllers, uploader.directives, and uploader.services). I'm also going to initialize each of the dependencies here so that they are easy to reference down the road.

``` js
angular.module( "uploader", [
	"uploader.controllers",
	"uploader.directives",
	"uploader.services"
]);

angular.module( "uploader.controllers", [] );
angular.module( "uploader.directives", [] );
angular.module( "uploader.services", [] );
```

### UploadCtrl

We're using a single controller, UploadCtrl. We'll start off by defining the controller and its dependencies. The dependencies are defined both as annotations - `[ "$scope", "$timeout", "imageService" ]` - and as arguments to the controller method. 

The annotations are a necessity for Angular code that will be minified because Angular uses them to determine (and then inject) our controller's dependencies. Without the annotations, Angular infers the dependencies from the method's argument names, which will almost certainly be renamed during minification.

``` js
angular.module( "uploader.controllers" )

.controller( "UploadCtrl", [ "$scope", "$timeout", "imageService", 
	function( $scope, $timeout, imageService ) {
		// do controller stuff here
}])
```

Although Angular is generally pretty forgiving when it comes to undefined variables, I prefer to initialize my $scope variables right away.

``` js
$scope.images = [];
$scope.error = "";
$scope.flash = "";
$scope.uploading = false;
```

Next up, we have a handful of private (that is, var scoped and not accessible to the view) convenience methods that are used to manage the display of dynamic messages. This could certainly be done better, but it works for our purposes.

``` js
var setError = function( error ) {
	$scope.error = error || "";
	$scope.uploading = false;
};

var clearError = function() {
	setError("");
};

var flashMessage = function( message, duration ) {

	$scope.flash = message;

	$timeout(function() {
		$scope.flash = "";
	}, duration || 3000);

};
```

Now that our setup and private methods are out of the way, let's take a look at the first real action the controller will perform: requesting a list of images from the back end.

``` js
imageService.getImages().then(
	function( data ) {
		$scope.imagePath = data.imagePath;
		$scope.images = data.images;
	},
	setError
);
```

`imageService.getImages()` returns a promise provided by [$q](https://docs.angularjs.org/api/ng/service/$q). Once the promise has resolved, the first callback to the `then()` method will be executed. If the promise is rejected, which will happen if we receive an error from the back end, the second callback (`setError`) will be executed.

In our success callback, we're just taking the response from the back end and sticking it into $scope. If we currently have images in the image directory, our image grid will be populated.

Our failure callback simply passes the entirety of the error message to `setError()`, which ultimately results in the error being dumped out on the screen. This is not optimal because an unexpected exception will cause Ratpack to respond with an HTML error page, the source of which will get dumped into our error div. Not a good solution, but sufficient for our purposes - it's not like this thing is going into a production environment anyway (famous last words)!

Finally, we have the method that handles sending the file to imageService and ultimately to the server. This method will be called via ng-click when the user clicks on the "Upload!" button.

``` js
$scope.uploadFile = function() {

	clearError();
	$scope.uploading = true;

	imageService.uploadImage( $scope.fileToUpload ).then(
		function( data ) {
			$scope.images.push( data.fileName );
			$scope.uploading = false;
			flashMessage( "Success!" );
		},
		setError
	);

};
```

The first order of business in this method is to clear any existing error messages from the screen. If the user previously attempted to upload a PDF and is looking at an error message, we want to wipe it out while they are waiting for their valid (we hope) file to upload. Next, we'll set the uploading flag - this is what's used to trigger some disabled attributes on the form inputs as well as to change the button text to indicate that the upload is in progress.

Just like `imageService.getImages()`, `imageService.uploadImage()` returns a promise. When it resolves, we'll push the new file name onto the images array, set the uploading flag to false, and then use our `flashMessage()` method to briefly display the text, "Success!" Again, if it fails we are just passing the entirety of the error string (whatever that might be) along to `setError()`.

We're passing a single argument to `imageService.uploadImage()` - `$scope.fileToUpload`. This variable is populated by the fileModel directive, which we'll discuss in the fileModel section.

### imageService

Our imageService exposes two public methods: `getImages()` and `uploadImage( image )`. In addition to the public methods, there is a single private method, `promise( callback )`, that allows us to avoid duplicating a very small amount of code by creating a deferred, invoking the callback, and returning a promise. You'll notice that we use the same dependency annotation here that was used on our controller.

``` js
angular.module( "uploader.services" )

.service( "imageService", [ "$q", "$http", function( $q, $http ) {

	var promise = function( callback ) {

		var deferred = $q.defer();

		callback( deferred );

		return deferred.promise;

	};

	return {
		getImages: function() {
			// retrieves images
		},

		uploadImage: function( image ) {
			// sends an image
		}
	};
}]);
```

Both of our public methods utilize the `promise` method. The first, `getImages()`, is straightforward - we simply make an HTTP request to "image", our Ratpack endpoint at http://localhost:5050 that returns a list of images, and then either resolve or reject the promise based on the result of that request.

``` js
getImages: function() {
	return promise( function( deferred ) {

		$http.get( "image" )
			.success( function( data ) {
				deferred.resolve( data );
			})
			.error( function( error ) {
				deferred.reject( error );
			});

	});
}
```

The second, `uploadImage()`, makes use of the JavaScript [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object. FormData is the object that makes it possible for us to upload files directly via AJAX. The interface is simple enough: by calling FormData's `append()` method, we can attach key value pairs to the object and send them in the same format as a standard (non-AJAX) POST request.

``` js
uploadImage: function( image ) {
	return promise( function( deferred ) {

		var formData = new FormData();

		formData.append( "fileUpload", image );

		$http.post( "image/upload", formData, {
			transformRequest: angular.identity,
			headers: { "Content-Type": undefined }
		}).success( function( data ) {
			deferred.resolve( data );
		}).error( function( error ) {
			deferred.reject( error );
		});

	});
}
```

Once again, we're performing an HTTP request and resolving the promise with a successful result or rejecting it when it is unsuccessful. In this case, however, we're passing two additional arguments to the request method (`$http.post()`): formData, which we know is the form we want to send to the server, and a configuration object, which is needed to make sure Angular doesn't screw up our request.

We have to set two parameters to prevent Angular from getting in our way: `transformRequest` and `headers` (specifically, Content-Type). When Angular sends a POST request, it assumes the data we are POSTing is JSON. The default action of the transformRequest method is to convert the data to a JSON string. So, how do we override that? We could define transformRequest as an anonymous function that simply doesn't do anything other than send the data right back, but that's not necessary because Angular provides us with the [identity](https://docs.angularjs.org/api/ng/function/angular.identity) method, which simply returns its first argument.

Content-Type needs to be set to `undefined`, _not_ "multipart/form-data." If we set the content type to "multipart/form-data", the POSTed data will not have the correct boundaries and our request will fail. If we set it to `undefined`, the browser will fill in both the correct content type and the boundaries we need. I've seen reports of people using `false` instead of `undefined`, but I was unable to get that to work.

### fileModel

This directive is where the magic happens. Angular does not currently support binding to a file input, but the fileModel directive makes that possible. For a quick refresher of how we're using the directive, you can see the `file-model` attribute on the file input, which is what tells Angular to load up the directive and bind it to our DOM element.

``` html
<input type="file" file-model="fileToUpload" ng-disabled="uploading">
```

If you're not familiar with Angular directives, the gist of what you need to know is that the directive's link function is called once the element is ready to have its DOM manipulated or events bound to it. The link function receives three arguments: the scope that the element is bound to, the element itself, and the element's attributes. Attribute names with a dash (such as "file-upload") will be converted to camelcase.

``` js
angular.module( "uploader.directives" )

.directive( "fileModel", [ "$parse", function( $parse ) {
	return {
		restrict: "A",
		link: function( scope, element, attrs ) {

			var model = $parse( attrs.fileModel );

			element.bind( "change", function() {
				scope.$apply( function() {
					model.assign( scope, element[ 0 ].files[ 0 ] );
				});
			});

		}
	}
}]);
```

The first thing we need to do in the link function is to get a reference to our model which, in this case, is represented by the value of the `file-model` attribute on the input element. By using the [$parse](https://docs.angularjs.org/api/ng/service/$parse) service, we're making sure we can support dot paths. For example, if the file-model attribute was "files.images.image1," `$parse` will evaluate that as an expression and return the correct variable.

Once we have the model, we bind a change listener on our file input - standard jQuery stuff. When the change event is triggered, we update the model using `model.assign` and passing in the context (scope). This basically equates to `scope[ attrs.fileModel ] = value`, but this syntax is necessary due to the way we're retrieving the model with `$parse`. `scope.$apply()` is vital here because our model change is happening outside of Angular's digest cycle (basically, the loop that keeps all of our models in sync) and `scope.$apply()` lets Angular know that it needs to include this change the next time it performs the cycle.

## Run it!

Now that we've completed both halves of the application, we're ready to run it. This is accomplished by using the command prompt or terminal to navigate to the application's root directory and executing `gradle run`. If everything works correctly, you'll eventually see something like this:

```
:compileJava UP-TO-DATE
:compileGroovy UP-TO-DATE
:processResources UP-TO-DATE
:classes UP-TO-DATE
:configureRun
:prepareBaseDir UP-TO-DATE
:run
[main] INFO ratpack.server.internal.NettyRatpackServer - Ratpack started for http://localhost:5050
> Building 85% :run
```

Once it's up and running, we can point our browser to http://localhost:5050 and start uploading images!

## Conclusion

That wraps up part two of this two part series. You can find the full source of this project on Github at [https://github.com/s992/angular-ratpack-upload](https://github.com/s992/angular-ratpack-upload). If I did my job right, you probably now know more than you ever cared to about file uploads. :)

Thanks for reading!