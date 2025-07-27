// ==UserScript==
// @name         Hide Popover via CSS
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Hide the script‑adjacent .popover.select-none by injecting CSS
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // inject a CSS rule so that any .popover.select-none immediately
    // following a <script> tag is hidden by default
    const style = document.createElement('style');
    style.textContent = `
        script + .popover.select-none {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
})();
