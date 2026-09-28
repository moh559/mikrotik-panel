(function() {
    'use strict';
    
    var CACHE_CONFIG = {
        enabled: true,
        version: '2.0',
        expiryHours: 72,
        maxRetries: 2,
        timeout: 8000
    };
    
    var CACHE_KEYS = {
        profiles: 'cached_profiles',
        points: 'cached_points',
        text: 'cached_text',
        images: 'cached_images',
        colors: 'cached_colors',
        settings: 'cached_settings',
        speeds: 'cachedSpeeds'
    };
    
    window.CacheManager = {
        
        pendingRequests: {},
        
        isValid: function(key) {
            try {
                var timestamp = localStorage.getItem(key + '_time');
                if (!timestamp) return false;
                
                var now = Date.now();
                var age = now - parseInt(timestamp);
                var maxAge = CACHE_CONFIG.expiryHours * 60 * 60 * 1000;
                
                return age < maxAge;
            } catch (e) {
                console.warn('خطأ في فحص صلاحية الكاش:', e);
                return false;
            }
        },
        
        set: function(key, data) {
            if (!CACHE_CONFIG.enabled) return false;
            
            try {
                localStorage.setItem(key, JSON.stringify(data));
                localStorage.setItem(key + '_time', Date.now().toString());
                localStorage.setItem(key + '_version', CACHE_CONFIG.version);
                return true;
            } catch (e) {
                console.warn('خطأ في حفظ الكاش:', e);
                this.clearOldCache();
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    localStorage.setItem(key + '_time', Date.now().toString());
                    return true;
                } catch (e2) {
                    console.error('فشل حفظ الكاش بعد التنظيف:', e2);
                    return false;
                }
            }
        },
        
        get: function(key) {
            if (!CACHE_CONFIG.enabled) return null;
            
            try {
                if (!this.isValid(key)) return null;
                
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.warn('خطأ في جلب الكاش:', e);
                return null;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_time');
                localStorage.removeItem(key + '_version');
            } catch (e) {
                console.warn('خطأ في حذف الكاش:', e);
            }
        },
        
        clearOldCache: function() {
            try {
                var keys = Object.keys(localStorage);
                var now = Date.now();
                var maxAge = CACHE_CONFIG.expiryHours * 60 * 60 * 1000;
                
                keys.forEach(function(key) {
                    if (key.endsWith('_time')) {
                        var timestamp = localStorage.getItem(key);
                        if (timestamp && (now - parseInt(timestamp) > maxAge)) {
                            var baseKey = key.replace('_time', '');
                            this.remove(baseKey);
                        }
                    }
                });
            } catch (e) {
                console.warn('خطأ في تنظيف الكاش:', e);
            }
        },
        
        clearAll: function() {
            try {
                Object.values(CACHE_KEYS).forEach(key => {
                    this.remove(key);
                });
            } catch (e) {
                console.warn('خطأ في حذف كل الكاش:', e);
            }
        },
        
        compareData: function(oldData, newData) {
            try {
                var oldStr = JSON.stringify(oldData);
                var newStr = JSON.stringify(newData);
                return oldStr !== newStr;
            } catch (e) {
                return true;
            }
        },
        
        fetchWithCache: function(url, cacheKey, options) {
            options = options || {};
            var self = this;
            
            if (this.pendingRequests[cacheKey]) {
                return this.pendingRequests[cacheKey];
            }
            
            var promise = new Promise(function(resolve, reject) {
                var cached = self.get(cacheKey);
                var resolved = false;
                var timeoutReached = false;
                
                if (cached) {
                    resolve(cached);
                    resolved = true;
                }
                
                var timeoutId = setTimeout(function() {
                    timeoutReached = true;
                    if (!resolved && cached) {
                        resolve(cached);
                        resolved = true;
                    }
                }, CACHE_CONFIG.timeout);
                
                var fetchOptions = {cache: 'no-store'};
                for (var key in options) {
                    if (options.hasOwnProperty(key)) {
                        fetchOptions[key] = options[key];
                    }
                }
                
                fetch(url, fetchOptions)
                .then(function(response) {
                    if (timeoutReached && resolved) {
                        return response.json().then(function(data) {
                            var hasChanges = self.compareData(cached, data);
                            if (hasChanges) {
                                self.set(cacheKey, data);
                                window.dispatchEvent(new CustomEvent('cacheUpdated', {
                                    detail: { key: cacheKey, data: data }
                                }));
                            }
                        }).catch(function() {});
                        return;
                    }
                    clearTimeout(timeoutId);
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(function(data) {
                    if (!data) return;
                    
                    var hasChanges = self.compareData(cached, data);
                    
                    if (hasChanges || !cached) {
                        self.set(cacheKey, data);
                        if (!resolved) {
                            resolve(data);
                            resolved = true;
                        } else {
                            window.dispatchEvent(new CustomEvent('cacheUpdated', {
                                detail: { key: cacheKey, data: data }
                            }));
                        }
                    }
                    
                    delete self.pendingRequests[cacheKey];
                })
                .catch(function(error) {
                    if (timeoutReached) return;
                    clearTimeout(timeoutId);
                    console.warn('خطأ في جلب البيانات من السيرفر:', error);
                    
                    delete self.pendingRequests[cacheKey];
                    
                    if (!resolved) {
                        if (cached) {
                            resolve(cached);
                        } else {
                            reject(error);
                        }
                    }
                });
            });
            
            this.pendingRequests[cacheKey] = promise;
            
            return promise;
        },
        
        buildUrl: function(endpoint, params) {
            params = params || {};
            var urlParams = new URLSearchParams(params);
            return sp + endpoint + pp + '?' + urlParams.toString();
        }
    };
    
    // إبطال أي كاش قديم من الإصدار السابق (قبل العزل عن السيرفر البعيد)
    function invalidateOldVersion() {
        try {
            var storedVersion = localStorage.getItem('cache_app_version');
            if (storedVersion !== CACHE_CONFIG.version) {
                window.CacheManager.clearAll();
                localStorage.setItem('cache_app_version', CACHE_CONFIG.version);
            }
        } catch (e) {}
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            invalidateOldVersion();
            window.CacheManager.clearOldCache();
        });
    } else {
        invalidateOldVersion();
        window.CacheManager.clearOldCache();
    }
    
})();
