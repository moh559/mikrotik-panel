(function(){
    if(typeof sp==='undefined'||typeof nd==='undefined'||typeof rs==='undefined') {
        // إذا لم تتوفر المتغيرات، استخدم السرعات الافتراضية
        if(typeof window.defaultSpeedsConfig !== 'undefined') {
            window.speedsConfig = window.defaultSpeedsConfig;
            if(typeof loadSpeedsFromConfig==='function') loadSpeedsFromConfig();
        }
        return;
    }

    var hasCM = typeof CacheManager !== 'undefined' && !!CacheManager.fetchWithCache;
    var speedsUrl = 'data/speeds.json?t='+Date.now();
    var settingsUrl = 'data/settings.json?t='+Date.now();

    // الجلب عبر الكاش أولاً: ينجح حتى عند فتح البوابة كملف محلي (file://) حيث يمنع المتصفح fetch المباشر
    var speedsPromise = hasCM
        ? CacheManager.fetchWithCache(speedsUrl, 'cached_speeds_data').catch(function(){ return null; })
        : fetch(speedsUrl).then(function(r){ return r.json(); }).catch(function(){ return null; });

    var settingsPromise = hasCM
        ? CacheManager.fetchWithCache(settingsUrl, 'cached_settings').catch(function(){ return {}; })
        : fetch(settingsUrl).then(function(r){ return r.json(); }).catch(function(){ return {}; });

    var currentSettings = {};

    function applySpeeds(d, settings){
        var defaultBuiltinSpeed = (d && d.default_builtin_speed) || '';
        var s = Array.isArray(d) ? d : (d && d.speeds ? d.speeds : []);
        var df = (window.defaultSpeedsConfig || []).slice();

        if(settings && typeof settings==='object'){
            if(settings["512K"]==="on") df=df.filter(function(x){return x.download!=='512K'});
            if(settings["1M"]==="on") df=df.filter(function(x){return x.download!=='1024K'});
            if(settings["2M"]==="on") df=df.filter(function(x){return x.download!=='2048K'});
            if(settings["4M"]==="on") df=df.filter(function(x){return x.download!=='4096K'});
            if(settings["8M"]==="on") df=df.filter(function(x){return x.download!=='8192K'});
            if(settings["16M"]==="on" && window.speed16MConfig){
                var speed16M = Object.assign({}, window.speed16MConfig);
                delete speed16M.className;
                df.push(speed16M);
            }
            // إخفاء كروت هوت سبوت
            if(settings["hide-hotspot-cards"]==="on"){
                window.hideHotspotCards = true;
            }
        }

        // تطبيق السرعة الافتراضية من الإعدادات
        if(defaultBuiltinSpeed){
            df=df.map(function(sp){
                var spVal=sp.upload+'/'+sp.download;
                return{upload:sp.upload,download:sp.download,name:sp.name,className:sp.className,is_default:spVal===defaultBuiltinSpeed?1:0};
            });
        }

        if(!d || d.error){
            // فشل الجلب: الكاش المحلي المحفوظ من زيارة سابقة أولاً ثم الافتراضية
            var localCached = null;
            try { localCached = localStorage.getItem('cachedSpeeds'); } catch(e) {}
            if(localCached){
                try {
                    var parsed = JSON.parse(localCached);
                    if(Array.isArray(parsed) && parsed.length){
                        window.speedsConfig = parsed;
                        if(typeof loadSpeedsFromConfig==='function') loadSpeedsFromConfig();
                        return;
                    }
                } catch(e) {}
            }
            window.speedsConfig = df;
            if(typeof loadSpeedsFromConfig==='function') loadSpeedsFromConfig();
            return;
        }

        if(Array.isArray(s)){
            if(s.length>0){
                var cd=s.filter(function(x){return x.is_default==1});
                var co=s.filter(function(x){return x.is_default!=1});
                var dfDefault=df.filter(function(x){return x.is_default==1});
                var dfOther=df.filter(function(x){return!x.is_default});
                if(cd.length>0){
                    window.speedsConfig=cd.concat(dfOther).concat(co);
                }else if(dfDefault.length>0){
                    window.speedsConfig=dfDefault.concat(dfOther).concat(co);
                }else{
                    window.speedsConfig=df.concat(s);
                }
            }else{
                window.speedsConfig=df;
            }
            if(typeof loadSpeedsFromConfig==='function') loadSpeedsFromConfig();
        }
    }

    Promise.all([speedsPromise, settingsPromise]).then(function(results){
        currentSettings = results[1] || {};
        applySpeeds(results[0], currentSettings);
    }).catch(function(e){
        console.error('خطأ في جلب السرعات:', e);
        applySpeeds(null, currentSettings);
    });

    // نسخة أحدث وصلت من الكاش أثناء التشغيل → أعد التطبيق
    window.addEventListener('cacheUpdated', function(e){
        if(e && e.detail && e.detail.key === 'cached_speeds_data'){
            applySpeeds(e.detail.data, currentSettings);
        }
    });
})();
