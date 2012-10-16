/// <reference path="../Scripts/modernizr-2.6.1-respond-1.1.0.min.js" />
/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="../Scripts/knockout-2.1.0.js" />
/// <reference path="providers.js" />
/// <reference path="Utils.js" />

var colorCount = 5;	//This must match the number of CSS classes defined in item-colors.less
var advanceDelay = 15;	//Seconds between slides
var refreshDelay = 45;

var providerId = Glisten.readQueryString("source");
var listId = Glisten.readQueryString("list");

var provider = Glisten.providers[providerId];
if (!provider || !listId)
	location.href = ".";

var viewModel = {
	isLoading: ko.observable(true),
	messages: ko.observableArray()
};

loadItems().then(function () {
	$('.ListBorder .Content').addClass('Loaded');
	advanceTimer = setInterval(advance, advanceDelay * 1000);

	$(window).resize(function () {
		selectMessage(activeIndex);
	});
});
ko.applyBindings(viewModel);

var advanceTimer;
function loadItems() {
	viewModel.isLoading(true);
	return provider.readList(listId).then(function (list) {
		//If a new item is inserted before the current item, keep displaying the current item.
		//If the current item was removed, go back to the beginning.
		var currentText = false, newIndex = 0;
		if (viewModel.messages.length > 0)
			currentText = viewModel.messages[activeIndex].text;

		viewModel.messages.removeAll();

		document.title = list.name + " – Glisten";
		for (var i = 0; i < list.items.length; i++) {
			var item = list.items[i];

			if (item.text === currentText)
				activeIndex = i;

			viewModel.messages.push({
				author: item.author || false,
				text: item.text,
				cssClass: "Color" + (1 + (getHash(item.text) % colorCount))
			});
		}

		viewModel.isLoading(false);
		selectMessage(newIndex);

		updateLayout();

		setTimeout(loadItems, refreshDelay * 1000);
	});
}
function getHash(text) {
	var hash = 17;
	for (var i = 0; i < text.length; i++) {
		hash = hash * 7 + text.charCodeAt(i);
	}
	return hash;
}

function advance() {
	if (activeIndex === viewModel.messages().length - 1)
		selectMessage(0);
	else
		selectMessage(activeIndex + 1);
}

function updateLayout() {
	$('.MessageDetail article').css('padding', function () {
		var me = $(this);
		return (me.parent().height() - me.height()) / 2 + 'px ' + me.css('padding-left');
	});

	if ($('.MessageList').is(':visible'))
		$('.ListBorder .Content').height($('.MessageList > *').eq(activeIndex).innerHeight());
}

var activeIndex = false;
function selectMessage(index) {
	activeIndex = index;

	//In case the new list item has a different height.
	updateLayout();
	$('.MessageDetail:visible > :first-child').css('margin-top',
		function (i, old) {
			return parseInt(old, 10) - $(this).parent().children().eq(index).offset().top;
		}
	);

	if ($('.MessageList').is(':visible'))
		$('.ListBorder').css('margin-top', $('.MessageList > *').eq(activeIndex).offset().top);
}

