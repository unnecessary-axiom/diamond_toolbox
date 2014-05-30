(function($, window, game){
	'use strict';

	// settings and resources
	var target_version = -1407974026;
	var work_interval = 1000;
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
		'Hide crafted item': {
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
		'Log Ticks (DS debug)': {
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

	// version checking
	var init = function(){
		if($('#dsSettings-tab').length > 0){
			alert('Please reload the page before applying DS again');
			return;
		}

		$.get('updatelog.txt')
		.done(function(data){
			var current_version = hash_string(data);
			console.log('Current: ' + current_version);
			console.log('Target: ' + target_version);
			if(current_version === target_version){
				add_menu();
			}else{
				if(window.confirm('Incompatable version.\nCheck for updates or wait for a new release.\nPress OK to continue anyway.')){
					add_menu();
				}
			}
		})
		.fail(function(){
			alert('Failed to fetch updatelog.txt to check for compatable version');
		});

	};
	
	var override = function(target_function, new_function){
		game['origional_' + target_function.name] = target_function;
		game[target_function.name] = new_function;
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
			tooltip: 'Diamond Scope Settings',
			onClick: 'openTab("dsSettings")',
			html: '<img src=\'data:image/svg+xml;utf8,<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="512px" height="512px" viewBox="0 0 512 512" enable-background="new 0 0 512 512" xml:space="preserve"> <path d="M462,280.72v-49.44l-46.414-16.48c-3.903-15.098-9.922-29.343-17.675-42.447l0.063-0.064l21.168-44.473l-34.96-34.96 l-44.471,21.167l-0.064,0.064c-13.104-7.753-27.352-13.772-42.447-17.673L280.72,50h-49.44L214.8,96.415 c-15.096,3.9-29.343,9.919-42.447,17.675l-0.064-0.066l-44.473-21.167l-34.96,34.96l21.167,44.473l0.066,0.064 c-7.755,13.104-13.774,27.352-17.675,42.447L50,231.28v49.44l46.415,16.48c3.9,15.096,9.921,29.343,17.675,42.447l-0.066,0.064 l-21.167,44.471l34.96,34.96l44.473-21.168l0.064-0.063c13.104,7.753,27.352,13.771,42.447,17.675L231.28,462h49.44l16.48-46.414 c15.096-3.903,29.343-9.922,42.447-17.675l0.064,0.063l44.471,21.168l34.96-34.96l-21.168-44.471l-0.063-0.064 c7.753-13.104,13.771-27.352,17.675-42.447L462,280.72z M256,338.4c-45.509,0-82.4-36.892-82.4-82.4c0-45.509,36.891-82.4,82.4-82.4 c45.509,0,82.4,36.891,82.4,82.4C338.4,301.509,301.509,338.4,256,338.4z"/></svg>\' style="vertical-align: text-bottom;" alt="icon" height="30px" width="30px">',
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
			row.appendTo($('.table-dssettings'));
		});
		//
		// override tab functions so mine works
		override(hideAllTabs, function(){
			$('.tab-scroll-bars').hide();
		});

		override(openTab, function(tabName){
			// triggers loading functions and calls hideAllTabs
			game.origional_openTab(tabName);
			$('#' + tabName + '-tab').show();
		});

		// trigger change on input elements, so default values get added to the queue
		$('#dsSettings-tab input').change();

		// start doing jobs
		window.ds_work_interval = window.setInterval(do_work, work_interval);
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
