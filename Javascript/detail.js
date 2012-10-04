/// <reference path="../Scripts/modernizr-2.6.1-respond-1.1.0.min.js" />
/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="../Scripts/knockout-2.1.0.js" />

var colorCount = 5;

var data = [
	{ author: 'Schabse Laks', text: 'Welcome to the CalendarBoard system!' },
	{ author: 'Chana Laks', text: 'We aren\'t having anyone for שבת' },
	{ author: 'David Laks', text: 'There are two Kiddushim to go to.' }
];

$.each(data, function () {
	var hash = 17;
	for (var i = 0; i < this.text.length; i++) {
		hash = hash * 7 + this.text.charCodeAt(i);
	}
	this.cssClass = "Color" + (1 + (hash % colorCount));
});

ko.applyBindings({ messages: data });

