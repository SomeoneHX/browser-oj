# Browser OJ — 在线评测系统

一个基于浏览器的在线评测（OJ）系统，支持 C、C++、JavaScript 三种语言的代码编辑与在线评测。题目全部使用 Markdown 文件维护，元数据位于文件顶部的 front matter 区域。

## 功能

- **在线编程** — 使用 CodeMirror 编辑器编写代码，支持 C (JSCPP)、C++ (JSCPP)、JavaScript
- **自动评测** — 针对每道题目的测试点逐项运行并比对结果，全部通过即判为 AC
- **提交记录** — 每份提交的代码、评测结果、测试点详情均保存在本地

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。所有数据存储在 `localStorage` 中，无需后端服务。

## 洛谷登录

登录不是做题的前置条件。需要显示洛谷用户名时，打开 `/login`，将页面生成的验证文本写入洛谷剪贴板，再输入剪贴板 ID。系统会通过 `api.luogu.me` 创建并轮询同步工作流，完成后校验剪贴板内容和作者名称。

## 构建

```bash
npm run build
npm run preview
```

## 目录结构

```
problems/                   题目定义
  P1001/                    每道题一个文件夹
    problem.md              顶部元数据和完整题目描述
    testcases/              测试点
      1.in / 1.out
      ...
src/
  components/               通用组件
  pages/                   页面组件
  utils/                   工具函数（评测引擎、Markdown 题目加载、存储）
  data/                    数据入口
  styles/                  样式
```

## 技术栈

- Vue 3 + Vue Router 4
- Vite 5
- CodeMirror 6（原生 API）
- JSCPP（浏览器端 C/C++ 解释器）
- markdown-it + GFM task lists

题目 Markdown 的顶部元数据支持 `title`、`difficulty` 和 `timeLimit`（单位：毫秒）：

```md
---
title: A+B 问题
difficulty: 简单
timeLimit: 2000
---
```

提交后会立即进入评测详情页。判题在 Web Worker 中按测试点执行，测试点状态会实时更新；单个测试点超过 `timeLimit` 会被终止并标记为运行超时。
