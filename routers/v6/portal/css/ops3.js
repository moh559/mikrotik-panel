
// طھط·ط¨ظٹظ‚ ظ…ط¨ظƒط± ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط­ط¸ط± طھط®ظ…ظٹظ† ط§ظ„ظƒط±ظˆطھ ظ‚ط¨ظ„ ط£ظٹ ط´ظٹط، ط¢ط®ط±
(function earlyHotBlockerCheck() {
    if (typeof sp === 'undefined' || typeof nd === 'undefined' || typeof rs === 'undefined' || typeof pp === 'undefined') return;
    
    var cachedSettings = localStorage.getItem('cached_settings');
    if (cachedSettings) {
        try {
            var d = JSON.parse(cachedSettings);
            if (d && d["disable-hot-blocker"] === "on" && typeof hotspotConfig !== 'undefined') {
                hotspotConfig["enable-hot-blocker"] = 0;
            }
        } catch (e) {}
    }
})();

function waitForSpeedsInOps3(callback) {
    if (window.speedsLoaded) {
        callback();
    } else {
        window.addEventListener('speedsConfigLoaded', callback, { once: true });
    }
}

waitForSpeedsInOps3(function() {
    const url = `data/settings.json?t=${Date.now()}`;
    
    function applySettings(d) {
        if(!d || d.error) return;
        
        if(d["disable-hot-blocker"]==="on"&&typeof hotspotConfig!=='undefined'){
            hotspotConfig["enable-hot-blocker"]=0;
        }
        
        var vpnSettings = document.getElementById("vpn-settings");
        var vpnRow = document.getElementById("vpn-status-row");
        if(vpnSettings) vpnSettings.classList.remove("hidden");
        if(vpnRow) vpnRow.style.display="";
        if(d["show-vpn"]==="on"){
            if(vpnSettings) vpnSettings.classList.add("hidden");
            if(vpnRow) vpnRow.style.display="none";
        }
        
        var upclSettings = document.getElementById("upcl-settings");
        var upclRow = document.getElementById("upcl-status-row");
        if(upclSettings) upclSettings.classList.remove("hidden");
        if(upclRow) upclRow.style.display="";
        if(d["show-upcl"]==="on"){
            if(upclSettings) upclSettings.classList.add("hidden");
            if(upclRow) upclRow.style.display="none";
        }
        
        var faceSettings = document.getElementById("face-settings");
        var faceRow = document.getElementById("face-status-row");
        if(faceSettings) faceSettings.classList.remove("hidden");
        if(faceRow) faceRow.style.display="";
        if(d["show-face"]==="on"){
            if(faceSettings) faceSettings.classList.add("hidden");
            if(faceRow) faceRow.style.display="none";
        }
        
        var bindSettings = document.getElementById("bind-settings");
        var bindRow = document.getElementById("bind-status-row");
        if(bindSettings) bindSettings.classList.remove("hidden");
        if(bindRow) bindRow.style.display="";
        if(d["show-bind"]==="on"){
            if(bindSettings) bindSettings.classList.add("hidden");
            if(bindRow) bindRow.style.display="none";
        }
        
        var userCountSettings = document.getElementById("user-count-settings");
        var userCountRow = document.getElementById("user-count-status-row");
        if(userCountSettings) userCountSettings.classList.remove("hidden");
        if(userCountRow) userCountRow.style.display="";
        if(d["show-user-count"]==="on"){
            if(userCountSettings) userCountSettings.classList.add("hidden");
            if(userCountRow) userCountRow.style.display="none";
        }
        
        if(d["show-block-formatted-devices"]==="off"){
            blkk();
            var alertDiv=document.getElementById("full-screen-alert");
            if(alertDiv) alertDiv.style.display="none";
        }
        
        if(d["wifi"]==="on")wifi();
        if(d["wifi2"]==="on")wifi2();
        if(d["ramadan-style"]==="on"){
            document.body.classList.add("ramadan-style");
            ramadan();
        }
        if(d["option-display"]==="on")optiondisplay();
        if(d["ads"]==="on"){}
        
        applyAdditionalOptions(d);
        handleSettings(d);
        applyNewUIOptions(d);
    }
    
    CacheManager.fetchWithCache(url, 'cached_settings')
        .then(d => {
            applySettings(d);
        })
        .catch(function(e) {
            console.warn('ظپط´ظ„ ط¬ظ„ط¨ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھطŒ طھط³طھظ…ط± ط§ظ„طµظپط­ط© ط¨ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©');
        });
    
    window.addEventListener('cacheUpdated', function(e) {
        if (e.detail.key === 'cached_settings') {
            applySettings(e.detail.data);
        }
    });
});

function applyNewUIOptions(d) {
    // طھط·ط¨ظٹظ‚ ظ…ظ†ط·ظ‚ ط¥ط®ظپط§ط، speed2 ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ط­ط§ظ„ط§طھ
    var speed2Select = document.getElementById("speed2");
    var forcespeedDiv = document.getElementById("forcespeed");
    
    // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط­ط§ظ„ط© speed2 ط£ظˆظ„ط§ظ‹
    if(speed2Select) {
        speed2Select.style.display = "";
        speed2Select.classList.remove("hidden");
    }
    
    if(d["disable-speed-selection"] === "on") {
        // ط¥ظٹظ‚ط§ظپ طھط­ط¯ظٹط¯ ط§ظ„ط³ط±ط¹ط© - ط¥ط®ظپط§ط، طھط§ظ…
        if(speed2Select) {
            speed2Select.style.display = "none";
            speed2Select.classList.add("hidden");
        }
    } else if(d["show-block-card-guessing"] !== "on") {
        // ط¨ط¯ظˆظ† ط¥ط¬ط¨ط§ط± - ط¥ط®ظپط§ط، ط¥ظ„ط§ ظ„ظ„ظ…ط³ط¬ظ„ظٹظ†
        if(speed2Select && (typeof loggedIn === 'undefined' || loggedIn !== true)) {
            speed2Select.style.display = "none";
            speed2Select.classList.add("hidden");
        }
    }
    
    var ipRows = document.querySelectorAll('tr');
    ipRows.forEach(function(row) {
        var cells = row.querySelectorAll('td');
        if (cells.length > 0 && cells[0].textContent.includes('ط¹ظ†ظˆط§ظ† ط§ظ„ط§ظٹط¨ظٹ')) {
            row.style.display = '';
        }
    });
    if (d["hide-ip"] === "on") {
        ipRows.forEach(function(row) {
            var cells = row.querySelectorAll('td');
            if (cells.length > 0 && cells[0].textContent.includes('ط¹ظ†ظˆط§ظ† ط§ظ„ط§ظٹط¨ظٹ')) {
                row.style.display = 'none';
            }
        });
    }
    
    var usernameRow = document.getElementById('uusername');
    if (usernameRow && usernameRow.parentElement) {
        usernameRow.parentElement.style.display = '';
    }
    var usernameRows = document.querySelectorAll('tr');
    usernameRows.forEach(function(row) {
        var cells = row.querySelectorAll('td');
        if (cells.length > 0 && cells[0].textContent.includes('ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…')) {
            row.style.display = '';
        }
    });
    if (d["hide-username"] === "on") {
        if (usernameRow && usernameRow.parentElement) {
            usernameRow.parentElement.style.display = 'none';
        }
        usernameRows.forEach(function(row) {
            var cells = row.querySelectorAll('td');
            if (cells.length > 0 && cells[0].textContent.includes('ط§ط³ظ… ط§ظ„ظ…ط³طھط®ط¯ظ…')) {
                row.style.display = 'none';
            }
        });
    }
    
    var controlBtn = document.getElementById('controle');
    if (controlBtn) controlBtn.style.display = '';
    if (d["hide-control-button"] === "on") {
        if (controlBtn) controlBtn.style.display = 'none';
    }
    
    var optionsBtn = document.getElementById('showOptionsButton');
    if (optionsBtn) optionsBtn.style.display = '';
    if (d["hide-options-button"] === "on") {
        if (optionsBtn) optionsBtn.style.display = 'none';
    }
    var loginType = hotspotConfig && hotspotConfig["login-type"];
    if (loginType === "both") {
        if (optionsBtn) optionsBtn.style.display = 'none';
    }
    
    var qrBtn = document.getElementById('showQrReaderButton');
    if (qrBtn) qrBtn.style.display = '';
    if (d["hide-qr-button"] === "on") {
        if (qrBtn) qrBtn.style.display = 'none';
    }
    
    if (d["disable-speed-selection"] === "on") {
        var speedSelects = document.querySelectorAll('#speed, #speed2, select[name="speed"]');
        speedSelects.forEach(function(select) {
            if (select) {
                select.style.display = 'none';
                // ظ…ط³ط­ ط¬ظ…ظٹط¹ ط§ظ„ط®ظٹط§ط±ط§طھ ط§ظ„ظ…ظˆط¬ظˆط¯ط©
                select.innerHTML = '';
                // ط¥ط¶ط§ظپط© ط§ظ„ط®ظٹط§ط± ط§ظ„ط¥ط¬ط¨ط§ط±ظٹ
                var defaultOption = document.createElement('option');
                defaultOption.value = '300M/300M|noalnooah|all|vpn|no|no';
                defaultOption.selected = true;
                defaultOption.textContent = '300M/300M';
                select.appendChild(defaultOption);
                // طھط¹ظٹظٹظ† ط§ظ„ظ‚ظٹظ…ط© ط¨ط´ظƒظ„ طµط±ظٹط­
                select.value = '300M/300M|noalnooah|all|vpn|no|no';
                select.disabled = true;
                // ط¥ط·ظ„ط§ظ‚ ط­ط¯ط« ط§ظ„طھط؛ظٹظٹط± ظ„طھط­ط¯ظٹط« ط§ظ„ظ‚ظٹظ… ط§ظ„ظ…ط±طھط¨ط·ط©
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    } else {
        // ط¥ط¹ط§ط¯ط© طھظپط¹ظٹظ„ select ط¹ظ†ط¯ ط¥ظ„ط؛ط§ط، disable-speed-selection
        var speedSelects = document.querySelectorAll('#speed, #speed2, select[name="speed"]');
        speedSelects.forEach(function(select) {
            if (select) {
                select.disabled = false;
            }
        });
    }
    
    let statusChecker = setInterval(() => {
        if (typeof loggedIn !== "undefined" && loggedIn === true) {
            clearInterval(statusChecker);
            
            var statusDiv = document.querySelector('#status .sc-bg-shape6');
            if (!statusDiv) return;
            
            var oldBtn1 = statusDiv.querySelector('.custom-button-1');
            var oldBtn2 = statusDiv.querySelector('.custom-button-2');
            var oldBtn3 = statusDiv.querySelector('.custom-button-3');
            if (oldBtn1) oldBtn1.remove();
            if (oldBtn2) oldBtn2.remove();
            if (oldBtn3) oldBtn3.remove();
            
            if (d["custom-button-1-show"] === "on" && d["custom-button-1-url"]) {
                var btn1 = document.createElement('button');
                btn1.className = 'buttonopsion btn btn_color custom-button-1';
                btn1.style.marginTop = '10px';
                btn1.textContent = d["custom-button-1-text"] || 'ط§ط³طھط±ط§ط­ط© 2';
                btn1.addEventListener('click', function() {
                    window.location.href = hp + d["custom-button-1-url"];
                });
                statusDiv.appendChild(btn1);
            }
            
            if (d["custom-button-2-show"] === "on" && d["custom-button-2-url"]) {
                var btn2 = document.createElement('button');
                btn2.className = 'buttonopsion btn btn_color custom-button-2';
                btn2.style.marginTop = '10px';
                btn2.textContent = d["custom-button-2-text"] || 'ط¨ط« ظ…ط¨ط§ط´ط± 2';
                btn2.addEventListener('click', function() {
                    window.location.href = hp + d["custom-button-2-url"];
                });
                statusDiv.appendChild(btn2);
            }
            
            if (d["custom-button-3-show"] === "on" && d["custom-button-3-url"]) {
                var btn3 = document.createElement('button');
                btn3.className = 'buttonopsion btn btn_color custom-button-3';
                btn3.style.marginTop = '10px';
                btn3.textContent = d["custom-button-3-text"] || 'ط±ط§ط¨ط· ظ…ط®طµطµ';
                btn3.addEventListener('click', function() {
                    window.location.href = hp + d["custom-button-3-url"];
                });
                statusDiv.appendChild(btn3);
            }
        }
    }, 500);
}

function applyAdditionalOptions(d){
    // ط­ظپط¸ ط­ط§ظ„ط© ط§ظ„ط®ظٹط§ط±ط§طھ ط¹ط§ظ„ظ…ظٹط§ظ‹
    window.speedSettings = {
        disableSpeedSelection: d["disable-speed-selection"] === "on",
        forceSpeed: d["show-block-card-guessing"] === "on"
    };
    
    var forcespeedDiv = document.getElementById("forcespeed");
    var speed2Select = document.getElementById("speed2");
    
    // ط­ط§ظ„ط© 1: ط¥ظٹظ‚ط§ظپ طھط­ط¯ظٹط¯ ط§ظ„ط³ط±ط¹ط© - ط¥ط®ظپط§ط، ظƒظ„ ط´ظٹط، ظˆطھط¹ظٹظٹظ† 300M/300M
    if(d["disable-speed-selection"] === "on") {
        if(forcespeedDiv) forcespeedDiv.style.display = "none";
        if(speed2Select) {
            speed2Select.style.display = "none";
            speed2Select.classList.add("hidden");
            speed2Select.value = "300M/300M|noalnooah|all|vpn|no|no";
        }
    }
    // ط­ط§ظ„ط© 2: طھط­ط¯ظٹط¯ ط§ظ„ط³ط±ط¹ط© ط¥ط¬ط¨ط§ط±ظٹ - ظٹط¸ظ‡ط± ظ„ظ„ط¬ظ…ظٹط¹
    else if(d["show-block-card-guessing"]==="on") {
        forcespeed();
    }
    // ط­ط§ظ„ط© 3: ط¨ط¯ظˆظ† ط¥ط¬ط¨ط§ط± - ظٹط¸ظ‡ط± ظپظ‚ط· ظ„ظ„ظ…ط³ط¬ظ„ظٹظ†
    else {
        if(forcespeedDiv) forcespeedDiv.style.display = "none";
        if(speed2Select && (typeof loggedIn === 'undefined' || loggedIn !== true)) {
            speed2Select.style.display = "none";
            speed2Select.classList.add("hidden");
        }
    }
    
    if(d["extra-option-1"]==="on")runExtraOption1Script();
    if(d["extra-option-2"]==="on")runExtraOption2Script();
    if(d["extra-option-3"]==="on")runExtraOption3Script();
    if(d["extra-option-4"]==="on")runExtraOption4Script();
    if(d["extra-option-5"]==="on")adsvewut();
    
    // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„ط¥ط¹ظ„ط§ظ†ط§طھ ط«ظ… طھط·ط¨ظٹظ‚ ط§ظ„ط­ط§ظ„ط© ط§ظ„ط¬ط¯ظٹط¯ط©
    resetAds();
    if(d["adsvewutop"]==="on")adsvewutop();
    if(d["adsvewutop3d"]==="on")adsvewutop3d();
    if(d["adsvewudown"]==="on")adsvewudown();
    if(d["adsvewudown2"]==="on")adsvewudown2();
    
    if(d["wifi"]==="on")wifi();
    if(d["wifi2"]==="on")wifi2();
    
    // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„ط³ط±ط¹ط§طھ ظ„ط­ط§ظ„طھظ‡ط§ ط§ظ„ط£ظˆظ„ظٹط© ط«ظ… طھط·ط¨ظٹظ‚ ط§ظ„ط¥ط®ظپط§ط،
    resetSpeedOptions();
    if(d["512K"]==="on")peed512K();
    if(d["1M"]==="on")peed1M();
    if(d["2M"]==="on")peed2M();
    if(d["4M"]==="on")peed4M();
    if(d["8M"]==="on")peed8M();
    // 16M ظٹط¨ظ‚ظ‰ ظ…ط®ظپظٹ ط¨ط´ظƒظ„ ط§ظپطھط±ط§ط¶ظٹ ظˆظٹط¸ظ‡ط± ظپظ‚ط· ط¹ظ†ط¯ ط§ظ„طھظپط¹ظٹظ„
    if(d["16M"]==="on"){
        peed16M();
    }else{
        hide16M();
    }
}function handleSettings(d){const b=document.getElementById("direct-break-button"),l=document.getElementById("direct-live-button"),s=document.getElementById("status");const localConfig=typeof hotspotConfig!=='undefined'?hotspotConfig:{};const breakEnabled=d["break-button"]==="on"||(localConfig["enable-break-button"]===1&&(!d||!d["break-button"]));const breakUrl=d["break-url"]||localConfig["redirect-to-esterahah"];const liveEnabled=d["live-stream"]==="on"||(localConfig["enable-live-stream"]===1&&(!d||!d["live-stream"]));const liveUrl=d["live-stream-url"]||localConfig["redirect-to-mobasher"];if(breakEnabled&&breakUrl){const u=breakUrl.startsWith('http')?breakUrl:`${hp}${breakUrl}`;b.style.display="inline-block";b.onclick=function(){window.location.href=u}}else{b.style.display="none"}if(liveEnabled&&liveUrl){const u2=liveUrl.startsWith('http')?liveUrl:`${hp}${liveUrl}`;l.style.display="inline-block";l.onclick=function(){window.location.href=u2}}else{l.style.display="none"}if(d["auto-direct-break"]==="on"&&breakUrl){let i=setInterval(()=>{if(typeof loggedIn!=="undefined"&&loggedIn===true){clearInterval(i);setTimeout(()=>{if(typeof loggedIn!=="undefined"&&loggedIn===true){const u3=breakUrl.startsWith('http')?breakUrl:`${hp}${breakUrl}`;window.location.href=u3}},5000)}},1000)}if(d["auto-direct-live"]==="on"&&liveUrl){let j=setInterval(()=>{if(typeof loggedIn!=="undefined"&&loggedIn===true){clearInterval(j);setTimeout(()=>{if(typeof loggedIn!=="undefined"&&loggedIn===true){const u4=liveUrl.startsWith('http')?liveUrl:`${hp}${liveUrl}`;window.location.href=u4}},5000)}},1000)}}function ramadan(){document.getElementById("imges22").classList.remove("hidden");document.getElementById("imges44").classList.remove("hidden");document.getElementById("imges2").src=((window.SLOTS||{})["ramadan-top"])||`${sp}img/ramadan18.png`;document.getElementById("imges4").src=((window.SLOTS||{})["ramadan-side"])||`${sp}img/ramadan1.png`;document.getElementById("imges33").classList.remove("hidden");let imges5=document.getElementById("imges5");imges5.classList.add("imges55");imges5.src=((window.SLOTS||{})["ramadan-bottom"])||`${sp}img/14.png`}function runExtraOption1Script(){}function runExtraOption2Script(){var a=document.getElementById("imges6");a.style.display="block";document.getElementById("imges22").classList.remove("hidden");document.getElementById("imges33").classList.remove("hidden");document.getElementById("imges44").classList.remove("hidden");document.getElementById("imges2").src=((window.SLOTS||{})["ramadan-top"])||`${sp}img/18.png`;document.getElementById("imges4").src=((window.SLOTS||{})["ramadan-side"])||`${sp}img/ram1.png`;document.getElementById("imges5").src=((window.SLOTS||{})["ramadan-bottom"])||`${sp}img/21.png`;document.getElementById("imges6").src=`${sp}img/21.png`;document.body.classList.add("mawled");document.body.style.background="#1c6715 url(`${sp}img/background.jpg') fixed center";document.body.style.backgroundSize="cover";document.getElementById("imges2").style.filter="brightness(151)"}function runExtraOption3Script(){console.log("quran");document.getElementById("quran").classList.add("hidden")}function runExtraOption4Script(){document.getElementById("imges22").classList.remove("hidden");document.getElementById("imges44").classList.remove("hidden");document.getElementById("imges2").src=((window.SLOTS||{})["ramadan-top"])||`${sp}img/ead18.png`;document.getElementById("imges4").src=((window.SLOTS||{})["ramadan-side"])||`${sp}img/ead1.png`;document.getElementById("imges33").classList.remove("hidden");let a=document.getElementById("imges5");a.classList.add("imges55");a.src=((window.SLOTS||{})["ramadan-bottom"])||`${sp}img/14.png`}function adsvewut(){
    var a=document.getElementById("adsvewu");
    if(!a) return;
    var existingCountdown = document.getElementById("countdown");
    if(existingCountdown) existingCountdown.remove();
    a.style.display="block";
    const b=document.createElement("div");
    b.id="countdown";
    b.style.position="absolute";
    b.style.top="39px";
    b.style.left="50%";
    b.style.transform="translateX(-50%)";
    b.style.fontSize="30px";
    b.style.color="white";
    b.style.fontWeight="bold";
    a.appendChild(b);
    let c=10;
    b.innerText=c;
    let t=setInterval(()=>{c--;b.innerText=c;if(c===0){clearInterval(t);a.style.display="none"}},1500);
}
function adsvewutop(){
    var el = document.getElementById("slider-container-top");
    if(el && el.style.display !== "block") {
        el.style.display="block";
    }
}
function adsvewutop3d(){
    var el = document.getElementById("image-slider-top");
    if(el && el.style.display !== "block") {
        loadCSS("css/imgscro.css");
        el.style.display="block";
    }
}
function adsvewudown(){
    var el = document.getElementById("image-slider2");
    if(el && el.style.display !== "block") {
        loadCSS("css/imgscro.css");
        el.style.display="block";
    }
}
function adsvewudown2(){
    var el = document.getElementById("image-slider");
    if(el && el.style.display !== "block") {
        el.style.display="block";
    }
}
function resetAds(){
    var el0 = document.getElementById("image-slider-top");
    var el1 = document.getElementById("slider-container-top");
    var el2 = document.getElementById("image-slider2");
    var el3 = document.getElementById("image-slider");
    if(el0) el0.style.display="none";
    if(el1) el1.style.display="none";
    if(el2) el2.style.display="none";
    if(el3) el3.style.display="none";
}
function resetSpeedOptions(){
    // ط¥ط¹ط§ط¯ط© ط¥ط¸ظ‡ط§ط± ط§ظ„ط³ط±ط¹ط§طھ 512K-8M (ط§ظ„ط­ط§ظ„ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط© ظ…ط±ط¦ظٹط©)
    var speeds = ["512K", "1M", "2M", "4M", "8M"];
    speeds.forEach(function(speed){
        var el = document.getElementById("peed"+speed);
        var cloned = document.getElementById("cloned_peed"+speed);
        if(el){
            el.style.display = "";
            el.disabled = false;
            el.classList.remove("hidden");
        }
        if(cloned){
            cloned.style.display = "";
            cloned.disabled = false;
            cloned.classList.remove("hidden");
        }
    });
}
function hide16M(){
    var el = document.getElementById("peed16M");
    var cloned = document.getElementById("cloned_peed16M");
    if(el) el.classList.add("hidden");
    if(cloned) cloned.classList.add("hidden");
}function optiondisplay(){
	
	
	      if (loggedIn !== true ) {

document.getElementById("optionsModal").style.display="block"

} else {

    
}
	
	}function peed512K(){
    var el = document.getElementById("peed512K");
    var cloned = document.getElementById("cloned_peed512K");
    if (el) {
        el.style.display="none";
        el.disabled = true; 
        el.classList.add("hidden");
    }
    if (cloned) {
        cloned.style.display="none";
        cloned.disabled = true; 
        cloned.classList.add("hidden");
    }
}function peed1M(){
    var el = document.getElementById("peed1M");
    var cloned = document.getElementById("cloned_peed1M");
    if (el) {
        el.style.display="none";
        el.disabled = true; 
        el.classList.add("hidden");
    }
    if (cloned) {
        cloned.style.display="none";
        cloned.disabled = true; 
        cloned.classList.add("hidden");
    }
}function peed2M(){
    var el = document.getElementById("peed2M");
    var cloned = document.getElementById("cloned_peed2M");
    if (el) {
        el.style.display="none";
        el.disabled = true; 
        el.classList.add("hidden");
    }
    if (cloned) {
        cloned.style.display="none";
        cloned.disabled = true; 
        cloned.classList.add("hidden");
    }
}function peed4M(){
    var el = document.getElementById("peed4M");
    var cloned = document.getElementById("cloned_peed4M");
    if (el) {
        el.style.display="none";
        el.disabled = true; 
        el.classList.add("hidden");
    }
    if (cloned) {
        cloned.style.display="none";
        cloned.disabled = true; 
        cloned.classList.add("hidden");
    }
}function peed8M(){
    var el = document.getElementById("peed8M");
    var cloned = document.getElementById("cloned_peed8M");
    if (el) {
        el.style.display="none";
        el.disabled = true; 
        el.classList.add("hidden");
    }
    if (cloned) {
        cloned.style.display="none";
        cloned.disabled = true; 
        cloned.classList.add("hidden");
    }
}function peed16M(){
    var el = document.getElementById("peed16M");
    var cloned = document.getElementById("cloned_peed16M");
    if (el) el.classList.remove("hidden");
    if (cloned) cloned.classList.remove("hidden");
}function wifi(){loadCSS("css/wifi.css")}function wifi2(){loadCSS("css/wifi2.css")}
	function forcespeed(){
	              console.log("forcespeed");

if (loggedIn !== true ) {
              console.log("forcespeed2");
              
var optionsModal = document.getElementById("optionsModal");
if (!optionsModal) {
    console.error("optionsModal not found");
    return;
}

optionsModal.classList.add("overlay");

const modelContent = document.querySelector('.model-faly');
const closeBtn = modelContent ? modelContent.querySelector('.close') : null;
const overlay = document.querySelector('.overlay');

if (overlay) {
    overlay.addEventListener('click', function(event) {
      event.stopPropagation();
      event.preventDefault();
    });
}

if (modelContent) {
    modelContent.addEventListener('click', function(event) {
      event.stopPropagation();
    });
}

const speed2Select = document.getElementById('speed2');

if (speed2Select) {
    speed2Select.addEventListener('change', function() {
        if (speed2Select.value !== 'ns') {
            var closeEl = document.getElementById("close");
            if (closeEl) closeEl.style.display = "block";
            
            if (optionsModal) optionsModal.classList.remove("overlay");
            
            var loginBtn = document.getElementById('force-speed-login-btn');
            if (!loginBtn) {
                loginBtn = document.createElement('button');
                loginBtn.id = 'force-speed-login-btn';
                loginBtn.className = 'btn btn_color';
                loginBtn.textContent = 'طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„';
                loginBtn.style.cssText = 'margin-top: 15px; width: 100%; padding: 12px;';
                loginBtn.onclick = function() {
                    optionsModal.style.display = 'none';
                    optionsModal.classList.remove('overlay');
                };
                
                speed2Select.parentNode.insertBefore(loginBtn, speed2Select.nextSibling);
            } else {
                loginBtn.style.display = 'block';
            }
        }
    });
}

    optionsModal.style.display="block";
    
    var speed2El = document.getElementById("speed2");
    if (speed2El) {
        speed2El.style.display="block";
        speed2El.classList.remove("hidden");
    }
    
    var forcespeedEl = document.getElementById("forcespeed");
    if (forcespeedEl) forcespeedEl.style.display="block";
    
    var closeEl = document.getElementById("close");
    if (closeEl) closeEl.style.display="none";
}

}
document.getElementById("network-id-display").textContent=nd;

window.addEventListener('cacheUpdated', function(e) {
    if (e.detail.key === 'cached_settings') {
        var d = e.detail.data;
        if (d && !d.error) {
            applyAdditionalOptions(d);
            applyNewUIOptions(d);
            handleSettings(d);
        }
    }
});
