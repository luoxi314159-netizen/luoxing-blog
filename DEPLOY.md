# 上线手册（0 成本）

目标：把 `my-blog` 发到公网，并且能用站内后台「写文章 / 插图 / 上传」实时更新。

整体分三步：**① 建 GitHub 仓库并上传文件 → ② 用 Cloudflare / EdgeOne 托管 → ③ 打开后台配置 Token**。

> 因为后台是用 GitHub 接口发布的，所以线上站点必须**从 GitHub 仓库构建**，这样你一发内容，网站就会自动重新部署。

---

## 第一步：建 GitHub 仓库并上传文件

1. 登录 [github.com](https://github.com)（没有就注册一个）。
2. 右上角 **+ → New repository**：
   - Repository name：如 `luoxing-blog`
   - 选 **Public**（公开）或 Private 都行
   - 点 **Create repository**
3. 进入新仓库，点 **Add file → Upload files**。
4. 打开 `C:\Users\Admin\Desktop\my-blog`，**全选里面的所有文件和文件夹**（`index.html`、`assets`、`downloads`、`post.html`、`downloads.html`、`about.html`、`admin.html`、`README.md`、`robots.txt` 等）→ 拖到网页上传区。
   - ⚠️ 注意：拖的是 `my-blog` **里面的内容**，不是 `my-blog` 这个文件夹本身。上传后仓库根目录应能直接看到 `index.html`。
5. 底部点 **Commit changes**。

### 建访问令牌（发布用）

1. 右上角头像 → **Settings** → 左侧最下 **Developer settings**。
2. **Personal access tokens → Fine-grained tokens → Generate new token**。
3. 填写：
   - Token name：随便，如 `blog-admin`
   - Expiration：按需（如 1 年）
   - Repository access：**Only select repositories** → 勾选刚建的仓库
   - Permissions → **Repository permissions → Contents → Read and write**
4. **Generate token**，复制生成的令牌（只显示一次，务必保存好）。

---

## 第二步：托管

选一个平台即可，两个都 0 成本。

### 方案 A：Cloudflare Pages（推荐，全球速度好）

1. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) 登录/注册。
2. 左侧 **Workers & Pages → Create → Pages → Connect to Git**。
3. 授权 GitHub，选择刚建的仓库。
4. 构建设置：
   - Framework preset：**None**
   - Build command：**留空**
   - Build output directory：**`/`**
5. **Save and Deploy**，完成后得到网址 `https://xxx.pages.dev`。

### 方案 B：腾讯云 EdgeOne Pages（国内访问更快）

1. 打开 EdgeOne Pages 控制台，登录/注册（需实名）。
2. **新建项目 → 从 Git 导入** → 关联 GitHub → 选择仓库。
3. 框架预设：**其他 / 无**；构建命令留空；输出目录 **`/`**。
4. 部署，完成后得到一个免费网址。

> 两个平台都可以之后再绑定自己的域名（域名本身要花钱，可选）。

---

## 第三步：打开后台并配置

1. 访问 `https://你的网址/admin.html`。
2. 展开顶部「仓库与令牌设置」，填入：
   - 用户名/组织、仓库名、分支（一般 `main`）
   - data.js 路径：`assets/data.js`
   - 粘贴第一步生成的 Token
3. 点 **保存设置** → 再点 **测试连接**，出现成功提示即可。
4. 以后回到网站首页，点右上角 **✎ 写文章** 就能发文、插图、上传文件，最后点 **🚀 发布到 GitHub**，线上约 1 分钟自动更新。

---

## 常见问题

- **发布后网站没变？** 托管平台重新部署需要几十秒~1 分钟，稍等刷新。可在 Cloudflare/EdgeOne 的部署记录里看进度。
- **后台提示认证失败？** 检查 Token 是否勾了该仓库的 **Contents: Read and write**，以及仓库名/用户名是否填对。
- **图片看不到？** 图片在 `assets/uploads/`，需发布后线上才可见。
- **国内打不开 github.com？** 那后台无法使用；可考虑改用支持自定义 API 的方案（需改造后台）。
