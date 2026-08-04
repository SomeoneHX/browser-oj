# Browser OJ — 在线评测系统

一个基于浏览器的在线评测（OJ）系统，支持 C、C++、JavaScript 四种语言的代码编辑与在线评测。其中 C++ (WASM) 使用浏览器内的 LLVM/clang 工具链完成真实编译，其余语言由 JSCPP 解释执行。题目全部使用 Markdown 文件维护，元数据位于文件顶部的 front matter 区域。所有数据存储在浏览器 `localStorage` 中，无需后端服务。

## 功能

- **首页** — 公告、今日日历、题目跳转（支持输入题号与随机跳题）、近 14 天每日通过（AC）数量折线统计
- **在线编程** — 使用 CodeMirror 编辑器编写代码，支持 C (JSCPP)、C++ (JSCPP)、C++ (WASM)、JavaScript，Tab 缩进为 4 格；C++ (WASM) 在工具链资源未就绪时禁用
- **在线 IDE** — `/ide` 提供独立编辑器与标准输入/输出面板，支持 C++ (WASM)（浏览器内真实编译执行），代码、语言与输入自动保存到浏览器，下次打开自动恢复
- **开发环境** — `/environment` 页面管理 C++ (WASM) 工具链资源：首次使用下载核心包（约 45 MB，clang/lld/libc++ 等）或完整包（约 130 MB，含 CMake/Python/SDL3 等），并行下载、失败自动重试、支持残留清理，下载完成后可离线编译
- **自动评测** — 针对每道题目的测试点逐项运行并比对结果，全部通过即判为 AC；WASM 评测包含「编译中 → 评测中」状态流转
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

提交后会立即进入评测详情页。判题在 Web Worker 中按测试点执行，测试点状态会实时更新；单个测试点超过 `timeLimit` 会被终止并标记为运行超时。在线 IDE 复用同一判题 Worker，对自定义输入执行代码并在 5 秒内终止超时运行。

## C++ (WASM) 浏览器内编译

「C++ (WASM)」基于 [emception](https://github.com/emception/emception)（固定版本 v3.8.0）：将 LLVM/Clang/lld 工具链编译为 WebAssembly，在浏览器内完成 C++ 的编译（clang）与链接（wasm-ld），并通过 WASI 运行时直接执行产物，全程无需后端服务器。

- **资源下载** — 首次使用需在「开发环境」页面下载工具链资源：核心包约 45 MB（clang、lld、libc/libc++ 头文件与链接库），完整包约 130 MB（额外包含 CMake、Python、SDL3/raylib 等高级资源）。资源从 jsDelivr CDN 拉取，下载采用并行策略（同时 3 个文件），单个文件停滞超过 60 秒会自动切换其他 CDN 节点重试，失败的文件重新下载时自动跳过已完成部分
- **离线可用** — 资源由 Service Worker 缓存；同源页面使用 COOP + `credentialless` COEP 以启用 SharedArrayBuffer，下载完成后无需联网即可编译运行；「清除资源」可随时释放缓存。由于 Service Worker 的跨域隔离策略，部分未提供 CORP/CORS 响应头的跨域图片可能会被浏览器拦截，主题背景建议使用允许跨域访问的图片地址
- **评测流程** — 提交后先进入「编译中」状态（首次编译含工具链冷启动，较慢），编译成功后逐测试点运行并标记「评测中」；单测试点预算为 `timeLimit` + 内核开销宽限（首个测试点 +30s，后续 +3s），超时后剩余测试点标记为「已跳过」；运行结果与标准输出归一化比对后判为 AC / WA / TLE / 运行错误
- **在线 IDE** — 同样支持 C++ (WASM) 编译运行，自定义标准输入通过 SharedArrayBuffer 注入，单次运行预算为 5s + 30s 宽限
- **工具链限制** — emception 内置的 libc++ 使用无异常构建，C++ (WASM) 不支持 `try` / `catch`。少数代码组合可能触发上游 lld 的无效 WASM 产物问题，系统会在运行阶段显示「编译器产物异常」并将原始诊断保留在浏览器控制台。

## 许可证

[MIT](LICENSE)

本项目内置的 C++ (WASM) 工具链（LLVM/Clang/lld、Emscripten sysroot）等第三方组件的许可信息见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
