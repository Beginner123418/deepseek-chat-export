# DeepSeek 聊天记录导出

一个 Tampermonkey (篡改猴) 脚本，用于将 DeepSeek 网页端的聊天记录导出为 Markdown 文件或 PDF 格式。

## 功能特点

* **📥 对话选择与导出**
  此插件支持将 DeepSeek 网页版的对话导出为 PDF 和 Markdown 文件，并且您可以自定义勾选需要的对话轮次进行导出。同时，在导出时您可以自由选择文件的保存位置并对文件进行重命名。

* **⏳ 首次加载提示**
  初次进入 DeepSeek 聊天界面加载时，可能会有 2-3 秒的轻微卡顿。加载完成后，界面右上角会自动显示 “导出MD” 和 “导出PDF” 按钮。

* **💡 完整加载小贴士**
  当会话轮次较多、内容较长时，如果您想完整导出 Markdown 文件，建议在导出前先点击一下 “导出PDF” 以确保全部对话内容被完整加载。


## 安装方式

### 第一步：安装 Tampermonkey 浏览器扩展
为了运行此脚本，您的浏览器需要首先安装 Tampermonkey (篡改猴) 扩展程序。请根据您的浏览器选择下方链接进行安装：
*   **Chrome 浏览器**：[Chrome 网上应用店 - Tampermonkey](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkbhmibihijbejgghopjifhocd)
*   **Edge 浏览器**：[Microsoft Edge 外接程序 - Tampermonkey](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepohlfhondcobe)
*   **Firefox 浏览器**：[Firefox Browser Add-ons - Tampermonkey](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)

安装完成后，浏览器工具栏右上角会显现一个绿色的 “黑眼圈” 篡改猴图标。

---

### 第二步：安装本脚本（提供两种安装方式）

#### 方式 A：一键自动安装（推荐，最便捷）
如果您已完成第一步并启用了 Tampermonkey，可以直接点击下方的安装链接，Tampermonkey 将会自动弹出脚本安装确认页面：
👉 [点击直接安装脚本](https://github.com/Beginner123418/deepseek-chat-export/raw/main/deepseek_export.user.js)

在弹出的新标签页中，点击 **“安装”**（或 **“更新”**）按钮即可。

#### 方式 B：手动复制创建
1. 打开本仓库下的 [deepseek_export.user.js](https://github.com/Beginner123418/deepseek-chat-export/blob/main/deepseek_export.user.js) 代码文件。
2. 点击右上角的 **Raw** 按钮（或直接查看纯文本），按 `Ctrl + A` 全选代码，再按 `Ctrl + C` 复制全部内容。
3. 点击浏览器右上角的 Tampermonkey 图标，在弹出的菜单中选择 **“添加新脚本”**（或进入 Tampermonkey 控制面板点击 **“+”** 选项卡）。
4. 在代码编辑器中，清空原本自带的默认模板内容，然后按 `Ctrl + V` 将复制的代码全部粘贴进去。
5. 按快捷键 `Ctrl + S` 保存，或在编辑器上方菜单点击 **“文件” -> “保存”**。

---

### 第三步：开始使用
打开或刷新 [DeepSeek 官方对话网页](https://chat.deepseek.com/)。等待约 2-3 秒，页面右上角就会自动浮现天蓝色背景的“📄 导出 MD”和绿色背景的“📄 导出 PDF”按钮。

## 声明

本项目基于 GitHub 创作者 [phoebusluckymail-cpu](https://github.com/phoebusluckymail-cpu) 的开源项目 [DeepSeek-Markdown-Tampermonkey](https://github.com/phoebusluckymail-cpu/DeepSeek-Markdown-Tampermonkey)。

在此对原作者的开源精神、无私奉献与杰出贡献致以最诚挚的感谢！
