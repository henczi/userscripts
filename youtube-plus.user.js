// ==UserScript==
// @name         YouTubePlus
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @match        https://www.youtube.com/*
// @grant        none
// @downloadURL  https://github.com/henczi/userscripts/raw/master/youtube-plus.user.js
// ==/UserScript==

(function() {
    'use strict';
    (document.querySelector('video').onplay = function() {
        setTimeout(function() {
            const url = new URL(location.href);
            const params = url.searchParams;

            // Fixup media session keys (Chrome) - w history handling (POC)
            if (url.pathname == '/watch' && params.get('v') && !params.get('list')) {
                navigator.mediaSession.setActionHandler('nexttrack', () => {
                    document.querySelector('.ytp-next-button').click()
                });
                navigator.mediaSession.setActionHandler('previoustrack', () => {
                    window.history.back();
                });

                console.info('[*] Custom media key handlers loaded.');
            }
        }, 1000);
    })()
})();