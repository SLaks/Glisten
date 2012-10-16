this.Glisten = this.Glisten || {};

Glisten.readQueryString = function (name) {
	/// <summary>Parses a parameter from the current page's querystring.</summary>
	/// <returns type="String" />

	var match = location.search.match(new RegExp("[?&]" + name + "=([^&]*)", "i"));
	if (!match)
		return null;
	return decodeURIComponent(match[1]);
};