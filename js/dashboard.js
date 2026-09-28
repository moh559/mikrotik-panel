(function () {
  var LABELS = {
    "settings.json": "الإعدادات",
    "speeds.json": "السرعات",
    "profiles.json": "الباقات",
    "points.json": "النقاط",
    "text.json": "النص",
    "colors.json": "الألوان",
    "colors-default.json": "الألوان الافتراضية",
    "images.json": "الصور",
    "slots.json": "الفتحات",
    "styles.json": "الأنماط"
  };
  var state = { list: [], current: null };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function $(id) { return document.getElementById(id); }

  async function jget(url) {
    var r = await fetch(url);
    if (!r.ok) throw new Error("HTTP " + r.status);
    return JSON.parse(await r.text());
  }

  function apiRepo() {
    if (window.__DASH_REPO) return window.__DASH_REPO;
    var m = (location.hostname || "").match(/^([A-Za-z0-9-]+)\.github\.io$/);
    var seg = (location.pathname || "").split("/").filter(Boolean);
    if (!m || !seg.length) return null;
    return { owner: m[1], repo: seg[0] };
  }

  function isColor(v) {
    return typeof v === "string" && (/^#[0-9a-fA-F]{3,8}$/.test(v) || v.indexOf("gradient(") !== -1 || v.indexOf("rgb(") !== -1);
  }

  function scalar(v) {
    if (v == null) return "";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  }

  function tableFromObject(obj) {
    var rows = Object.keys(obj).map(function (k) {
      var v = obj[k];
      var sw = isColor(v) && /^#|^rgb/.test(v) ? '<span class="swatch" style="background:' + esc(v) + '"></span>' : "";
      var ltr = /^#[0-9a-fA-F]/.test(String(v)) || String(v).indexOf("gradient(") !== -1 ? " ltr" : "";
      return "<tr><th>" + esc(k) + "</th><td class=\"" + ltr.trim() + "\">" + sw + esc(scalar(v)) + "</td></tr>";
    });
    if (!rows.length) return '<p class="dim">لا توجد عناصر</p>';
    return "<table><tbody>" + rows.join("") + "</tbody></table>";
  }

  function tableFromArray(arr) {
    if (!arr.length) return '<p class="dim">لا توجد عناصر</p>';
    if (arr.every(function (x) { return x && typeof x === "object" && Object.keys(x).length === 1 && x.name; })) {
      return '<div class="chips">' + arr.map(function (x) { return '<span class="chip">' + esc(x.name) + "</span>"; }).join("") + "</div>";
    }
    if (arr.every(function (x) { return x && typeof x === "object" && x.image_path; })) {
      return "";
    }
    var keys = [];
    arr.forEach(function (x) {
      if (x && typeof x === "object") Object.keys(x).forEach(function (k) { if (keys.indexOf(k) === -1) keys.push(k); });
    });
    var head = keys.map(function (k) { return "<th>" + esc(k) + "</th>"; }).join("");
    var body = arr.map(function (x) {
      return "<tr>" + keys.map(function (k) { return "<td>" + esc(x ? scalar(x[k]) : "") + "</td>"; }).join("") + "</tr>";
    }).join("");
    return "<table><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table>";
  }

  function renderData(name, json, router) {
    var label = LABELS[name] || name;
    var box = el("article", "box");
    var inner = "";
    if (name === "speeds.json" && json && Array.isArray(json.speeds)) {
      inner = tableFromArray(json.speeds);
      if (json.default_builtin_speed) inner += '<p class="dim">السرعة الافتراضية: <span class="ltr">' + esc(json.default_builtin_speed) + "</span></p>";
    } else if (name === "images.json" && Array.isArray(json)) {
      inner = '<div class="chips">' + json.map(function (x) {
        var src = (router.repoBase || "") + "/" + (x.image_path || "");
        return '<a href="' + esc(src) + '" target="_blank" rel="noopener"><img src="' + esc(src) + '" alt=""></a>';
      }).join("") + "</div>";
    } else if (Array.isArray(json)) {
      inner = tableFromArray(json);
    } else if (json && typeof json === "object") {
      inner = tableFromObject(json);
    } else {
      inner = '<pre class="ltr">' + esc(JSON.stringify(json, null, 2)) + "</pre>";
    }
    box.innerHTML = "<h3>" + esc(label) + '</h3><div class="path">' + esc(name) + "</div>" + inner;
    return box;
  }

  function renderList() {
    var box = $("routers");
    box.innerHTML = "";
    if (!state.list.length) {
      box.innerHTML = '<p class="dim">لا توجد راوترات منشورة بعد.</p>';
      return;
    }
    state.list.forEach(function (r, i) {
      var card = el("article", "card");
      card.innerHTML =
        "<h2>" + esc(r.name || r.id) + "</h2>" +
        '<p class="dim">' + esc(r.network || "") + "</p>" +
        '<div class="actions">' +
        (r.portal ? '<a class="btn" href="' + esc(r.portal) + '" target="_blank" rel="noopener">فتح البوابة</a>' : "") +
        '<button class="btn primary" type="button" data-i="' + i + '">التفاصيل</button>' +
        "</div>";
      box.appendChild(card);
    });
    Array.prototype.forEach.call(box.querySelectorAll("button[data-i]"), function (b) {
      b.addEventListener("click", function () { openRouter(state.list[+b.getAttribute("data-i")]); });
    });
  }

  function loadChanges(r) {
    var box = $("changes");
    box.innerHTML = '<li class="dim">…</li>';
    var a = apiRepo();
    if (!a) { box.innerHTML = '<li class="dim">غير متاح</li>'; return; }
    var url = "https://api.github.com/repos/" + a.owner + "/" + a.repo + "/commits?per_page=8" +
      (r.repoBase ? "&path=" + encodeURIComponent(r.repoBase) : "");
    jget(url).then(function (list) {
      if (!Array.isArray(list) || !list.length) { box.innerHTML = '<li class="dim">لا توجد تغييرات</li>'; return; }
      box.innerHTML = list.map(function (c) {
        var msg = (c.commit && c.commit.message ? c.commit.message : "").split("\n")[0];
        var d = c.commit && c.commit.author && c.commit.author.date;
        return "<li><span>" + esc(msg) + "</span><time>" + (d ? esc(new Date(d).toLocaleString("ar-EG")) : "") + "</time></li>";
      }).join("");
    }).catch(function () { box.innerHTML = '<li class="dim">تعذر جلب التغييرات</li>'; });
  }

  function openRouter(r) {
    state.current = r;
    $("listView").hidden = true;
    $("detailView").hidden = false;
    var head = $("detailHead");
    head.innerHTML =
      "<h2>" + esc(r.name || r.id) + "</h2>" +
      '<p class="dim">' + esc(r.network || "") + "</p>" +
      '<div class="head-links">' +
      (r.portal ? '<a class="btn" href="' + esc(r.portal) + '" target="_blank" rel="noopener">فتح البوابة</a>' : "") +
      "</div>";
    var grid = $("dataGrid");
    grid.innerHTML = "";
    var files = (r.files || []).filter(function (f) { return /\.json$/.test(f); });
    if (!files.length) grid.innerHTML = '<p class="dim">لا توجد ملفات بيانات.</p>';
    files.forEach(function (f) {
      var short = f.split("/").pop();
      var card = el("article", "box");
      card.innerHTML = "<h3>" + esc(LABELS[short] || short) + '</h3><div class="path">' + esc(f) + '</div><p class="dim">…</p>';
      grid.appendChild(card);
      jget(f).then(function (json) { card.innerHTML = renderData(short, json, r).innerHTML; })
        .catch(function () { card.innerHTML = card.innerHTML.replace("…", "تعذر الجلب"); });
    });
    loadChanges(r);
    window.scrollTo(0, 0);
  }

  function back() {
    state.current = null;
    $("detailView").hidden = true;
    $("listView").hidden = false;
    window.scrollTo(0, 0);
  }

  function boot() {
    $("backBtn").addEventListener("click", back);
    $("footInfo").textContent = "عرض فقط — التحكم والإعداد من اللوحة الخاصة.";
    jget("routers/public.json").then(function (data) {
      state.list = (data && data.routers) || [];
      renderList();
      $("footInfo").textContent = "عرض فقط — التحكم والإعداد من اللوحة الخاصة." +
        (data && data.generated ? " · آخر نشر: " + new Date(data.generated).toLocaleString("ar-EG") : "");
    }).catch(function () {
      var e = $("errorBox");
      e.hidden = false;
      e.textContent = "تعذر تحميل قائمة الراوترات.";
      renderList();
    });
  }

  boot();
})();
