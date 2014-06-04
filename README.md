diamond_toolbox
===============

Enhancements bookmarklet for http://diamondhunt.co

To use, create a bookmark in your browser with the following target:

    javascript:(function(){if(document.domain!=='diamondhunt.co'){alert('This bookmarklet must be run on the Diamond Hunt website.');return;}document.body.appendChild(document.createElement('script')).src='https://raw.githubusercontent.com/unnecessary-axiom/diamond_toolbox/master/diamond_toolbox.js';})();


Then just use the bookmark when you're in the game.

Features
--------

* Checks for Diamond Hunt updates
* Can show current value of inventory per category
* Hides already crafted and purchased items
* Shows combined rates of oil
* Able to reenable shop sounds
* Control panel for enable/disable of features
