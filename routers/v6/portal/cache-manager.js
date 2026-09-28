(function() {
    'use strict';
    
    const CACHE_KEYS = {
        PROFILES: 'cached_profiles',
        SELL_POINTS: 'cached_sell_points',
        SCROLLING_TEXT: 'cached_scrolling_text',
        SETTINGS: 'cached_settings',
        COLORS: 'cached_colors',
        IMAGES: 'cached_images',
        SPEEDS: 'cached_speeds',
        TIMESTAMPS: 'cache_timestamps'
    };
    
    const CACHE_DURATION = 24 * 60 * 60 * 1000;
    
    function saveToCache(key, data) {
        try {
            const timestamps = getTimestamps();
            timestamps[key] = Date.now();
            
            localStorage.setItem(key, JSON.stringify(data));
            localStorage.setItem(CACHE_KEYS.TIMESTAMPS, JSON.stringify(timestamps));
            
            console.log(`✅ تم حفظ ${key} في الذاكرة المؤقتة`);
            return true;
        } catch (e) {
            console.warn(`⚠️ خطأ في حفظ ${key}:`, e);
            return false;
        }
    }
    
    function getFromCache(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const timestamps = getTimestamps();
            const timestamp = timestamps[key] || 0;
            const age = Date.now() - timestamp;
            
            if (age > 7 * 24 * 60 * 60 * 1000) {
                console.log(`🗑️ حذف ${key} المنتهية الصلاحية`);
                localStorage.removeItem(key);
                return null;
            }
            
            return JSON.parse(cached);
        } catch (e) {
            console.warn(`⚠️ خطأ في استرجاع ${key}:`, e);
            return null;
        }
    }
    
    function getTimestamps() {
        try {
            const timestamps = localStorage.getItem(CACHE_KEYS.TIMESTAMPS);
            return timestamps ? JSON.parse(timestamps) : {};
        } catch (e) {
            return {};
        }
    }
    
    function loadAndCacheProfiles() {
        const cached = getFromCache(CACHE_KEYS.PROFILES);
        
        if (cached && cached.length > 0) {
            console.log('📋 تحميل أسعار الكروت من الكاش');
            displayProfiles(cached);
        }
        
        fetch(`${sp}client/getprofiles${pp}?network_id=${nd}&read_pass=${rs}`)
            .then(r => r.json())
            .then(d => {
                if (d && d.profiles && d.profiles.length > 0) {
                    saveToCache(CACHE_KEYS.PROFILES, d.profiles);
                    displayProfiles(d.profiles);
                } else if (!cached) {
                    console.log('⚠️ لا توجد بيانات كروت');
                }
            })
            .catch(err => {
                console.warn('❌ خطأ في جلب الكروت:', err);
                if (!cached) {
                    console.log('⚠️ لا يوجد كاش متوفر');
                }
            });
    }
    function loadAndCacheSellPoints() {
        const cached = getFromCache(CACHE_KEYS.SELL_POINTS);
        
        if (cached && cached.length > 0) {
            console.log('🏪 تحميل نقاط البيع من الكاش');
            displaySellPoints(cached);
        }
        
        fetch(`${sp}client/getpoints${pp}?network_id=${nd}&read_pass=${rs}`)
            .then(r => r.json())
            .then(d => {
                if (d && d.points && d.points.length > 0) {
                    saveToCache(CACHE_KEYS.SELL_POINTS, d.points);
                    displaySellPoints(d.points);
                } else if (!cached) {
                    console.log('⚠️ لا توجد نقاط بيع');
                }
            })
            .catch(err => {
                console.warn('❌ خطأ في جلب نقاط البيع:', err);
            });
    }
    
    function loadAndCacheScrollingText() {
        const cached = getFromCache(CACHE_KEYS.SCROLLING_TEXT);
        
        if (cached) {
            console.log('📜 تحميل النص المتحرك من الكاش');
            displayScrollingText(cached);
        }
        
        fetch(`${sp}client/gettext${pp}?network_id=${nd}&read_pass=${rs}`)
            .then(r => r.json())
            .then(d => {
                if (d && d.text) {
                    saveToCache(CACHE_KEYS.SCROLLING_TEXT, d.text);
                    displayScrollingText(d.text);
                }
            })
            .catch(err => {
                console.warn('❌ خطأ في جلب النص المتحرك:', err);
            });
    }
    
    function loadAndCacheImages() {
        const cached = getFromCache(CACHE_KEYS.IMAGES);
        
        if (cached) {
            console.log('🖼️ تحميل الصور من الكاش');
            applyImages(cached);
        }
        
        fetch(`${sp}client/getimages${pp}?network_id=${nd}&read_pass=${rs}`)
            .then(r => r.json())
            .then(d => {
                if (d && d.images) {
                    saveToCache(CACHE_KEYS.IMAGES, d.images);
                    applyImages(d.images);
                }
            })
            .catch(err => {
                console.warn('❌ خطأ في جلب الصور:', err);
            });
    }
    
    function loadAndCacheColors() {
        const cached = getFromCache(CACHE_KEYS.COLORS);
        
        if (cached) {
            console.log('🎨 تحميل الألوان من الكاش');
            applyColors(cached);
        }
        
        fetch(`${sp}client/getcolors${pp}?network_id=${nd}&read_pass=${rs}`)
            .then(r => r.json())
            .then(d => {
                if (d && d.colors) {
                    saveToCache(CACHE_KEYS.COLORS, d.colors);
                    applyColors(d.colors);
                }
            })
            .catch(err => {
                console.warn('❌ خطأ في جلب الألوان:', err);
            });
    }
    
    function loadAndCacheSettings() {
        const cached = getFromCache(CACHE_KEYS.SETTINGS);
        
        if (cached) {
            console.log('⚙️ تحميل الإعدادات من الكاش');
        }
        
        fetch(`${sp}client/getsettings${pp}?action=get_settings&network_id=${nd}&read_pass=${rs}`)
            .then(r => r.json())
            .then(d => {
                if (d && !d.error) {
                    saveToCache(CACHE_KEYS.SETTINGS, d);
                }
            })
            .catch(err => {
                console.warn('❌ خطأ في جلب الإعدادات:', err);
            });
    }
    
    function displayProfiles(profiles) {
        const containers = document.querySelectorAll('#profiles');
        containers.forEach(container => {
            if (!container) return;
            
            container.innerHTML = '';
            profiles.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.price}</td>
                    <td>${p.time}</td>
                    <td>${p.transfer}</td>
                    <td>${p.validity}</td>
                `;
                container.appendChild(row);
            });
        });
    }
    
    function displaySellPoints(points) {
        const containers = document.querySelectorAll('#sell-points');
        containers.forEach(container => {
            if (!container) return;
            
            container.innerHTML = '';
            points.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${p.name}</td>`;
                container.appendChild(row);
            });
        });
    }
    
    function displayScrollingText(text) {
        const elements = document.querySelectorAll('#scroll-text-content, #scrolling-text');
        elements.forEach(el => {
            if (el) el.textContent = text;
        });
    }
    
    function applyImages(images) {
        if (images.logo) {
            const logoEl = document.getElementById('delayed-image');
            if (logoEl) logoEl.src = images.logo;
        }
        
        if (images.background) {
            document.body.style.backgroundImage = `url(${images.background})`;
        }
    }
    
    function applyColors(colors) {
        const root = document.documentElement;
        
        if (colors.primary) {
            root.style.setProperty('--primary-color', colors.primary);
        }
        if (colors.secondary) {
            root.style.setProperty('--secondary-color', colors.secondary);
        }
        if (colors.background) {
            root.style.setProperty('--background-color', colors.background);
        }
    }
    
    function cleanOldCache() {
        const timestamps = getTimestamps();
        const now = Date.now();
        let cleaned = false;
        
        Object.keys(timestamps).forEach(key => {
            const age = now - timestamps[key];
            if (age > 30 * 24 * 60 * 60 * 1000) { // 30 يوم
                console.log(`🗑️ حذف ${key} القديم جداً`);
                localStorage.removeItem(key);
                delete timestamps[key];
                cleaned = true;
            }
        });
        
        if (cleaned) {
            localStorage.setItem(CACHE_KEYS.TIMESTAMPS, JSON.stringify(timestamps));
        }
    }
    
    function refreshAllData() {
        console.log('🔄 بدء تحديث جميع البيانات...');
        loadAndCacheProfiles();
        loadAndCacheSellPoints();
        loadAndCacheScrollingText();
        loadAndCacheImages();
        loadAndCacheColors();
        loadAndCacheSettings();
    }
    
    window.CacheManager = {
        refresh: refreshAllData,
        clear: function() {
            Object.values(CACHE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('🗑️ تم مسح جميع البيانات المخزنة');
        },
        getStatus: function() {
            const timestamps = getTimestamps();
            const status = {};
            
            Object.keys(CACHE_KEYS).forEach(key => {
                const cacheKey = CACHE_KEYS[key];
                const data = getFromCache(cacheKey);
                const timestamp = timestamps[cacheKey];
                
                status[key] = {
                    cached: !!data,
                    timestamp: timestamp,
                    age: timestamp ? Date.now() - timestamp : null
                };
            });
            
            return status;
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            cleanOldCache();
            refreshAllData();
        });
    } else {
        cleanOldCache();
        refreshAllData();
    }
    
    console.log('✅ نظام التخزين المؤقت جاهز');
})();
