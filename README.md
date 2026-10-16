# 网站

- **根目录** = 游戏发布站（《少女终末旅行》同人游戏，灰白废土风）
- **`blog/`** = 个人博客（子网页）

## 结构

```
（仓库根）
├─ index.html          游戏站首页
├─ assets/style.css    游戏站样式
├─ downloads/          游戏安装包
├─ robots.txt
├─ wrangler.jsonc      Cloudflare 静态托管配置
└─ blog/               博客
   ├─ index.html       文章列表
   ├─ post.html        文章详情（post.html#slug）
   ├─ downloads.html   博客下载页
   ├─ about.html       关于
   ├─ admin.html       站内编辑后台
   ├─ README.md        博客使用说明
   ├─ DEPLOY.md        部署说明
   └─ assets/  downloads/
```

## 菜单关系

- 游戏站顶部菜单 → **博客 ↗** → `blog/index.html`
- 博客各页菜单 → **首页** → `../index.html`

## 部署

整个仓库根即网站，**构建命令留空、输出目录 `/`**。

- 游戏站访问：`https://你的域名/`
- 博客访问：`https://你的域名/blog/`
- 博客后台：`https://你的域名/blog/admin.html`
  - 后台里 **data.js 路径** 填 **`blog/assets/data.js`**
