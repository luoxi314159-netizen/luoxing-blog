/* 站点渲染逻辑：一般不需要改动 */
(function () {
  "use strict";

  var page = document.body.dataset.page;

  function byDateDesc(a, b) {
    return new Date(b.date) - new Date(a.date);
  }

  function tagHtml(tags) {
    if (!tags || !tags.length) return "";
    return " · " + tags.map(function (t) {
      return '<span class="tag">' + t + "</span>";
    }).join(" ");
  }

  function getSlug() {
    // 优先用 # 锚点（本地 file:// 也支持）；兼容 ?slug= 写法
    var h = (window.location.hash || "").replace(/^#/, "");
    if (h) return decodeURIComponent(h);
    var m = /[?&]slug=([^&]+)/.exec(window.location.search || "");
    return m ? decodeURIComponent(m[1]) : "";
  }

  function renderHome() {
    var box = document.getElementById("posts-list");
    if (!box) return;
    var posts = (POSTS || []).slice().sort(byDateDesc);
    if (!posts.length) {
      box.innerHTML = '<p class="muted">还没有文章，去 assets/data.js 里添加吧。</p>';
      return;
    }
    box.innerHTML = posts.map(function (p) {
      return (
        '<article class="post-card">' +
          '<a class="post-card-link" href="post.html#' + encodeURIComponent(p.slug) + '">' +
            "<h3>" + p.title + "</h3>" +
          "</a>" +
          '<p class="meta">' + p.date + tagHtml(p.tags) +
            (p.aiGenerated ? ' <span class="ai-badge">AI 生成</span>' : "") + "</p>" +
          '<p class="summary">' + (p.summary || "") + "</p>" +
        "</article>"
      );
    }).join("");
  }

  function renderPost() {
    var box = document.getElementById("post");
    if (!box) return;
    var slug = getSlug();
    var p = (POSTS || []).filter(function (x) { return x.slug === slug; })[0];
    if (!p) {
      box.innerHTML =
        '<h1>找不到这篇文章</h1><p class="muted">链接可能已失效。' +
        '<a href="index.html">返回文章列表</a></p>';
      return;
    }
    document.title = p.title + " · 我的博客";
    box.innerHTML =
      '<h1 class="post-title">' + p.title + "</h1>" +
      '<p class="meta">' + p.date + tagHtml(p.tags) + "</p>" +
      (p.aiGenerated ? '<p class="ai-notice">本文由 AI 生成</p>' : "") +
      '<div class="prose">' + (p.content || p.summary || "") + "</div>";
  }

  function renderDownloads() {
    var box = document.getElementById("downloads-list");
    if (!box) return;
    var items = (DOWNLOADS || []).slice().sort(byDateDesc);
    if (!items.length) {
      box.innerHTML = '<p class="muted">暂时还没有可下载的内容。</p>';
      return;
    }
    box.innerHTML = items.map(function (d) {
      return (
        '<div class="download-card">' +
          "<div class=\"download-info\">" +
            "<h3>" + d.name + "</h3>" +
            '<p class="summary">' + (d.desc || "") + "</p>" +
            '<p class="meta">' + (d.date || "") + (d.size ? " · " + d.size : "") + "</p>" +
          "</div>" +
          '<a class="btn download-btn" href="' + d.url + '" download>下载</a>' +
        "</div>"
      );
    }).join("");
  }

  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    setYear();
    if (page === "home") renderHome();
    else if (page === "post") renderPost();
    else if (page === "downloads") renderDownloads();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
