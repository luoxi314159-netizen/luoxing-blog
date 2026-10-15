/* 站内编辑后台：读取/编辑文章与下载项，一键提交到 GitHub */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var LS_KEY = "myblog_admin_cfg";

  var cfg = (function () {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch (e) { return {}; }
  })();

  var posts = [];
  var downloads = [];
  var curPost = -1;      // -1 表示新建
  var curDownload = -1;
  var savedRange = null; // 正文光标位置（用于插图）

  /* ================= 工具 ================= */

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "", chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function base64ToUtf8(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function arrayBufferToBase64(buf) {
    var bytes = new Uint8Array(buf), bin = "", chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function status(msg, kind) {
    var el = $("status");
    el.textContent = msg || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  /* ================= GitHub API ================= */

  function assertCfg() {
    if (!cfg.owner || !cfg.repo || !cfg.token) {
      throw new Error("请先在顶部「仓库与令牌设置」里填好 用户名 / 仓库 / Token 并保存。");
    }
  }

  function headers() {
    return {
      "Authorization": "Bearer " + cfg.token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    };
  }

  function branch() { return cfg.branch || "main"; }
  function contentUrl(path) {
    return "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo +
           "/contents/" + path + "?ref=" + encodeURIComponent(branch());
  }
  function apiUrl(path) {
    return "https://api.github.com/repos/" + cfg.owner + "/" + cfg.repo +
           "/contents/" + path;
  }

  async function ghGet(path) {
    var res = await fetch(contentUrl(path), { headers: headers() });
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error("认证失败（" + res.status + "），请检查 Token 是否有该仓库的 Contents 读写权限。");
    }
    if (!res.ok) throw new Error("读取失败 " + res.status + "：" + (await res.text()));
    return res.json();
  }

  async function ghPut(path, base64Content, message, sha) {
    var body = { message: message, content: base64Content, branch: branch() };
    if (sha) body.sha = sha;
    var res = await fetch(apiUrl(path), {
      method: "PUT", headers: headers(), body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("提交失败 " + res.status + "：" + (await res.text()));
    return res.json();
  }

  /* ================= data.js 解析 / 生成 ================= */

  function parseDataJs(src) {
    var fn = new Function(
      src + "\n;return { POSTS: (typeof POSTS!=='undefined'?POSTS:[]), " +
      "DOWNLOADS: (typeof DOWNLOADS!=='undefined'?DOWNLOADS:[]) };"
    );
    return fn();
  }

  function generateDataJs() {
    return "/* 本文件由站内编辑器自动生成，请勿手动编辑 */\n" +
      "const POSTS = " + JSON.stringify(posts, null, 2) + ";\n\n" +
      "const DOWNLOADS = " + JSON.stringify(downloads, null, 2) + ";\n";
  }

  /* ================= 配置 ================= */

  function loadCfgToForm() {
    $("cfgOwner").value = cfg.owner || "";
    $("cfgRepo").value = cfg.repo || "";
    $("cfgBranch").value = cfg.branch || "main";
    $("cfgPath").value = cfg.path || "assets/data.js";
    $("cfgToken").value = cfg.token || "";
  }

  function saveCfgFromForm() {
    cfg.owner = $("cfgOwner").value.trim();
    cfg.repo = $("cfgRepo").value.trim();
    cfg.branch = $("cfgBranch").value.trim() || "main";
    cfg.path = $("cfgPath").value.trim() || "assets/data.js";
    cfg.token = $("cfgToken").value.trim();
    localStorage.setItem(LS_KEY, JSON.stringify(cfg));
    status("设置已保存到本机浏览器 ✓", "ok");
    if (cfg.owner && cfg.repo) { loadFromGithub(); }
  }

  async function testConnection() {
    try {
      assertCfg();
      status("正在测试…");
      var f = await ghGet(cfg.path || "assets/data.js");
      status(f ? "连接成功，已找到 " + cfg.path + " ✓" : "连接成功，但仓库里还没有 " + cfg.path + "（首次发布会自动创建）", "ok");
    } catch (e) { status(e.message, "err"); }
  }

  /* ================= 数据读写 ================= */

  async function loadFromGithub() {
    try {
      assertCfg();
      status("正在从 GitHub 读取…");
      var f = await ghGet(cfg.path || "assets/data.js");
      if (!f) {
        posts = []; downloads = [];
      } else {
        var data = parseDataJs(base64ToUtf8(f.content));
        posts = data.POSTS || [];
        downloads = data.DOWNLOADS || [];
      }
      renderPosts(); renderDownloads();
      clearPostForm(); clearDownloadForm();
      status("已读取线上数据（共 " + posts.length + " 篇文章 / " + downloads.length + " 个下载项）✓", "ok");
    } catch (e) { status(e.message, "err"); }
  }

  async function publish() {
    try {
      assertCfg();
      status("正在提交到 GitHub…");
      var path = cfg.path || "assets/data.js";
      var message = $("commitMsg").value.trim() || ("更新站点内容 " + today());
      var cur = await ghGet(path);
      var out = await ghPut(path, utf8ToBase64(generateDataJs()), message, cur ? cur.sha : undefined);
      var link = out && out.commit ? out.commit.html_url : "";
      status("已发布 ✓ 托管平台通常 1 分钟内自动重新部署。" + (link ? " 提交：" + link : ""), "ok");
    } catch (e) { status(e.message, "err"); }
  }

  /* ================= 文章 ================= */

  function renderPosts() {
    var ul = $("postList");
    if (!posts.length) { ul.innerHTML = '<li class="muted">暂无文章</li>'; return; }
    ul.innerHTML = posts.map(function (p, i) {
      return '<li data-i="' + i + '"' + (i === curPost ? ' class="active"' : "") + '>' +
        escapeHtml(p.title || "(无标题)") +
        '<span class="sub">' + escapeHtml(p.slug || "") + " · " + escapeHtml(p.date || "") + "</span></li>";
    }).join("");
    Array.prototype.forEach.call(ul.children, function (li) {
      if (li.dataset.i === undefined) return;
      li.onclick = function () { editPost(Number(li.dataset.i)); };
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function clearPostForm() {
    curPost = -1;
    $("pTitle").value = ""; $("pSlug").value = ""; $("pDate").value = today();
    $("pTags").value = ""; $("pSummary").value = ""; $("pContent").innerHTML = "";
    renderPosts();
  }

  function editPost(i) {
    var p = posts[i]; if (!p) return;
    curPost = i;
    $("pTitle").value = p.title || "";
    $("pSlug").value = p.slug || "";
    $("pDate").value = p.date || "";
    $("pTags").value = (p.tags || []).join(", ");
    $("pSummary").value = p.summary || "";
    $("pContent").innerHTML = p.content || "";
    renderPosts();
  }

  function collectPost() {
    return {
      slug: $("pSlug").value.trim(),
      title: $("pTitle").value.trim(),
      date: $("pDate").value.trim() || today(),
      tags: $("pTags").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean),
      summary: $("pSummary").value.trim(),
      content: $("pContent").innerHTML.trim()
    };
  }

  function savePost() {
    var p = collectPost();
    if (!p.title) { status("标题不能为空", "err"); return; }
    if (!p.slug) { status("slug 不能为空", "err"); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(p.slug)) { status("slug 只能用英文、数字、- 和 _", "err"); return; }
    var dup = posts.some(function (x, i) { return x.slug === p.slug && i !== curPost; });
    if (dup) { status("slug「" + p.slug + "」已被使用", "err"); return; }

    if (curPost === -1) posts.unshift(p);
    else posts[curPost] = p;
    curPost = posts.findIndex(function (x) { return x.slug === p.slug; });
    renderPosts();
    status("已保存到草稿，记得点「🚀 发布到 GitHub」", "warn");
  }

  function deletePost() {
    if (curPost === -1) { status("请先在左侧选择一篇文章", "warn"); return; }
    if (!confirm("确定删除《" + (posts[curPost].title || "") + "》？")) return;
    posts.splice(curPost, 1);
    clearPostForm();
    status("已从草稿中删除，点「发布」生效", "warn");
  }

  /* ================= 下载 ================= */

  function renderDownloads() {
    var ul = $("downloadList");
    if (!downloads.length) { ul.innerHTML = '<li class="muted">暂无下载项</li>'; return; }
    ul.innerHTML = downloads.map(function (d, i) {
      return '<li data-i="' + i + '"' + (i === curDownload ? ' class="active"' : "") + '>' +
        escapeHtml(d.name || "(未命名)") +
        '<span class="sub">' + escapeHtml(d.date || "") + (d.size ? " · " + escapeHtml(d.size) : "") + "</span></li>";
    }).join("");
    Array.prototype.forEach.call(ul.children, function (li) {
      if (li.dataset.i === undefined) return;
      li.onclick = function () { editDownload(Number(li.dataset.i)); };
    });
  }

  function clearDownloadForm() {
    curDownload = -1;
    $("dName").value = ""; $("dDate").value = today(); $("dSize").value = "";
    $("dUrl").value = ""; $("dDesc").value = "";
    renderDownloads();
  }

  function editDownload(i) {
    var d = downloads[i]; if (!d) return;
    curDownload = i;
    $("dName").value = d.name || "";
    $("dDate").value = d.date || "";
    $("dSize").value = d.size || "";
    $("dUrl").value = d.url || "";
    $("dDesc").value = d.desc || "";
    renderDownloads();
  }

  function collectDownload() {
    return {
      name: $("dName").value.trim(),
      date: $("dDate").value.trim() || today(),
      size: $("dSize").value.trim(),
      desc: $("dDesc").value.trim(),
      url: $("dUrl").value.trim()
    };
  }

  function saveDownload() {
    var d = collectDownload();
    if (!d.name) { status("名称不能为空", "err"); return; }
    if (!d.url) { status("下载地址不能为空（可先上传文件自动生成）", "err"); return; }
    if (curDownload === -1) downloads.unshift(d);
    else downloads[curDownload] = d;
    var name = d.name;
    curDownload = downloads.findIndex(function (x) { return x.name === name && x.date === d.date; });
    renderDownloads();
    status("已保存到草稿，记得点「🚀 发布到 GitHub」", "warn");
  }

  function deleteDownload() {
    if (curDownload === -1) { status("请先在左侧选择一个下载项", "warn"); return; }
    if (!confirm("确定删除「" + downloads[curDownload].name + "」？")) return;
    downloads.splice(curDownload, 1);
    clearDownloadForm();
    status("已从草稿中删除，点「发布」生效", "warn");
  }

  async function uploadFile(file) {
    try {
      assertCfg();
      var path = "downloads/" + file.name;
      status("正在上传 " + file.name + " …");
      var buf = await file.arrayBuffer();
      var cur = await ghGet(path);
      await ghPut(path, arrayBufferToBase64(buf), "上传文件: " + file.name, cur ? cur.sha : undefined);
      $("dUrl").value = path;
      if (!$("dName").value) $("dName").value = file.name.replace(/\.[^.]+$/, "");
      status("文件已上传到仓库 " + path + " ✓（地址已自动填好，别忘了保存并发布）", "ok");
    } catch (e) { status(e.message, "err"); }
  }

  /* ================= 文章插图 ================= */

  function saveSel() {
    var sel = window.getSelection();
    if (sel && sel.rangeCount) {
      var r = sel.getRangeAt(0);
      if ($("pContent").contains(r.commonAncestorContainer)) {
        savedRange = r.cloneRange();
      }
    }
  }

  function insertAtCursor(html) {
    var rte = $("pContent");
    rte.focus();
    var sel = window.getSelection();
    if (savedRange) {
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }
    document.execCommand("insertHTML", false, html);
  }

  async function uploadImage(file) {
    try {
      assertCfg();
      if (file.size > 8 * 1024 * 1024) {
        status("图片超过 8 MB，建议压缩后再上传。", "err");
        return;
      }
      var safe = file.name.replace(/[^\w.\-]+/g, "_");
      var path = "assets/uploads/" + Date.now() + "-" + safe;
      status("正在上传图片 " + file.name + " …");
      var buf = await file.arrayBuffer();
      var cur = await ghGet(path);
      await ghPut(path, arrayBufferToBase64(buf), "上传图片: " + file.name, cur ? cur.sha : undefined);
      insertAtCursor('<img src="' + path + '" alt="' + escapeHtml(file.name) + '">');
      status("图片已上传并插入正文 ✓（记得点「🚀 发布到 GitHub」）", "ok");
    } catch (e) { status(e.message, "err"); }
  }

  /* ================= 富文本工具栏 ================= */

  function setupRte() {
    document.querySelectorAll(".rte-toolbar button").forEach(function (btn) {
      btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
      btn.addEventListener("click", function () {
        var cmd = btn.dataset.cmd;
        if (cmd === "image") { saveSel(); $("pImage").click(); return; }
        $("pContent").focus();
        if (cmd === "link") {
          var url = prompt("输入链接地址：", "https://");
          if (url) document.execCommand("createLink", false, url);
        } else if (cmd === "code") {
          var text = prompt("输入代码内容：", "");
          if (text) document.execCommand("insertHTML", false, "<pre><code>" + escapeHtml(text) + "</code></pre>");
        } else if (cmd === "formatBlock") {
          document.execCommand("formatBlock", false, "<" + btn.dataset.val + ">");
        } else {
          document.execCommand(cmd, false, null);
        }
      });
    });
  }

  function setupTabs() {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        $("tab-posts").classList.toggle("hidden", t.dataset.tab !== "posts");
        $("tab-downloads").classList.toggle("hidden", t.dataset.tab !== "downloads");
      });
    });
  }

  /* ================= 启动 ================= */

  function init() {
    loadCfgToForm();
    setupRte();
    setupTabs();
    renderPosts();
    renderDownloads();
    $("pDate").value = today();
    $("dDate").value = today();

    $("btnSaveCfg").onclick = saveCfgFromForm;
    $("btnTest").onclick = testConnection;
    $("btnLoad").onclick = loadFromGithub;
    $("btnPublish").onclick = publish;

    $("btnNewPost").onclick = clearPostForm;
    $("btnSavePost").onclick = savePost;
    $("btnDeletePost").onclick = deletePost;

    $("btnNewDownload").onclick = clearDownloadForm;
    $("btnSaveDownload").onclick = saveDownload;
    $("btnDeleteDownload").onclick = deleteDownload;

    $("dFile").onchange = function (e) {
      if (e.target.files && e.target.files[0]) uploadFile(e.target.files[0]);
    };

    $("pImage").onchange = function (e) {
      if (e.target.files && e.target.files[0]) uploadImage(e.target.files[0]);
      e.target.value = "";
    };

    if (cfg.owner && cfg.repo && cfg.token) loadFromGithub();
    else status("先展开顶部设置，填入仓库和 Token，然后点「保存设置」。");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
