/* =========================================================
 *  站点数据：以后只改这个文件就能更新博客
 *  - POSTS      ：文章（首页和文章页都读这里）
 *  - DOWNLOADS  ：下载项（下载页读这里）
 * ========================================================= */

const POSTS = [
  {
    slug: "deepseek-balance-widget",
    title: "我做了一个 DeepSeek 余额挂件（附下载）",
    date: "2026-10-15",
    tags: ["DeepSeek", "OpenCode", "作品"],
    aiGenerated: true,
    summary: "在 B 站看到有人为 DSH 开发了 DeepSeek 余额插件，于是用 OpenCode 开发了一个独立的余额挂件。",
    content: `
      <p>在 B 站看到有人为 <strong>DSH</strong> 开发了 DeepSeek 余额插件，用于在桌面显示账户余额。随后使用 <strong>OpenCode</strong> 开发了一个功能类似的余额挂件。</p>

      <h2>显示效果</h2>
      <pre><code>┌──────────────────────┐
│ DeepSeek             │
│ 余额 110.00¥         │
│ 今日已用 1.23        │
│ 更新 14:32:07        │
└──────────────────────┘</code></pre>
      <p>挂件固定显示在桌面右下角，默认每 60 秒刷新一次余额，并显示当日已用金额。</p>

      <h2>主要特点</h2>
      <p>与依赖 DSH 的插件不同，本挂件基于<strong>独立的 PowerShell 实现</strong>，不依赖 DSH 或其他框架，双击即可运行：</p>
      <ul>
        <li><strong>多种主题</strong>：深色、浅色、深海、樱花、终端、半透，可从右键菜单切换；</li>
        <li><strong>高峰时段提醒</strong>：DeepSeek 按北京时间区分高峰与空闲计费。高峰时段挂件边框变为橙色，右上角显示「⚡高峰」；</li>
        <li><strong>随 OpenCode 自启</strong>：打开 OpenCode 时可自动启动挂件（可开关）；</li>
        <li><strong>密钥安全</strong>：API Key 使用 Windows DPAPI 加密保存，仅当前 Windows 用户可解密，不会上传到其他位置。</li>
      </ul>

      <h2>实现说明</h2>
      <h3>「今日已用」的计算方式</h3>
      <p>DeepSeek 官方余额接口仅返回余额快照，不提供消费流水。因此采用「余额观测记账」：每次刷新时与上一次余额比较，余额下降的部分累计为当日消费；余额上升（充值）则忽略。该方式仅统计挂件启动之后的消耗，启动前的数据不计入。</p>

      <h3>采用进程监听而非插件</h3>
      <p>最初计划以 OpenCode 插件形式实现，但当前版本的本地插件不提供 <code>@opencode/plugin</code> 模块解析，无法实现。最终改为进程监听方案：后台每 10 秒检测一次 OpenCode 是否运行，检测到启动时拉起挂件。该方案不依赖 OpenCode 内部 API，兼容性更好。</p>

      <h2>使用方法</h2>
      <ol>
        <li>下载并解压；</li>
        <li>双击 <code>设置密钥.bat</code>，粘贴 DeepSeek API Key（输入不回显）；</li>
        <li>双击 <code>启动.bat</code>，挂件出现在桌面右下角。</li>
      </ol>
      <p>API Key 可在 <code>platform.deepseek.com</code> 的 API Keys 页面创建。</p>

      <h2>下载</h2>
      <p>前往 <a href="downloads.html">下载页</a>，或 <a href="downloads/DeepSeekBalanceWidget.zip">直接下载 zip</a>。</p>
    `
  }
];

const DOWNLOADS = [
  {
    name: "DeepSeek 余额挂件 · 余额监视器",
    date: "2026-10-15",
    desc: "适用于 OpenCode 的桌面常驻小窗，实时显示 DeepSeek 余额与今日已用，" +
          "支持深色/浅色/深海/樱花/终端/半透 6 种主题，高峰时段提醒，可随 OpenCode 自动启动。" +
          "解压后双击『设置密钥.bat』填入 API Key，再双击『启动.bat』即可。",
    url: "downloads/DeepSeekBalanceWidget.zip",
    size: "20 KB"
  }
  /* 复制上面一段继续添加，例如：
  {
    name: "我的小工具 v1.0",
    date: "2026-10-20",
    desc: "一个用来做 xxx 的小工具，解压后双击 exe 运行。",
    url: "downloads/mytool-v1.0.zip",
    size: "3.2 MB"
  }
  */
];
