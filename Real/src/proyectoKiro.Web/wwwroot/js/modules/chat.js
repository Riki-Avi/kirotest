// chat.js — Módulo de gestión del Chat y comunicación con Tutor IA Gemini
window.KiroChat = (function () {
    const chatMessages = document.getElementById('chatMessages');
    let renderedPersonalityId = null;
    let requestPending = false;

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
        renderedPersonalityId = activePersonality?.id || null;
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

    function getHistorySnapshot(personalityId, chatHistories) {
        return (chatHistories[personalityId] || []).map(item => ({
            role: item.role,
            message: item.message
        }));
    }

    function getIntensity() {
        const intensitySelect = document.getElementById('aiIntensitySelect');
        return intensitySelect?.value || localStorage.getItem('ai_intensity') || 'normal';
    }

    function setRequestPending(isPending) {
        requestPending = isPending;
        document.querySelectorAll('.quick-help-btn').forEach(button => {
            button.disabled = isPending;
        });

        ['sendBtn', 'sendCodeToMentorBtn', 'micBtn'].forEach(id => {
            const button = document.getElementById(id);
            if (button) button.disabled = isPending;
        });

        const messageInput = document.getElementById('messageInput');
        if (messageInput) messageInput.disabled = isPending;
    }

    function appendTypingIndicator() {
        const typingEl = document.createElement('div');
        typingEl.className = 'message-row model typing';
        typingEl.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="bubble"><em>Gemini está pensando...</em></div>
        `;
        chatMessages?.appendChild(typingEl);
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingEl;
    }

    function ensureHistory(personalityId, chatHistories) {
        if (!chatHistories[personalityId]) {
            chatHistories[personalityId] = [];
        }
        return chatHistories[personalityId];
    }

    function saveUserMessage(personalityId, displayMessage, chatHistories) {
        ensureHistory(personalityId, chatHistories).push({
            role: 'user',
            message: displayMessage
        });
    }

    function saveModelResponse(personalityId, response, chatHistories) {
        ensureHistory(personalityId, chatHistories).push({
            role: 'model',
            message: response
        });
    }

    async function sendRequest({ endpoint, payload, displayMessage, activePersonality, chatHistories }) {
        if (requestPending || !activePersonality || !displayMessage.trim()) return false;

        const personalityId = activePersonality.id;
        saveUserMessage(personalityId, displayMessage, chatHistories);
        appendUserMessage(displayMessage);
        const typingEl = appendTypingIndicator();
        setRequestPending(true);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);
            typingEl.remove();

            if (!response.ok || !data?.success) {
                const errorMessage = data?.errorMessage || `Error HTTP ${response.status}`;
                if (renderedPersonalityId === personalityId) appendErrorMessage(errorMessage);
                return false;
            }

            saveModelResponse(personalityId, data.response, chatHistories);
            if (renderedPersonalityId === personalityId) appendModelMessage(data.response);
            return true;
        } catch (error) {
            typingEl.remove();
            if (renderedPersonalityId === personalityId) {
                appendErrorMessage('Error de red al enviar mensaje: ' + error.message);
            }
            return false;
        } finally {
            setRequestPending(false);
        }
    }

    async function sendPrompt(messageText, activePersonality, chatHistories) {
        if (!activePersonality || !messageText.trim()) return false;

        return sendRequest({
            endpoint: '/api/chat/send',
            displayMessage: messageText,
            activePersonality,
            chatHistories,
            payload: {
                personalityId: activePersonality.id,
                message: messageText,
                history: getHistorySnapshot(activePersonality.id, chatHistories),
                intensity: getIntensity(),
                customApiKey: localStorage.getItem('gemini_api_key') || null,
                model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash'
            }
        });
    }

    async function sendQuickHelp(options, activePersonality, chatHistories) {
        if (!activePersonality || !options?.helpType || !options?.displayMessage) return false;

        return sendRequest({
            endpoint: '/api/chat/quick-help',
            displayMessage: options.displayMessage,
            activePersonality,
            chatHistories,
            payload: {
                personalityId: activePersonality.id,
                helpType: options.helpType,
                currentCode: options.helpType === 'Understand' ? null : (options.currentCode || null),
                language: options.language || 'csharp',
                history: getHistorySnapshot(activePersonality.id, chatHistories),
                intensity: getIntensity(),
                customApiKey: localStorage.getItem('gemini_api_key') || null,
                model: localStorage.getItem('gemini_model') || 'gemini-3.5-flash'
            }
        });
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
        sendPrompt,
        sendQuickHelp,
        isRequestPending: () => requestPending
    };
})();
