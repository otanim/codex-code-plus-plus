// ==UserScript==
// @name         Codex task – Code++ queue helper
// @namespace    https://chatgpt.com/
// @version      0.1.0
// @description  Adds a “Code++” button to Codex task pages, storing each prompt in a persistent queue and displaying them as numbered toasts (375 px min‑width) that you can drag‑resize, reorder (up/down) or delete. Inline SVG icons keep it CSP‑safe, and the queue auto‑executes tasks while marking toasts as processing or done.
// @match        https://chatgpt.com/codex/tasks/task*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    /*************** constants ***************/
    const STOP_SEL   = '[data-testid="stop-button"]';
    const CODE_CLASS = 'code-plus-plus-inject-btn';
    const EDITOR_SEL = '#prompt-textarea';
    const LS_PREFIX  = 'code-plus-plusQueue:';
    const PAGE_KEY   = LS_PREFIX + location.pathname;
    const MIN_WIDTH  = 375; // enforce minimum width

    console.log('[code-plus-plus] v0.1.0');

    /*************** queue helpers ***************/
    const getQ  = () => JSON.parse(localStorage.getItem(PAGE_KEY) || '[]');
    const saveQ = q  => localStorage.setItem(PAGE_KEY, JSON.stringify(q));

    /*************** inline SVG icons ***************/
    const upSvg = '<svg aria-hidden="true" class="svg-up" viewBox="0 0 448 512" fill="currentColor"><path d="M224 128L96 256h256L224 128z"/></svg>';
    const downSvg = '<svg aria-hidden="true" class="svg-down" viewBox="0 0 448 512" fill="currentColor"><path d="M224 384l128-128H96l128 128z"/></svg>';
    const trashSvg = '<svg aria-hidden="true" class="svg-trash" viewBox="0 0 448 512" fill="currentColor"><path d="M135.2 17.7C140.6 7.1 150.1 0 160 0h128c9.9 0 19.4 7.1 24.8 17.7l12 24H416c17.7 0 32 14.3 32 32v16c0 8.8-7.2 16-16 16H16c-8.8 0-16-7.2-16-16V73.7c0-17.7 14.3-32 32-32h79.2l12-24zM53.2 467c2.4 26.7 24.3 45 50.9 45h239.8c26.6 0 48.5-18.3 50.9-45L416 128H32l21.2 339z"/></svg>';

    /*************** inject CSS ***************/
    const style = document.createElement('style');
    style.textContent = `
#code-plus-plus-toast-container {
  position: fixed;
  right: 32px;
  bottom: 16px;
  display: flex;
  flex-direction: column; /* was column-reverse */
  align-items: flex-end;
  gap: 8px;
  z-index: 2147483647;
}
.code-plus-plus-toast {
  position: relative;
  width: ${MIN_WIDTH}px;
  max-width: 100%;
  background: #242424;
  color: #fff;
  padding: 10px 14px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  font-size: 14px;
  line-height: 1.4;
  overflow: hidden;
}
.code-plus-plus-toast.processing {
  border-left: 4px solid #ffd54f;
}
.code-plus-plus-toast.done {
  opacity: 0.6;
  text-decoration: line-through;
}
.toast-badge {
  display: inline-block;
  background: #fff;
  color: #242424;
  border-radius: 4px;   /* small rounding for a square badge */
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  font-weight: bold;
  margin-right: 8px;
}
.toast-text {
  margin-right: 90px;
  white-space: pre-wrap;
  word-break: break-word;
}
.toast-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  gap: 8px;
}
.toast-actions svg {
  cursor: pointer;
  transition: color 0.2s, transform 0.2s;
}
.toast-actions svg.svg-trash {
  width: 14px;
  height: 14px;
  color: #e57373;
}
.toast-actions svg.svg-trash:hover {
  color: #ef9a9a;
}
/* bigger, more visible up/down icons */
.toast-actions svg.svg-up,
.toast-actions svg.svg-down {
  width: 20px;
  height: 20px;
  color: #ccc;
}
.toast-actions svg.svg-up:hover,
.toast-actions svg.svg-down:hover {
  color: #fff;
  transform: scale(1.3);
}
/* Resizer handle on left edge */
.code-plus-plus-toast .resizer {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  z-index: 10;
}
`;
    document.head.appendChild(style);

    /*************** toast container ***************/
    let toastContainer;
    function ensureToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'code-plus-plus-toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    /*************** render toasts ***************/
    function renderToasts() {
        const container = ensureToastContainer();
        container.innerHTML = '';
        getQ().forEach((item, idx) => createToast(item, idx));
    }

    /*************** create single toast ***************/
    function createToast(item, idx) {
        const container = ensureToastContainer();
        const t = document.createElement('div');
        t.className = 'code-plus-plus-toast';
        t.dataset.idx = idx;

        // Resizer handle
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        t.appendChild(resizer);

        // Resizing logic
        let isResizing = false;
        resizer.addEventListener('mousedown', e => {
            e.preventDefault();
            isResizing = true;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', e => {
            if (!isResizing) return;
            const rect = t.getBoundingClientRect();
            t.style.width = Math.max(MIN_WIDTH, rect.right - e.clientX) + 'px';
        });
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
            }
        });

        // Content with badge
        const textEl = document.createElement('div');
        textEl.className = 'toast-text';
        const badge = document.createElement('span');
        badge.className = 'toast-badge';
        badge.textContent = idx + 1;
        const content = document.createElement('span');
        content.textContent = item;
        textEl.append(badge, content);

        // Actions container
        const actions = document.createElement('div');
        actions.className = 'toast-actions';

        // Move up
        if (idx > 0) {
            const upBtn = document.createElement('span');
            upBtn.innerHTML = upSvg;
            upBtn.title = 'Move up';
            upBtn.addEventListener('click', () => {
                const q = getQ();
                [q[idx-1], q[idx]] = [q[idx], q[idx-1]];
                saveQ(q);
                renderToasts();
            });
            actions.append(upBtn);
        }

        // Move down
        const qLen = getQ().length;
        if (idx < qLen - 1) {
            const downBtn = document.createElement('span');
            downBtn.innerHTML = downSvg;
            downBtn.title = 'Move down';
            downBtn.addEventListener('click', () => {
                const q = getQ();
                [q[idx], q[idx+1]] = [q[idx+1], q[idx]];
                saveQ(q);
                renderToasts();
            });
            actions.append(downBtn);
        }

        // Remove
        const trashBtn = document.createElement('span');
        trashBtn.innerHTML = trashSvg;
        trashBtn.title = 'Remove';
        trashBtn.addEventListener('click', () => {
            const q = getQ();
            q.splice(idx, 1);
            saveQ(q);
            renderToasts();
        });
        actions.append(trashBtn);

        t.append(textEl, actions);
        container.appendChild(t);
    }

    function markNextToastProcessing() {
        const toast = document.querySelector('#code-plus-plus-toast-container .code-plus-plus-toast:not(.done):not(.processing)');
        if (toast) toast.classList.add('processing');
    }

    function markNextToastCompleted() {
        const toast = document.querySelector('#code-plus-plus-toast-container .code-plus-plus-toast.processing');
        if (toast) {
            toast.classList.remove('processing');
            toast.classList.add('done');
        }
    }

    /*************** Code++ button ***************/
    function buildBtn() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn relative btn-primary btn-small ${CODE_CLASS}`;
        btn.textContent = 'Code++';
        btn.addEventListener('click', ev => {
            ev.stopPropagation();
            const ed = document.querySelector(EDITOR_SEL);
            const text = ed ? (ed.innerText.trim() || '(empty)') : '(empty)';
            const q = getQ();
            q.push(text);
            saveQ(q);
            renderToasts();

            const placeholder = document.querySelector('.placeholder');
            if (placeholder) simulateClick(placeholder);

            if (ed) {
                const textarea = ed;
                const fire = (type, key, opts = {}) => {
                    const code = key === 'Delete' ? 46 : key.toUpperCase().charCodeAt(0);
                    textarea.dispatchEvent(new KeyboardEvent(type, {
                        key,
                        keyCode: code,
                        which: code,
                        bubbles: true,
                        cancelable: true,
                        ...opts
                    }));
                };
                fire('keydown', 'a', { ctrlKey: true });
                fire('keyup', 'a', { ctrlKey: true });
                fire('keydown', 'Delete');
                textarea.innerText = '';
                textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
                fire('keyup', 'Delete');
            }
        });
        return btn;
    }

    /*************** UI hook ***************/
    function attachIfNeeded(stopBtn) {
        const row = stopBtn.parentElement;
        if (!row || row.querySelector(`.${CODE_CLASS}`)) return;
        if (!row.closest('.contents, .apper')) return;
        row.appendChild(buildBtn());
    }

    function detachOrphans() {
        document.querySelectorAll(`.${CODE_CLASS}`).forEach(btn => {
            const row = btn.parentElement;
            if (!row || !row.querySelector(STOP_SEL)) btn.remove();
        });
    }

    const DEFAULT_TIMEOUT = 10_000; //10s
    const CODE_TIMEOUT = 600_000; //10m

    /*************** helper: wait for visibility ***************/
    function waitForVisible(selector, timeout = DEFAULT_TIMEOUT) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const el = document.querySelector(selector);
                if (el && el.offsetParent !== null) return resolve(el);
                if (Date.now() - start >= timeout) return resolve(null);
                requestAnimationFrame(check);
            })();
        });
    }

    /*************** helper: wait for presence ***************/
    function waitForElement(selector, timeout = DEFAULT_TIMEOUT) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const el = document.querySelector(selector);
                if (el) return resolve(el);
                if (Date.now() - start >= timeout) return resolve(null);
                requestAnimationFrame(check);
            })();
        });
    }

    /*************** helper: simulate click ***************/
    function simulateClick(el) {
        ['mousedown', 'mouseup', 'click'].forEach(type => {
            el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
        });
    }

    /*************** helper: simulate typing ***************/
    function simulateTyping(el, text) {
        ['mousedown', 'mouseup', 'click'].forEach(t =>
            el.dispatchEvent(new MouseEvent(t, { bubbles: true }))
        );
        el.focus();
        el.innerText = '';
        el.dispatchEvent(new InputEvent('input', { bubbles: true }));
        const fireKey = (type, ch) => {
            const code = ch.charCodeAt(0);
            el.dispatchEvent(new KeyboardEvent(type, {
                key: ch,
                char: ch,
                keyCode: code,
                which: code,
                bubbles: true,
                cancelable: true
            }));
        };
        for (const ch of text) {
            fireKey('keydown', ch);
            el.innerText += ch;
            el.dispatchEvent(new InputEvent('input', { data: ch, inputType: 'insertText', bubbles: true }));
            fireKey('keyup', ch);
        }
    }

    /*************** helper: wait for Code button ***************/
    function waitForCodeButton(timeout = DEFAULT_TIMEOUT) {
        const sel = 'div.flex.items-center.justify-center';
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const btn = [...document.querySelectorAll(sel)]
                    .find(el => el.textContent.trim() === 'Code' && el.offsetParent !== null);
                if (btn) return resolve(btn);
                if (Date.now() - start >= timeout) return resolve(null);
                requestAnimationFrame(check);
            })();
        });
    }

    /*************** helper: wait until element hidden or removed ***************/
    function waitForGone(selector, timeout = DEFAULT_TIMEOUT) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const el = document.querySelector(selector);
                if (!el || el.offsetParent === null) return resolve(true);
                if (Date.now() - start >= timeout) return resolve(false);
                requestAnimationFrame(check);
            })();
        });
    }

    /*************** helpers: Code++ button detection ***************/
    function queryCodePlus() {
        return [...document.querySelectorAll('button,div')]
            .find(el => el.textContent.trim() === 'Code++' &&
                !el.classList.contains(CODE_CLASS));
    }

    function waitForCodePlusVisible(timeout = DEFAULT_TIMEOUT) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const el = queryCodePlus();
                if (el && el.offsetParent !== null) return resolve(el);
                if (Date.now() - start >= timeout) return resolve(null);
                requestAnimationFrame(check);
            })();
        });
    }

    function waitForCodePlusGone(timeout = DEFAULT_TIMEOUT) {
        return new Promise(resolve => {
            const start = Date.now();
            (function check() {
                const el = queryCodePlus();
                if (!el || el.offsetParent === null) return resolve(true);
                if (Date.now() - start >= timeout) return resolve(false);
                requestAnimationFrame(check);
            })();
        });
    }

    /*************** queued task opener ***************/
    async function handleQueueOnLoad() {
        console.log('[code-plus-plus] handleQueueOnLoad start');
        const contentsSel = '.contents';
        const actionsSel = '[data-testid="composer-footer-actions"]';
        const placeholderSel = '.placeholder';
        const composerBtnSel = '.composer-btn';

        let queue = getQ();
        if (!queue.length) return;
        console.log(`[code-plus-plus] tasks queued: ${queue.length}`);

        await waitForElement(contentsSel, DEFAULT_TIMEOUT);

        let actions = document.querySelector(actionsSel);
        const actionsVisible = actions && actions.offsetParent !== null;
        console.log(`[code-plus-plus] actions initially visible: ${actionsVisible}`);
        if (!actionsVisible) {
            const placeholder = await waitForVisible(placeholderSel, DEFAULT_TIMEOUT);
            console.log(`[code-plus-plus] placeholder visible: ${!!placeholder}`);
            if (placeholder) {
                simulateClick(placeholder);
                console.log('[code-plus-plus] placeholder clicked');
            }
            actions = await waitForVisible(actionsSel, DEFAULT_TIMEOUT);
        } else {
            actions = await waitForVisible(actionsSel, DEFAULT_TIMEOUT);
        }
        console.log(`[code-plus-plus] actions visible: ${!!actions}`);
        if (!actions) return;

        const composerBtn = await waitForVisible(composerBtnSel, DEFAULT_TIMEOUT);
        console.log(`[code-plus-plus] ${composerBtn ? 'fresh' : 'non fresh'}`);

        while ((queue = getQ()).length) {
            markNextToastProcessing();
            const task = queue.shift();
            const textarea = await waitForElement(EDITOR_SEL, DEFAULT_TIMEOUT);
            if (!textarea) break;
            console.log('[code-plus-plus] typing queued task');
            simulateTyping(textarea, task);
            saveQ(queue);

            const codeBtn = await waitForCodeButton(CODE_TIMEOUT);
            if (!codeBtn) break;

            simulateClick(codeBtn);
            console.log('[code-plus-plus] Code button clicked');

            console.log('[code-plus-plus] waiting for Code++ to appear');
            const codePlus = await waitForCodePlusVisible(DEFAULT_TIMEOUT);
            console.log(`[code-plus-plus] Code++ appeared: ${!!codePlus}`);
            if (codePlus) {
                const gone = await waitForCodePlusGone(CODE_TIMEOUT);
                console.log(`[code-plus-plus] Code++ gone: ${gone}`);
            }

            markNextToastCompleted();
            queue = getQ();
            if (queue[0] === task) {
                queue.shift();
                saveQ(queue);
            }
            await new Promise(r => setTimeout(r, 500));
        }

        console.log('[code-plus-plus] queue processing done');
    }

    // Initial hook and observer
    document.querySelectorAll(STOP_SEL).forEach(attachIfNeeded);
    detachOrphans();
    new MutationObserver(muts => {
        muts.forEach(m => m.addedNodes.forEach(n => {
            if (!(n instanceof HTMLElement)) return;
            if (n.matches(STOP_SEL)) attachIfNeeded(n);
            n.querySelectorAll(STOP_SEL).forEach(attachIfNeeded);
        }));
        detachOrphans();
    }).observe(document.body, { childList: true, subtree: true });

    // Initial render
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            renderToasts();
            handleQueueOnLoad();
        });
    } else {
        renderToasts();
        handleQueueOnLoad();
    }

})();
