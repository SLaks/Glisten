﻿/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="../Scripts/knockout-2.1.0.js" />
/// <reference path="providers.js" />
/// <reference path="Utils.js" />

var providerId = Glisten.readQueryString("source");
var provider = Glisten.providers[providerId];
if (!provider)
	location.href = ".";

var viewModel = {
	providerId: providerId,
	displayName: provider.displayName,
	iconUrl: 'Images/' + encodeURI(providerId) + '.png',

	groups: ko.observableArray(),
	isLoading: ko.observable(true),
};

if (!provider.logout)
	viewModel.logout = false;
else
	viewModel.logout = function () {
		provider.logout();
		location.href = ".";
		return false;
	};

ko.applyBindings(viewModel);
refresh();

function refresh() {
	viewModel.isLoading(true);
	provider.getLists().then(function (groups) {
		viewModel.groups.removeAll();

		for (var g = 0; g < groups.length; g++) {
			var source = groups[g];
			var group = { name: source.name, lists: [] };

			for (var i = 0; i < source.lists.length; i++) {
				var list = source.lists[i];
				group.lists.push({
					name: list.name,
					url: "list.html?source=" + encodeURIComponent(providerId) + "&list=" + encodeURIComponent(list.id)
				});
			}

			viewModel.groups.push(group);
		}

		viewModel.isLoading(false);
	});
}