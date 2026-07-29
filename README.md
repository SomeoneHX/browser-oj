# Anti-OJ — 在线评测系统

一个基于浏览器的在线评测（OJ）系统，支持 C、C++、JavaScript 三种语言的代码编辑与在线评测。

## 功能

- **在线编程** — 使用 CodeMirror 编辑器编写代码，支持 C (JSCPP)、C++ (JSCPP)、JavaScript
- **自动评测** — 针对每道题目的测试点逐项运行并比对结果，全部通过即判为 AC
- **提交记录** — 每份提交的代码、评测结果、测试点详情均保存在本地
- **成就系统** — 完成特定行为解锁成就

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。所有数据存储在 `localStorage` 中，无需后端服务。

## 构建

```bash
npm run build
npm run preview
```

## 目录结构

```
problems/                   题目定义
  P1001/                    每道题一个文件夹
    meta.json               标题、难度、陷阱变量
    problem.md              Markdown 题目描述
    testcases/              测试点
      1.in / 1.out
      ...
src/
  components/               通用组件
  pages/                   页面组件
  utils/                   工具函数（评测引擎、题目加载、存储）
  data/                    数据入口
  styles/                  样式
```

## 技术栈

- React 18 + React Router 6
- Vite 5
- CodeMirror 6（`@uiw/react-codemirror`）
- JSCPP（浏览器端 C/C++ 解释器）
- react-markdown + remark-gfm + rehype-raw
