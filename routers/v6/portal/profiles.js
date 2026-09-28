(function() {
    let isLoading = false;
    let isLoaded = false;
    
    function loadProfiles() {
        if (isLoading || isLoaded) return;
        isLoading = true;
        
        const url = `data/profiles.json?t=${Date.now()}`;
        
        CacheManager.fetchWithCache(url, 'cached_profiles')
            .then(data => {
                const profilesEl = document.getElementById("profiles");
                if (!profilesEl) return;
                
                profilesEl.innerHTML = "";
                
                const localProfiles = (typeof hotspotConfig !== 'undefined' && hotspotConfig.profiles) ? hotspotConfig.profiles : [];
                const serverProfiles = (data && !data.error) ? data : [];
                const allProfiles = [...localProfiles, ...serverProfiles];
                
                if (allProfiles.length === 0) return;
                
                allProfiles.forEach(profile => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${profile.price}</td>
                        <td>${profile.time}</td>
                        <td>${profile.transfer}</td>
                        <td>${profile.validity}</td>
                    `;
                    profilesEl.appendChild(row);
                });
                
                isLoaded = true;
            })
            .catch(error => {
                console.warn('فشل تحميل الباقات:', error);
            })
            .finally(() => {
                isLoading = false;
            });
    }
    
    if (typeof CacheManager !== 'undefined') {
        loadProfiles();
    } else {
        setTimeout(loadProfiles, 100);
    }
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_profiles') {
            var data = e.detail.data;
            var profilesEl = document.getElementById("profiles");
            if (!profilesEl) return;
            
            var localProfiles = (typeof hotspotConfig !== 'undefined' && hotspotConfig.profiles) ? hotspotConfig.profiles : [];
            var serverProfiles = (data && !data.error) ? data : [];
            var allProfiles = localProfiles.concat(serverProfiles);
            
            profilesEl.innerHTML = "";
            allProfiles.forEach(function(profile) {
                var row = document.createElement("tr");
                row.innerHTML = '<td>' + profile.price + '</td><td>' + profile.time + '</td><td>' + profile.transfer + '</td><td>' + profile.validity + '</td>';
                profilesEl.appendChild(row);
            });
        }
    });
})();
