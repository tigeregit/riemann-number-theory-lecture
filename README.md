# 黎曼在数论方面的研究（理工科本科生讲义）· 附 Lean 4 形式化教程

一份中文 LaTeX 讲义，讲清楚黎曼 1859 年那篇六页论文做了什么、为什么重要，
并配一整套**已通过 Lean 内核检查**的形式化示例。

- 读者对象：具备微积分、线性代数、复变函数初步的理工科本科生；较深的技术细节标 ★ 可跳过。
- 第一编（第 0–5 章）：从欧拉乘积到黎曼猜想的完整思路链。
- 第二编（第 6–8 章）：Lean 4 形式化证明教程，从「命题即类型」到「如何把百万美元问题写成一行 def」。
- 附录 A：复分析工具箱；附录 B：习题、提示与部分解答。
- **交互式网页讲义**（web/index.html）：动画、图片、7 组滑块实验、素数无穷多的七个完整证明、Lean 源码标签页、证明步骤器与 6 道自测题，双击即可离线打开。

版本固定：**Lean 4.36.0 / mathlib v4.36.0**（见 lean/lean-toolchain、lean/lakefile.toml）。
讲义中所有库名都按该版本逐条核对过。

## 目录结构

    .
    ├── README.md            本文件
    ├── Makefile             一键构建
    ├── tex/
    │   ├── riemann-lecture.tex   主文件（ctexbook + XeLaTeX）
    │   ├── preamble.tex          宏包、定理环境、代码排版、自定义记号
    │   ├── titlepage.tex         扉页
    │   ├── chapters/             各章（ch00–ch08 + 两个附录）
    │   ├── data/                 图形数据（由 scripts/gen_data.py 生成）
    │   ├── refs.bib              参考文献
    │   └── riemann-lecture.pdf   编译产物（交付件）
    ├── lean/
    │   ├── lakefile.toml         mathlib v4.36.0 依赖
    │   ├── lean-toolchain
    │   ├── Riemann.lean          根模块
    │   ├── Main.lean             可执行 demo
    │   └── Riemann/              7 个示例模块（见 lean/README.md）
    ├── web/                   交互式网页讲义（见 web/README.md）
    │   ├── index.html           入口，双击即可打开
    │   ├── styles.css / app.js  布局、主题、动画与交互实验
    │   ├── data.js              绘图数据 + 真实 Lean 源码（生成）
    │   ├── assets/              透明背景 PNG 曲线图（生成）
    │   └── vendor/              本地打包的 KaTeX 0.16.11
    └── scripts/
        ├── gen_data.py           LaTeX 图形数据
        ├── gen_web_data.py       网页数据与 Lean 源码
        └── gen_web_assets.py     网页 PNG 图

## 环境要求

**LaTeX**：TeX Live（含 xelatex、biber、latexmk）+ 以下宏包：
ctex、amsmath/amssymb/mathtools、geometry、tikz/pgfplots、tcolorbox、
listings、newunicodechar、biblatex、hyperref、cleveref、booktabs。
中文字体默认用 macOS 的 Songti SC / Heiti SC / Kaiti SC；其它平台请修改
tex/preamble.tex 中的 \setCJKmainfont 等（Linux 可用 Noto Serif CJK SC，
Windows 可用 SimSun）。

> 代码用 listings + newunicodechar 排版，**不需要** -shell-escape，
> 也不依赖 Pygments；这样在受限环境里也能编译。

**Python**：3.x + numpy（只用于生成图形数据）。

**Lean**：elan + lake（见 lean/README.md）。

> 在 Apple Silicon + MacTeX 上，系统自带的 `biber` 有时是通用二进制，
> 运行时会用 `lipo` 抽取 arm64 分片；在受限环境里可能失败并报
> `extracting arm64 binary with lipo failed`。此时执行 `make biber-fix`
> 把可用的 arm64 版本抽取到 `.tools/bin/`，Makefile 会自动优先使用它。

## 快速开始

    # 1. 讲义 PDF
    make pdf                 # 生成 tex/riemann-lecture.pdf

    # 2. Lean 示例（首次需要下载 mathlib 缓存，约几百 MB）
    cd lean
    lake update
    lake exe cache get
    cd ..
    make lean                # lake build
    make demo                 # 运行小程序

    # 3. 交互式网页（无需构建；make serve 可起本地预览）
    make web                 # 重新生成网页数据与图片
    make serve               # http://127.0.0.1:8123/

手动编译 LaTeX（等效于 make pdf）：

    python3 scripts/gen_data.py
    cd tex
    latexmk -xelatex -interaction=nonstopmode riemann-lecture.tex
    # 或：xelatex riemann-lecture.tex → biber riemann-lecture → xelatex ×2

在缓存写入受限的环境里，给 lake 指定缓存目录：

    export XDG_CACHE_HOME="$PWD/.tools/cache"
    export ELAN_HOME="$PWD/.tools/elan"
    export PATH="$ELAN_HOME/bin:$PATH"

## 关于 sorry

lean/Riemann/Exercises.lean 里故意留了 3 个 sorry 作为练习题，
lake build 会打印 declaration uses 'sorry' 警告，这是**预期行为**。
教程其余所有定理都没有 sorry / axiom。

## 内容导航（对应章节）

| 章 | 主题 | 对应 Lean 文件 |
|---|---|---|
| 0 | 导论、记号、时间表 | — |
| 1 | 欧拉乘积、素数倒数和发散、π(x) | EulerProduct.lean |
| 2 | 1859 论文：解析延拓、函数方程、ξ、零点 | ZetaStatements.lean |
| 3 | 显式公式、Möbius 反演、误差项 | Moebius.lean |
| 4 | 素数定理、RH 的等价命题、数值验证 | PrimeCounting.lean |
| 5 | 黎曼的其他工作与遗产 | — |
| 6 | 为什么形式化、环境搭建、语言速览 | Basic.lean |
| 7 | 欧几里得定理、有限欧拉乘积、Möbius、π | Euclid.lean 等 |
| 8 | ζ、函数方程、RiemannHypothesis 的陈述 | ZetaStatements.lean |

## Git

仓库使用 git 管理，主分支 main，按「骨架 → 讲义第一编 → 讲义第二编 → 构建产物」
分成若干原子提交；用 git log --oneline 查看。

## 许可

讲义正文与示例代码可按 CC BY-NC-SA 4.0 使用；参考文献的版权归原作者所有。
scripts/gen_data.py 生成的数值数据仅用于绘图，无独立版权主张。
