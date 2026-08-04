# 第三方声明（Third-Party Notices）

本项目的部分依赖与内置资源来自第三方项目，各自适用其原始许可证。本文件用于满足 Apache-2.0 等许可要求的版权声明保留义务。

## 运行时资源

以下资源由本项目在运行时从 jsDelivr CDN 下载并缓存在浏览器中，用于「C++ (WASM)」编译运行和「Python (WASM)」执行：

| 组件 | 许可证 | 说明 |
| --- | --- | --- |
| emception | MIT | 浏览器内 C++ 工具链的 JavaScript 包装与构建产物管理（npm 包，v3.8.0） |
| @gameguild/emception-browser | MIT | emception 的浏览器嵌入 API（npm 包，v3.8.0） |
| LLVM / Clang / lld | Apache-2.0 WITH LLVM-exception | 编译工具链本体（clang.wasm、lld.wasm 及工具链内部库） |
| LLVM 标准库（libc++ / libc++abi） | Apache-2.0 WITH LLVM-exception | C++ 标准库头文件与链接库 |
| Emscripten sysroot | Apache-2.0 / MIT / BSD-2-Clause 等 | 链接库（libc、libc++ 等编译产物）与运行时支持 |
| brotli | MIT | 资源解压（brotli_wasm.js / brotli_wasm.wasm） |
| Pyodide | MPL-2.0 | 浏览器中的 CPython WebAssembly 运行时（npm 包与 CDN 资源，v0.29.3） |
| CPython / Python 标准库 | PSF-2.0 | Pyodide 随核心运行时提供的 Python 解释器与标准库 |
| Emscripten | MIT | Pyodide WebAssembly 运行时依赖 |
| Brython | BSD-3-Clause | Python 到 JavaScript 的浏览器解释器与标准库（v3.12.5） |

## JavaScript 依赖

| 包 | 许可证 |
| --- | --- |
| JSCPP | MIT |
| @codemirror/lang-* / @codemirror/state / @codemirror/view / codemirror | MIT |
| chart.js | MIT |
| markdown-it / markdown-it-task-lists | MIT |
| vue / vue-router | MIT |
| vite / @vitejs/plugin-vue | MIT |
| Font Awesome（图标字体） | CC BY 4.0（图标）/ MIT（代码部分） |

上述 MIT 许可组件随其源码一并分发完整许可文本；Apache-2.0 组件的许可文本见 <https://www.apache.org/licenses/LICENSE-2.0>。
