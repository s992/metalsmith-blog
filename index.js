require("harmonize")();

var metalsmith = require("metalsmith"),
	markdown = require("metalsmith-markdown"),
	layouts = require("metalsmith-layouts"),
	collections = require("metalsmith-collections"),
	branch = require("metalsmith-branch")
	permalinks = require("metalsmith-permalinks"),
	sass = require("metalsmith-sass"),
	copyAssets = require("metalsmith-copy-assets"),
	excerpts = require("metalsmith-better-excerpts"),
	pagination = require("metalsmith-pagination"),
	metallic = require("metalsmith-metallic"),
	minify = require("metalsmith-html-minifier"),
	uncss = require("metalsmith-uncss"),
	argv = require("yargs").argv,
	moment = require("moment"),
	handlebars = require("handlebars");

var PROD = argv.env && argv.env === "prod";

var metadata = {
	site: {
		title: "Sean Walsh",
		author: "Sean Walsh",
		url: PROD ? "http://swalsh.org" : "",
		social: {
			github: "https://github.com/s992",
			twitter: "https://twitter.com/theseanwalsh",
			stackOverflow: "http://stackoverflow.com/users/603502/sean-walsh",
			linkedin: "https://www.linkedin.com/pub/sean-walsh/bb/aa4/6a8"
		},
		disqus: {
			shortName: "swalsh",
			siteUrl: "http://swalsh.org"
		}
	}
};

handlebars.registerHelper("moment", function( date, format ) {
	return moment.utc( date ).format( format );
});

handlebars.registerHelper("link", function( path ) {
	return metadata.site.url + "/" + ( path ? path.replace(/\\/g, "/") : "" );
});

handlebars.registerHelper("disqus", function( path ) {
	return metadata.site.disqus.siteUrl + "/" + ( path ? path.replace(/\\/g, "/") : "" ) + "/";
});

handlebars.registerHelper("archive", function( context, options ) {
	var ret = "",
		data, currentYear, year;

	if( options.data ) {
		data = handlebars.createFrame( options.data );
	}

	for( var i = 0; i < context.length; i++ ) {
		var post = context[ i ];

		currentYear = moment.utc( post.date ).format( "YYYY" );

		if( data ) {
			if( year !== currentYear ) {
				year = currentYear;
				data.year = year;
			} else {
				data.year = null;
			}

			ret += options.fn( post, { data: data });
		}
	}

	return ret;
});

metalsmith(__dirname)
	.metadata( metadata )
	.use(sass({
		outputDir: "assets/css/"
	}))
	.use(copyAssets({
		src: "node_modules/font-awesome/fonts",
		dest: "assets/fonts"
	}))
	.use(metallic({
		tabReplace: "  "
	}))
	.use(markdown())
	.use(collections({
		blog: {
			pattern: ["!blog/index.html", "blog/**.html"],
			sortBy: "date",
			reverse: true
		}
	}))
	.use(pagination({
		"collections.blog": {
			perPage: 5,
			layout: "index.hbt",
			path: "blog/page/:num/index.html",
			first: "index.html"
		}
	}))
	.use(branch("blog/**.html")
		.use(permalinks({
			pattern: "blog/:date/:title",
			relative: false
		}))
	)
	.use(branch("!blog/**.html")
		.use(branch("!index.html")
			.use(permalinks({
				relative: false
			}))
		)
	)
	.use(excerpts({
		moreRegExp: /\s*<!--\s*more\s*-->/i,
		pruneLength: 0,
		stripTags: false
	}))
	.use(layouts({
		engine: "handlebars",
		directory: "templates",
		partials: "templates/partials",
		default: "default.hbt",
		pattern: "**/*.html"
	}))
	.use(minify())
	.use(uncss({
		output: "assets/css/site.css",
		removeOriginal: true
	}))
	.destination("./build")
	.build(function( err ) {
		if( err ) {
			console.log( err );
		}
	});