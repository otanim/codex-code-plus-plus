// ==UserScript==
// @name         Hide Popover via CSS
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @author       Arman Yeghiazaryan - @otanim
// @description  Hide the "Ctrl" popover by targeting the body's last or pre-last div element
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // inject a CSS rule so that the popover shown when holding Ctrl
    // is hidden whether it's the last <div> or the second to last element if that element is a <div>
    const style = document.createElement('style');
    style.textContent = `
        body > div.popover.select-none:last-child,
        body > div.popover.select-none:nth-last-child(2) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();
