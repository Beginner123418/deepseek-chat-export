# DeepSeek 聊天记录导出 (可视化轮次选择)

一个 Tampermonkey (篡改猴) 脚本，用于将 DeepSeek 网页端的聊天记录导出为 Markdown 文件或 PDF 格式。

## 功能特点

1. **可视化轮次选择**：导出前自动提取所有对话轮次，支持勾选指定轮次、一键全选/取消全选，并支持手动输入范围（如 `1-3,5`）。
2. **支持 Markdown 导出**：完美转换为 Markdown 语法，包含目录/索引、完美保存公式（KaTeX/MathJax），以及图片消息的保留。
3. **支持 PDF 导出与打印**：打印时自动优化样式，彻底去除思考过程（Think）、网页搜索参考块，修复纯图片消息与 AI 回复丢失的问题。
4. **智能去除噪音**：去除 AI 生成提示词、已思考时长等对文档排版无用或多余的元素。
5. **另存为 API 支持**：如果浏览器支持 `showSaveFilePicker`，将弹出原生保存对话框；若不支持，则自动降级为传统的文件下载。

## 安装方式

1. 确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。
2. 创建一个新脚本，将本仓库下的 `deepseek_export.user.js` 代码复制进去并保存。
3. 或者直接点击 `deepseek_export.user.js` 的原始链接（Raw）进行安装。

## 许可证

MIT License
