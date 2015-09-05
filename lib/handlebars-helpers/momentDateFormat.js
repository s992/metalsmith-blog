var moment = require("moment");

module.exports = function( date, format ) {
	return moment.utc( date ).format( format );
}