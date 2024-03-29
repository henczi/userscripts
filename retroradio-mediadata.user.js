// ==UserScript==
// @name         Retro radio mediadata
// @version      0.1.3
// @match        http://stream1.retroradio.hu/mid.mp3*
// @match        http://stream2.retroradio.hu/mid.mp3*
// @match        http://stream3.retroradio.hu/mid.mp3*
// @match        http://stream4.retroradio.hu/mid.mp3*
// @match        http://stream5.retroradio.hu/mid.mp3*
// @match        http://stream6.retroradio.hu/mid.mp3*
// @downloadURL  https://github.com/henczi/userscripts/raw/master/retroradio-mediadata.user.js
// ==/UserScript==

(function() {
  'use strict';
async function getSize(img){
return new Promise(r => {
  var image = new Image();
  image.onload = function(){
    r(image.width+'x'+image.height);
  }
  image.src = img;
});
}


async function doit() {
var retry = 30000;
var sleep = t => new Promise(r => setTimeout(r,t));
while(1) {
  try {var res = await fetch('https://www.retroradio.hu/stream/stream.php').then(x => x.json());}
  catch (e) { console.log(`retry: ${retry}ms ...`); await sleep(retry); continue; }
  var now = +new Date;
  var next_start = res.player[0].length ? ((+new Date(res.player[0].idopont)) + (+res.player[0].length)) : (+new Date(res.player[1].idopont));
  var wait = Math.max(next_start - now, 0) + 3000;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: res.player[0].title,
    artist: res.player[0].artist,
    artwork: [{src: res.player[0].cover, sizes: await getSize(res.player[0].cover), type: 'image/png'}]
  });
  console.log(`wait: ${wait}ms ...`);
  await sleep(wait);
}
}

if ("mediaSession" in navigator) doit();
})();