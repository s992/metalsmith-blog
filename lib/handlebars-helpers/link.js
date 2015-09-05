module.exports = function( metadata ) {
	return function( path ) {
		return metadata.site.url + "/" + ( path ? path.replace(/\\/g, "/") : "" );
	}
};