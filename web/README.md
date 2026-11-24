# 交互式网页讲义

入口：index.html。**双击即可打开**（全部资源相对引用，无外部网络依赖、无需构建、无需服务器）。
也可以用本地服务器预览：

    cd .. && make serve        # http://127.0.0.1:8123/

## 内容

- 第 0 章 导论：逻辑链流程图、可展开的历史时间线、π(x) 与 Li(x) 对比图
- 第 1 章 欧拉乘积：可拖动 s 与素数个数 N 的收敛实验
- 第 2 章 1859 论文：Gamma / theta 工具箱、theta 变换公式交互图、函数方程、实轴 ζ(s) 图
- 第 3 章 零点：临界带 SVG 示意图、拖动 β 看误差项恶化的实验
- 第 4 章 显式公式：逐个加入零点看阶梯函数「长出来」、可悬停读数的 π(x) 曲线
- 第 5 章 素数定理与 RH：三角不等式实验、RH 等价命题表、部分结果与物理联系
- 第 6 章 遗产：Riemann 面、theta 函数、Riemann–Roch、Riemann–Siegel 公式
- 第 7 章 Lean 教程：7 个示例模块的真实源码标签页、逐战术 goal state 演示器
- 自测：6 道选择题，即时反馈与评分

## 交互与动画

| 类型 | 实现 |
|---|---|
| 动画 | 首屏临界带 Canvas（脉动零点、漂移粒子）、滚动揭示、数字淡入、「播放」逐个加入零点、暂停/恢复按钮 |
| 图片 | 2 张透明背景 PNG 曲线图、临界带 SVG 示意图、Riemann 面 / theta 格点 SVG 小图、7 个实时 Canvas 图 |
| 互动 | 5 组滑块实验、播放按钮、图表悬停读数、可折叠证明、标签页、证明步骤器、测验、三态配色设置对话框 |
| 公式 | 本地打包的 KaTeX（JS + CSS + 20 个 woff2 字体），254 处公式，含自定义宏 Re / pit / bigO 等 |

## 目录

    web/
    ├── index.html          页面结构与全部正文
    ├── styles.css          响应式布局、明暗主题、动画、无障碍控件
    ├── app.js              实验、绘图、测验、标签页与证明步骤器
    ├── data.js             由 scripts/gen_web_data.py 生成：绘图数据 + 真实 Lean 源码
    ├── assets/             由 scripts/gen_web_assets.py 生成的透明 PNG 图
    ├── vendor/             KaTeX 0.16.11（js / css / auto-render / fonts）
    └── README.md

重新生成数据/图片：

    python3 scripts/gen_web_data.py
    python3 scripts/gen_web_assets.py

## 技术要点

- 无框架、无构建步骤、无 CDN：KaTeX 及其字体全部本地打包，离线可用。
- meta color-scheme + CSS color-scheme: light dark + light-dark() 颜色令牌，
  支持「跟随系统 / 浅色 / 深色」三态，URL 参数 ?theme=light|dark|system 可强制预览。
- 原生 scroll-target-group / :target-current 滚动高亮，带 IntersectionObserver 回退与 aria-current。
- 原生 input[type=range]、details、dialog、focusgroup 标签页（附带键盘回退）。
- 所有持续动画都可由右上角按钮暂停，并遵守 prefers-reduced-motion。
- 已用无头 Chrome + CDP 验证：254 处公式、7 个 Canvas、7 个 Lean 面板、全部交互，控制台 0 错误。
