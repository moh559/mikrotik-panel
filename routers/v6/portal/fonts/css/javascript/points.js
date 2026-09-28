(function() {
    var isLoading = false;
    var isLoaded = false;
    
    function loadPoints() {
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        var url = 'data/points.json?t=' + Date.now();
        
        CacheManager.fetchWithCache(url, 'cached_points')
            .then(function(data) {
                var pointsEl = document.getElementById("sell-points");
                if (!pointsEl) return;
                
                pointsEl.innerHTML = "";
                
                var localPoints = (typeof hotspotConfig !== 'undefined' && hotspotConfig['sell-points']) ? hotspotConfig['sell-points'] : [];
                var serverPoints = (data && !data.error) ? data : [];
                var allPoints = localPoints.concat(serverPoints);
                
                if (allPoints.length === 0) return;
                
                allPoints.forEach(function(point) {
                    var row = document.createElement("tr");
                    row.innerHTML = '<td>' + point.name + '</td>';
                    pointsEl.appendChild(row);
                });
                
                isLoaded = true;
            })
            .catch(function(error) {
                console.warn('فشل تحميل نقاط البيع:', error);
            })
            .finally(function() {
                isLoading = false;
            });
    }
    
    if (typeof CacheManager !== 'undefined') {
        loadPoints();
    } else {
        setTimeout(loadPoints, 100);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_points') {
            var data = e.detail.data;
            var pointsEl = document.getElementById("sell-points");
            if (!pointsEl) return;
            
            var localPoints = (typeof hotspotConfig !== 'undefined' && hotspotConfig['sell-points']) ? hotspotConfig['sell-points'] : [];
            var serverPoints = (data && !data.error) ? data : [];
            var allPoints = localPoints.concat(serverPoints);
            
            pointsEl.innerHTML = "";
            allPoints.forEach(function(point) {
                var row = document.createElement("tr");
                row.innerHTML = '<td>' + point.name + '</td>';
                pointsEl.appendChild(row);
            });
        }
    });
})();
