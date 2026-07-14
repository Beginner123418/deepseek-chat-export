# DeepSeek 聊天记录导出 (可视化轮次选择)

一个 Tampermonkey (篡改猴) 脚本，用于将 DeepSeek 网页端的聊天记录导出为 Markdown 文件或 PDF 格式。

## 功能特点

* **📥 对话选择与导出**
  此插件支持将 DeepSeek 网页版的对话导出为 PDF 和 Markdown 文件，并且您可以自定义勾选需要的对话轮次进行导出。

* **⏳ 首次加载提示**
  初次进入 DeepSeek 聊天界面加载时，可能会有 2-3 秒的轻微卡顿。加载完成后，界面右上角会自动显示 “导出MD” 和 “导出PDF” 按钮。

* **💡 完整加载小贴士**
  当会话轮次较多、内容较长时，如果您想完整导出 Markdown 文件，建议在导出前先点击一下 “导出PDF” 以确保全部对话内容被完整加载。


## 安装方式

1. 确保浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/) 插件。
2. 创建一个新脚本，将本仓库下的 `deepseek_export.user.js` 代码复制进去并保存。
3. 或者直接点击 `deepseek_export.user.js` 的原始链接（Raw）进行安装。

## 声明

本项目基于 GitHub 上一位创作者的项目，他的地址我没有记下，谨此感谢他的贡献。
