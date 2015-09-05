module.exports = function( metadata ) {
	return function( path ) {
		return metadata.site.disqus.siteUrl + "/" + ( path ? path.replace(/\\/g, "/") : "" ) + "/";
	}
};