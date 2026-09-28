(function () {
  var REGISTRY_PATH = "routers/registry.json";
  var DEFAULT_ROUTERS = [
    {
      id: "v6",
      name: "الراوتر القديم v6",
      host: "50.50.0.1",
      network: "شبكة 50.50.0.0/24",
      portal: "http://50.50.0.1/1/",
      files: [
        { repo: "routers/v6/data/settings.json", router: "1/data/settings.json" },
        { repo: "routers/v6/data/colors.json", router: "1/data/colors.json" },
        { repo: "routers/v6/data/speeds.json", router: "1/data/speeds.json" },
        { repo: "routers/v6/conf.js", router: "1/conf.js" }
      ]
    },
    {
      id: "v7",
      name: "الراوتر الجديد v7",
      host: "192.168.50.1",
      network: "شبكة 192.168.50.0/24",
      portal: "http://192.168.50.1/1/",
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
    ["editorRouter", "historyRouter"].forEach(function (id) {
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

  function buildPullRsc() {
    var c = GH.cfg();
    if (!c.owner || !c.repo) return null;
    var base = "https://raw.githubusercontent.com/" + c.owner + "/" + c.repo + "/" + (c.branch || "main") + "/";
    var lines = [];
    routers.forEach(function (r) {
      (r.files || []).forEach(function (f) {
        lines.push("/tool/fetch url=" + base + f.repo + " dst-path=" + f.router);
      });
    });
    if (!lines.length) return null;
    return "/system scheduler add name=panel_pull interval=1m start-time=startup comment=\"cloud panel pull\" on-event=\"" +
      lines.join("\n") + "\"";
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

  function wire() {
    document.querySelectorAll(".tab").forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
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
  }

  async function boot() {
    wire();
    fillSettingsForm();
    updateRepoBadge();
    if (!GH.cfg().owner || !GH.cfg().repo) setTab("settings");
    await loadRegistry(false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    boot().catch(function (e) { console.error(e); });
  });
})();
