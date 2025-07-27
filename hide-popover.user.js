// ==UserScript==
// @name         Hide Popover via CSS
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @author       Arman Yeghiazaryan - @otanim
// @description  Hide the "Ctrl" popover by targeting body's last or pre-last div
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // inject a CSS rule so that the popover shown when holding Ctrl
    // is hidden whether it's the last or second to last <div>
    const style = document.createElement('style');
    style.textContent = `
        body > div:nth-last-of-type(1).popover.select-none,
        body > div:nth-last-of-type(2).popover.select-none {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();
