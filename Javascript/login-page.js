/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="../Scripts/knockout-2.1.0.js" />
/// <reference path="providers.js" />

var loginOptions = [];

for (var id in CalenderBoard.providers) {
	if (!CalenderBoard.providers.hasOwnProperty(id)) continue;
	var p = CalenderBoard.providers[id];
	if (typeof p.login !== 'function') continue;

	loginOptions.push({
		id: id,
		name: p.displayName
	});
}
ko.applyBindings({ loginOptions: loginOptions });