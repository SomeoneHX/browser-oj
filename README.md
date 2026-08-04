# Browser OJ — 在线评测系统

一个基于浏览器的在线评测（OJ）系统，支持 C、C++、C++ (WASM)、Python (WASM)、Python (Brython) 和 JavaScript。C++ (WASM) 使用浏览器内的 LLVM/clang 工具链，Python (WASM) 使用 Pyodide 执行，Python (Brython) 使用 JavaScript 解释器执行；其余语言由 JSCPP 或浏览器 JavaScript 执行。题目全部使用 Markdown 文件维护，元数据位于文件顶部的 front matter 区域。所有数据存储在浏览器 `localStorage` 中，无需后端服务。

## 功能

- **首页** — 公告、今日日历、题目跳转（支持输入题号与随机跳题）、近 14 天每日通过（AC）数量折线统计
- **在线编程** — 使用 CodeMirror 编辑器编写代码，支持 C (JSCPP)、C++ (JSCPP)、C++ (WASM)、Python (WASM)、Python (Brython)、JavaScript，Tab 缩进为 4 格；需要运行时的语言在对应环境未就绪时禁用
- **在线 IDE** — `/ide` 提供独立编辑器与标准输入/输出面板，支持 C++ (WASM)、Python (WASM) 和 Python (Brython)，代码、语言与输入自动保存到浏览器，下次打开自动恢复
- **开发环境** — `/environment` 页面独立管理 C++ 工具链、Pyodide Python 与 Brython Python 环境；全部资源支持查看、筛选、下载、删除与实际缓存体积统计
- **自动评测** — 针对每道题目的测试点逐项运行并比对结果，全部通过即判为 AC；WASM 语言和 Brython 均在独立准备阶段初始化，用户代码执行时间才按测试点 `timeLimit` 计时
- **提交记录** — 每份提交的代码、评测结果、测试点详情均保存在本地
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
problems/                     题目定义
  P1001/                      每道题一个文件夹
    problem.md                顶部元数据和完整题目描述
    testcases/                测试点
      1.in / 1.out
      ...
public/                       静态资源（404.html 等，原样拷贝到构建产物）
src/
  components/                 通用组件（BaseCard、CodeEditor、Navbar 等）
  pages/                      页面组件（首页、题目、评测记录、在线 IDE、登录）
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

题目 Markdown 的顶部元数据支持 `title`、`difficulty` 和 `timeLimit`（单位：毫秒）：

```md
---
title: A+B 问题
difficulty: 简单
timeLimit: 2000
---
```

提交后会立即进入评测详情页。判题按测试点执行，测试点状态会实时更新；用户程序超过 `timeLimit` 会被终止并标记为运行超时。在线 IDE 对自定义输入执行代码，默认执行时限为 5 秒。

## 浏览器运行时

「C++ (WASM)」基于 [emception](https://github.com/emception/emception)（固定版本 v3.8.0）：将 LLVM/Clang/lld 工具链编译为 WebAssembly，在浏览器内完成 C++ 编译、链接，并通过 WASI 运行产物。

- **C++ (WASM)** — 编译、链接和 WASI 执行器预热属于独立准备阶段；准备完成后，每个测试点严格按 `timeLimit` 运行。emception 内置 libc++ 使用无异常构建，因此不支持 `try` / `catch`；少数代码组合可能触发上游 lld 的无效 WASM 产物问题。
- **Python (WASM)** — 基于 Pyodide 0.29.3，在独立 module Worker 中运行 CPython。解释器与标准库完成准备后，复用同一 Worker 依次执行该提交的测试点；每次执行使用新的 globals、stdin、stdout 和 stderr。`threading`、`multiprocessing`、`subprocess` 及未下载的第三方扩展包不保证可用。
- **Python (Brython)** — 基于 Brython 3.12.5，在经典 Worker 中将 Python 解释为 JavaScript。每个测试点都使用独立 Worker，以隔离全局状态并能可靠终止死循环；`input()` 使用 OJ 注入的标准输入，不依赖浏览器 `prompt()`。
- **JavaScript** — 在独立 Worker 中执行，不提供完整 Node.js 运行时。可直接使用完整标准输入字符串 `input`，或用 `readline()` / `readLine()` 逐行读取；读至 EOF 时返回 `undefined`。兼容 `process.stdin.read()`、`fs.readFileSync(0, 'utf8')` 及常见的 `require('fs').readFileSync('/dev/stdin').toString('ascii')` 输入写法；`require` 仅支持 `fs`，`process.exit()` 会正常结束当前测试点，`print(...)` 与 `console.log(...)` 都会写入标准输出。例如：`const fs = require('fs'); const [a, b] = fs.readFileSync('/dev/stdin').toString('ascii').trim().split(/\s+/).map(Number); console.log(a + b); process.exit()`。
- **Wenyan-Lang（文言）** — 基于内置的 `@wenyan/core` 0.3.4，在独立 Worker 中编译并执行，`書之` 的内容会被捕获为标准输出。此功能仅供娱乐和展示，未实现标准输入，因此不适合需要读取测试数据的算法题；也不支持文言的网络或文件模块导入。例如：`吾有一言。曰「「問天地好在。」」。書之。`
- **资源下载与缓存** — 开发环境页从固定版本 jsDelivr 下载 emception bundle、Pyodide 核心文件和 Brython 核心文件。Service Worker 对这些资源采用缓存优先策略，下载完成后可离线使用。页面显示的是 Cache Storage 响应体字节数及其来源明细，不包含浏览器内部缓存元数据或磁盘分配开销。
- **超时与结果** — 运行时初始化失败会报告运行环境错误，不会记为用户程序 TLE。用户代码超时会终止当前执行器，当前点标记为 TLE，后续点标记为“已跳过”；输出经归一化后判定 AC、WA、TLE 或运行错误。

## 许可证

[MIT](LICENSE)

本项目内置的 C++ (WASM) 工具链（LLVM/Clang/lld、Emscripten sysroot）等第三方组件的许可信息见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
