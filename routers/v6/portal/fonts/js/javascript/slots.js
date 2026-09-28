// نظام المواضع - يجلب data/slots.json ويضع الصور في مواضعها (الشعار + رمضان)
window.SLOTS = {};
(function () {
    function base() { return (typeof sp !== 'undefined') ? sp : ''; }
    function src(v) { if (!v) return null; return (/^https?:|^data:|^\/|^\.|^img\//.test(v)) ? v : base() + v; }

    function applySlots() {
        var s = window.SLOTS || {};
        var v;
        // الشعار + الأيقونة
        if ((v = src(s.logo))) {
            var img = document.getElementById('delayed-image');
            if (img) img.src = v;
            var fav = document.querySelector('link[rel="shortcut icon"], link[rel="icon"]');
            if (fav) fav.href = v;
            var lg = document.querySelector('.logo');
            if (lg) { lg.style.backgroundImage = 'url("' + v + '")'; lg.style.backgroundSize = 'contain'; lg.style.backgroundRepeat = 'no-repeat'; lg.style.backgroundPosition = 'center'; }
        }
        // رمضان
        var map = { 'ramadan-top': 'imges2', 'ramadan-side': 'imges4', 'ramadan-bottom': 'imges5' };
        Object.keys(map).forEach(function (k) {
            if ((v = src(s[k]))) { var el = document.getElementById(map[k]); if (el) el.src = v; }
        });
    }

    function load() {
        if (typeof CacheManager === 'undefined' || !CacheManager.fetchWithCache) { setTimeout(load, 150); return; }
        CacheManager.fetchWithCache('data/slots.json?t=' + Date.now(), 'cached_slots')
            .then(function (d) {
                if (!d) return;
                window.SLOTS = (typeof d === 'object' && d !== null && !Array.isArray(d)) ? d : {};
                applySlots();
            })
            .catch(function (e) { console.warn('slots load:', e); });
    }

    window.addEventListener('cacheUpdated', function (e) {
        if (e.detail && e.detail.key === 'cached_slots') {
            window.SLOTS = e.detail.data || {};
            applySlots();
        }
    });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applySlots);
    setTimeout(applySlots, 0);
    load();
})();
