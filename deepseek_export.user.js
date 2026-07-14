// ==UserScript==
// @name         DeepSeek 聊天记录导出 (可视化轮次选择)
// @namespace    http://tampermonkey.net/
// @version      7.12
// @description  可视化勾选轮次，自动同步输入框，完美另存为，支持 KaTeX，PDF 打印（彻底去思考/搜索块，修复纯图片消息与 AI 回复丢失，PDF 不再误隐藏 AI 回复）
// @match        *://*.deepseek.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    // ---------- 注入打印隐藏样式 ----------
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            #deepseek-export-buttons {
                display: none !important;
            }
            .hide-print-temp {
                display: none !important;
            }
            .ds-think-content,
            .ds-think-content *,
            [class*="think"],
            [class*="reason"],
            .ds-search-banner,
            .ds-search-results,
            ._287b564 {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);

    // ---------- 工具函数 ----------
    function getPlainText(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent.trim();
    }

    function truncate(text, maxLen) {
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen) + '…';
    }

    function removeNewlines(text) {
        return text.replace(/[\r\n]+/g, ' ');
    }

    // ---------- 解析轮次范围 ----------
    function parseRoundInput(input, maxRound) {
        const trimmed = input.trim().toLowerCase();
        if (trimmed === 'all' || trimmed === '') {
            return Array.from({ length: maxRound }, (_, i) => i + 1);
        }
        const parts = trimmed.split(',').map(p => p.trim());
        const rounds = new Set();
        for (const part of parts) {
            if (part.includes('-')) {
                const [startStr, endStr] = part.split('-').map(s => s.trim());
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                if (isNaN(start) || isNaN(end) || start < 1 || end > maxRound || start > end) return null;
                for (let i = start; i <= end; i++) rounds.add(i);
            } else {
                const num = parseInt(part, 10);
                if (isNaN(num) || num < 1 || num > maxRound) return null;
                rounds.add(num);
            }
        }
        return Array.from(rounds).sort((a, b) => a - b);
    }

    function formatRounds(rounds) {
        if (!rounds.length) return '';
        const sorted = [...rounds].sort((a, b) => a - b);
        const ranges = [];
        let start = sorted[0], end = sorted[0];
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i] === end + 1) {
                end = sorted[i];
            } else {
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                start = sorted[i];
                end = sorted[i];
            }
        }
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        return ranges.join(',');
    }

    // ---------- HTML → Markdown ----------
    function htmlToMarkdown(html) {
        const div = document.createElement('div');
        div.innerHTML = html;

        function processNode(node) {
            try {
                if (node.nodeType === Node.TEXT_NODE) return node.textContent;
                if (node.nodeType !== Node.ELEMENT_NODE) return '';

                const tag = node.tagName.toLowerCase();
                const cls = node.className || '';

                if (cls.includes('katex-display')) {
                    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
                    const tex = ann ? ann.textContent.trim() : node.textContent.trim();
                    return '\n$$\n' + tex + '\n$$\n\n';
                }
                if (cls.includes('katex')) {
                    const ann = node.querySelector('annotation[encoding="application/x-tex"]');
                    const tex = ann ? ann.textContent.trim() : node.textContent.trim();
                    return '$' + tex + '$';
                }
                if (tag === 'script' && node.getAttribute('type') === 'math/tex') {
                    return '$' + node.textContent.trim() + '$';
                }
                if (tag === 'script' && node.getAttribute('type') === 'math/tex; mode=display') {
                    return '\n$$\n' + node.textContent.trim() + '\n$$\n\n';
                }

                if (node.classList && node.classList.contains('md-code-block-banner')) return '';

                if (tag === 'pre') {
                    let lang = '';
                    let parent = node.parentElement;
                    while (parent && parent !== document.body) {
                        const langSpan = parent.querySelector('.d813de27');
                        if (langSpan) { lang = langSpan.textContent.trim(); break; }
                        const codeEl = parent.querySelector('code');
                        if (codeEl) {
                            const match = codeEl.className.match(/language-(\w+)/);
                            if (match) { lang = match[1]; break; }
                        }
                        parent = parent.parentElement;
                    }
                    const clone = node.cloneNode(true);
                    clone.querySelectorAll('[role="button"], .ds-button').forEach(b => b.remove());
                    let code = clone.textContent.replace(/^\s+/, '').replace(/\s+$/, '');
                    return '```' + lang + '\n' + code + '\n```\n\n';
                }

                if (tag === 'img') {
                    const src = node.getAttribute('src') || '';
                    const alt = node.getAttribute('alt') || '图片';
                    return src ? `![${alt}](${src})` : `[${alt}]`;
                }

                const children = Array.from(node.childNodes).map(processNode).join('');
                switch (tag) {
                    case 'h1': return '# ' + children + '\n\n';
                    case 'h2': return '## ' + children + '\n\n';
                    case 'h3': return '### ' + children + '\n\n';
                    case 'h4': return '#### ' + children + '\n\n';
                    case 'h5': return '##### ' + children + '\n\n';
                    case 'h6': return '###### ' + children + '\n\n';
                    case 'p': return children + '\n\n';
                    case 'strong': case 'b': return '**' + children + '**';
                    case 'em': case 'i': return '*' + children + '*';
                    case 'code': return '`' + children + '`';
                    case 'ul': return children + '\n';
                    case 'ol': return children + '\n';
                    case 'li': return '- ' + children + '\n';
                    case 'blockquote': return '> ' + children.replace(/\n/g, '\n> ') + '\n\n';
                    case 'a': return '[' + children + '](' + (node.getAttribute('href') || '#') + ')';
                    case 'br': return '\n';
                    case 'hr': return '---\n\n';
                    case 'div': case 'span': case 'section': return children;
                    default: return children;
                }
            } catch (e) {
                return node.textContent || '';
            }
        }

        let md = processNode(div);
        md = md.replace(/\n{3,}/g, '\n\n');
        return md.trim();
    }

    // ---------- 判断辅助 ----------
    function isThinkingElement(el) {
        if (el.querySelector('.ds-think-content')) return true;
        if (el.className.includes('think') || el.className.includes('reason')) return true;
        const span = el.querySelector('span');
        if (span && /^已思考（用时 .* 秒）$/.test(span.innerText.trim())) {
            return el.querySelectorAll('.ds-icon, svg').length >= 2;
        }
        return false;
    }

    function isAssistant(el) {
        return el.className.includes('assistant') || el.className.includes('ds-assistant');
    }

    function isAIGeneratedHint(el) {
        return el.innerText.trim() === '本回答由 AI 生成，内容仅供参考，请仔细甄别';
    }

    function isSearchReferenceBlock(el) {
        if (el.querySelector('._287b564')) return true;
        if (el.querySelector('.ds-search-banner')) return true;
        if (el.querySelector('.ds-search-results')) return true;
        if (el.className.includes('search')) return true;
        const text = el.innerText.trim();
        if (/^搜索到\s*\d+\s*个网页/.test(text)) return true;
        if (/^浏览\s*\d+\s*个页面/.test(text)) return true;
        if (/\d+\s*个网页/.test(text)) return true;
        if (el.querySelector('img.site_logo_img')) return true;
        return false;
    }

    function isThinkingOrSearchBlock(el) {
        if (isThinkingElement(el)) return true;
        if (isSearchReferenceBlock(el)) return true;
        if (el.innerText.trim().startsWith('已思考')) return true;
        return false;
    }

    function hasValidContent(el) {
        if (el.innerText.trim().length > 0) return true;
        if (el.querySelector('img, video, audio, iframe')) return true;
        return false;
    }

    // ---------- 提取消息（MD 导出用，已修复 AI 回复丢失）----------
    function extractMessages() {
        const groups = document.querySelectorAll('.ds-message, [class*="message-container"], [class*="chat-item"]');
        if (!groups.length) return [];

        let all = [];
        for (const g of groups) {
            const children = Array.from(g.children).filter(el =>
                el.tagName === 'DIV' && hasValidContent(el)
            );
            let userEl = null, assistantEl = null;

            for (const el of children) {
                if (isAIGeneratedHint(el)) continue;

                // 优先识别 assistant，避免被后续跳过逻辑误杀
                if (isAssistant(el)) {
                    assistantEl = el;
                    continue;
                }

                // 非 assistant 才跳过思考/搜索块
                if (isThinkingElement(el) || isSearchReferenceBlock(el)) continue;

                if (!userEl) userEl = el;
            }

            if (userEl) {
                const html = userEl.innerHTML.trim();
                if (html) all.push({ role: 'user', html });
            }
            if (assistantEl) {
                const contentEl = assistantEl.querySelector('.ds-markdown, .markdown, .prose, .message-content') || assistantEl;
                const html = contentEl.innerHTML.trim();
                if (html) all.push({ role: 'assistant', html });
            }
        }
        return all;
    }

    function filterMessagesByRounds(messages, selectedRounds) {
        if (!selectedRounds || selectedRounds.length === 0) return [];
        const roundSet = new Set(selectedRounds);
        const filtered = [];
        let currentRound = 0, i = 0;
        while (i < messages.length) {
            if (messages[i].role === 'user') {
                currentRound++;
                if (roundSet.has(currentRound)) {
                    filtered.push(messages[i]);
                    if (i + 1 < messages.length && messages[i + 1].role === 'assistant') {
                        filtered.push(messages[i + 1]);
                        i++;
                    }
                }
            }
            i++;
        }
        return filtered;
    }

    function buildMarkdown(messages) {
        let toc = '';
        const userMsgs = messages.filter(m => m.role === 'user');
        if (userMsgs.length) {
            let items = [];
            for (let i = 0; i < userMsgs.length; i++) {
                const plain = getPlainText(userMsgs[i].html);
                const clean = removeNewlines(plain);
                const text = truncate(clean, 100) || '[图片消息]';
                items.push(`${i+1}. [${text}](#msg-${i+1})`);
            }
            toc = '# 📑 目录\n\n' + items.join('\n') + '\n\n___\n\n';
        }

        let body = '', userIdx = 0;
        for (const msg of messages) {
            if (msg.role === 'user') {
                userIdx++;
                body += `<span id="msg-${userIdx}"></span>\n\n`;
                const userMd = htmlToMarkdown(msg.html);
                body += `**👤 用户**\n\n${userMd}\n\n___\n\n`;
            } else {
                try {
                    const md = htmlToMarkdown(msg.html);
                    if (md) body += `**🤖 DeepSeek**\n\n${md}\n\n___\n\n`;
                } catch (e) {
                    body += `**🤖 DeepSeek**\n\n${msg.html}\n\n___\n\n`;
                }
            }
        }
        return toc + body;
    }

    // ---------- 轮次选择对话框 ----------
    function showRoundDialog(userCount, assistantCount, userSummaries, callback) {
        const old = document.getElementById('ds-export-dialog');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'ds-export-dialog';
        overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:99999;display:flex;align-items:center;justify-content:center;';

        const box = document.createElement('div');
        box.style.cssText = 'background:white;border-radius:12px;padding:24px;max-width:500px;width:90%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 10px 25px rgba(0,0,0,0.3);font-family:sans-serif;';
        box.innerHTML = `
            <h3 style="margin-top:0;">📤 选择要导出的轮次</h3>
            <p style="color:#555;margin-bottom:8px;">已提取 <b>${userCount}</b> 轮对话（用户消息 ${userCount} 条，助手回复 ${assistantCount} 条）</p>
            <div style="display:flex;gap:10px;margin-bottom:12px;">
                <button id="ds-select-all" style="padding:6px 12px;font-size:12px;background:#e9ecef;border:1px solid #ced4da;border-radius:4px;cursor:pointer;">全选</button>
                <button id="ds-select-none" style="padding:6px 12px;font-size:12px;background:#e9ecef;border:1px solid #ced4da;border-radius:4px;cursor:pointer;">取消全选</button>
                <span style="flex:1;"></span>
                <span style="font-size:12px;color:#888;align-self:center;">已选 <span id="ds-selected-count">${userCount}</span> 轮</span>
            </div>
            <div id="ds-round-list" style="overflow-y:auto;max-height:300px;border:1px solid #dee2e6;border-radius:6px;padding:4px;background:#f8f9fa;"></div>
            <div style="margin-top:12px;">
                <label style="font-size:13px;color:#555;">手动输入范围（与勾选同步）：</label>
                <input type="text" id="ds-round-input" style="width:100%;padding:10px;font-size:15px;border:1px solid #ccc;border-radius:6px;box-sizing:border-box;margin-top:4px;" value="all">
            </div>
            <div style="margin-top:16px;display:flex;gap:10px;justify-content:flex-end;">
                <button id="ds-round-cancel" style="padding:10px 20px;border:none;background:#ddd;border-radius:6px;cursor:pointer;">取消</button>
                <button id="ds-round-confirm" style="padding:10px 20px;border:none;background:#17a2b8;color:white;border-radius:6px;cursor:pointer;">确认导出</button>
            </div>
        `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const listContainer = document.getElementById('ds-round-list');
        const input = document.getElementById('ds-round-input');
        const confirmBtn = document.getElementById('ds-round-confirm');
        const cancelBtn = document.getElementById('ds-round-cancel');
        const selectAllBtn = document.getElementById('ds-select-all');
        const selectNoneBtn = document.getElementById('ds-select-none');
        const selectedCountSpan = document.getElementById('ds-selected-count');

        const checkboxes = [];
        for (let i = 0; i < userCount; i++) {
            const summary = userSummaries[i] || '[无文本消息]';
            const label = document.createElement('label');
            label.style.cssText = 'display:flex;align-items:center;padding:6px 8px;border-bottom:1px solid #e9ecef;cursor:pointer;background:white;transition:background 0.1s;';
            label.innerHTML = `
                <input type="checkbox" class="ds-round-checkbox" data-round="${i+1}" checked style="margin-right:10px;">
                <span style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i+1}. ${escapeHtml(truncate(summary, 80))}</span>
            `;
            const cb = label.querySelector('input');
            checkboxes.push(cb);
            listContainer.appendChild(label);
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getSelectedRounds() {
            return checkboxes.filter(cb => cb.checked).map(cb => parseInt(cb.dataset.round));
        }

        function updateInputFromCheckboxes() {
            const selected = getSelectedRounds();
            if (selected.length === 0) input.value = '';
            else if (selected.length === userCount) input.value = 'all';
            else input.value = formatRounds(selected);
            selectedCountSpan.textContent = selected.length;
        }

        function updateCheckboxesFromInput() {
            const parsed = parseRoundInput(input.value, userCount);
            if (!parsed) return;
            const set = new Set(parsed);
            checkboxes.forEach(cb => {
                cb.checked = set.has(parseInt(cb.dataset.round));
            });
            selectedCountSpan.textContent = set.size;
        }

        updateInputFromCheckboxes();

        checkboxes.forEach(cb => cb.addEventListener('change', updateInputFromCheckboxes));
        input.addEventListener('input', () => {
            updateCheckboxesFromInput();
            if (input.value.trim() === '') {
                checkboxes.forEach(cb => { cb.checked = true; });
                updateInputFromCheckboxes();
            }
        });

        selectAllBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => { cb.checked = true; });
            updateInputFromCheckboxes();
        });
        selectNoneBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => { cb.checked = false; });
            updateInputFromCheckboxes();
        });

        confirmBtn.addEventListener('click', () => {
            const selected = getSelectedRounds();
            if (selected.length === 0) {
                alert('请至少选择一轮对话。');
                return;
            }
            callback(input.value.trim() || 'all');
            overlay.remove();
        });

        cancelBtn.addEventListener('click', () => {
            overlay.remove();
            callback(null);
        });
    }

    async function performSave(md, filename) {
        if (window.showSaveFilePicker) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Markdown 文件',
                        accept: { 'text/markdown': ['.md', '.markdown'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(md);
                await writable.close();
                console.log('✅ 文件已保存到所选位置！');
                return;
            } catch (err) {
                if (err.name === 'AbortError') {
                    console.log('用户取消保存，导出终止。');
                    return;
                }
                console.error('showSaveFilePicker 异常，改用传统下载：', err);
            }
        }
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    function exportMDDirect() {
        const messages = extractMessages();
        if (!messages.length) {
            alert('❌ 未提取到任何消息。请先滚动页面加载完整对话，再点击导出。');
            return;
        }

        const userMsgs = messages.filter(m => m.role === 'user');
        const userCount = userMsgs.length;
        const assistantCount = messages.filter(m => m.role === 'assistant').length;

        const userSummaries = userMsgs.map(msg => {
            const text = getPlainText(msg.html);
            if (text) return removeNewlines(text);
            const div = document.createElement('div');
            div.innerHTML = msg.html;
            if (div.querySelector('img')) return '[图片消息]';
            return '';
        });

        showRoundDialog(userCount, assistantCount, userSummaries, (userInput) => {
            if (userInput === null) {
                console.log('用户取消导出。');
                return;
            }
            const selectedRounds = parseRoundInput(userInput, userCount);
            if (!selectedRounds) {
                alert('❌ 输入格式无效，请使用数字、逗号或范围（如 1-3,5），或输入 all 导出全部。');
                return;
            }
            const filteredMessages = filterMessagesByRounds(messages, selectedRounds);
            if (!filteredMessages.length) {
                alert('❌ 所选轮次没有有效对话。');
                return;
            }
            const md = buildMarkdown(filteredMessages);
            if (!md.trim()) {
                alert('❌ 转换后内容为空。');
                return;
            }
            const filename = `DeepSeek_Chat_${new Date().toISOString().slice(0,10)}.md`;
            performSave(md, filename);
        });
    }

    // ---------- 导出 PDF（修复：不再隐藏 AI 回复）----------
    function exportPDF() {
        const hiddenElements = [];

        // 只隐藏真正的思考/搜索/参考块，不触碰 assistant 容器
        document.querySelectorAll('.ds-message, [class*="message-container"], [class*="chat-item"]').forEach(group => {
            Array.from(group.children).forEach(el => {
                if (el.tagName !== 'DIV') return;
                // 跳过 assistant 元素，保护 AI 回复
                if (isAssistant(el)) return;
                if (isThinkingOrSearchBlock(el)) {
                    el.classList.add('hide-print-temp');
                    hiddenElements.push(el);
                }
            });

            // 额外隐藏内部的搜索横幅等（即使它们在 assistant 内部也不影响主要回答）
            group.querySelectorAll('.ds-search-banner, .ds-search-results, ._287b564').forEach(block => {
                if (!block.classList.contains('hide-print-temp')) {
                    block.classList.add('hide-print-temp');
                    hiddenElements.push(block);
                }
            });
        });

        // 特殊处理：非 assistant 中仍存在的“已思考”文本
        document.querySelectorAll('.ds-message span, [class*="message-container"] span').forEach(span => {
            if (span.innerText.trim().startsWith('已思考（用时') && !span.closest('.hide-print-temp')) {
                const parentBlock = span.closest('div');
                if (parentBlock && !parentBlock.classList.contains('hide-print-temp') && !isAssistant(parentBlock)) {
                    parentBlock.classList.add('hide-print-temp');
                    hiddenElements.push(parentBlock);
                }
            }
        });

        window.print();

        setTimeout(() => {
            hiddenElements.forEach(el => el.classList.remove('hide-print-temp'));
        }, 2000);
    }

    // ---------- UI 按钮 ----------
    function addButtons() {
        if (document.getElementById('deepseek-export-md-btn')) return;

        const container = document.createElement('div');
        container.id = 'deepseek-export-buttons';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;gap:10px;';

        function createBtn(text, bg, hover, handler) {
            const btn = document.createElement('button');
            btn.textContent = text;
            Object.assign(btn.style, {
                padding: '10px 16px',
                backgroundColor: bg,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'background-color 0.2s'
            });
            btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = hover; });
            btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = bg; });
            btn.addEventListener('click', handler);
            return btn;
        }

        const mdBtn = createBtn('📄 导出 MD', '#17a2b8', '#138496', exportMDDirect);
        const pdfBtn = createBtn('📄 导出 PDF', '#28a745', '#218838', exportPDF);
        mdBtn.id = 'deepseek-export-md-btn';
        pdfBtn.id = 'deepseek-export-pdf-btn';

        container.appendChild(mdBtn);
        container.appendChild(pdfBtn);
        document.body.appendChild(container);
    }

    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(addButtons, 1500));
        } else {
            setTimeout(addButtons, 1500);
        }
    }
    init();

    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(addButtons, 1500);
        }
    }, 3000);

    console.log('DeepSeek 导出脚本（v7.12 PDF/AI回复修复+图片消息）已加载');
})();
