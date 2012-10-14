/// <reference path="../Scripts/jquery-1.8.2.js" />
/// <reference path="https://api.trello.com/1/client.js?key=6068fb37739492894da608debf94ef7f" />

//Providers are used by all three pages:
//index.html enumerates providers from the properties of the providers object, and initiates login
//lists.html displays the available lists (single-list sources, like Twitter, skip this)
//detail.html reads the contents of a single list.

//provider-themes.less should have the styling for the login buttons;
//each button will have the property name added as a class.

(function (global, undefined) {
	var loadedScripts = {};
	function loadScript(url) {
		/// <summary>Asynchronously loads an external .js file.</summary>
		/// <param name="url" type="String">The URL of the script file to load.</param>
		/// <returns type="jqXHR" />
		if (!loadedScripts.hasOwnProperty(url))
			loadedScripts[url] = $.getScript(url);
		return loadedScripts[url];
	}

	var CalenderBoard = global.Glisten = global.Glisten || {};

	CalenderBoard.providers = {
		trello: {
			displayName: 'Trello',
			getLists: function () {
				return this.login().pipe(function () {
					return Trello.members.get("me", { boards: "all", board_lists: "open" });
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
			},
			login: function () {
				var deferred = $.Deferred();

				loadScript('https://api.trello.com/1/client.js?key=6068fb37739492894da608debf94ef7f')
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
			},
			readList: function (id) {
			},
			login: function () { }
		}
	};
}(this));