// chat.js — Módulo de gestión del Chat y comunicación con Tutor IA Gemini
window.KiroChat = (function () {
    const chatMessages = document.getElementById('chatMessages');

    function appendUserMessage(text) {
        if (!chatMessages) return;
        const row = document.createElement('div');
        row.className = 'message-row user';
        row.innerHTML = `
            <div class="avatar">👤</div>
            <div class="bubble">${escapeHtml(text)}</div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendModelMessage(text) {
        if (!chatMessages) return;
        const row = document.createElement('div');
        row.className = 'message-row model';
        row.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="bubble markdown-body">${typeof marked !== 'undefined' ? marked.parse(text) : escapeHtml(text)}</div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendErrorMessage(text) {
        if (!chatMessages) return;
        const row = document.createElement('div');
        row.className = 'message-row model';
        row.innerHTML = `
            <div class="avatar">❌</div>
            <div class="bubble" style="border-color: var(--accent-danger); color: var(--accent-danger);">${escapeHtml(text)}</div>
        `;
        chatMessages.appendChild(row);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function renderCurrentChatHistory(activePersonality, chatHistories) {
        if (!chatMessages) return;
        chatMessages.innerHTML = '';
        if (!activePersonality) return;

        const history = chatHistories[activePersonality.id] || [];

        if (history.length === 0) {
            chatMessages.innerHTML = `
                <div class="welcome-card" style="padding: 20px 10px; text-align: center;">
                    <div class="welcome-icon" style="font-size: 32px; margin-bottom: 8px;">🤖</div>
                    <h3 style="font-size: 14px; margin-bottom: 6px;">Tutor IA Listo</h3>
                    <p style="font-size: 12px; color: var(--text-muted);">Puedes hacerme preguntas sobre tu código C#, pedirme pistas o explicaciones conceptuales.</p>
                </div>
            `;
            return;
        }

        history.forEach(item => {
            if (item.role === 'user') {
                appendUserMessage(item.message);
            } else {
                appendModelMessage(item.message);
            }
        });
    }

    async function sendPrompt(messageText, activePersonality, chatHistories) {
        if (!activePersonality || !messageText.trim()) return;

        appendUserMessage(messageText);

        const typingEl = document.createElement('div');
        typingEl.className = 'message-row model typing';
        typingEl.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="bubble"><em>Gemini está pensando...</em></div>
        `;
        chatMessages.appendChild(typingEl);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const currentHistory = (chatHistories[activePersonality.id] || []).map(h => ({
            role: h.role,
            message: h.message
        }));

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalityId: activePersonality.id,
                    message: messageText,
                    history: currentHistory,
                    customApiKey: localStorage.getItem('gemini_api_key') || null,
                    model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash'
                })
            });

            if (!res.ok) {
                const textErr = await res.text();
                throw new Error(`HTTP ${res.status}: ${textErr || res.statusText}`);
            }

            const data = await res.json();
            typingEl.remove();

            if (data.success) {
                appendModelMessage(data.response);
                if (!chatHistories[activePersonality.id]) {
                    chatHistories[activePersonality.id] = [];
                }
                chatHistories[activePersonality.id].push({ role: 'user', message: messageText });
                chatHistories[activePersonality.id].push({ role: 'model', message: data.response });
            } else {
                appendErrorMessage(data.errorMessage || 'Error al comunicarse con Gemini.');
            }
        } catch (err) {
            typingEl.remove();
            appendErrorMessage('Error de red al enviar mensaje: ' + err.message);
        }
    }

    function escapeHtml(str) {
        return (str || '')
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    return {
        appendUserMessage,
        appendModelMessage,
        appendErrorMessage,
        renderCurrentChatHistory,
        sendPrompt
    };
})();
