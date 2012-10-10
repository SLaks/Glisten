/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="../Scripts/knockout-2.1.0.js" />
/// <reference path="providers.js" />

var providerId = location.search.match(/[?&]source=([^&]*)/i)[1];
var provider = Glisten.providers[providerId];

var viewModel = {
	providerId: providerId,
	groups: ko.observableArray(),
	isLoading: ko.observable(true)
};

ko.applyBindings(viewModel);

function refresh() {
	viewModel.isLoading(true);

}