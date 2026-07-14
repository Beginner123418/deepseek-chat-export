# DeepSeek 聊天记录导出 (可视化轮次选择)

一个 Tampermonkey (篡改猴) 脚本，用于将 DeepSeek 网页端的聊天记录导出为 Markdown 文件或 PDF 格式。

## 功能特点

（1）此插件支持将 DeepSeek 网页版的对话，导出 PDF 和 Markdown 文件，可以自定义选择对话轮次进行导出；
（2）初次在 DeepSeek 聊天界面加载时，可能会有点卡顿，大概 2-3 秒的样子，加载出来后在右上角出现“导出MD”和“导出PDF”两个按钮；
（3）会话比较多时，想要在导出 Markdown 文件时把对话完整加载出来，需要先点击下“导出PDF”。

## 安装方式

1. 确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。
2. 创建一个新脚本，将本仓库下的 `deepseek_export.user.js` 代码复制进去并保存。
3. 或者直接点击 `deepseek_export.user.js` 的原始链接（Raw）进行安装。

## 声明

本项目基于 GitHub 上一位创作者的项目，他的地址我没有记下，谨此感谢他的贡献。
