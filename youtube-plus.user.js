// ==UserScript==
// @name         YouTubePlus
// @namespace    http://tampermonkey.net/
// @version      0.1
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const url = new URL(location.href);
    const params = url.searchParams;

    // Fixup media session keys (Chrome) - w history handling (POC)
    if (url.pathname == '/watch' && params.get('v') && !params.get('list')) {
        sessionStorage.historyStackSize = '0';
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            sessionStorage.historyStackSize = (+sessionStorage.historyStackSize + 1).toString();
            document.querySelector('.ytp-next-button').click()
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            if (+sessionStorage.historyStackSize > 0) {
                sessionStorage.historyStackSize = (+sessionStorage.historyStackSize - 1).toString();
                window.history.back();
            }
        });

        console.info('[*] Custom media key handlers loaded.');
    }
})();