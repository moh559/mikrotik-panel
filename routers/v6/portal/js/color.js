(function() {
    let isLoading = false;
    let isLoaded = false;
    
    function fetchColors() {
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        const url = `data/colors.json?t=${Date.now()}`;

        CacheManager.fetchWithCache(url, 'cached_colors')
        .then(colors => {
            if (!colors) return;
            
            Object.keys(colors).forEach(colorKey => {
                const elements = document.querySelectorAll("." + colorKey);
                elements.forEach(el => {
                    el.style.background = colors[colorKey];
                    if (colorKey === "btn_color") {
                        el.style.color = "#ffffff";
                    }
                });
                
                if (colorKey === "bd_color") {
                    document.body.style.background = colors[colorKey];
                }
            });
            
            isLoaded = true;
        })
        .catch(error => {
            console.warn('فشل تحميل الألوان:', error);
        })
        .finally(() => {
            isLoading = false;
        });
    }
    
    if (typeof CacheManager !== 'undefined') {
        fetchColors();
    } else {
        setTimeout(fetchColors, 100);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_colors') {
            var colors = e.detail.data;
            if (!colors) return;
            
            Object.keys(colors).forEach(function(colorKey) {
                var elements = document.querySelectorAll("." + colorKey);
                elements.forEach(function(el) {
                    el.style.background = colors[colorKey];
                    if (colorKey === "btn_color") {
                        el.style.color = "#ffffff";
                    }
                });
                
                if (colorKey === "bd_color") {
                    document.body.style.background = colors[colorKey];
                }
            });
        }
    });
})();
