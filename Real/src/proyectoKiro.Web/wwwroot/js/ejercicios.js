// ejercicios.js — Módulo de gestión y renderizado de la lista de ejercicios y personalidades
window.KiroEjercicios = (function () {
    let list = [];

    async function fetchAll() {
        try {
            const res = await fetch('/api/personalities');
            list = await res.json();
            return list;
        } catch (err) {
            console.error('[Ejercicios] Error al cargar lista:', err);
            return [];
        }
    }

    function renderList(containerId, activeItem, onSelect) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        list.forEach(item => {
            const card = document.createElement('div');
            card.className = `personality-card ${activeItem?.id === item.id ? 'active' : ''}`;
            card.innerHTML = `
                <div class="p-icon">${item.emoji || '🧩'}</div>
                <div class="p-details">
                    <div class="p-header">
                        <span class="p-name">${escapeHtml(item.name || '')}</span>
                        ${item.isCustom ? '<span class="p-badge">Custom</span>' : ''}
                    </div>
                    <div class="p-desc">${escapeHtml(item.description || '')}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                window.activePersonalityId = item.id;
                if (onSelect) onSelect(item);
            });

            container.appendChild(card);
        });
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
        fetchAll,
        renderList,
        getList: () => list
    };
})();
