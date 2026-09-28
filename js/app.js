(function () {
  var REGISTRY_PATH = "routers/registry.json";
  var DEFAULT_ROUTERS = [
    {
      id: "v6",
      name: "الراوتر القديم v6",
      host: "50.50.0.1",
      network: "شبكة 50.50.0.0/24",
      portal: "http://50.50.0.1/1/",
      repoBase: "routers/v6",
      routerBase: "1/",
      files: [
        { repo: "routers/v6/data/settings.json", router: "1/data/settings.json" },
        { repo: "routers/v6/data/speeds.json", router: "1/data/speeds.json" },
        { repo: "routers/v6/data/profiles.json", router: "1/data/profiles.json" },
        { repo: "routers/v6/data/points.json", router: "1/data/points.json" },
        { repo: "routers/v6/data/text.json", router: "1/data/text.json" },
        { repo: "routers/v6/data/colors.json", router: "1/data/colors.json" },
        { repo: "routers/v6/data/colors-default.json", router: "1/data/colors-default.json" },
        { repo: "routers/v6/data/images.json", router: "1/data/images.json" },
        { repo: "routers/v6/data/slots.json", router: "1/data/slots.json" },
        { repo: "routers/v6/data/styles.json", router: "1/data/styles.json" },
        { repo: "routers/v6/config/config.js", router: "1/config/config.js" },
        { repo: "routers/v6/conf.js", router: "1/conf.js" }
      ]
    },
    {
      id: "v7",
      name: "الراوتر الجديد v7",
      host: "192.168.50.1",
      network: "شبكة 192.168.50.0/24",
      portal: "http://192.168.50.1/1/",
      repoBase: "routers/v7",
      routerBase: "1/",
      files: []
    }
  ];

  var routers = [];
  var loaded = { sha: null, path: null };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  var toastTimer = null;
  function toast(msg, kind) {
    var t = $("toast");
    t.textContent = msg;
    t.className = kind || "";
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 4200);
  }

  function setTab(name) {
    document.querySelectorAll(".tab").forEach(function (b) { b.classList.toggle("active", b.dataset.tab === name); });
    document.querySelectorAll(".page").forEach(function (p) { p.classList.toggle("active", p.id === "tab-" + name); });
  }

  function updateRepoBadge() {
    var c = GH.cfg();
    var b = $("repoBadge");
    if (!c.owner || !c.repo) { b.textContent = "المستودع غير مهيأ — افتح الإعدادات"; b.className = "badge err"; return; }
    b.textContent = c.owner + "/" + c.repo + "@" + (c.branch || "main") + (c.token ? " · رمز محفوظ" : " · قراءة فقط");
    b.className = "badge" + (c.token ? " ok" : "");
  }

  async function loadRegistry(showToast) {
    try {
      var f = await GH.getFile(REGISTRY_PATH);
      routers = JSON.parse(f.content);
      loaded.sha = f.sha;
      if (showToast) toast("تم تحميل سجل الرواتر من المستودع", "ok");
    } catch (e) {
      if (e.status === 404) {
        routers = JSON.parse(JSON.stringify(DEFAULT_ROUTERS));
        loaded.sha = null;
        if (showToast) toast("لا يوجد سجل بعد — ستُحفظ الافتراضية عند أول حفظ", "");
      } else {
        toast("تعذر تحميل السجل: " + e.message, "err");
        routers = JSON.parse(JSON.stringify(DEFAULT_ROUTERS));
        loaded.sha = null;
      }
    }
    renderRouters();
    fillRouterSelects();
    fillEditorRouter();
  }

  async function saveRegistry() {
    var body = JSON.stringify(routers, null, 2);
    var res = await GH.putFile(REGISTRY_PATH, body, "panel: update router registry", loaded.sha);
    loaded.sha = res.sha;
    toast("حُفظ سجل الرواتر في المستودع", "ok");
  }

  function renderRouters() {
    var box = $("routerList");
    box.innerHTML = routers.map(function (r, i) {
      var files = (r.files || []).map(function (f) {
        return "<li>" + esc(f.repo) + " ← " + esc(f.router) + "</li>";
      }).join("");
      return '<div class="card">' +
        "<h3>" + esc(r.name) + "</h3>" +
        '<div class="dim">' + esc(r.network || "") + " · <code>" + esc(r.host) + "</code></div>" +
        '<div class="dim">البوابة: ' + (r.portal ? '<a href="' + esc(r.portal) + '" target="_blank" rel="noopener">' + esc(r.portal) + "</a>" : "—") + "</div>" +
        '<ul class="files">' + (files || '<li class="dim">لا ملفات مرتبطة بعد</li>') + "</ul>" +
        '<div class="actions">' +
        '<button data-act="edit" data-i="' + i + '">تعديل</button>' +
        '<button data-act="addfile" data-i="' + i + '">ربط ملف</button>' +
        '<button data-act="open" data-i="' + i + '">فتح المحرر</button>' +
        '<button data-act="del" data-i="' + i + '" class="danger">حذف</button>' +
        "</div></div>";
    }).join("");
    box.querySelectorAll("button").forEach(function (b) {
      b.onclick = function () {
        var i = +b.dataset.i, act = b.dataset.act;
        var r = routers[i];
        if (act === "del") {
          if (confirm("حذف \"" + r.name + "\" من السجل؟")) { routers.splice(i, 1); renderRouters(); fillRouterSelects(); saveRegistry().catch(function(e){toast(e.message,"err");}); }
        } else if (act === "edit") {
          var n = prompt("اسم الراوتر", r.name); if (n === null) return;
          var h = prompt("عنوان الراوتر (IP)", r.host); if (h === null) return;
          var net = prompt("الشبكة", r.network || ""); if (net === null) return;
          var p = prompt("رابط البوابة (Portal URL)", r.portal || ""); if (p === null) return;
          r.name = n.trim(); r.host = h.trim(); r.network = net.trim(); r.portal = p.trim();
          renderRouters(); fillRouterSelects(); saveRegistry().catch(function(e){toast(e.message,"err");});
        } else if (act === "addfile") {
          var rp = prompt("مسار الملف في المستودع\nمثال: routers/v6/data/settings.json"); if (!rp) return;
          var up = prompt("المسار داخل الراوتر\nمثال: 1/data/settings.json"); if (!up) return;
          r.files = r.files || [];
          r.files.push({ repo: rp.trim(), router: up.trim() });
          renderRouters(); fillRouterSelects(); saveRegistry().catch(function(e){toast(e.message,"err");});
        } else if (act === "open") {
          $("editorRouter").value = String(i);
          fillEditorFiles();
          setTab("editor");
        }
      };
    });
  }

  function fillRouterSelects() {
    ["editorRouter", "historyRouter", "portalRouter"].forEach(function (id) {
      var sel = $(id), cur = sel.value;
      sel.innerHTML = routers.map(function (r, i) { return '<option value="' + i + '">' + esc(r.name) + "</option>"; }).join("");
      if (cur && +cur < routers.length) sel.value = cur;
    });
  }

  function currentRouter(selId) { return routers[+$(selId).value] || null; }

  function fillEditorRouter() { fillEditorFiles(); }

  function fillEditorFiles() {
    var r = currentRouter("editorRouter");
    var sel = $("editorFile");
    if (!r || !(r.files || []).length) { sel.innerHTML = '<option value="">— لا ملفات —</option>'; return; }
    sel.innerHTML = r.files.map(function (f, i) { return '<option value="' + i + '">' + esc(f.repo) + "</option>"; }).join("");
    loadSelectedFile();
  }

  function selectedFile() {
    var r = currentRouter("editorRouter");
    if (!r || !r.files || !r.files.length) return null;
    return r.files[+$("editorFile").value] || null;
  }

  function validateText(name, text) {
    var v = $("editorValid");
    if (/\.json$/i.test(name)) {
      try { JSON.parse(text); v.textContent = "JSON صحيح"; v.className = "valid ok"; return true; }
      catch (e) { v.textContent = "خطأ JSON: " + e.message; v.className = "valid err"; return false; }
    }
    v.textContent = "ملف نصي (" + (text.length) + " حرف)"; v.className = "valid";
    return true;
  }

  async function loadSelectedFile() {
    var f = selectedFile();
    var ta = $("editorText"), meta = $("editorMeta"), save = $("btnSaveFile");
    save.disabled = true; loaded.path = null; loaded.fileSha = null;
    if (!f) { ta.value = ""; meta.textContent = ""; return; }
    if (!GH.cfg().owner || !GH.cfg().repo) {
      ta.value = ""; meta.textContent = "أكمل إعدادات المستودع في تبويب الإعدادات أولاً";
      return;
    }
    var r = currentRouter("editorRouter");
    $("rawLink").href = GH.rawUrl(f.repo);
    $("liveLink").href = r && r.portal ? r.portal : "";
    $("liveLink").style.display = r && r.portal ? "" : "none";
    try {
      var file = await GH.getFile(f.repo);
      ta.value = file.content;
      loaded.path = f.repo;
      loaded.fileSha = file.sha;
      meta.innerHTML = "<span>المسار: <b>" + esc(f.repo) + "</b></span><span>الحجم: <b>" + file.size + "</b> بايت</span><span>الوجهة في الراوتر: <b>" + esc(f.router) + "</b></span>";
      validateText(f.repo, file.content);
      save.disabled = false;
    } catch (e) {
      if (e.status === 404) {
        ta.value = "";
        meta.innerHTML = '<span>الملف غير موجود في المستودع بعد — اكتب محتواه ثم احفظ (سيُنشأ)</span>';
        loaded.path = f.repo;
        validateText(f.repo, "");
        save.disabled = false;
      } else {
        meta.textContent = "خطأ: " + e.message;
        toast("تعذر فتح الملف: " + e.message, "err");
      }
    }
  }

  async function saveSelectedFile() {
    var f = selectedFile();
    if (!f) return;
    var text = $("editorText").value;
    if (!validateText(f.repo, text)) { toast("صحّح الخطأ قبل الحفظ", "err"); return; }
    var btn = $("btnSaveFile");
    btn.disabled = true;
    try {
      var sha = loaded.path === f.repo ? loaded.fileSha : null;
      if (!sha) {
        try { sha = (await GH.getFile(f.repo)).sha; } catch (e) { if (e.status !== 404) throw e; }
      }
      var res = await GH.putFile(f.repo, text, "panel: update " + f.repo, sha);
      loaded.fileSha = res.sha;
      toast("حُفظ " + f.repo + " — الراوتر سسحبه خلال دقيقة", "ok");
      $("editorMeta").innerHTML += ' · <span>آخر حفظ: <b>' + new Date().toLocaleString() + "</b></span>";
    } catch (e) {
      toast("فشل الحفظ: " + e.message, "err");
    } finally {
      btn.disabled = false;
    }
  }

  async function loadHistory() {
    var f = selectedFileIn("historyRouter", "historyFile");
    var box = $("historyList");
    if (!f) { box.innerHTML = '<div class="item">اختر ملفاً</div>'; return; }
    box.innerHTML = '<div class="item">جارٍ التحميل…</div>';
    try {
      var commits = await GH.listCommits(f.repo, 15);
      box.innerHTML = commits.map(function (c) {
        var d = c.commit.author && c.commit.author.date ? new Date(c.commit.author.date).toLocaleString() : "";
        var a = c.commit.author && c.commit.author.name ? c.commit.author.name : "";
        return '<div class="item"><a href="' + esc(c.html_url) + '" target="_blank" rel="noopener">' + esc((c.commit.message || "").split("\n")[0]) + "</a>" +
          '<div class="dim">' + esc(a) + " · " + esc(d) + " · " + esc((c.sha || "").substring(0, 7)) + "</div></div>";
      }).join("") || '<div class="item">لا سجل</div>';
    } catch (e) {
      box.innerHTML = '<div class="item">خطأ: ' + esc(e.message) + "</div>";
    }
  }

  function selectedFileIn(routerSel, fileSel) {
    var r = routers[+$(routerSel).value];
    if (!r || !r.files || !r.files.length) return null;
    var fsel = $(fileSel);
    if (fsel.options.length !== r.files.length) {
      fsel.innerHTML = r.files.map(function (f, i) { return '<option value="' + i + '">' + esc(f.repo) + "</option>"; }).join("");
    }
    return r.files[+fsel.value] || null;
  }

  function fillHistoryFiles() {
    var r = currentRouter("historyRouter");
    var sel = $("historyFile");
    if (!r || !r.files || !r.files.length) { sel.innerHTML = '<option value="">— لا ملفات —</option>'; return; }
    sel.innerHTML = r.files.map(function (f, i) { return '<option value="' + i + '">' + esc(f.repo) + "</option>"; }).join("");
  }

  function fillSettingsForm() {
    var c = GH.cfg();
    $("cfgOwner").value = c.owner || "";
    $("cfgRepo").value = c.repo || "";
    $("cfgBranch").value = c.branch || "main";
    $("cfgToken").value = c.token || "";
  }

  function saveSettings() {
    var c = {
      owner: $("cfgOwner").value.trim(),
      repo: $("cfgRepo").value.trim(),
      branch: $("cfgBranch").value.trim() || "main",
      token: $("cfgToken").value.trim()
    };
    localStorage.setItem("panel_cfg", JSON.stringify(c));
    updateRepoBadge();
    toast("حُفظت الإعدادات محلياً في هذا المتصفح", "ok");
  }

  async function testSettings() {
    saveSettings();
    var s = $("cfgStatus");
    s.textContent = "جارٍ الاختبار…"; s.className = "badge";
    try {
      var repo = await GH.getRepo();
      var who = "";
      try { var u = await GH.getUser(); who = " · " + u.login; } catch (e) { who = " · قراءة فقط"; }
      s.textContent = "متصل: " + repo.full_name + who + " · " + (repo.private ? "خاص" : "عام");
      s.className = "badge ok";
    } catch (e) {
      s.textContent = "فشل: " + e.message;
      s.className = "badge err";
    }
  }

  async function initRepo() {
    saveSettings();
    var c = GH.cfg(), st = $("cfgStatus"), btn = $("btnInitRepo");
    if (!c.owner || !c.repo) { st.textContent = "أكمل المالك واسم المستودع"; st.className = "badge err"; return; }
    if (!c.token) { st.textContent = "الرمز مطلوب لإنشاء المستودع"; st.className = "badge err"; return; }
    btn.disabled = true;
    st.textContent = "جارٍ التهيئة…"; st.className = "badge";
    try {
      var created = false, repo;
      try {
        repo = await GH.getRepo();
      } catch (e) {
        if (e.status !== 404) throw e;
        repo = await GH.createRepo(c.repo, true);
        created = true;
      }
      if (repo.default_branch && repo.default_branch !== (c.branch || "main")) {
        c.branch = repo.default_branch;
        localStorage.setItem("panel_cfg", JSON.stringify(c));
        fillSettingsForm();
        updateRepoBadge();
      }
      try {
        await GH.getFile(REGISTRY_PATH);
      } catch (e) {
        if (e.status !== 404) throw e;
        await GH.putFile(REGISTRY_PATH, JSON.stringify(DEFAULT_ROUTERS, null, 2), "panel: init registry");
      }
      var pages = null;
      try {
        pages = await GH.enablePages(c.branch || "main");
      } catch (e) {
        if (e.status === 422) {
          try { pages = await GH.getPages(); } catch (e2) { pages = null; }
        } else if (e.status === 404 || e.status === 403) {
          pages = null;
        } else {
          throw e;
        }
      }
      var link = pages && pages.html_url ? pages.html_url : null;
      st.innerHTML = (created ? "مستودع جديد ✓ · " : "مستودع ✓ · ") + "سجل ✓ · Pages: " +
        (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(link) + "</a>" : "لم يتفعّل");
      st.className = "badge ok";
      toast("اكتملت التهيئة" + (link ? " — الموقع: " + link : ""), "ok");
      loadRegistry(false).catch(function () {});
    } catch (e) {
      var msg = e.message;
      if (e.status === 403 || /Resource not accessible|Bad credentials|bad credentials/i.test(msg)) {
        msg += " — تأكد أن الرمز كلاسيكي بصلاحية repo وأن المستودع من حسابك";
      }
      st.textContent = "فشل: " + msg;
      st.className = "badge err";
    } finally {
      btn.disabled = false;
    }
  }

  function repoBaseOf(r) {
    if (!r) return null;
    if (r.repoBase) return r.repoBase;
    var f = (r.files || [])[0];
    if (f) { var m = /^([^/]+\/[^/]+)\//.exec(f.repo); if (m) return m[1]; }
    return null;
  }

  function routerBaseOf(r) {
    if (!r) return "1/";
    if (r.routerBase) return r.routerBase;
    var f = (r.files || [])[0];
    if (f) {
      var parts = f.router.split("/");
      if (parts.length > 2) return parts.slice(0, parts.length - 2).join("/") + "/";
      return parts[0] + "/";
    }
    return "1/";
  }

  function buildPullRsc() {
    var c = GH.cfg();
    if (!c.owner || !c.repo) return null;
    var raw = GH.rawUrl("");
    if (!raw || raw === "#/") return null;
    var out = [];
    out.push("# cloud panel - data pull (every minute) + assets pull (daily)");
    out.push("# generated " + new Date().toISOString());
    out.push("/system scheduler remove [find name=panel_pull]");
    out.push("/system script remove [find name=panel_pull]");
    var any = false;
    routers.forEach(function (r) {
      var base = repoBaseOf(r), dst = routerBaseOf(r);
      if (!base) return;
      any = true;
      var id = String(r.id || "r").replace(/[^A-Za-z0-9_]/g, "");
      var fetches = [];
      (r.files || []).forEach(function (f) {
        fetches.push('/tool fetch url="' + raw + f.repo + '" dst-path="' + f.router + '"');
      });
      if (!fetches.length) {
        ["settings", "speeds", "profiles", "points", "text", "colors", "colors-default", "images", "slots", "styles"].forEach(function (n) {
          fetches.push('/tool fetch url="' + raw + base + "/data/" + n + '.json" dst-path="' + dst + "data/" + n + '.json"');
        });
        fetches.push('/tool fetch url="' + raw + base + '/config/config.js" dst-path="' + dst + 'config/config.js"');
      }
      out.push("# ---- " + r.name + " ----");
      out.push("/system script remove [find name=panel_pull_" + id + "]");
      out.push("/system script add name=panel_pull_" + id + " comment=\"cloud panel data pull\" source={");
      fetches.forEach(function (l) { out.push(l); });
      out.push("}");
      out.push("/system scheduler remove [find name=panel_pull_" + id + "]");
      out.push("/system scheduler add name=panel_pull_" + id + " interval=1m start-time=startup comment=\"cloud panel pull\" on-event=panel_pull_" + id);
      out.push("/system script remove [find name=panel_assets_" + id + "]");
      out.push("/system script add name=panel_assets_" + id + " comment=\"cloud panel assets (images)\" source={");
      out.push('/tool fetch url="' + raw + base + '/deploy/assets.rsc" dst-path="' + dst + 'assets.rsc"');
      out.push('/import file-name="' + dst + 'assets.rsc"');
      out.push('}');
      out.push("/system scheduler remove [find name=panel_assets_" + id + "]");
      out.push("/system scheduler add name=panel_assets_" + id + " interval=1d start-time=03:00:00 comment=\"cloud panel assets\" on-event=panel_assets_" + id);
    });
    if (!any) return null;
    return out.join("\n") + "\n";
  }

  function downloadPullScript() {
    var text = buildPullRsc();
    if (!text) { toast("لا توجد ملفات مرتبطة بالرواتر بعد", "err"); return; }
    var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "panel-pull.rsc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    toast("نُزّل أمر السحب — الصقه في terminal الراوتر", "ok");
  }

  /* ===== البوابة (بيانات اللوحة المحلية — كلها في المستودع) ===== */

  var PORTAL_DATA_FILES = ["settings", "speeds", "profiles", "points", "text", "colors", "colors-default", "images", "slots", "styles"];
  var FILE_LABELS = {
    speeds: "السرعات", settings: "الإعدادات", profiles: "الأسعار", points: "نقاط البيع",
    text: "النص المتحرك", colors: "الألوان", "colors-default": "الألوان الافتراضية",
    images: "الصور", slots: "مواضع الصور", styles: "حِزم الاستايلات"
  };
  var SETTINGS_SCHEMA = [
    { title: "المظهر العام", rows: [
      { key: "wifi", label: "نمط الخلفية wifi.css", type: "toggle" },
      { key: "wifi2", label: "نمط الخلفية wifi2.css", type: "toggle" },
      { key: "ramadan-style", label: "نمط رمضان", type: "toggle" },
      { key: "option-display", label: "فتح نافذة الخيارات تلقائياً قبل الدخول", type: "toggle" },
      { key: "ads", label: "الإعلانات", type: "toggle" }
    ]},
    { title: "إخفاء عناصر الواجهة", rows: [
      { key: "hide-ip", label: "إخفاء عنوان IP في صفحة الحالة", type: "toggle" },
      { key: "hide-username", label: "إخفاء اسم المستخدم", type: "toggle" },
      { key: "hide-control-button", label: "إخفاء زر لوحة التحكم", type: "toggle" },
      { key: "hide-options-button", label: "إخفاء زر عرض الخيارات", type: "toggle" },
      { key: "hide-qr-button", label: "إخفاء زر QR", type: "toggle" }
    ]},
    { title: "خيارات ما بعد تسجيل الدخول (تشغيل = إخفاء)", rows: [
      { key: "show-vpn", label: "إخفاء خيار VPN", type: "toggle" },
      { key: "show-upcl", label: "إخفاء إيقاف التحديثات", type: "toggle" },
      { key: "show-face", label: "إخفاء خيار كرت فيس/واتساب", type: "toggle" },
      { key: "show-bind", label: "إخفاء خيار ربط الجهاز", type: "toggle" },
      { key: "show-user-count", label: "إخفاء تحديد عدد المستخدمين", type: "toggle" }
    ]},
    { title: "السرعات", rows: [
      { key: "disable-speed-selection", label: "قفل اختيار السرعة (الكل بنفس السرعة)", type: "toggle" },
      { key: "show-block-card-guessing", label: "إلزام اختيار السرعة قبل تسجيل الدخول", type: "toggle" },
      { key: "hide-hotspot-cards", label: "إخفاء خيار كروت هوت سبوت", type: "toggle" },
      { key: "512K", label: "إخفاء سرعة 512K", type: "toggle" },
      { key: "1M", label: "إخفاء سرعة 1 ميجا", type: "toggle" },
      { key: "2M", label: "إخفاء سرعة 2 ميجا", type: "toggle" },
      { key: "4M", label: "إخفاء سرعة 4 ميجا", type: "toggle" },
      { key: "8M", label: "إخفاء سرعة 8 ميجا", type: "toggle" },
      { key: "16M", label: "إخفاء سرعة 16 ميجا", type: "toggle" }
    ]},
    { title: "الحماية من تخمين الكروت", rows: [
      { key: "disable-hot-blocker", label: "تعطيل حظر المحاولات الخاطئة", type: "toggle" },
      { key: "show-block-formatted-devices", label: "حظر الأجهزة المبرمجة خطأ (تشغيل = بدون حظر)", type: "toggle" }
    ]},
    { title: "الاستراحة والبث المباشر", rows: [
      { key: "break-button", label: "إظهار زر الاستراحة", type: "toggle" },
      { key: "break-url", label: "رابط الاستراحة", type: "text" },
      { key: "live-stream", label: "إظهار زر البث المباشر", type: "toggle" },
      { key: "live-stream-url", label: "رابط البث المباشر", type: "text" },
      { key: "auto-direct-break", label: "تحويل تلقائي للاستراحة بعد الدخول بـ 5 ثوانٍ", type: "toggle" },
      { key: "auto-direct-live", label: "تحويل تلقائي للبث بعد الدخول بـ 5 ثوانٍ", type: "toggle" }
    ]},
    { title: "أزرار مخصصة (صفحة الحالة)", rows: [
      { key: "custom-button-1-show", label: "زر مخصص 1 - تشغيل", type: "toggle" },
      { key: "custom-button-1-text", label: "زر مخصص 1 - النص", type: "text" },
      { key: "custom-button-1-url", label: "زر مخصص 1 - الرابط", type: "text" },
      { key: "custom-button-2-show", label: "زر مخصص 2 - تشغيل", type: "toggle" },
      { key: "custom-button-2-text", label: "زر مخصص 2 - النص", type: "text" },
      { key: "custom-button-2-url", label: "زر مخصص 2 - الرابط", type: "text" },
      { key: "custom-button-3-show", label: "زر مخصص 3 - تشغيل", type: "toggle" },
      { key: "custom-button-3-text", label: "زر مخصص 3 - النص", type: "text" },
      { key: "custom-button-3-url", label: "زر مخصص 3 - الرابط", type: "text" }
    ]},
    { title: "خيارات موسمية وإضافية", rows: [
      { key: "extra-option-1", label: "الخيار الإضافي 1 (زينة موسمية)", type: "toggle" },
      { key: "extra-option-2", label: "الخيار الإضافي 2 (زينة موسمية)", type: "toggle" },
      { key: "extra-option-3", label: "الخيار الإضافي 3 (زينة موسمية)", type: "toggle" },
      { key: "extra-option-4", label: "الخيار الإضافي 4 (زينة موسمية)", type: "toggle" },
      { key: "extra-option-5", label: "الخيار الإضافي 5 (إعلان منبثق بعدّ تنازلي)", type: "toggle" },
      { key: "adsvewutop", label: "سلايدر صور علوي", type: "toggle" },
      { key: "adsvewutop3d", label: "كاروسيل علوي ثلاثي الأبعاد (3D)", type: "toggle" },
      { key: "adsvewudown", label: "سلايدر كاروسيل سفلي", type: "toggle" },
      { key: "adsvewudown2", label: "سلايدر صور سفلي", type: "toggle" }
    ]}
  ];
  var SLOT_DEFS = [
    { key: "logo", label: "شعار الموقع (الصورة الرئيسية + الأيقونة)", def: "img/logo.jpg" },
    { key: "ramadan-top", label: "الزاوية العلوية (زينة أعلى الشاشة)", def: "img/ramadan18.png" },
    { key: "ramadan-side", label: "الزاوية الجانبية", def: "img/ramadan1.png" },
    { key: "ramadan-bottom", label: "العنصر السفلي (أسفل الشاشة)", def: "img/14.png" }
  ];
  var THEME_KEYS = ["ramadan-style", "extra-option-2", "extra-option-4"];
  var THEME_OF_KEY = { "ramadan-style": "ramadan", "extra-option-2": "mawled", "extra-option-4": "eid" };
  var THEME_LABELS = { none: "بدون زينة", ramadan: "رمضان", mawled: "المولد", eid: "العيد" };
  var NET_FIELDS = ["network-name", "network-title", "net-name-en", "n-n", "service-number", "news-line"];
  var ISO_FILES = [
    "index.html", "qr.html", "conf.js", "config/config.js", "config/speeds.js",
    "js/init.min.js", "js/main.min.js", "js/hotInImprover.min.js", "js/hotCookie.min.js",
    "js/hotOptions.min.js", "js/hotBlocker.min.js", "js/options.js", "js/templates.min.js", "js/mus.min.js",
    "javascript/cg.js", "javascript/sr.js", "javascript/cache.js", "javascript/color.js",
    "javascript/ops1.js", "javascript/ops2.js", "javascript/profiles.js", "javascript/points.js",
    "javascript/speeds.js", "javascript/txt.js", "javascript/img.js", "javascript/ops3.js", "javascript/sp.js"
  ];
  var ISO_PATTERNS = ["hotspot.alnooah.pro", "read_pass=", "network_id=", "corenotion.io", "unpkg.com", "cdn.jsdelivr.net", "qr_api"];

  var pState = {}, pShas = {}, pConfigText = "", pConfigSha = null, pLoaded = false, pLoading = false;

  function qsa(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function pBase() { return repoBaseOf(currentRouter("portalRouter")); }
  function pDst() { return routerBaseOf(currentRouter("portalRouter")); }
  function imgSrcOf(path) { return GH.rawUrl(pBase() + "/" + path); }

  async function loadPortal(force) {
    if (pLoading) return;
    if (pLoaded && !force) { return; }
    pLoading = true;
    var badge = $("portalBadge");
    var base = pBase();
    if (!base) { badge.textContent = "لا يوجد مسار بوابة (repoBase) للراوتر"; badge.className = "badge err"; pLoading = false; return; }
    if (!GH.cfg().owner || !GH.cfg().repo) { badge.textContent = "أكمل إعدادات المستودع أولاً"; badge.className = "badge err"; pLoading = false; return; }
    badge.textContent = "جارٍ التحميل…"; badge.className = "badge";
    try {
      for (var i = 0; i < PORTAL_DATA_FILES.length; i++) {
        var n = PORTAL_DATA_FILES[i];
        try {
          var f = await GH.getFile(base + "/data/" + n + ".json");
          pState[n] = JSON.parse(f.content);
          pShas[n] = f.sha;
        } catch (e) {
          if (e.status !== 404) throw e;
          delete pState[n]; delete pShas[n];
        }
      }
      try {
        var cf = await GH.getFile(base + "/config/config.js");
        pConfigText = cf.content; pConfigSha = cf.sha;
      } catch (e) {
        if (e.status !== 404) throw e;
        pConfigText = ""; pConfigSha = null;
      }
      portalDefaults();
      renderPortalAll();
      pLoaded = true;
      badge.textContent = base + " ✓";
      badge.className = "badge ok";
    } catch (e) {
      badge.textContent = "خطأ: " + e.message;
      badge.className = "badge err";
      toast("تعذر تحميل بيانات البوابة: " + e.message, "err");
    } finally {
      pLoading = false;
    }
  }

  function portalDefaults() {
    if (!pState.settings) pState.settings = {};
    if (!pState.speeds) pState.speeds = { speeds: [], default_builtin_speed: "" };
    if (!Array.isArray(pState.profiles)) pState.profiles = [];
    if (!Array.isArray(pState.points)) pState.points = [];
    if (!pState.text) pState.text = { text: "" };
    if (!pState.colors) pState.colors = {};
    if (!pState["colors-default"] || typeof pState["colors-default"] !== "object" || Array.isArray(pState["colors-default"]) || !Object.keys(pState["colors-default"]).length) {
      pState["colors-default"] = JSON.parse(JSON.stringify(pState.colors || {}));
    }
    if (!Array.isArray(pState.images)) pState.images = [];
    if (!pState.slots || typeof pState.slots !== "object" || Array.isArray(pState.slots)) pState.slots = {};
    if (!Array.isArray(pState.styles)) pState.styles = [];
  }

  function renderPortalAll() {
    renderSettings();
    renderSpeeds();
    renderProfiles();
    renderPoints();
    renderText();
    renderColors();
    renderImages();
    renderSlots();
    renderStyles();
    loadNetData();
    renderRawSelect();
  }

  async function savePortalFile(name, notify) {
    var base = pBase();
    if (!base) throw new Error("لا يوجد مسار بوابة");
    var path = base + "/data/" + name + ".json";
    var res = await GH.putFile(path, JSON.stringify(pState[name], null, 2), "panel: update " + name + ".json", pShas[name] || null);
    pShas[name] = res.sha;
    if (notify !== false) toast("حُفظ " + name + ".json — الراوتر سسحبه خلال دقيقة", "ok");
  }

  async function refreshAssetsScript() {
    var base = pBase();
    if (!base) return;
    try {
      var dir = await GH.getFile(base + "/img");
      var names = dir.entries.filter(function (e) { return e.type === "file"; }).map(function (e) { return e.name; });
      var dst = pDst();
      var lines = names.map(function (n) {
        return '/tool fetch url="' + GH.rawUrl(base + "/img/" + n) + '" dst-path="' + dst + "img/" + n + '"';
      });
      var path = base + "/deploy/assets.rsc";
      var sha = null;
      try { sha = (await GH.getFile(path)).sha; } catch (e) { if (e.status !== 404) throw e; }
      await GH.putFile(path, lines.join("\n") + "\n", "panel: refresh assets script", sha);
    } catch (e) {
      toast("تعذر تحديث أمر سحب الصور: " + e.message, "err");
    }
  }

  /* ---- الإعدادات ---- */

  function renderSettings() {
    var wrap = $("settingsGroups");
    wrap.innerHTML = "";
    SETTINGS_SCHEMA.forEach(function (g) {
      var div = document.createElement("div");
      div.className = "group";
      var h = document.createElement("h3");
      h.textContent = g.title;
      div.appendChild(h);
      var rows = document.createElement("div");
      g.rows.forEach(function (row) {
        var r = document.createElement("div");
        r.className = "setting-row";
        var lab = document.createElement("label");
        lab.textContent = row.label;
        lab.title = row.key;
        r.appendChild(lab);
        if (row.type === "toggle") {
          var sw = document.createElement("label");
          sw.className = "switch";
          var inp = document.createElement("input");
          inp.type = "checkbox";
          inp.dataset.key = row.key;
          inp.className = "set-toggle";
          inp.checked = pState.settings[row.key] === "on";
          var sp = document.createElement("span");
          sp.className = "slider-tg";
          sw.appendChild(inp); sw.appendChild(sp);
          r.appendChild(sw);
        } else {
          var ti = document.createElement("input");
          ti.type = "text";
          ti.dataset.key = row.key;
          ti.className = "set-text";
          ti.value = pState.settings[row.key] || "";
          r.appendChild(ti);
        }
        rows.appendChild(r);
      });
      div.appendChild(rows);
      wrap.appendChild(div);
    });
  }

  function collectSettings() {
    var out = Object.assign({}, pState.settings);
    qsa(".set-toggle").forEach(function (i) { out[i.dataset.key] = i.checked ? "on" : "off"; });
    qsa(".set-text").forEach(function (i) { out[i.dataset.key] = i.value; });
    return out;
  }

  /* ---- السرعات ---- */

  function renderSpeeds() {
    var tb = $("speedsTable").querySelector("tbody");
    tb.innerHTML = "";
    (pState.speeds.speeds || []).forEach(function (s, i) { tb.appendChild(speedRow(s, i)); });
    renderDefaultSpeedSelect();
  }

  function speedRow(s, i) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><input type="text" class="sp-up" value="' + esc(s.upload || "") + '"></td>' +
      '<td><input type="text" class="sp-dl" value="' + esc(s.download || "") + '"></td>' +
      '<td><input type="text" class="sp-name" value="' + esc(s.name || "") + '"></td>' +
      '<td class="center"><input type="radio" name="spdef" class="sp-def" ' + (s.is_default == 1 ? "checked" : "") + "></td>" +
      '<td class="center"><button class="del" title="حذف">✕</button></td>';
    tr.querySelector(".del").onclick = function () { pState.speeds.speeds.splice(i, 1); renderSpeeds(); };
    return tr;
  }

  function collectSpeeds() {
    var rows = [], def = "";
    qsa("#speedsTable tbody tr").forEach(function (tr) {
      var up = tr.querySelector(".sp-up").value.trim();
      var dl = tr.querySelector(".sp-dl").value.trim();
      var name = tr.querySelector(".sp-name").value.trim();
      var isDef = tr.querySelector(".sp-def").checked;
      if (!up || !dl) return;
      var row = { upload: up, download: dl, name: name || (dl + " - " + up) };
      if (isDef) { row.is_default = 1; def = up + "/" + dl; }
      rows.push(row);
    });
    return { speeds: rows, default_builtin_speed: $("defaultSpeed").value || def };
  }

  function renderDefaultSpeedSelect() {
    var sel = $("defaultSpeed");
    var cur = pState.speeds.default_builtin_speed || "";
    sel.innerHTML = '<option value="">(بدون)</option>';
    (pState.speeds.speeds || []).forEach(function (s) {
      var v = s.upload + "/" + s.download;
      var o = document.createElement("option");
      o.value = v;
      o.textContent = v + " — " + (s.name || "");
      if (v === cur) o.selected = true;
      sel.appendChild(o);
    });
  }

  /* ---- الأسعار ونقاط البيع ---- */

  function renderProfiles() {
    var tb = $("profilesTable").querySelector("tbody");
    tb.innerHTML = "";
    pState.profiles.forEach(function (p, i) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td><input type="text" class="pf-price" value="' + esc(p.price || "") + '"></td>' +
        '<td><input type="text" class="pf-time" value="' + esc(p.time || "") + '"></td>' +
        '<td><input type="text" class="pf-transfer" value="' + esc(p.transfer || "") + '"></td>' +
        '<td><input type="text" class="pf-validity" value="' + esc(p.validity || "") + '"></td>' +
        '<td class="center"><button class="del">✕</button></td>';
      tr.querySelector(".del").onclick = function () { pState.profiles.splice(i, 1); renderProfiles(); };
      tb.appendChild(tr);
    });
  }

  function collectProfiles() {
    return qsa("#profilesTable tbody tr").map(function (tr) {
      return {
        price: tr.querySelector(".pf-price").value.trim(),
        time: tr.querySelector(".pf-time").value.trim(),
        transfer: tr.querySelector(".pf-transfer").value.trim(),
        validity: tr.querySelector(".pf-validity").value.trim()
      };
    });
  }

  function renderPoints() {
    var tb = $("pointsTable").querySelector("tbody");
    tb.innerHTML = "";
    pState.points.forEach(function (p, i) {
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><input type="text" class="pt-name" value="' + esc(p.name || "") + '"></td>' +
        '<td class="center"><button class="del">✕</button></td>';
      tr.querySelector(".del").onclick = function () { pState.points.splice(i, 1); renderPoints(); };
      tb.appendChild(tr);
    });
  }

  function collectPoints() {
    return qsa("#pointsTable tbody tr").map(function (tr) { return { name: tr.querySelector(".pt-name").value.trim() }; })
      .filter(function (o) { return o.name; });
  }

  /* ---- النص ---- */

  function renderText() { $("scrollText").value = pState.text.text || ""; }

  /* ---- الألوان ---- */

  function isHexColor(v) { return /^#?[0-9a-fA-F]{6}$/.test(String(v || "").trim()); }
  function normHex(v) {
    v = String(v || "").trim();
    if (/^[0-9a-fA-F]{6}$/.test(v)) v = "#" + v;
    return v.toLowerCase();
  }
  function isGradient(v) { return /^(linear|radial|conic)-gradient\(/.test(String(v || "").trim()); }

  function renderColors() {
    var tb = $("colorsTable").querySelector("tbody");
    tb.innerHTML = "";
    var defs = pState["colors-default"] || {};
    Object.keys(pState.colors).forEach(function (key) {
      if (isGradient(defs[key])) pState.colors[key] = defs[key];
      tb.appendChild(colorRow(key, pState.colors[key]));
    });
    Object.keys(defs).forEach(function (key) {
      if (isGradient(defs[key]) && !(key in pState.colors)) {
        pState.colors[key] = defs[key];
        tb.appendChild(colorRow(key, pState.colors[key]));
      }
    });
  }

  function colorRow(key, val) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td><input type="text" class="c-key" value="' + esc(key) + '" spellcheck="false"></td>' +
      '<td><input type="text" class="c-val" value="' + esc(val) + '" spellcheck="false" placeholder="#173672 أو linear-gradient(...)"></td>' +
      '<td class="c-prev"><span style="display:inline-block;width:36px;height:22px;border-radius:5px;border:1px solid #555;vertical-align:middle"></span>' +
      '<input type="color" class="c-pick" title="اختر لوناً" style="width:34px;height:26px;padding:0;border:1px solid #555;border-radius:5px;background:transparent;cursor:pointer;vertical-align:middle;margin-inline-start:6px"></td>' +
      '<td class="center"><button class="del">✕</button></td>';
    var valInput = tr.querySelector(".c-val");
    var keyInput = tr.querySelector(".c-key");
    var prev = tr.querySelector(".c-prev span");
    var pick = tr.querySelector(".c-pick");
    var del = tr.querySelector(".del");
    var defs = pState["colors-default"] || {};
    var locked = isGradient(val) || isGradient(defs[key]);
    if (locked) {
      valInput.readOnly = true;
      valInput.style.opacity = ".6";
      valInput.title = "التدرج الافتراضي — يبقى كما هو ولا يتغيّر";
      keyInput.readOnly = true;
      keyInput.style.opacity = ".6";
      pick.disabled = true;
      del.disabled = true;
      del.style.opacity = ".3";
      del.title = "التدرج الافتراضي محمي — لا يُحذف";
    }
    var lastHex = isHexColor(val) ? normHex(val) : "#7919ab";
    var updatePrev = function () {
      var v = valInput.value.trim();
      prev.style.background = v || "transparent";
      var ok = !v || isHexColor(v) || isGradient(v);
      valInput.style.borderColor = ok ? "" : "var(--err)";
      if (isHexColor(v)) lastHex = normHex(v);
      pick.value = lastHex;
    };
    valInput.oninput = updatePrev;
    pick.oninput = function () { valInput.value = pick.value; lastHex = pick.value; updatePrev(); };
    updatePrev();
    del.onclick = function () { tr.remove(); };
    return tr;
  }

  function collectColors() {
    var out = {};
    var defs = pState["colors-default"] || {};
    qsa("#colorsTable tbody tr").forEach(function (tr) {
      var k = tr.querySelector(".c-key").value.trim();
      var v = tr.querySelector(".c-val").value.trim();
      if (isGradient(defs[k])) v = defs[k];
      else if (isHexColor(v)) v = normHex(v);
      if (k && v) out[k] = v;
    });
    return out;
  }

  /* ---- الصور ---- */

  function renderImages() {
    var wrap = $("imagesList");
    wrap.innerHTML = "";
    if (!pState.images.length) {
      wrap.innerHTML = '<p class="hint">لا توجد صور في السلايدر حالياً.</p>';
      return;
    }
    pState.images.forEach(function (img, i) {
      var path = String(img.image_path || "");
      var file = path.split("/").pop();
      var card = document.createElement("div");
      card.className = "img-card";
      card.innerHTML =
        '<img src="' + esc(imgSrcOf(path)) + '" onerror="this.style.opacity=.3">' +
        '<div class="name">' + esc(path) + "</div>" +
        '<div class="acts">' +
        '<button class="ghost" title="أعلى">↑</button>' +
        '<button class="ghost" title="أسفل">↓</button>' +
        '<button class="danger" title="حذف من المستودع">حذف</button>' +
        "</div>";
      var acts = card.querySelectorAll(".acts button");
      acts[0].onclick = function () { moveImage(i, -1); };
      acts[1].onclick = function () { moveImage(i, 1); };
      acts[2].onclick = async function () {
        if (!confirm("حذف الصورة نهائياً من المستودع؟")) return;
        try {
          var fp = pBase() + "/" + path;
          var sha = null;
          try { sha = (await GH.getFile(fp)).sha; } catch (e) { if (e.status !== 404) throw e; }
          if (sha) await GH.deleteFile(fp, sha, "panel: delete image " + file);
          pState.images.splice(i, 1);
          await savePortalFile("images", false);
          renderImages();
          await refreshAssetsScript();
          toast("حُذفت الصورة — ستختفي من الراوتر في المهمة اليومية", "ok");
        } catch (e) { toast("فشل الحذف: " + e.message, "err"); }
      };
      wrap.appendChild(card);
    });
  }

  async function moveImage(i, dir) {
    var j = i + dir;
    if (j < 0 || j >= pState.images.length) return;
    var t = pState.images[i];
    pState.images[i] = pState.images[j];
    pState.images[j] = t;
    renderImages();
    try { await savePortalFile("images", false); } catch (e) { toast(e.message, "err"); }
  }

  async function uploadImages(files) {
    var okCount = 0;
    for (var fi = 0; fi < files.length; fi++) {
      var f = files[fi];
      try {
        var safe = f.name.replace(/[^A-Za-z0-9._-]/g, "_");
        var buf = await f.arrayBuffer();
        await GH.putBinary(pBase() + "/img/" + safe, buf, "panel: upload image " + safe);
        pState.images = pState.images || [];
        var dup = pState.images.some(function (x) { return String(x.image_path).endsWith("/" + safe); });
        if (!dup) pState.images.push({ image_path: "img/" + safe });
        okCount++;
      } catch (e) {
        toast("فشل رفع " + f.name + ": " + e.message, "err");
      }
    }
    if (okCount) {
      await savePortalFile("images", false);
      renderImages();
      await refreshAssetsScript();
      toast("رُفعت " + okCount + " صورة — تُسحب للراوتر في المهمة اليومية", "ok");
    }
  }

  /* ---- المواضع والزينة ---- */

  function currentTheme(settings) {
    for (var i = 0; i < THEME_KEYS.length; i++) if (settings && settings[THEME_KEYS[i]] === "on") return THEME_OF_KEY[THEME_KEYS[i]];
    return "none";
  }

  function applyThemeFlags(settings, theme) {
    THEME_KEYS.forEach(function (k) { settings[k] = (THEME_OF_KEY[k] === theme) ? "on" : "off"; });
  }

  function slotValue(k) {
    return (pState.slots && typeof pState.slots[k] === "string") ? pState.slots[k] : "";
  }

  function renderSlots() {
    var wrap = $("slotRows");
    wrap.innerHTML = "";
    SLOT_DEFS.forEach(function (def) {
      var row = document.createElement("div");
      row.className = "field";
      var cur = slotValue(def.key);
      var paths = [], seen = {};
      (pState.images || []).forEach(function (im) { var p = im.image_path; if (p && !seen[p]) { seen[p] = 1; paths.push(p); } });
      if (cur && !seen[cur]) paths.unshift(cur);
      var opts = ['<option value="">— الافتراضي (' + esc(def.def) + ") —</option>"];
      paths.forEach(function (p) { opts.push('<option value="' + esc(p) + '"' + (p === cur ? " selected" : "") + ">" + esc(p) + "</option>"); });
      row.innerHTML =
        "<label>" + esc(def.label) + "</label>" +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<select data-slot="' + def.key + '" style="flex:1">' + opts.join("") + "</select>" +
        '<label class="ghost link" style="margin:0;cursor:pointer">رفع صورة خاصة<input type="file" accept="image/*" hidden data-slotfile="' + def.key + '"></label>' +
        "</div>";
      wrap.appendChild(row);
    });
    wrap.querySelectorAll("select[data-slot]").forEach(function (sel) {
      sel.onchange = async function () {
        var k = sel.dataset.slot;
        if (sel.value) pState.slots[k] = sel.value; else delete pState.slots[k];
        try { await savePortalFile("slots"); } catch (e) { toast(e.message, "err"); }
      };
    });
    wrap.querySelectorAll("input[data-slotfile]").forEach(function (inp) {
      inp.onchange = async function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        var k = inp.dataset.slotfile;
        try {
          var safe = "slot_" + k.replace(/[^A-Za-z0-9_-]/g, "_") + "_" + Date.now() + "_" + f.name.replace(/[^A-Za-z0-9._-]/g, "_");
          var buf = await f.arrayBuffer();
          await GH.putBinary(pBase() + "/img/" + safe, buf, "panel: slot image " + safe);
          pState.slots[k] = "img/" + safe;
          await savePortalFile("slots");
          renderSlots();
          await refreshAssetsScript();
          toast("رُفعت الصورة إلى الموضع ✓", "ok");
        } catch (e) { toast(e.message, "err"); }
        inp.value = "";
      };
    });
  }

  async function activateStyle(st, silent) {
    pState.settings = pState.settings || {};
    pState.slots = JSON.parse(JSON.stringify(st.slots || {}));
    applyThemeFlags(pState.settings, st.theme || "none");
    pState.settings["active-style"] = st.name;
    await savePortalFile("slots", false);
    await savePortalFile("settings", false);
    renderSlots();
    renderStyles();
    renderSettings();
    if (!silent) toast("النمط \"" + st.name + "\" مُفعّل — البقية متوقفة تلقائياً ✓", "ok");
  }

  async function deactivateStyles() {
    pState.settings = pState.settings || {};
    applyThemeFlags(pState.settings, "none");
    delete pState.settings["active-style"];
    await savePortalFile("settings", false);
    renderStyles();
    renderSettings();
    toast("تم إيقاف الزينة — الوضع عادي ✓", "ok");
  }

  function renderStyles() {
    var wrap = $("stylesList");
    wrap.innerHTML = "";
    var active = (pState.settings && pState.settings["active-style"]) || "";
    var actStyle = pState.styles.find(function (s) { return s.name === active; });
    var themeSel = $("styleTheme");
    if (themeSel) themeSel.value = actStyle ? (actStyle.theme || "none") : "none";
    if (!pState.styles.length) {
      wrap.innerHTML = '<p class="hint">لا توجد styles محفوظة بعد — اضبط المواضع والثيم ثم احفظه كـ style.</p>';
      return;
    }
    pState.styles.forEach(function (st, i) {
      var theme = st.theme || "none";
      var isActive = st.name === active;
      var row = document.createElement("div");
      row.className = "field";
      row.innerHTML =
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
        '<span style="flex:1"><b>' + esc(st.name) + "</b> " +
        '<span class="dim">[' + esc(THEME_LABELS[theme] || theme) + "]</span>" +
        (isActive ? ' <span class="dim">(نشط الآن — يعمل وحده)</span>' : "") + "</span>" +
        (isActive ? '<button class="ghost">إيقاف الزينة</button>' : '<button class="primary">تفعيل</button>') +
        '<button class="danger">حذف</button>' +
        "</div>";
      var btns = row.querySelectorAll("button");
      var actBtn = isActive ? null : btns[0];
      var offBtn = isActive ? btns[0] : null;
      var delBtn = btns[btns.length - 1];
      if (actBtn) actBtn.onclick = async function () {
        try { await activateStyle(st); } catch (e) { toast(e.message, "err"); }
      };
      if (offBtn) offBtn.onclick = async function () {
        try { await deactivateStyles(); } catch (e) { toast(e.message, "err"); }
      };
      delBtn.onclick = async function () {
        if (!confirm("حذف الـ style \"" + st.name + "\"؟")) return;
        try {
          var wasActive = st.name === active;
          pState.styles.splice(i, 1);
          if (wasActive) {
            applyThemeFlags(pState.settings || {}, "none");
            delete pState.settings["active-style"];
            await savePortalFile("settings", false);
          }
          await savePortalFile("styles", false);
          renderStyles();
          renderSettings();
          toast("تم الحذف", "ok");
        } catch (e) { toast(e.message, "err"); }
      };
      wrap.appendChild(row);
    });
  }

  async function saveStyle() {
    var name = ($("styleNameInput").value || "").trim();
    var theme = $("styleTheme").value || "none";
    if (!name) { toast("اكتب اسم الـ style أولاً", "err"); return; }
    try {
      var rec = { name: name, theme: theme, slots: JSON.parse(JSON.stringify(pState.slots || {})) };
      var existing = -1, si;
      for (si = 0; si < pState.styles.length; si++) if (pState.styles[si].name === name) { existing = si; break; }
      if (existing >= 0) {
        if (!confirm("يوجد style بنفس الاسم — استبداله؟")) return;
        pState.styles[existing] = rec;
      } else pState.styles.push(rec);
      await savePortalFile("styles", false);
      $("styleNameInput").value = "";
      await activateStyle(rec, true);
      toast("حُفظ وفُعّل الـ style \"" + name + "\" ✓", "ok");
    } catch (e) { toast(e.message, "err"); }
  }

  /* ---- بيانات الشبكة (config/config.js) ---- */

  function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function readNetFields(text) {
    var out = {};
    NET_FIELDS.forEach(function (k) {
      var m = text.match(new RegExp('"' + reEsc(k) + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
      out[k] = m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\") : "";
    });
    return out;
  }

  function writeNetFieldsTo(text, fields) {
    var changed = false;
    Object.keys(fields).forEach(function (k) {
      if (NET_FIELDS.indexOf(k) === -1) return;
      var v = String(fields[k]).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      var re = new RegExp('("' + reEsc(k) + '"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"', "g");
      if (re.test(text)) {
        text = text.replace(re, function (m, g1) { return g1 + '"' + v + '"'; });
        changed = true;
      } else {
        text = text.replace(/\}\s*\)\s*;?\s*$/, '  "' + k + '": "' + v + '"\n})');
        changed = true;
      }
    });
    return { text: text, changed: changed };
  }

  function loadNetData() {
    var fields = readNetFields(pConfigText || "");
    NET_FIELDS.forEach(function (k) {
      var el = document.getElementById("net_" + k);
      if (el) el.value = fields[k] || "";
    });
  }

  async function saveNetData() {
    var btn = $("saveNetBtn");
    if (!pConfigText && !pConfigSha) { toast("ملف config/config.js غير موجود في المستودع", "err"); return; }
    var fields = {};
    NET_FIELDS.forEach(function (k) {
      var el = document.getElementById("net_" + k);
      if (el) fields[k] = el.value;
    });
    btn.disabled = true;
    try {
      var r = writeNetFieldsTo(pConfigText, fields);
      if (r.changed) {
        await GH.putFile(pBase() + "/config/config.js", r.text, "panel: update config.js", pConfigSha || null);
        pConfigText = r.text;
      }
      $("netResult").textContent = "آخر حفظ: " + new Date().toLocaleTimeString();
      toast("حُفظت بيانات الشبكة — الراوتر سحبها خلال دقيقة", "ok");
    } catch (e) {
      toast("فشل الحفظ: " + e.message, "err");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---- JSON خام ---- */

  function renderRawSelect() {
    var sel = $("rawFileSelect");
    var cur = sel.value;
    sel.innerHTML = "";
    PORTAL_DATA_FILES.forEach(function (n) {
      var o = document.createElement("option");
      o.value = n;
      o.textContent = n + ".json — " + FILE_LABELS[n];
      sel.appendChild(o);
    });
    if (cur) sel.value = cur;
    loadRaw();
  }

  function loadRaw() {
    var name = $("rawFileSelect").value;
    var v = pState[name];
    $("rawEditor").value = v === undefined ? "" : JSON.stringify(v, null, 2);
    $("rawDownload").href = pBase() ? GH.rawUrl(pBase() + "/data/" + name + ".json") : "#";
    $("rawError").textContent = "";
  }

  /* ---- الحالة والعزل ---- */

  async function refreshPortalStatus() {
    var r = currentRouter("portalRouter"), base = pBase();
    var info = $("statusRouterInfo");
    if (!r || !base) { info.innerHTML = '<div class="dim">لا راوتر محدد</div>'; return; }
    info.innerHTML =
      "<div><b>" + esc(r.name) + "</b></div>" +
      '<div class="dim">العنوان: <code>' + esc(r.host || "—") + "</code></div>" +
      '<div class="dim">الشبكة: ' + esc(r.network || "—") + "</div>" +
      '<div class="dim">مسار المستودع: <code>' + esc(base) + "</code></div>" +
      '<div class="dim">وجهة الراوتر: <code>' + esc(routerBaseOf(r)) + "</code></div>" +
      (r.portal ? '<div class="dim">البوابة: <a href="' + esc(r.portal) + '" target="_blank" rel="noopener">' + esc(r.portal) + "</a></div>" : "");
    var tb = $("filesTable").querySelector("tbody");
    tb.innerHTML = '<tr><td colspan="3" class="dim">جارٍ التحميل…</td></tr>';
    var rows = PORTAL_DATA_FILES.map(function (n) { return [n + ".json", base + "/data/" + n + ".json"]; });
    rows.push(["config/config.js", base + "/config/config.js"]);
    var html = "";
    for (var i = 0; i < rows.length; i++) {
      try {
        var f = await GH.getFile(rows[i][1]);
        html += "<tr><td>" + esc(rows[i][0]) + "</td><td>" + f.size + ' B</td><td><code>' + esc(String(f.sha || "").substring(0, 7)) + "</code></td></tr>";
      } catch (e) {
        html += "<tr><td>" + esc(rows[i][0]) + '</td><td class="dim">' + (e.status === 404 ? "غير موجود" : esc(e.message)) + "</td><td>—</td></tr>";
      }
    }
    tb.innerHTML = html;
    try {
      var cs = await GH.listCommits(base, 1);
      $("portalLastCommit").textContent = (cs && cs[0])
        ? "آخر تعديل: " + new Date(cs[0].commit.author.date).toLocaleString() + " — " + (cs[0].commit.message || "").split("\n")[0]
        : "";
    } catch (e) { $("portalLastCommit").textContent = ""; }
  }

  async function runIsolation() {
    var base = pBase();
    var ul = $("isolationList");
    if (!base) { ul.innerHTML = '<li class="no">لا مسار بوابة</li>'; return; }
    ul.innerHTML = "<li>جارٍ الفحص…</li>";
    var html = "", allOk = true;
    for (var i = 0; i < ISO_FILES.length; i++) {
      var rel = ISO_FILES[i];
      try {
        var f = await GH.getFile(base + "/portal/" + rel);
        var hit = null;
        for (var j = 0; j < ISO_PATTERNS.length; j++) {
          if (f.content.indexOf(ISO_PATTERNS[j]) !== -1) { hit = ISO_PATTERNS[j]; break; }
        }
        html += "<li>" + (hit ? '<span class="no">✗ ' + esc(hit) + "</span>" : '<span class="yes">✓ نظيف</span>') + " — " + esc(rel) + "</li>";
        if (hit) allOk = false;
      } catch (e) {
        if (e.status === 404) html += '<li class="dim">— غير في المستودع: ' + esc(rel) + "</li>";
        else { html += '<li class="no">✗ ' + esc(e.message) + " — " + esc(rel) + "</li>"; allOk = false; }
      }
    }
    html += "<li>" + (allOk
      ? '<span class="yes">✓ لا توجد إشارات لسيرفر خارجي في الملفات المتاحة</span>'
      : '<span class="no">✗ توجد إشارات تحتاج تنظيفاً</span>') + "</li>";
    ul.innerHTML = html;
  }

  /* ---- حفظ عامة ---- */

  async function portalSave(what, btn) {
    if (!pLoaded) { toast("حمّل بيانات البوابة أولاً (تحديث الكل)", "err"); return; }
    try {
      if (btn) btn.disabled = true;
      if (what === "settings") {
        var old = pState.settings || {};
        pState.settings = collectSettings();
        var lit = THEME_KEYS.filter(function (k) { return pState.settings[k] === "on"; });
        if (lit.length > 1) {
          var justOn = null, li;
          for (li = 0; li < lit.length; li++) if (old[lit[li]] !== "on") { justOn = lit[li]; break; }
          applyThemeFlags(pState.settings, THEME_OF_KEY[justOn || lit[0]]);
        }
        var cur = currentTheme(pState.settings);
        var actNow = pState.styles.find(function (s) { return s.name === pState.settings["active-style"]; });
        if (!(actNow && (actNow.theme || "none") === cur)) {
          var m = pState.styles.find(function (s) { return (s.theme || "none") === cur; });
          if (m) pState.settings["active-style"] = m.name;
          else delete pState.settings["active-style"];
        }
        await savePortalFile("settings");
        renderStyles();
      } else if (what === "speeds") { pState.speeds = collectSpeeds(); await savePortalFile("speeds"); }
      else if (what === "profiles") { pState.profiles = collectProfiles(); await savePortalFile("profiles"); }
      else if (what === "points") { pState.points = collectPoints(); await savePortalFile("points"); }
      else if (what === "text") { pState.text = { text: $("scrollText").value }; await savePortalFile("text"); }
      else if (what === "colors") { pState.colors = collectColors(); await savePortalFile("colors"); }
      else if (what === "raw") {
        var name = $("rawFileSelect").value;
        try {
          pState[name] = JSON.parse($("rawEditor").value);
        } catch (e) {
          $("rawError").textContent = "JSON غير صالح: " + e.message;
          return;
        }
        $("rawError").textContent = "";
        await savePortalFile(name);
        renderPortalAll();
      }
    } catch (e) {
      toast("فشل الحفظ: " + e.message, "err");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function wirePortal() {
    qsa("#portalSubtabs .subtab").forEach(function (b) {
      b.onclick = function () {
        qsa("#portalSubtabs .subtab").forEach(function (x) { x.classList.toggle("active", x === b); });
        qsa("#tab-portal .subpage").forEach(function (p) { p.classList.toggle("active", p.id === "p-" + b.dataset.sub); });
        if (b.dataset.sub === "status") refreshPortalStatus();
      };
    });
    qsa("[data-psave]").forEach(function (b) { b.onclick = function () { portalSave(b.dataset.psave, b); }; });
    $("portalRouter").onchange = function () { pLoaded = false; loadPortal(); };
    $("btnPortalReload").onclick = function () { loadPortal(true); };
    $("btnPortalScript").onclick = function (e) { e.preventDefault(); downloadPullScript(); };
    $("btnStatusPullScript").onclick = downloadPullScript;
    $("btnStatusIsolation").onclick = runIsolation;
    $("addSpeedRow").onclick = function () {
      pState.speeds = collectSpeeds();
      pState.speeds.speeds.push({ upload: "512K", download: "2048K", name: "" });
      renderSpeeds();
    };
    $("addProfileRow").onclick = function () { pState.profiles = collectProfiles(); pState.profiles.push({ price: "", time: "", transfer: "", validity: "" }); renderProfiles(); };
    $("addPointRow").onclick = function () { pState.points = collectPoints(); pState.points.push({ name: "" }); renderPoints(); };
    $("addColorRow").onclick = function () { $("colorsTable").querySelector("tbody").appendChild(colorRow("", "#7919ab")); };
    $("restoreColors").onclick = async function () {
      if (!confirm("استعادة الألوان الافتراضية السابقة؟ سيتم استبدال الألوان الحالية")) return;
      pState.colors = JSON.parse(JSON.stringify(pState["colors-default"] || {}));
      renderColors();
      try { await savePortalFile("colors"); } catch (e) { toast(e.message, "err"); }
    };
    $("saveColorsDefault").onclick = async function () {
      if (!confirm("حفظ الألوان الحالية كافتراضية جديدة؟")) return;
      pState["colors-default"] = collectColors();
      try { await savePortalFile("colors-default"); } catch (e) { toast(e.message, "err"); }
    };
    $("imageInput").onchange = function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      e.target.value = "";
      if (files.length) uploadImages(files);
    };
    $("saveStyleBtn").onclick = saveStyle;
    $("saveNetBtn").onclick = saveNetData;
    $("rawFileSelect").onchange = loadRaw;
  }

  function wire() {
    document.querySelectorAll(".tab").forEach(function (b) {
      b.onclick = function () {
        setTab(b.dataset.tab);
        if (b.dataset.tab === "portal" && !pLoaded) loadPortal();
      };
    });
    $("btnAddRouter").onclick = async function () {
      var n = prompt("اسم الراوتر الجديد"); if (!n) return;
      var h = prompt("عنوان الراوتر (IP)"); if (!h) return;
      var net = prompt("الشبكة", ""); if (net === null) return;
      routers.push({ id: "r" + Date.now(), name: n.trim(), host: h.trim(), network: (net || "").trim(), portal: "", files: [] });
      renderRouters(); fillRouterSelects();
      try { await saveRegistry(); } catch (e) { toast(e.message, "err"); }
    };
    $("btnReloadRouters").onclick = function () { loadRegistry(true); };
    $("editorRouter").onchange = fillEditorFiles;
    $("editorFile").onchange = loadSelectedFile;
    $("btnReloadFile").onclick = loadSelectedFile;
    $("btnSaveFile").onclick = saveSelectedFile;
    $("editorText").oninput = function () { var f = selectedFile(); if (f) validateText(f.repo, $("editorText").value); };
    $("historyRouter").onchange = fillHistoryFiles;
    $("btnLoadHistory").onclick = loadHistory;
    $("btnSaveCfg").onclick = saveSettings;
    $("btnTestCfg").onclick = testSettings;
    $("btnInitRepo").onclick = initRepo;
    $("btnPullScript").onclick = downloadPullScript;
    $("btnLogout").onclick = function () {
      localStorage.removeItem("panel_auth");
      location.href = "login.html";
    };
    wirePortal();
  }

  async function boot() {
    if (!localStorage.getItem("panel_auth")) { location.href = "login.html"; return; }
    wire();
    fillSettingsForm();
    updateRepoBadge();
    if (!GH.cfg().owner || !GH.cfg().repo) setTab("settings");
    await loadRegistry(false);
  }

  function start() {
    boot().catch(function (e) { console.error(e); });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
