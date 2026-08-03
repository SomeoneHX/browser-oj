# Browser OJ — 在线评测系统

一个基于浏览器的在线评测（OJ）系统，支持 C、C++、JavaScript 三种语言的代码编辑与在线评测。题目全部使用 Markdown 文件维护，元数据位于文件顶部的 front matter 区域。所有数据存储在浏览器 `localStorage` 中，无需后端服务。

## 功能

- **首页** — 公告、今日日历、题目跳转（支持输入题号与随机跳题）、近 14 天每日通过（AC）数量折线统计
- **在线编程** — 使用 CodeMirror 编辑器编写代码，支持 C (JSCPP)、C++ (JSCPP)、JavaScript，Tab 缩进为 4 格
- **在线 IDE** — `/ide` 提供独立编辑器与标准输入/输出面板，代码、语言与输入自动保存到浏览器，下次打开自动恢复
- **自动评测** — 针对每道题目的测试点逐项运行并比对结果，全部通过即判为 AC
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
- JSCPP（浏览器端 C/C++ 解释器）
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
