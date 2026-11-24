# 交互式网页讲义

入口：index.html（总讲义）与 **chapter1.html（第一章独立详解版）**。**双击即可打开**（全部资源相对引用，无外部网络依赖、无需构建、无需服务器）。

- [chapter1.html](chapter1.html)：第一章「欧拉：把素数装进一个函数」独立页面，含 Bézout 引理、算术基本定理、欧拉乘积、∑1/p 发散、Chebyshev、Bertrand、Dirichlet 的**完整证明**，以及 `lean/Riemann/Chapter1.lean` 的形式化证明与逐战术演示器；文字居中、电脑/平板/手机三端适配。
- [index.html](index.html)：全部章节的总讲义，含「素数为什么有无穷多个」七个完整证明专题。

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
- **专题 · 素数为什么有无穷多个**：七个完整证明（Euclid、Euler、Goldbach/Fermat 数、Erdős 计数、Furstenberg 拓扑、Filip Saidak 构造、Euclid 变体 4k+3），每个含逐步证明、引理、常见误区与定量推论；附欧几里得机器与素数倒数和/Erdős 下界两组交互实验
- 第 7 章 Lean 教程：7 个示例模块的真实源码标签页、逐战术 goal state 演示器
- 自测：6 道选择题，即时反馈与评分

## 交互与动画

| 类型 | 实现 |
|---|---|
| 动画 | 首屏临界带 Canvas（脉动零点、漂移粒子）、滚动揭示、数字淡入、「播放」逐个加入零点、可逐步执行的欧几里得构造、暂停/恢复按钮 |
| 图片 | 2 张透明背景 PNG 曲线图、临界带 SVG 示意图、Riemann 面 / theta 格点 SVG 小图、9 个实时 Canvas 图 |
| 互动 | 7 组滑块实验、播放/逐步按钮、图表悬停读数、7 个可折叠完整证明（展开全部按钮）、标签页、证明步骤器、测验、三态配色设置对话框 |
| 公式 | 本地打包的 KaTeX（JS + CSS + 20 个 woff2 字体），577 处公式，含自定义宏 Re / pit / bigO 等 |

## 目录

    web/
    ├── index.html          总讲义页面结构与全部正文
    ├── chapter1.html       第一章独立详解版（完整证明 + Lean 形式化）
    ├── chapter1.css        居中排版、text-wrap 修复、三端适配
    ├── chapter1.js         第一章的 KaTeX、实验、Lean 标签页与步骤器
    ├── styles.css          总讲义：响应式布局、明暗主题、动画、无障碍控件
    ├── app.js              总讲义：实验、绘图、测验、标签页与证明步骤器
    ├── data.js             由 scripts/gen_web_data.py 生成：绘图数据 + 9 个真实 Lean 源码
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
- 排版：文字居中；标题用 `text-wrap: balance`、正文用 `text-wrap: pretty` 修复意外分行；`clamp()` 流式字号、容器查询、`pointer: coarse` 触摸目标、安全区适配、响应式表格容器内滚动。
- 已用无头 Chrome + CDP 在 1440 / 820 / 390 / 320 CSS px 四种视口验证：总讲义 577 处公式、独立第一章 659 处公式，控制台 0 错误、0 个公式解析错误、无真实横向滚动。
