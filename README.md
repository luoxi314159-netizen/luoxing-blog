# 我的博客

纯静态博客 + 下载站。无框架、无构建、无 CDN 依赖，双击 `index.html` 就能预览。

## 目录结构

```
my-blog/
├─ index.html          首页（文章列表）
├─ post.html           文章详情页（用 ?slug=xxx 打开）
├─ downloads.html      下载页
├─ about.html          关于页
├─ assets/
│  ├─ data.js          ★ 你要改的就这两个：文章 & 下载项
│  ├─ app.js           渲染逻辑（一般不用动）
│  └─ style.css        样式
└─ downloads/          放要下载的文件
```

## 日常操作

### 1. 写一篇新文章
打开 `assets/data.js`，在 `POSTS` 数组里复制一段，改成你的：

```js
{
  slug: "my-new-post",        // 网址标识，唯一，用英文
  title: "文章标题",
  date: "2026-10-20",
  tags: ["教程"],
  summary: "首页显示的一句话摘要。",
  content: `
    <p>正文，直接写 HTML。</p>
    <h2>小标题</h2>
    <p>支持 <code>代码</code>、<a href="#">链接</a>、图片等。</p>
  `
}
```

保存后刷新首页即可看到。

### 2. 发布一个可下载的东西
1. 把文件放进 `downloads/` 文件夹（文件名建议用英文）。
2. 在 `assets/data.js` 的 `DOWNLOADS` 里加一条：

```js
{
  name: "我的小工具 v1.0",
  date: "2026-10-20",
  desc: "功能一句话说明。",
  url: "downloads/mytool-v1.0.zip",
  size: "3.2 MB"
}
```

### 3. 改站名 / 关于页 / 首页问候语
- 站名「我的博客」：在 4 个 `.html` 文件的 `<title>` 和 `.brand` 里替换。
- 关于页内容：`about.html`。
- 首页大标题：`index.html` 的 `.hero` 部分。

## 本地预览

直接双击 `index.html` 即可（本站在 `file://` 下也能正常工作）。

如果想用本地服务器预览：

```bash
cd my-blog
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

## 部署到线上（国内可访问，0 成本）

### 方案 A：腾讯云 EdgeOne Pages（推荐，国内访问快）
1. 把 `my-blog` 整个文件夹推到一个仓库（GitHub 或 Gitee 都行）。
2. 打开 EdgeOne Pages 控制台 → 新建项目 → 关联你的仓库。
3. 构建设置留空 / 输出目录填 `/`（纯静态，无需构建）。
4. 部署完成，得到一个免费网址，可直接分享；之后可选绑自己的域名。

### 方案 B：Cloudflare Pages
1. 仓库推到 GitHub。
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → 连接仓库。
3. Build command 空，Build output directory 填 `/`。
4. 得到 `xxx.pages.dev` 免费网址。

### 方案 C：GitHub Pages
1. 仓库推到 GitHub。
2. Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/root`。
3. 得到 `xxx.github.io` 网址。（注意：国内直连不稳定，见下。）

> 三个平台都是 0 成本。国内访客建议用 **EdgeOne Pages / Cloudflare Pages**；
> GitHub Pages 的 `github.io` 在国内常打不开。

## 站内编辑后台（可视化改文章 / 上传文件）

访问 `你的网址/admin.html`（例如 `https://xxx.pages.dev/admin.html`），
即可在网页上增删改文章、上传要下载的文件，点「🚀 发布到 GitHub」一键提交，
托管平台会自动重新部署，线上马上更新。

### 一次性准备：创建 GitHub 仓库 + 访问令牌

1. **建仓库**：在 GitHub 新建一个仓库（可以是 Public 或 Private），把 `my-blog` 里的文件全部上传进去。
2. **建令牌**：GitHub → 右上角头像 → Settings → Developer settings →
   **Personal access tokens → Fine-grained tokens → Generate new token**。
   - Repository access：选 **Only select repositories**，勾选刚才那个仓库。
   - Permissions → Repository permissions → **Contents：Read and write**。
   - 生成后复制令牌（只显示一次）。
3. **填后台**：打开 `/admin.html`，展开顶部「仓库与令牌设置」，填：
   - 用户名/组织、仓库名、分支（一般 `main`）、data.js 路径（`assets/data.js`）、粘贴 Token。
   - 点「保存设置」→「测试连接」。

设置只保存在你自己浏览器的 localStorage，不会上传到任何第三方。

### 日常使用

- **写文章**：「文章」标签 → 新建/点左侧列表 → 填标题、slug、日期、正文（带加粗/标题/列表/链接/代码按钮）→「保存到草稿」。
- **文章配图**：正文工具栏点「🖼 图片」，选图后自动上传到仓库 `assets/uploads/`，并在光标处插入 `<img>` 标签。
- **加下载**：「下载」标签 → 填名称、说明 → 可直接**上传文件**（自动传到仓库 `downloads/` 并填好地址）→「保存到草稿」。
- **发布**：所有改动先存在浏览器草稿里，最后点顶部「🚀 发布到 GitHub」一次性提交。

### 权限说明（重点）

**本站只有作者本人可以发布文章。** 后台通过 GitHub Token 进行读写作，
没有 Token 的访客即使打开 `admin.html`，也无法发布、修改或上传任何内容——
数据读取会失败，发布请求会被 GitHub 拒绝。因此无需额外的「账号系统」。

### 安全提示

Token 相当于仓库钥匙，只保存在本机浏览器。**不要在公用电脑使用**；
若怀疑泄露，去 GitHub 吊销并重新生成即可。首次部署时 `admin.html`
已带 `noindex`，不会被搜索引擎收录，但仍建议不要对外宣传这个地址。
