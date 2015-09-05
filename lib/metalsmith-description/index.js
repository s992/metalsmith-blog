var sanitize = require("sanitize-html"),
	truncate = require("truncate");

module.exports = description;

function description( opts ) {
	var opts = opts || {};

	opts.length = opts.length || 150;

	return function( files ) {
		Object.keys( files ).forEach(function( file ) {
			var data = files[ file ];

			if( data.description ) {
				return;
			}

			var content = data.contents.toString();
			
			data.description = sanitize( content, {
				allowedTags: []
			});

			data.description = data.description.replace(/\s+/g, " ");
			data.description = truncate( data.description, opts.length );
		});
	}
}