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
	providerName: provider.displayName,
	listName: ko.observable("Loading"),
	isLoading: ko.observable(true),
	messages: ko.observableArray()
};

$(document.body).dblclick(loadItems);

loadItems().then(function () {
	$('.ListBorder .Content').addClass('Loaded');

	$(window).resize(function () {
		selectMessage(activeIndex);
	});
});
// Apply to the HTML element to include bindings on <title>
ko.applyBindings(viewModel, $('html')[0]);

var advanceTimer = false;
function setTimerState(on) {
	on = !!on;
	if (!!advanceTimer === on) return;

	if (on)
		advanceTimer = setInterval(advance, advanceDelay * 1000);
	else {
		clearInterval(advanceTimer);
		advanceTimer = false;
	}
}

function loadItems() {
	return provider.readList(listId).then(function (list) {
		//If a new item is inserted before the current item, keep displaying the current item.
		//If the current item was removed, go back to the beginning.
		var currentText = false, newIndex = 0;
		if (viewModel.messages().length > 0)
			currentText = viewModel.messages()[activeIndex].text;

		viewModel.listName(list.name);

		viewModel.messages.removeAll();
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
		//If we have items to display, start the timer.
		setTimerState(viewModel.messages().length);

		if (viewModel.messages().length) {
			selectMessage(newIndex);
			updateLayout();
		}

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

	layoutScrollbar($('.ScrollThumb'));

	if ($('.MessageList').is(':visible'))
		$('.ListBorder .Content').height($('.MessageList > *').eq(activeIndex).innerHeight());
}

function layoutScrollbar(scrollThumb) {
	/// <param name="scrollThumb" type="jQuery">The scroll thumb element that will visualize the scrolling position.</param>

	// Pixels of margin on either side of the scroll thumb.
	// This makes it look nicer when scrolled to the top or
	// bottom of the window. I need to subtract it from the
	// assigned height of the thumb.
	scrollThumbMargin = parseFloat($('.ScrollThumb').css('margin-top'));

	var contentHeight = scrollThumb.prev().height(), paneHeight = scrollThumb.parent().height();
	if (contentHeight < paneHeight)
		scrollThumb.hide();
	else
		scrollThumb.height(paneHeight * (paneHeight / contentHeight) - scrollThumbMargin * 2).show();
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

	var messageList = $('.MessageList');
	if (messageList.is(':visible')) {
		var currentItem = messageList.children().eq(activeIndex);
		var itemHeight = currentItem.height();
		var itemTop = currentItem.position().top;
		var paneHeight = messageList.parent().height();
		var contentHeight = messageList.height();

		var scrollOffset = -parseFloat(messageList.css('top')) || 0;

		if (itemTop - scrollOffset > paneHeight - itemHeight * 2)
			scrollOffset = Math.min(contentHeight - paneHeight, itemTop - paneHeight / 2);
		else if (itemTop < scrollOffset)
			scrollOffset = Math.max(0, itemTop - itemHeight * 2);

		messageList.css('top', -scrollOffset)
			.next().css('top', (scrollOffset / contentHeight) * paneHeight);

		$('.ListBorder').css({
			top: -scrollOffset,
			marginTop: itemTop
		});
	}
}