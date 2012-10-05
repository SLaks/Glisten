/// <reference path="../Scripts/jquery-1.8.2.js" />

//Providers are used by all three pages:
//index.html enumerates providers from the properties of the providers object, and initiates login
//lists.html displays the available lists (single-list sources, like Twitter, skip this)
//detail.html reads the contents of a single list.

//provider-themes.less should have the styling for the login buttons;
//each button will have the property name added as a class.

(function (global, undefined) {
	var CalenderBoard = global.Glisten = global.Glisten || {};

	CalenderBoard.providers = {
		trello: {
			displayName: 'Trello',
			login: function () { }
		},
		gCalendar: {
			displayName: 'Google Calendar',
			login: function () { }
		}
	};
}(this));