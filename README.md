# Browser OJ — 在线评测系统

一个基于浏览器的在线评测（OJ）系统，支持 C、C++、C++ (WASM)、Python (WASM)、Python (Brython) 和 JavaScript。C++ (WASM) 使用浏览器内的 LLVM/clang 工具链，Python (WASM) 使用 Pyodide 执行，Python (Brython) 使用 JavaScript 解释器执行；其余语言由 JSCPP 或浏览器 JavaScript 执行。题目与文章全部使用 Markdown 文件维护，元数据位于文件顶部的 front matter 区域。所有数据存储在浏览器 `localStorage` 中，无需后端服务。

## 功能

- **首页** — 公告、今日日历、题目跳转（支持输入题号与随机跳题）、近 14 天每日通过（AC）数量折线统计
- **在线编程** — 使用 CodeMirror 编辑器编写代码，支持 C (JSCPP)、C++ (JSCPP)、C++ (WASM)、Python (WASM)、Python (Brython)、JavaScript，Tab 缩进为 4 格；需要运行时的语言在对应环境未就绪时禁用
- **在线 IDE** — `/ide` 提供独立编辑器与标准输入/输出面板，支持 C++ (WASM)、Python (WASM) 和 Python (Brython)，代码、语言与输入自动保存到浏览器，下次打开自动恢复
- **开发环境** — `/environment` 页面独立管理 C++ 工具链、Pyodide Python 与 Brython Python 环境；全部资源支持查看、筛选、下载、删除与实际缓存体积统计
- **自动评测** — 针对每道题目的测试点逐项运行并比对结果，全部通过即判为 AC；WASM 语言和 Brython 均在独立准备阶段初始化，用户代码执行时间才按测试点 `timeLimit` 计时
- **题目** — 题目支持难度与标签元数据；`/problems` 可按题目编号、名称、难度或标签实时筛选。题目详情页显示提交/通过次数、历史最高分、标签，并提供题目描述和提交答案选项卡，以及题解、提交记录、讨论区入口
- **提交记录** — 每份提交的代码、评测结果、测试点详情均保存在本地；`/record` 支持按题目编号筛选，`/record?problem=<题号>` 可直接查看指定题目的记录
- **文章** — `/article` 按分类浏览文章，左侧分类卡片（题解、科技·工程、算法·理论、生活·游记、学习·文化课、休闲·娱乐）筛选，题解文章可关联题目，`/article?problem=<题号>` 查看某道题的全部题解；文章详情页底部集成 **Giscus 评论区**（基于 GitHub Discussions），评论与文章一一对应，无需自建后端
- **讨论区** — `/discuss` 汇总每道题的独立讨论区，`/discuss/<题号>` 使用 Giscus 提供题意、算法、复杂度、边界条件和实现问题交流；`/discuss/feedback` 用于提交 Browser OJ 的问题与改进建议
- **界面** — 毛玻璃卡片设计，顶栏 + 侧边栏导航，响应式布局

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。

## 洛谷登录

登录不是做题的前置条件。需要显示洛谷用户名时，打开 `/login`，将页面生成的验证文本写入洛谷剪贴板，再输入剪贴板 ID。系统会通过 `api.luogu.me` 创建并轮询同步工作流，完成后校验剪贴板内容和作者名称。

## 构建

```bash
npm run build
npm run preview
```

## 部署到 GitHub Pages

项目使用 GitHub Actions 工作流（`.github/workflows/deploy.yml`）自动部署，push 到 `main` 分支后构建产物会发布到 `https://<user>.github.io/browser-oj/`。

- Vite 的 `base` 由环境变量 `BASE_URL` 控制：本地为空（即 `/`），工作流中设置为 `/${{ github.event.repository.name }}/`
- 首次部署前需在仓库 Settings → Pages → Source 中选择 **GitHub Actions**
- 由于使用 history 模式路由，`public/404.html` 负责深层链接回退：GitHub Pages 对未知路径返回 404.html，由其携带 `?redirect=` 参数跳回首页，`index.html` 中的恢复脚本再通过 `history.replaceState` 还原目标路由

## 目录结构

```
.github/workflows/            GitHub Pages 部署工作流
patches/                      patch-package 补丁（emception 无 SAB 环境的 stdin 预载）
problems/                     题目定义
  P1001/                      每道题一个文件夹
    problem.md                顶部元数据和完整题目描述
    testcases/                测试点
      1.in / 1.out
      ...
articles/                     文章定义
  hello-world.md              每篇文章一个 Markdown 文件，文件名即文章 ID
public/                       静态资源（404.html 等，原样拷贝到构建产物）
src/
  components/                 通用组件（BaseCard、CodeEditor、Navbar 等）
  pages/                      页面组件（首页、题目、评测记录、讨论区、文章、在线 IDE、登录）
  workers/                    Web Worker（判题执行器）
  utils/                      工具函数（评测引擎、Markdown 题目加载、存储、IDE 运行）
  data/                       数据入口
  styles/                     样式
```

## 技术栈

- Vue 3 + Vue Router 4
- Vite 5
- CodeMirror 6（原生 API）
- JSCPP（浏览器端 C/C++ 解释器，C/C++ 快速评测路径）
- emception / @gameguild/emception-browser（浏览器内 LLVM 工具链，C++ (WASM)）
- Pyodide（浏览器内 CPython 运行时，Python (WASM)）
- Brython（Python 到 JavaScript 的浏览器解释器，Python (Brython)）
- chart.js（做题统计折线图）
- markdown-it + GFM task lists
- @giscus/vue（GitHub Discussions 驱动的评论组件）

题目 Markdown 的顶部元数据支持 `title`、`difficulty`、`tags` 和 `timeLimit`（单位：毫秒）：

```md
---
title: A+B 问题
difficulty: 简单
tags: [入门, 数学, 基础输入输出]
timeLimit: 2000
---
```

- `tags` 为可选字段，使用英文逗号或中文逗号分隔；未填写时默认为空标签列表

## 路由与筛选

- `/problems` — 题目列表；可按题目编号、名称、难度或标签筛选
- `/problem/<题号>` — 题目详情；可进入该题的题解、提交记录和讨论区
- `/record?problem=<题号>` — 查看指定题目的提交记录
- `/article?problem=<题号>` — 查看指定题目的全部题解
- `/discuss` — 所有题目讨论区列表
- `/discuss/<题号>` — 指定题目的独立讨论区
- `/discuss/feedback` — Browser OJ 反馈建议区

提交后会立即进入评测详情页。判题按测试点执行，测试点状态会实时更新；用户程序超过 `timeLimit` 会被终止并标记为运行超时。在线 IDE 对自定义输入执行代码，默认执行时限为 5 秒。

文章 Markdown 的顶部元数据支持 `title`、`category`、`date`、`author`、`tags`、`problem` 和 `summary`：

```md
---
title: P1001 A+B 问题：三种语言解法对比
category: solutions          # solutions | tech-engineering | algo-theory | life-travel | academics | entertainment
date: 2026-08-05
author: OJ 维护组
tags: [入门, 语法]             # 可选
problem: P1001               # 可选，仅题解使用，关联题目
summary: 一句话摘要            # 可选，缺省自动截取正文首段
---
```

- 文件名即文章 ID，详情页路由为 `/article/<文件名>`（如 `/article/p1001-solution`）
- `problem` 元数据使文章显示关联题目卡片：`/article?problem=<题号>` 会筛选出该题的全部题解
- 路由 `/article` 显示全部文章，`/article?category=<分类>` 按分类筛选，左侧分类卡片默认选中「全部」

## Giscus 讨论

文章评论、题目讨论和 Browser OJ 反馈均由 [Giscus](https://giscus.app/) 提供，并存储在 GitHub Discussions 中，无需自建后端。文章使用文章 ID 作为讨论主题；每道题使用 `problem-discuss-<题号>` 作为独立主题，反馈建议使用 `browser-oj-feedback` 主题，因此三类讨论互不混合。

## 浏览器运行时

「C++ (WASM)」基于 [emception](https://github.com/gameguild-gg/gameguild/tree/main/tools/emception)（gameguild monorepo，npm 包 `emception` v3.8.0，MIT）：将 LLVM/Clang/lld 工具链编译为 WebAssembly，在浏览器内完成 C++ 编译、链接，并通过 WASI 运行产物。其内置的 Emscripten sysroot 源自 [emscripten-core/emscripten](https://github.com/emscripten-core/emscripten)（MIT / NCSA）。

- **C++ (WASM)** — 编译、链接和 WASI 执行器预热属于独立准备阶段；准备完成后，每个测试点严格按 `timeLimit` 运行。emception 内置 libc++ 使用无异常构建，因此不支持 `try` / `catch`；少数代码组合可能触发上游 lld 的无效 WASM 产物问题。
- **补丁与隔离策略** — `patches/` 下由 patch-package 管理两处 emception 补丁：在没有 SharedArrayBuffer（非跨域隔离环境）时，stdin 改为随运行消息预载的字节数组，不再依赖同步共享内存通道。因此全站无需注入 COOP/COEP 头，Service Worker 为纯缓存角色，第三方 iframe（如 Giscus）可正常嵌入，页面间保持纯 SPA 切换。`npm install` / CI 的 `npm ci` 会在 postinstall 阶段自动应用补丁；**开发时修改 node_modules 后必须重启 dev server**（Vite 默认不监听 node_modules，旧模块会被继续使用）。
- **Python (WASM)** — 基于 Pyodide 0.29.3，在独立 module Worker 中运行 CPython。解释器与标准库完成准备后，复用同一 Worker 依次执行该提交的测试点；每次执行使用新的 globals、stdin、stdout 和 stderr。`threading`、`multiprocessing`、`subprocess` 及未下载的第三方扩展包不保证可用。
- **Python (Brython)** — 基于 Brython 3.12.5，在经典 Worker 中将 Python 解释为 JavaScript。每个测试点都使用独立 Worker，以隔离全局状态并能可靠终止死循环；`input()` 使用 OJ 注入的标准输入，不依赖浏览器 `prompt()`。
- **JavaScript** — 在独立 Worker 中执行，不提供完整 Node.js 运行时。可直接使用完整标准输入字符串 `input`，或用 `readline()` / `readLine()` 逐行读取；读至 EOF 时返回 `undefined`。兼容 `process.stdin.read()`、`fs.readFileSync(0, 'utf8')` 及常见的 `require('fs').readFileSync('/dev/stdin').toString('ascii')` 输入写法；`require` 仅支持 `fs`，`process.exit()` 会正常结束当前测试点，`print(...)` 与 `console.log(...)` 都会写入标准输出。例如：`const fs = require('fs'); const [a, b] = fs.readFileSync('/dev/stdin').toString('ascii').trim().split(/\s+/).map(Number); console.log(a + b); process.exit()`。
- **Wenyan-Lang（文言）** — 基于内置的 `@wenyan/core` 0.3.4，在独立 Worker 中编译并执行，`書之` 的内容会被捕获为标准输出。此功能仅供娱乐和展示，未实现标准输入，因此不适合需要读取测试数据的算法题；也不支持文言的网络或文件模块导入。例如：`吾有一言。曰「「問天地好在。」」。書之。`
- **资源下载与缓存** — 开发环境页从固定版本 jsDelivr 下载 emception bundle、Pyodide 核心文件和 Brython 核心文件。Service Worker 对这些资源采用缓存优先策略，下载完成后可离线使用；SW 不注入任何隔离响应头，仅为纯缓存角色。页面显示的是 Cache Storage 响应体字节数及其来源明细，不包含浏览器内部缓存元数据或磁盘分配开销。
- **超时与结果** — 运行时初始化失败会报告运行环境错误，不会记为用户程序 TLE。用户代码超时会终止当前执行器，当前点标记为 TLE，后续点标记为“已跳过”；输出经归一化后判定 AC、WA、TLE 或运行错误。

## 许可证

[MIT](LICENSE)

本项目内置的 C++ (WASM) 工具链（LLVM/Clang/lld、Emscripten sysroot）等第三方组件的许可信息见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
