if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.nodeType === 1 && (el.matches || el.webkitMatchesSelector || el.msMatchesSelector).call(el, s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el && el !== document.body);
        return null;
    };
}

function loadJSON(key) {
    try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
}
function saveJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
function clearSaved(key) {
    localStorage.removeItem(key);
}

var PIECE_WHITE_FILL, PIECE_WHITE_STROKE, PIECE_BLACK_FILL, PIECE_BLACK_STROKE;
(function() {
    var cs = document.documentElement && getComputedStyle(document.documentElement);
    if (cs) {
        PIECE_WHITE_FILL = (cs.getPropertyValue('--piece-white-fill') || '#faf7f2').trim();
        PIECE_WHITE_STROKE = (cs.getPropertyValue('--piece-white-stroke') || '#2c2c2c').trim();
        PIECE_BLACK_FILL = (cs.getPropertyValue('--piece-black-fill') || '#2c2c2c').trim();
        PIECE_BLACK_STROKE = (cs.getPropertyValue('--piece-black-stroke') || '#faf7f2').trim();
    } else {
        PIECE_WHITE_FILL = '#faf7f2';
        PIECE_WHITE_STROKE = '#2c2c2c';
        PIECE_BLACK_FILL = '#2c2c2c';
        PIECE_BLACK_STROKE = '#faf7f2';
    }
})();

var BACK_BTN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 183.192 145"><path d="m96.127 145 .137-47.578h86.928V47.578H96.264L96.127 0 0 72.5z" style="fill:#fff"/></svg>';
var FORWARD_BTN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="183.2" height="145" viewBox="0 0 183.2 145"><path d="m87.1 0-.2 47.6H0v49.8h86.9l.2 47.6 96.1-72.5z" style="fill:#2c2c2c"/></svg>';

var MODAL_BACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 375.8 521.5"><path d="M332.7 0H34C15.4 0 0 17 0 37.9v483.6l146.2-141.3 146.2 141.3V49a27 27 0 0 1 15.7-25c15-6.3 25 15.9 10.3 23a51 51 0 0 1-10.1 3.5v31.2H374S388.7 0 332.7 0m-99.5 225v24.8h-87v47.6L50 225l96.1-72.5.2 47.6h87z" style="fill:#2c2c2c"/></svg>';
var MODAL_INFO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 375.8 521.5"><path d="M332.7 0H34C15.4 0 0 17 0 37.9v483.6l146.2-141.3 146.2 141.3V49a27 27 0 0 1 15.7-25c15-6.3 25 15.9 10.3 23a51 51 0 0 1-10.1 3.5v31.2H374S388.7 0 332.7 0m-173 298.5q-6 5.8-14.3 5.8t-14.5-5.8q-6-6-6.1-14t6.1-14 14.5-6a20 20 0 0 1 14.3 6 19 19 0 0 1 0 28m29.9-73.2a64 64 0 0 1-39.3 15.3l-.7 14.5h-9.5v-41.5a38 38 0 0 0 24.3-9.8 31 31 0 0 0 8.7-23.1q0-11.7-6.1-18.6t-16.5-7q-4.4 0-7.8.9-3.5.9-6.6 2.8l2.5 8.8q1.5 5.5 1.4 10 0 7.5-4.8 11.6a20 20 0 0 1-13.5 4q-8.1 0-12.8-5a18 18 0 0 1-4.6-12.6q0-12.3 14-20.8a64 64 0 0 1 33.7-8.6q23.4 0 37.8 12.2a40 40 0 0 1 14.5 32.1q0 21.5-14.7 34.8" style="fill:#2c2c2c"/></svg>';

function bindHistoryBack(ids, fn) {
    for (var i = 0; i < ids.length; i++) bindButton(ids[i], fn);
}
function bindHistoryForward(ids, fn) {
    for (var i = 0; i < ids.length; i++) bindButton(ids[i], fn);
}

function updateHistoryButtons(backIds, forwardIds, historyIndex, historyLength, opts) {
    opts = opts || {};
    var isGameOver = opts.isGameOver || false;
    for (var i = 0; i < backIds.length; i++) {
        var el = document.getElementById(backIds[i]);
        if (el) {
            el.disabled = historyIndex <= 0;
            el.innerHTML = BACK_BTN_SVG;
        }
    }
    for (var i = 0; i < forwardIds.length; i++) {
        var btn = document.getElementById(forwardIds[i]);
        if (!btn) continue;
        if (isGameOver && historyIndex === historyLength - 1) {
            btn.disabled = false;
            btn.innerHTML = 'New';
            btn.classList.add('btn-new');
        } else {
            btn.disabled = historyIndex >= historyLength - 1;
            btn.innerHTML = FORWARD_BTN_SVG;
            btn.classList.remove('btn-new');
        }
    }
}

function isKindle() { return /Kindle|Silk/i.test(navigator.userAgent); }
function refreshEink() {
    if (!isKindle()) return;
    var overlay = document.getElementById('eink-refresh-overlay');
    if (!overlay) return;
    setTimeout(function() {
        overlay.style.display = 'block';
        overlay.style.backgroundColor = '#000';
        setTimeout(function() {
            overlay.style.backgroundColor = '#fff';
            setTimeout(function() {
                overlay.style.display = 'none';
                overlay.style.backgroundColor = '#000';
            }, 100);
        }, 300);
    }, 100);
}

var isFullscreenMode = false;
var _onFullscreenExit;
var _fullscreenListenersAdded = false;

function toggleFullscreenMode(afterCallback) {
    isFullscreenMode = !isFullscreenMode;
    if (isFullscreenMode) {
        document.body.classList.add('fullscreen-mode');
        var elem = document.documentElement;
        var req = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
        if (req) req.call(elem).catch(function() {});
    } else {
        document.body.classList.remove('fullscreen-mode');
        var exit = document.exitFullscreen || document.webkitExitFullscreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen;
        if (exit && (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement)) exit.call(document).catch(function() {});
    }
    if (afterCallback) afterCallback();
}

function handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        if (isFullscreenMode) {
            isFullscreenMode = false;
            document.body.classList.remove('fullscreen-mode');
            if (_onFullscreenExit) _onFullscreenExit();
        }
    }
}

function initFullscreen(onExit) {
    _onFullscreenExit = onExit;
    if (!_fullscreenListenersAdded) {
        _fullscreenListenersAdded = true;
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    }
}

var _doubleTapLastTime = 0;
function initDoubleTapFullscreen(containerSelector) {
    containerSelector = containerSelector || '.board-container';
    initFullscreen(refreshEink);
    function handleTap(e) {
        var container = document.querySelector(containerSelector);
        if (!container) return;
        var outside = !container.contains(e.target);
        var isBtn = e.target.classList && (e.target.classList.contains('btn') || (e.target.closest && e.target.closest('.btn')));
        var isModalOrLink = e.target.closest && (e.target.closest('.promotion-modal') || e.target.closest('a'));
        if (!outside || isBtn || isModalOrLink) return;
        var now = Date.now();
        if (now - _doubleTapLastTime < 500) {
            toggleFullscreenMode(refreshEink);
            _doubleTapLastTime = 0;
        } else {
            _doubleTapLastTime = now;
        }
    }
    document.addEventListener('touchstart', function(e) {
        var container = document.querySelector(containerSelector);
        if (!container) return;
        var outside = !container.contains(e.target);
        var isBtn = e.target.classList && (e.target.classList.contains('btn') || (e.target.closest && e.target.closest('.btn')));
        var isModalOrLink = e.target.closest && (e.target.closest('.promotion-modal') || e.target.closest('a'));
        if (outside && !isBtn && !isModalOrLink) {
            e.preventDefault();
            handleTap(e);
        }
    }, { passive: false });
    document.addEventListener('click', handleTap);
}

function registerServiceWorker(path) {
    path = path || '../sw.js';
    if ('serviceWorker' in navigator) navigator.serviceWorker.register(path).catch(function() {});
}

function runOnReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
}

function bindButton(el, fn) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el) return;
    el.onclick = fn;
    el.addEventListener('touchstart', function(e) { e.preventDefault(); fn.call(el); }, { passive: false });
}
function bindCell(el, handler) {
    if (!el) return;
    el.addEventListener('touchstart', function(e) { e.preventDefault(); handler.call(el, e); }, { passive: false });
    el.onclick = handler;
}
function bindOptions(selector, fn) {
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) bindButton(els[i], fn);
}

function showModal(elOrId) {
    var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.classList.add('show');
    el.setAttribute('aria-hidden', 'false');
}

function hideModal(elOrId) {
    var el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.classList.remove('show');
    el.setAttribute('aria-hidden', 'true');
}

function bindModal(modalId, openBtnId, closeBtnId) {
    var modal = document.getElementById(modalId);
    var openBtn = document.getElementById(openBtnId);
    var closeBtn = closeBtnId ? document.getElementById(closeBtnId) : null;
    if (!closeBtn && modal) {
        var content = modal.querySelector('.variants-info-content');
        closeBtn = content ? content.querySelector('.variants-info-close') : null;
        if (!closeBtn && content) {
            closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'variants-info-close';
            closeBtn.setAttribute('aria-label', 'Close');
            content.appendChild(closeBtn);
        }
    }
    if (openBtn) bindButton(openBtn, function() { showModal(modal); });
    if (closeBtn) bindButton(closeBtn, function() { hideModal(modal); });
    if (modal) modal.onclick = function(e) { if (e.target === modal) hideModal(modal); };
}

var _welcomeContinueOpts = null;
function updateWelcomeContinueButton() {
    if (!_welcomeContinueOpts || !_welcomeContinueOpts.btnId || typeof _welcomeContinueOpts.hasSave !== 'function') return;
    var btn = document.getElementById(_welcomeContinueOpts.btnId);
    if (btn) btn.disabled = !_welcomeContinueOpts.hasSave();
}
function showWelcome(modalId, footerId) {
    var modal = document.getElementById(modalId);
    var footer = footerId ? document.getElementById(footerId) : null;
    if (modal) modal.style.display = 'flex';
    if (footer) footer.style.display = 'block';
    updateWelcomeContinueButton();
}

function hideWelcome(modalId, footerId) {
    var modal = document.getElementById(modalId);
    var footer = footerId ? document.getElementById(footerId) : null;
    if (modal) modal.style.display = 'none';
    if (footer) footer.style.display = 'none';
}

function runWelcomeFlow(opts) {
    if (opts.continueBtnId) _welcomeContinueOpts = { btnId: opts.continueBtnId, hasSave: opts.hasSave };
    showWelcome(opts.modalId, opts.footerId);
    if (opts.continueBtnId) {
        var btn = document.getElementById(opts.continueBtnId);
        if (btn) bindButton(btn, function() { if (btn.disabled) return; opts.onContinue(); });
    }
    if (opts.newButtons) {
        for (var i = 0; i < opts.newButtons.length; i++) bindButton(opts.newButtons[i].id, opts.newButtons[i].fn);
    }
    if (opts.infoModal) bindModal(opts.infoModal.modalId, opts.infoModal.openBtnId, opts.infoModal.closeBtnId);
}

var _backToWelcomeBound = false;
function initBackToWelcome(modalId, footerId) {
    if (history.replaceState) history.replaceState({ step: 'welcome' }, '', location.href);
    if (!_backToWelcomeBound) {
        _backToWelcomeBound = true;
        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.step === 'welcome') showWelcome(modalId, footerId);
        });
    }
}
function pushStatePlaying() {
    if (history.pushState) history.pushState({ step: 'playing' }, '', location.href);
}

function initModalSvgs() {
    var backLinks = document.querySelectorAll('.welcome-back-link');
    for (var i = 0; i < backLinks.length; i++) backLinks[i].innerHTML = MODAL_BACK_SVG;
    var infoBtns = document.querySelectorAll('.welcome-variants-info-btn');
    for (var i = 0; i < infoBtns.length; i++) infoBtns[i].innerHTML = MODAL_INFO_SVG;
}
function initNavSvgs() {
    var backBtns = document.querySelectorAll('.btn-nav-back');
    for (var i = 0; i < backBtns.length; i++) backBtns[i].innerHTML = BACK_BTN_SVG;
    var fwdBtns = document.querySelectorAll('.btn-nav-forward');
    for (var i = 0; i < fwdBtns.length; i++) fwdBtns[i].innerHTML = FORWARD_BTN_SVG;
}
function initPageSvgs() {
    initModalSvgs();
    initNavSvgs();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPageSvgs);
else initPageSvgs();

runOnReady(function() {
    if (document.querySelector('.board-container')) {
        initDoubleTapFullscreen('.board-container');
        registerServiceWorker('../sw.js');
    }
});
