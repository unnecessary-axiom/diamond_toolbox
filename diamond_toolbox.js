(function($, window, game){
	'use strict';

	// oh no extends!
	String.prototype.capitalize = function() {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};

	// settings and resources
	var target_version = -28420982;
	var loaded_version = null;
	var work_interval = 1 * 1000; // 1 second
	var update_interval = 5 * 60 * 1000; // 5 minutes

	var update_interval_registration;

	var resources = {
		'ore': [
			'Wood',
			'Stone',
			'Copper',
			'Iron',
			'Silver',
			'Gold',
			'Titanium',
		].map(function(item){ return 'var' + item + 'Amount'; }),
		'gems': [
			'Sapphire',
			'Emerald',
			'Ruby',
			'Jade',
			'Opal',
			'Topaz',
			'Tanzanite',
			'SeaCrystal',
			'Diamond',
			'BloodCrystal',
		].map(function(item){ return 'var' + item + 'Amount'; }),
		'materials': [
			'BronzeBar',
			'IronBar',
			'SilverBar',
			'GoldBar',
			'TitaniumBar',
			'CrushedTanzanite',
			'CrushedSeaCrystal',
			'CrushedDiamond',
			'GunPowder',
			'CopperWire',
			'Tnt',
			'VialOfWater',
		].map(function(item){ return 'var' + item + 'Amount'; }),
		'crafts': [
			'GoldRing',
			'BronzeRing',
			'SapphireRing',
			'EmeraldRing',
			'RubyRing',
			'DiamondRing',
		].map(function(item){ return 'var' + item + 'Amount'; }),
		'plants': [
			'DottedGreenLeaf',
			'GreenLeaf',
			'LimeLeaf',
			'RedLeaf',
			'GoldLeaf',
			'CrystalLeaf',
			'RedMushroom',
			'BlewitMushroom',
			'SnapeGrass',
		].map(function(item){ return 'var' + item + 'Amount'; }),
		'potions': [
			'SmeltingPotion',
			'ClickerPotion',
			'WoodcuttingPotion',
			'OilPotion',
			'CharmingPotion',
		].map(function(item){ return 'var' + item + 'Amount'; }),
	};

	// list of jobs to be run every tick
	var work_queue = {
		//'job-name': work function
	};

	// inputs in the config tab
	var menu_items = {
		'Additional Population Indicators': {
			type: 'checkbox',
			checked: 'checked',
			change: function(){
				if(this.checked){
					// add new indicators
					$('<div>', {
						class: 'ds-pop',
						style: 'color: white;',
					}).prependTo('#population-tab-inside');
					// add and override to update my indicators
					override('initPopulation', function(ammount){
						game.origional_initPopulation(ammount);
						var content = '';
						['electricity', 'water', 'education'].forEach(function(indicator, i){
							content += indicator.capitalize() + ': ' + $('#progress-percentage-' + indicator)[0].style.width + ', ' + $('#' + indicator + '-status').text() + '<br/>';
						});
						$('.ds-pop').html(content);
					});
				}else{
					// remove indicators
					$('.ds-pop').remove();
					// remove overrides
					unoverride('initPopulation');
				}
			},
		},
		'Diamond Hunt update checker': {
			type: 'checkbox',
			checked: 'checked',
			change: function(){
				if(this.checked){
					update_interval_registration = window.setInterval(function(){
						work_functions.update();
					}, update_interval);
				}else{
					window.clearInterval(update_interval_registration);
					$('.ds-update').remove();
				}
			},

		},
		'Show oil usage': {
			type: 'checkbox',
			checked: 'checked',
			change: function(){
				if(this.checked){
					work_queue.oil_stats = work_functions.oil_stats;
				}else{
					delete work_queue.oil_stats;
					$('.ds-oil').remove();
				}
			},
		},
		'Show inventory value': {
			type: 'checkbox',
			checked: 'checked',
			change: function(){
				if(this.checked){
					work_queue.inv_value = work_functions.inventory_value;
				}else{
					delete work_queue.inv_value;
					$('.ds-total').remove();
				}
			},
		},
		'Hide crafted items': {
			type: 'checkbox',
			checked: 'checked',
			change: function(){
				if(this.checked){
					work_queue.hide_crafted = function(){
						$('#crafting-tab #crafting table:last input[type=button]:disabled').parents('tr').hide();
					};
				}else{
					delete work_queue.hide_crafted;
					$('#crafting-tab #crafting table:last tr').show();
				}
			},
		},
		'Hide empty store categories': {
			type: 'checkbox',
			checked: 'checked',
			change: function(){
				if(this.checked){
					work_queue.hide_bought = function(){
						$('#store-tab .category:not(:has(.shop-box input[type=button]:enabled))').hide();
					};
				}else{
					delete work_queue.hide_bought;
					$('#store-tab .category').show();
				}
			},
		},
		'Patch playsound': {
			type: 'checkbox',
			change: function(){
				if(this.checked){
					game.playSound = function(path){
						if(game.varSoundIsOff === 1){
							return;
						}
						$('body > .sounds').remove();
						$("<embed src='" + path + "' hidden='true' autostart='true' loop='false' class='sounds'/>").appendTo('body');
					};
				}else{
					game.playSound = function(){};
				}
			},
		},
		'Log Ticks (DT debug)': {
			type: 'checkbox',
			change: function(){
				if(this.checked){
					work_queue.log_ticks = work_functions.log;
				}else{
					delete work_queue.log_ticks;
				}
			},
		},
	};

	// return a promise that gets the version hash
	var get_version = function(){
		var dfd = $.Deferred();
		$.get('updatelog.txt')
		.done(function(data){
			dfd.resolve(hash_string(data));
		})
		.fail(function(){
			dfd.reject();
		});
		return dfd.promise();
	};
	
	// version checking
	var init = function(){
		if($('#dsSettings-tab').length > 0){
			alert('Please reload the page before applying DT again');
			return;
		}

		get_version()
		.done(function(current_version){
			console.log('Current: ' + current_version);
			console.log('Target: ' + target_version);
			if(current_version === target_version){
				add_menu();
			}else{
				if(window.confirm('Incompatable version.\nCheck for updates or wait for a new release.\nPress OK to continue anyway.')){
					add_menu();
				}
			}
			loaded_version = current_version;
		})
		.fail(function(){
			alert('Failed to fetch updatelog.txt to check for compatable version');
		});

	};

	// Overrides a function, placing the origional at origional_[target_function]
	// Accepts:
	//     A string containing the name of the function
	//     A new function to call
	var override = function(target_function, new_function, scope){
		if(scope === undefined){
			scope = game;
		}
	
		scope['origional_' + target_function] = scope[target_function];
		scope[target_function] = new_function;
	};
	
	var unoverride = function(target_function, scope){
		if(scope === undefined){
			scope = game;
		}

		if(scope['origional_' + target_function] !== undefined){
			scope[target_function] = scope['origional_' + target_function];
			delete scope['origional_' + target_function];
		}
	};

	var add_menu = function(){
		var tab_html = [
			'<table class="table-dssettings">',
				'<thead>',
					'<tr>',
						'<th>Setting</th>',
						'<th>Enabled?</th>',
					'</tr>',
				'</thead>',
				'<tbody>',
				'</tbody>',
			'</table>',
		].join('');
		
		var tab_css = [
			'<style>',
			'.table-dsSettings {',
				'margin: 1em auto;',
				'background-color: white;',
				'text-align: center',
			'}',
			'.table-dsSettings td, .table-dsSettings th {',
				'padding: 5px;',
			'}',
			'</style>',
		].join('');

		// create settings tab button
		$('<td/>', {
			id: 'table-tab',
			class: 'activate-tooltip dsSettings-button',
			tooltip: 'Diamond Toolbox Settings',
			onClick: 'openTab("dsSettings")',
			html: '<img src=\'data:image/svg+xml;utf8,<?xml version="1.0" encoding="utf-8"?> <!-- http://uxrepo.com/icon-sets/all/5 --> <!-- Generator: IcoMoon.io --> <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"> <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g><path d="M 30,10l-8,0 c0,1.104-0.896,2-2,2l 10,0 l0,4 l-10,0 c 1.104,0, 2,0.896, 2,2l 8,0 l0,12 L 2,30 L 2,18 l 8,0 c0-1.104, 0.896-2, 2-2L 2,16 L 2,12 l 10,0 C 10.896,12, 10,11.104, 10,10L 2,10 C 0.896,10,0,10.896,0,12l0,4 l0,2 l0,12 c0,1.104, 0.896,2, 2,2l 28,0 c 1.104,0, 2-0.896, 2-2L 32,18 L 32,16 L 32,12 C 32,10.896, 31.104,10, 30,10zM 12,12l 8,0 c 1.104,0, 2-0.896, 2-2L 22,8 c0-1.104-0.896-2-2-2L 12,6 C 10.896,6, 10,6.896, 10,8l0,2 C 10,11.104, 10.896,12, 12,12z M 12,8l 8,0 l0,2 L 12,10 L 12,8 zM 10,18l0,2 c0,1.104, 0.896,2, 2,2l 8,0 c 1.104,0, 2-0.896, 2-2L 22,18 c0-1.104-0.896-2-2-2L 12,16 C 10.896,16, 10,16.896, 10,18z M 20,20L 12,20 L 12,18 l 8,0 L 20,20 z"></path></g></svg>\' style="vertical-align: text-bottom;" alt="icon" height="30px" width="30px">',
		}).insertAfter($('.tab-container tr #table-tab').last());

		// create settings tab table
		$('<div/>', {
			id: 'dsSettings-tab',
			class: 'tab-scroll-bars',
			style: 'display:none;',
			html: tab_html + tab_css,
		}).insertAfter('.tab-scroll-bars:last-child');

		// build the action buttons and insert them
		Object.keys(menu_items).forEach(function(item_label){
			var item_properties = menu_items[item_label];

			var row = $('<tr>');
			row.append(
				$('<td>', { text: item_label })
			);
			row.append(
				$('<td>')
				.append($('<input>', item_properties))
			);
			row.appendTo($('.table-dsSettings'));
		});
		//
		// override tab functions so mine works
		override('hideAllTabs', function(){
			$('.tab-scroll-bars').hide();
		});

		override('openTab', function(tabName){
			// triggers loading functions and calls hideAllTabs
			game.origional_openTab(tabName);
			$('#' + tabName + '-tab').show();
		});

		// trigger change on input elements, so default values get added to the queue
		$('#dsSettings-tab input').change();

		// start doing jobs
		window.setInterval(do_work, work_interval);
	};


	var work_functions = {
		'log': function(){
			console.log((new Date()), arguments);
		},
		'inventory_value': function(){
			var totals = {
				grand_total: 0
			};
			Object.keys(resources).forEach(function(resource_type){
				totals[resource_type] = 0;
				resources[resource_type].forEach(function(resource){
					totals[resource_type] += game[resource] * game.getOreValue(resource);
				});
				totals.grand_total += totals[resource_type];
			});

			if($('.ds-total').length === 0){
				Object.keys(totals).forEach(function(resource_type){
					var row = $('<tr>', { 'class': 'ds-total' }).append(
						$('<td>', {
						'class': 'no-borders',
						'style': 'color: white;',
						'colspan': 2,
						'text': resource_type,
					})).append(
						$('<td>', {
						'class': 'no-borders ds-total-' + resource_type,
						'style': 'color: white; text-align: right;',
						'colspan': 999,
					}));
					$('#coinsAmount-gatherings').parents('tr').after(row);
				});
			}

			Object.keys(totals).forEach(function(resource_type){
				$('.ds-total-' + resource_type).text(game.numberFormatter(totals[resource_type]));
			});
		},
		'oil_stats': function(){
			var using = 0;
			// I don't want to read from the HTML, but I also don't want to have to re-implement formulas
			// so this should work well for most things
			var generating = parseFloat($('#oil-gaining').text());
			$("[id^=oil-losing]").each(function(i, e){
				var amount = parseFloat($(e).text());
				if(!isNaN(amount)){
					using += amount;
				}
			});
			using = using*-1;
			var delta = (generating - using).toFixed(2);
			if($('.ds-oil').length < 1){
				$('<div>', {
					class: 'ds-oil',
					style: 'color:white; text-align:center;',
				}).insertBefore('#key-inventory-space');
			}
			$('.ds-oil').html('Generating: ' + game.numberFormatter(generating) + '<br/>Using: ' + game.numberFormatter(using) + '<br/>Profit: ' + game.numberFormatter(delta));
		},
		'update': function(){
			// get the latest version
			console.log("Update check...");
			get_version().done(function(current_version){
				//compare versions
				console.log("current: " + current_version);
				console.log("loaded: " + loaded_version);
				if(current_version !== loaded_version){
					// insert a notification
					$('<div>', {
						text: 'A new version is available. Click to save and refresh',
						click: function(){
							localSave();
							window.location.reload();
						},
						style: "background-color:99EEFF; color:red; padding:5px; position:fixed; left:0; right:0; top: 0; height: 30px; ",
						class: 'ds-update',
					})
					.prependTo('body');
					// move everything down to fit
					$('#main-game, .top-menu, #giant-rock-area').css('margin-top', '30px');
					//remove myself from updating
					delete work_queue.update;
				}
			})
			.fail(function(){
				console.log("Failed to fetch update hash");
			});
		},
	};

	// utility functions
	// used in version checking
	var hash_string = function(str){
		// http://stackoverflow.com/a/7616484/38473
		var hash = 0, i, chr, len;
		if(str.length === 0) return hash;
		for (i = 0, len = str.length; i < len; i++) {
			chr   = str.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	};

	// iterate and execute each item in the work queue
	var do_work = function(){
		Object.keys(work_queue).forEach(function(task_name){
			work_queue[task_name]();
		});
	};

	init();
})($, window, window); //game is actually window
