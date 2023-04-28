// ==UserScript==
// @name         Deno Deploy webCTL
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Deno Deploy webCTL
// @author       You
// @match        https://dash.deno.com/projects/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=deno.dev
// @grant        none
// @downloadURL  https://github.com/henczi/userscripts/raw/master/deno-deploy-webctl.user.js
// ==/UserScript==


(function() {
    'use strict';

    const wait = (t = 500) => new Promise(r => setTimeout(r, t))
    window.addEventListener('load', async function() {

        console.log('DENO webCTL')

        await wait();

        const isDeployCTL = document.querySelector('.leading-tight')?.textContent?.trim() === 'via deployctl';
        const projectId = location.href.match(/\/projects\/(.*?)$/)[1];
        const token = localStorage.getItem('token') ?? localStorage.getItem('X-APITOKEN') ?? prompt("Please provide a valid access token", "");

        if (!isDeployCTL) {
            console.log('Not deployclt project!')
            return;
        }

        if (!projectId) {
            console.log('Missing project!')
            return;
        }

        if (!token) {
            console.log('Missing token!')
            return;
        }

        if (!localStorage.getItem('token')) {
            localStorage.setItem('X-APITOKEN', token)
        }

        const mainContainer = document.querySelector('div.w-full');

        const newContainer = document.createElement('div');

        newContainer.innerHTML = `
        <div class="flex gap-1.5">
            <input type="text" class="DEPLOY-URL border rounded-md border-gray-300 bg-white h-9 flex-grow sm:w-70 px-3 text-gray-500 outline-none focus:text-gray-800 focus:border-gray-500 hover:border-gray-500 transition-colors" value="">
            <button class="DEPLOY h-9 px-4.5 rounded-md inline-flex flex-shrink-0 whitespace-nowrap items-center gap-2 transition-colors duration-150 ease-in-out leading-none border-1 cursor-pointer border-gray-200/60 bg-gray-200/60 text-gray-900 hover:bg-gray-200 hover:text-gray-900">
                Deploy
            </button>
            <button class="DEPLOY-PROD h-9 px-4.5 rounded-md inline-flex flex-shrink-0 whitespace-nowrap items-center gap-2 transition-colors duration-150 ease-in-out leading-none border-1 cursor-pointer border-primary bg-primary text-white hover:color-primary hover:bg-white">
                Deploy Prod
            </button>
        </div>
        `

        newContainer.className = "mt-3";

        mainContainer.insertBefore(newContainer, mainContainer.querySelector('header').nextSibling);

        newContainer.querySelector('.DEPLOY').addEventListener('click', () => deployUrl(newContainer.querySelector('.DEPLOY-URL').value, false))
        newContainer.querySelector('.DEPLOY-PROD').addEventListener('click', () => deployUrl(newContainer.querySelector('.DEPLOY-URL').value, true))

        async function deployUrl(url, production) {
            url = url.trim()
            if(!url) {
                console.log('Missin URL')
                return;
            }

            let request = {
                url,
                importMapUrl: null,
                production,
                manifest: undefined,
            };

            let form = new FormData();
            form.append("request", JSON.stringify(request));

            newContainer.querySelector('.DEPLOY-URL').value = '';
            try {

                const { status } = await fetch(`https://dash.deno.com/api/projects/${projectId}/deployment_with_assets`, {
                    headers: {
                        "Accept": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    method: 'POST',
                    body: form
                });
                if (status === 200) {
                    alert(`${status} - Successful deployment!`);
                }
                else {
                    alert(`Statuscode: ${status}`);
                }
            } catch (e) {
                alert(`Deployment failed - ${e.message}`);
            }
        }

    });

})();