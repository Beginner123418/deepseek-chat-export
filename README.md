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

### 方式一：直接链接安装（推荐，最便捷）
如果您已经安装了 Tampermonkey，可以直接点击下方的安装链接，Tampermonkey 会自动弹出安装确认界面：
👉 [点击直接安装脚本](https://github.com/Beginner123418/deepseek-chat-export/raw/main/deepseek_export.user.js)

---

### 方式二：手动复制安装
1. **安装 Tampermonkey 插件**：
   确保您的浏览器已安装 [Tampermonkey (篡改猴)](https://www.tampermonkey.net/) 浏览器扩展程序。
2. **新建用户脚本**：
   点击浏览器右上角的 Tampermonkey 图标，选择 **“添加新脚本”**（或进入管理面板，点击 **“+”** 号）。
3. **复制脚本代码**：
   打开本仓库下的 [deepseek_export.user.js](https://github.com/Beginner123418/deepseek-chat-export/blob/main/deepseek_export.user.js) 文件，复制其中的**所有**代码。
4. **粘贴并保存**：
   清空 Tampermonkey 编辑器中默认的模板内容，将刚才复制的代码粘贴进去。然后按键盘 `Ctrl + S` 保存，或在编辑器菜单中点击 **“文件” -> “保存”**。
5. **刷新页面**：
   打开 DeepSeek 对话网页，即可正常加载并使用本插件。

## 声明

本项目基于 GitHub 上一位创作者的项目。**非常抱歉，由于我的疏忽，未能记下原作者的项目地址**，谨在此表达诚挚的歉意，并衷心感谢他的无私贡献！
