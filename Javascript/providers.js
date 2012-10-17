/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="https://api.trello.com/1/client.js" />

//Providers are used by all three pages:
//index.html enumerates providers from the properties of the providers object, and initiates login
//lists.html displays the available lists (single-list sources, like Twitter, skip this)
//detail.html reads the contents of a single list.

//provider-themes.less should have the styling for the login buttons;
//each button will have the property name added as a class.

(function (global, undefined) {
	var trelloKey = '6068fb37739492894da608debf94ef7f';
	var googleKey = 'AIzaSyA4gRp0fklN_X5HrRN8IXuR0Ch8FTitizQ';
	var googleClientId = '701998454083.apps.googleusercontent.com';

	var loadedScripts = {};
	function loadScript(url) {
		/// <summary>Asynchronously loads an external .js file, if it has not been loaded already.</summary>
		/// <param name="url" type="String">The URL of the script file to load.</param>
		/// <returns type="jqXHR" />
		if (!loadedScripts.hasOwnProperty(url))
			loadedScripts[url] = $.getScript(url);
		return loadedScripts[url];
	}

	var googleClientLoad = false;
	var googleApis = {};
	function loadGoogleApi(name, version) {
		/// <summary>Asynchronously loads a Google Javascript API.</summary>
		/// <param name="name" type="String">The name of the API to load.</param>
		/// <param name="version" type="String">The version of the API to load.</param>
		/// <returns type="$.Deferred" />
		var promiseKey = name + "/" + version;

		if (!googleApis.hasOwnProperty(promiseKey)) {
			if (!googleClientLoad) {
				var cbName = "GoogleLoadCallback-" + (++jQuery.uuid);
				var libPromise = $.Deferred();
				global[cbName] = function () { libPromise.resolve(); delete global[cbName]; };
				$.getScript("https://apis.google.com/js/client.js?onload=" + encodeURIComponent(cbName));
				googleClientLoad = libPromise.promise();
			}

			googleApis[promiseKey] = googleClientLoad.pipe(function () {
				gapi.client.setApiKey(googleKey);

				var retVal = $.Deferred();

				gapi.client.load(name, version, $.proxy(retVal, 'resolve'));

				return retVal.promise();
			});
		}

		return googleApis[promiseKey];
	}

	var Glisten = global.Glisten = global.Glisten || {};

	Glisten.providers = {
		trello: {
			displayName: 'Trello',
			getLists: function () {
				return this.login().pipe(function () {
					return Trello.members.get("me", { boards: "open", board_lists: "open", fields: '' });
				}).pipe(function (user) {
					var groups = [];

					for (var b = 0; b < user.boards.length; b++) {
						var board = user.boards[b];
						var group = { name: board.name, lists: [] };
						groups.push(group);
						for (var i = 0; i < board.lists.length; i++) {
							var o = board.lists[i];
							group.lists.push({ id: o.id, name: o.name });
						}
					}

					return groups;
				});
			},
			readList: function (id) {
				return this.login().pipe(function () {
					return Trello.lists.get(encodeURI(id), { cards: 'open', card_fields: 'name', fields: 'name' });
				}).pipe(function (list) {
					var items = [];
					for (var i = 0; i < list.cards.length; i++) {
						var card = list.cards[i];
						items.push({ text: card.name });
					}

					return {
						name: list.name,
						items: items
					};
				});
			},
			login: function () {
				var deferred = $.Deferred();

				loadScript('https://api.trello.com/1/client.js?key=' + encodeURIComponent(trelloKey))
					.then(function () {
						Trello.authorize({
							type: 'popup',
							name: 'Glisten',
							success: $.proxy(deferred, 'resolve'),
							error: $.proxy(deferred, 'deferred')
						});
					});

				return deferred.promise();
			},
			logout: function () {
				Trello.deauthorize();
			}
		},
		gCalendar: {
			displayName: 'Google Calendar',
			getLists: function () {

				return this.login().pipe(function () {
					var promise = $.Deferred();

					gapi.client.calendar.calendarList.list({ fields: "items(id,summary,summaryOverride)" })
							.execute($.proxy(promise, 'resolve'));

					return promise.promise();
				}).pipe(function (results) {
					if (results.error)
						return $.Deferred().reject(results.error.message);

					var groups = [];
					for (var i = 0; i < results.items.length; i++) {
						var calendar = results.items[i];

						groups.push({
							name: calendar.summaryOverride || calendar.summary,
							lists: [
								{ name: 'This Week', id: '1w:' + calendar.id },
								{ name: 'This Month', id: '1m:' + calendar.id }
							]
						});
					}
					return groups;
				});
			},
			readList: function (id) {
				var parts = id.match(/^(\d+)([wm]):(.+)$/);
				if (!parts) return $.Deferred().reject();
				var unitCount = parseInt(parts[1], 10);
				var unit = parts[2];
				var calendarId = parts[3];

				var today = new Date();
				today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
				var endDate;

				switch (unit) {
					case 'm':
						endDate = new Date(today.getFullYear(), today.getMonth() + unitCount, 1);
						break;
					case 'w':
						endDate = new Date(
							today.getFullYear(),
							today.getMonth(),
							today.getDate() - today.getDay() + 7 * unitCount
						);
						break;
				}

				return this.login().pipe(function () {
					var promise = $.Deferred();

					gapi.client.calendar.events.list({
						fields: "summary,items(creator(displayName,email),summary)",
						calendarId: calendarId,
						timeMin: today,
						timeMax: endDate
					}).execute($.proxy(promise, 'resolve'));

					return promise.promise();
				}).pipe(function (results) {
					var items = [];

					if (results.items) {
						for (var i = 0; i < results.items.length; i++) {
							var event = results.items[i];
							items.push({ text: event.summary, author: event.creator.displayName || event.creator.email });
						}
					}

					return {
						name: results.summary,
						items: items
					};
				});
			},
			login: function () {
				return loadGoogleApi('calendar', 'v3').pipe(function () {
					var promise = $.Deferred();

					gapi.auth.authorize(
						{
							client_id: googleClientId,
							scope: 'https://www.googleapis.com/auth/calendar.readonly',
							immediate: false
						}, function (authResult) {
							if (authResult && authResult.error)
								promise.reject(authResult.error);
							else
								promise.resolve();
						});

					return promise.promise();
				});
			}
		}
	};
}(this));