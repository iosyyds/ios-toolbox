# 果机工具箱（iOS Toolbox）

iPhone 用户免费在线实用工具箱：纯前端静态站，**无后台、无数据库、免安装**，三端（桌面/平板/手机）自适应，已做完整 SEO。

## 功能

| 工具 | 说明 |
| --- | --- |
| 机型识别器 | A 代码（如 A3092）→ 对应机型与销售地区 |
| 电池健康估算 | 循环次数 + 机型世代 → 估算最大容量 |
| IMEI 校验 | 格式 + Luhn 校验位 + 常见 Apple 号段 |
| 序列号/型号校验 | 序列号与 Part Number 格式识别 |
| 保修到期计算 | 购机日期 + AppleCare+ → 到期日 |
| 存储容量换算 | B/KB/MB/GB/TB 与十进制/二进制口径 |
| iOS 版本时间线 | iOS 1 → 26 发布史 |
| iPhone 规格大全 | 全系屏幕/分辨率/PPI/芯片/刷新率 |

## 目录结构

```
ios-toolbox/
├── index.html      # 主页面（含全部 SEO：meta/OG/JSON-LD/FAQ）
├── css/style.css   # 样式（深浅色主题 + 响应式三端）
├── js/data.js      # 数据：机型A代码 / iOS版本 / 规格 / FAQ
├── js/app.js       # 工具逻辑（纯前端）
├── favicon.svg
├── robots.txt
├── sitemap.xml
├── 404.html
└── README.md
```

## 部署（上线）

静态站可直接托管到任意静态平台，推荐 GitHub Pages：

```bash
git init && git add -A && git commit -m "init ios-toolbox"
git remote add origin <你的仓库地址>
git push -u origin main
# 然后在仓库 Settings → Pages 选择 main 分支 / (root) 开启即可
```

上线后请把 `index.html`、`robots.txt`、`sitemap.xml` 中的
`https://iosyyds.github.io/ios-toolbox/` 替换为你的真实域名。

## 数据来源

- 机型 A 代码：Apple 官方支持页 + GitHub MobileModels 型号库（dolfly/MobileModels）
- iOS 版本日期：Apple 官方安全更新/发布记录、公开百科
- 电池标准：Apple 官方「电池 - 服务与回收」（500/1000 次循环保留 80%）
