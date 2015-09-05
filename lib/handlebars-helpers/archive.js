var moment = require("moment");

module.exports = function( context, options ) {
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
};