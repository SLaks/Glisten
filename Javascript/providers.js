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
	var googleKey = 'AIzaSyB6WakYj2GCQIudxb_e7X9pZ8M86Eqw8bE';

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
			googleClientLoad = googleClientLoad || $.getJSON("https://apis.google.com/js/client.js?onload=?");

			googleApis[promiseKey] = googleClientLoad.pipe(function () {
				console.log(arguments);
				gapi.client.setApiKey(googleKey);

				var retVal = $.Deferred();

				gapi.client.load(name, version, function () { retVal.resolve(); });

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
					return Trello.lists.get(encodeURI(id), { cards: 'open', card_fields: 'name', fields: 'name' })
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
							success: function () { deferred.resolve(); },
							error: function () { deferred.reject(); }
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

					gapi.client.calendar.calendarList.list(
						{ fields: "items(id,summary,summaryOverride)" },
						function (results) {
							promise.resolve(results);
						}
					);

					return promise.promise();
				}).pipe(function (results) {
					var groups = [];
					for (var i = 0; i < results.items.length; i++) {
						var calendar = results.items[i];

						groups.push({
							name: calendar.summaryOverride || calendar.summary,
							items: [
								{ name: 'This Week', id: '1w:' + calendar.id },
								{ name: 'This Month', id: '1m:' + calendar.id }
							]
						});
					}
				});
			},
			readList: function (id) {
			},
			login: function () {
				return loadGoogleApi('calendar', 'v3').pipe(function () {
					var promise = $.Deferred();

					gapi.auth.authorize(
						{
							client_id: 'AIzaSyB6WakYj2GCQIudxb_e7X9pZ8M86Eqw8bE',
							scope: 'https://www.googleapis.com/auth/calendar.readonly',
							immediate: true
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