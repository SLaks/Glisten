/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="../Scripts/knockout-2.1.0.js" />
/// <reference path="providers.js" />

var loginOptions = [];

for (var id in Glisten.providers) {
	if (!Glisten.providers.hasOwnProperty(id)) continue;
	var p = Glisten.providers[id];
	if (typeof p.login !== 'function') continue;

	loginOptions.push({
		id: id,
		name: p.displayName,
		url: 'select.html?source=' + encodeURIComponent(id),
		iconUrl: 'Images/' + encodeURI(id) + '.png'
	});
}
ko.applyBindings({ loginOptions: loginOptions });