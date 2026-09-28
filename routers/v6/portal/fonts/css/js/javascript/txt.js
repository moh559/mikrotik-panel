(function() {
    var isLoading = false;
    var isLoaded = false;
    
    function loadScrollingText() {
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        var url = 'data/text.json?t=' + Date.now();
        
        CacheManager.fetchWithCache(url, 'cached_text')
            .then(function(data) {
                if (data && !data.error && data.text) {
                    var textEl = document.getElementById("scroll-text-content");
                    if (textEl) {
                        textEl.innerText = data.text;
                        isLoaded = true;
                    }
                }
            })
            .catch(function(error) {
                console.warn('فشل تحميل النص المتحرك:', error);
            })
            .finally(function() {
                isLoading = false;
            });
    }
    
    if (typeof CacheManager !== 'undefined') {
        loadScrollingText();
    } else {
        setTimeout(loadScrollingText, 100);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_text') {
            var data = e.detail.data;
            if (data && !data.error && data.text) {
                var textEl = document.getElementById("scroll-text-content");
                if (textEl) {
                    textEl.innerText = data.text;
                }
            }
        }
    });
})();
