module.exports = canonical;

function canonical() {
	return function( files, metalsmith ) {
		var siteUrl = metalsmith.metadata().site.url;

		Object.keys( files ).forEach(function( file ) {
			var data = files[ file ];

			data.canonical = siteUrl;

			if( data.path ) {
				data.canonical += "/" + data.path.replace(/\\/g, "/");
			}
		});
	}
}