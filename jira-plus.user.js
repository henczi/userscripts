// ==UserScript==
// @name         Jira Plus
// @version      0.2.0
// @match        */secure/Tempo.jspa
// @require      https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.js
// ==/UserScript==

const vueRootId = 'jira-plus-plugin';

// XHR response hook
(function(open) {
    XMLHttpRequest.prototype.open = function(method, url) {
        if (method.toLowerCase() === 'post' && url === '/rest/tempo-timesheets/4/worklogs/search') {
            this.addEventListener('load', function() {
                var styleEl = document.getElementById('overide-tempo-style');
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.setAttribute('id', 'overide-tempo-style');
                    document.head.appendChild(styleEl);
                }
                var responseJSON = JSON.parse(this.responseText);
                if (responseJSON) {
                    styleEl.innerHTML = responseJSON.map(x => {
                        var rules = [];
                        if (x.attributes?.['_Overtime_']?.value === 'true') rules.push('border: 2px solid red;');
                        if (x.attributes?.['_On-site_']?.value === 'true') rules.push('background-color: #aaa;');
                        return rules.length ? `#WORKLOG-${x.tempoWorklogId} { ${ rules.join(';') } }` : '';
                    }).filter(Boolean).join('\n')
                }
            });
        }
        open.apply(this, arguments);
    };
})(XMLHttpRequest.prototype.open);


function logInfo() {
  console.log("%cJira+ extension \n%cversion: " + GM_info.script.version, "font-size: 1.6rem; font-weight: bold;", "");
}

function registerGlobalHelpers() {
  window.__reactGetInternalInstance = function (domEl) {
    var iis = Object.keys(domEl).filter(x => x.startsWith('__reactInternalInstance'));
    if (iis.length) {
      var iikey = iis[0];
      return domEl[iikey]
    }
    return null;
  }
  window.__reactGetEventHandlers = function (domEl) {
    var ehs = Object.keys(domEl).filter(x => x.startsWith('__reactEventHandlers'));
    if (ehs.length) {
      var ehkey = ehs[0];
      return domEl[ehkey]
    }
    return null;
  }
  window.__reactInputSetContent = function (selector = '#comment', text = 'komment') {
    var commentEl = document.querySelector(selector);
    const ehs = window.__reactGetEventHandlers(commentEl);
    ehs.onChange({ target: { value: text } })
    ehs.onBlur && ehs.onBlur();
  }
}

function injectGlobalStyle() {
  var sheet = document.createElement('style');
  sheet.innerHTML = `
  .jira-plus-plugin .cursor-pointer { cursor: pointer; }
  .jira-tempo-worklog-viewer { position: fixed; z-index: 10000; max-height: 500px; overflow-y: auto; display: none; }
  .jira-tempo-worklog-viewer.dropdown-container { border: 1px solid rgb(204, 204, 204); border-radius: .21428571em; box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 10px 4px; }
  .jira-tempo-worklog-viewer.dropdown-container { padding: 10px; background: white; }
  .jira-tempo-worklog-viewer.dropdown-container .item { padding: 10px; }
  .jira-tempo-worklog-viewer.dropdown-container .item:hover { background: rgb(220, 240, 253); }
  `;
  document.head.appendChild(sheet);
}

function registerComponents(Vue) {
  Vue.component('tempo-worklog-viewer-dropdown', {
    template: `
      <div ref="container" class="jira-tempo-worklog-viewer dropdown-container">
        <div>
          <strong>{{name}}</strong>
        </div>
        <div class="item cursor-pointer" v-for="item in data" @click.stop.prevent="select(item)" :title="item.authorName + ' - ' + item.date">
          <strong>{{item.comment}}</strong> ({{item.timeSpent}})
        </div>
      </div>
    `,
    data: () => ({
      name: '',
      commentBoxId: 'comment',
      data: []
    }),
    methods: {
      async load(worklogId) {
        this.data = [];
        this.name = worklogId;
        if (!worklogId) { return; }
        const res = await fetch(`/rest/api/2/issue/${worklogId}/worklog`, { "credentials": "include", "headers": {}, "body": null, "method": "GET" })
          .then(x => x.json())
          .then(x => x.worklogs.map(y => ({ comment: y.comment, timeSpent: y.timeSpent, authorName: y.author.displayName, date: y.started.split('T')[0] })).reverse())
        this.data = res.filter(x => x.comment.toLowerCase().indexOf('working on issue') < 0);
        if (this.data.length > 0) {
          this.show();
        }
      },
      select(t) {
        window.__reactInputSetContent('#comment', t.comment);
        window.__reactInputSetContent('#timeSpentSeconds', t.timeSpent);
        this.hide();
      },
      hide() {
        this.$refs.container.style.display = 'none';
      },
      show() {
        this.$refs.container.style.display = 'block';
      },
      onFocus(event) {
        const target = event.target
        if (target.id === this.commentBoxId) {
          const rect = target.getBoundingClientRect();
          this.$refs.container.style.top = `${rect.bottom}px`;
          this.$refs.container.style.left = `${rect.left}px`;
          this.$refs.container.style.width = `${(rect.right - rect.left)}px`;
          const worklogForm = (document.querySelector('#worklogForm'));
          if (worklogForm) {
            const isAdd = !!worklogForm.querySelector('#issuePickerInput');
            let issueKey = '';
            try {
              if (isAdd) {
                issueKey = ((worklogForm.querySelectorAll('.tuiForm__col, span[name^="selected_issue"')[0] || {}).textContent || '').split(':')[0]
              } else {
                issueKey = window.__reactGetInternalInstance(worklogForm.parentNode).memoizedProps.children.props.issue.key;
              }
            } catch (e) {
              console.log("Error: get issueKey", e);
            }
            if (issueKey) {
              this.load(issueKey);
            }
          }
        } else {
          this.hide();
        }
      },
      onBlur(event) {
        if (event.target.id === this.commentBoxId) {
          setTimeout(() => this.hide(), 150);
        }
      }
    },
    created() {
      window.addEventListener('focus', this.onFocus.bind(this), true);
      window.addEventListener('blur', this.onBlur.bind(this), true);
    }
  });
}

function main() {
  const Vue = window.Vue;

  logInfo();
  injectGlobalStyle();

  registerComponents(Vue);

  // Extension container
  var extensionContainer = document.createElement('div');
  extensionContainer.setAttribute('class', 'jira-plus-plugin')

  // Vue app element
  var vAppRoot = document.createElement('div');
  vAppRoot.setAttribute('id', vueRootId);
  extensionContainer.appendChild(vAppRoot);
  document.body.appendChild(extensionContainer);

  var app = new Vue({
    el: '#' + vueRootId,
    template: '<tempo-worklog-viewer-dropdown/>'
  });
}

(function () {
  'use strict';
  registerGlobalHelpers();
  window.onload = main;
})();