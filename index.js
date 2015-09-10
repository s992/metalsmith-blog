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
	minifyHtml = require("metalsmith-html-minifier"),
	uncss = require("metalsmith-uncss"),
	cleanCss = require("metalsmith-clean-css"),
	feed = require("metalsmith-feed"),
	ignore = require("metalsmith-ignore"),
	canonical = require("./lib/metalsmith-canonical"),
	description = require("./lib/metalsmith-description"),
	sitemap = require("metalsmith-sitemap"),
	argv = require("yargs").argv,
	moment = require("moment"),
	handlebars = require("handlebars"),
	handlebarsHelpers = require("./lib/handlebars-helpers");

var PROD = argv.env && argv.env === "prod";

var metadata = {
	site: {
		title: "Sean Walsh",
		author: "Sean Walsh",
		url: PROD ? "https://swalsh.org/metalsmith-blog" : "http://localhost:8080",
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

handlebars.registerHelper("moment", handlebarsHelpers.momentDateFormat);
handlebars.registerHelper("link", handlebarsHelpers.link( metadata ));
handlebars.registerHelper("disqus", handlebarsHelpers.disqus( metadata ));
handlebars.registerHelper("archive", handlebarsHelpers.archive);

metalsmith(__dirname)
	.metadata( metadata )
	.use(ignore([ "favicons/*" ]))
	.use(sass({
		outputDir: "assets/css/"
	}))
	.use(copyAssets({
		src: "node_modules/font-awesome/fonts",
		dest: "assets/fonts"
	}))
	.use(copyAssets({
		src: "src/favicons",
		dest: ""
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
	.use(canonical())
	.use(description())
	.use(layouts({
		engine: "handlebars",
		directory: "templates",
		partials: "templates/partials",
		default: "default.hbt",
		pattern: "**/*.html"
	}))
	.use(feed({
		collection: "blog"
	}))
	.use(sitemap({
		ignoreFiles: [ /^(?!.*html).*$/ ],
		output: "sitemap.xml",
		urlProperty: "canonical",
		hostname: metadata.site.url
	}))
	.use(minifyHtml())
	.use(uncss({
		output: "assets/css/site.css",
		removeOriginal: true
	}))
	.use(cleanCss())
	.destination("./build")
	.build(function( err ) {
		if( err ) {
			console.log( err );
		}
	});