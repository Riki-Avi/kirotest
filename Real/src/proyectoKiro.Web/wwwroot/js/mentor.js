// mentor.js — Módulo de gestión del Chat con el Tutor IA Gemini y Voz
window.KiroMentor = (function () {

    function appendUserMessage(containerId, text) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'message-row user';
        row.innerHTML = `
            <div class="avatar">👤</div>
            <div class="bubble">${escapeHtml(text)}</div>
        `;
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;
    }

    function appendModelMessage(containerId, text) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const row = document.createElement('div');
        row.className = 'message-row model';
        row.innerHTML = `
            <div class="avatar">🤖</div>
            <div class="bubble markdown-body">${typeof marked !== 'undefined' ? marked.parse(text) : escapeHtml(text)}</div>
        `;
        container.appendChild(row);
        container.scrollTop = container.scrollHeight;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    return {
        appendUserMessage,
        appendModelMessage
    };
})();
