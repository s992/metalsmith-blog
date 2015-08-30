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
			pattern: "blog/**.html",
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
	.destination("./build")
	.build(function( err ) {
		if( err ) {
			console.log( err );
		}
	});