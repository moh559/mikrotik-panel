window.GH = (function () {
  var API = "https://api.github.com";

  function cfg() {
    try { return JSON.parse(localStorage.getItem("panel_cfg") || "{}"); }
    catch (e) { return {}; }
  }

  function baseHeaders() {
    var c = cfg();
    var h = { "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (c.token) h["Authorization"] = "Bearer " + c.token;
    return h;
  }

  function requireCfg() {
    var c = cfg();
    if (!c.owner || !c.repo) throw new Error("أكمل إعدادات المستودع أولاً (الإعدادات تبويب)");
    return c;
  }

  function contentsUrl(path, ref) {
    var c = requireCfg();
    var u = API + "/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + "/contents";
    if (path) u += "/" + path.split("/").map(encodeURIComponent).join("/");
    var branch = ref || c.branch || "main";
    return u + "?ref=" + encodeURIComponent(branch);
  }

  async function ghFetch(url, opts) {
    opts = opts || {};
    opts.headers = Object.assign(baseHeaders(), opts.headers || {});
    var res = await fetch(url, opts);
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
      var msg = (data && data.message) ? data.message : ("HTTP " + res.status);
      var err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function b64encode(str) {
    return btoa(String.fromCharCode.apply(null, new TextEncoder().encode(str)));
  }

  function b64decode(b64) {
    var bin = atob(b64.replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  async function getRepo() {
    var c = requireCfg();
    return ghFetch(API + "/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo));
  }

  async function getUser() {
    return ghFetch(API + "/user");
  }

  async function getFile(path) {
    var data = await ghFetch(contentsUrl(path));
    if (Array.isArray(data)) {
      return { type: "dir", entries: data };
    }
    var content = data.content || "";
    if (data.encoding === "base64") content = b64decode(content);
    return { type: "file", path: data.path, sha: data.sha, size: data.size, content: content, htmlUrl: data.html_url, downloadUrl: data.download_url };
  }

  async function putFile(path, content, message, sha) {
    var c = requireCfg();
    var body = {
      message: message || ("panel: update " + path),
      content: b64encode(content),
      branch: c.branch || "main"
    };
    if (sha) body.sha = sha;
    var data = await ghFetch(contentsUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return { path: data.content && data.content.path, sha: data.content && data.content.sha, commitSha: data.commit && data.commit.sha, commitUrl: data.commit && data.commit.html_url };
  }

  async function createRepo(name, autoInit) {
    return ghFetch(API + "/user/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name,
        description: "mikrotik panel",
        private: false,
        auto_init: !!autoInit
      })
    });
  }

  function pagesApiUrl() {
    var c = requireCfg();
    return API + "/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) + "/pages";
  }

  async function enablePages(branch) {
    return ghFetch(pagesApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: { branch: branch, path: "/" } })
    });
  }

  async function getPages() {
    return ghFetch(pagesApiUrl());
  }

  async function listCommits(path, limit) {
    var c = requireCfg();
    var u = API + "/repos/" + encodeURIComponent(c.owner) + "/" + encodeURIComponent(c.repo) +
      "/commits?per_page=" + (limit || 10) + "&sha=" + encodeURIComponent(c.branch || "main");
    if (path) u += "&path=" + path.split("/").map(encodeURIComponent).join("/");
    return ghFetch(u);
  }

  function rawUrl(path) {
    var c = cfg();
    if (!c.owner || !c.repo) return "#";
    return "https://raw.githubusercontent.com/" + c.owner + "/" + c.repo + "/" + (c.branch || "main") + "/" + path;
  }

  function pagesUrl() {
    var c = cfg();
    if (!c.owner || !c.repo) return "#";
    return "https://" + c.owner.toLowerCase() + ".github.io/" + c.repo + "/";
  }

  return {
    cfg: cfg,
    getRepo: getRepo,
    getUser: getUser,
    getFile: getFile,
    putFile: putFile,
    createRepo: createRepo,
    enablePages: enablePages,
    getPages: getPages,
    listCommits: listCommits,
    rawUrl: rawUrl,
    pagesUrl: pagesUrl
  };
})();
