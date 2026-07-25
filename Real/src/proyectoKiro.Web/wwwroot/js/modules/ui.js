// ui.js — Módulo de interfaz gráfica (Sidebar, Paneles redimensionables, Colapso, Pestañas y Tamaño de Fuente)
window.KiroUI = (function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const tabConsoleBtn = document.getElementById('tabConsoleBtn');
    const tabTestsBtn = document.getElementById('tabTestsBtn');
    const terminalOutput = document.getElementById('terminalOutput');
    const testResultsContainer = document.getElementById('testResultsContainer');

    const exercisePanel = document.getElementById('exercisePanel');
    const chatPanel = document.getElementById('chatPanel');
    const exercisePanelCollapsedTab = document.getElementById('exercisePanelCollapsedTab');
    const chatPanelCollapsedTab = document.getElementById('chatPanelCollapsedTab');

    let isInitialized = false;

    function setSidebarOpen(isOpen, restoreFocus = false) {
        if (!sidebar) return;
        sidebar.classList.toggle('open', isOpen);
        sidebar.setAttribute('aria-hidden', String(!isOpen));
        sidebarBackdrop?.classList.toggle('active', isOpen);
        openSidebarBtn?.setAttribute('aria-expanded', String(isOpen));

        if (isOpen) {
            window.setTimeout(() => closeSidebarBtn?.focus(), 50);
        } else if (restoreFocus) {
            openSidebarBtn?.focus();
        }
    }

    function openSidebar() { setSidebarOpen(true); }
    function closeSidebar(restoreFocus = true) { setSidebarOpen(false, restoreFocus); }

    function switchTerminalTab(tab) {
        if (!tabConsoleBtn || !tabTestsBtn || !terminalOutput || !testResultsContainer) return;
        if (tab === 'console') {
            tabConsoleBtn.classList.add('active');
            tabTestsBtn.classList.remove('active');
            terminalOutput.classList.remove('hidden');
            testResultsContainer.classList.add('hidden');
        } else {
            tabConsoleBtn.classList.remove('active');
            tabTestsBtn.classList.add('active');
            terminalOutput.classList.add('hidden');
            testResultsContainer.classList.remove('hidden');
        }
    }

    function showToast(message) {
        let toast = document.getElementById('kiroToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'kiroToast';
            toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#6366F1; color:#fff; padding:12px 20px; border-radius:8px; z-index:9999; font-weight:600; box-shadow:0 4px 15px rgba(0,0,0,0.3); transition:opacity 0.3s ease; opacity:0; pointer-events:none;';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    function initUI() {
        if (isInitialized) return;
        isInitialized = true;

        // 1. Listeners para el Hamburguer y Sidebar Drawer
        openSidebarBtn?.addEventListener('click', openSidebar);
        closeSidebarBtn?.addEventListener('click', () => closeSidebar());
        sidebarBackdrop?.addEventListener('click', () => closeSidebar());

        // 2. Tabs Colapsados
        exercisePanelCollapsedTab?.addEventListener('click', () => {
            const ep = document.getElementById('exercisePanel');
            if (ep) {
                ep.classList.toggle('is-collapsed');
                refreshMonacoLayout();
            }
        });

        chatPanelCollapsedTab?.addEventListener('click', () => {
            const cp = document.getElementById('chatPanel');
            if (cp) {
                cp.classList.toggle('is-collapsed');
                refreshMonacoLayout();
            }
        });

        // 3. Resizers de Paneles (Horizontal Izquierdo, Horizontal Derecho y Vertical)
        initResizers();

        // 4. Controles de Tamaño de Fuente (Font Size)
        initFontSizeControls();
    }

    function initFontSizeControls() {
        const exerciseContent = document.getElementById('exerciseContent');
        const chatMessages = document.getElementById('chatMessages');

        const decExBtn = document.getElementById('decreaseExerciseFontBtn');
        const incExBtn = document.getElementById('increaseExerciseFontBtn');
        const decEditorBtn = document.getElementById('decreaseEditorFontBtn');
        const incEditorBtn = document.getElementById('increaseEditorFontBtn');
        const decChatBtn = document.getElementById('decreaseChatFontBtn');
        const incChatBtn = document.getElementById('increaseChatFontBtn');

        let exFontSize = parseInt(localStorage.getItem('kiro_exercise_font_size') || '13', 10);
        let editorFontSize = parseInt(localStorage.getItem('kiro_editor_font_size') || '14', 10);
        let chatFontSize = parseInt(localStorage.getItem('kiro_chat_font_size') || '13', 10);

        function applyExerciseFontSize(size) {
            exFontSize = Math.max(11, Math.min(24, size));
            if (exerciseContent) exerciseContent.style.fontSize = `${exFontSize}px`;
            localStorage.setItem('kiro_exercise_font_size', String(exFontSize));
        }

        function applyEditorFontSize(size) {
            editorFontSize = Math.max(10, Math.min(30, size));
            window.KiroEditor?.setFontSize(editorFontSize);
        }

        function applyChatFontSize(size) {
            chatFontSize = Math.max(11, Math.min(24, size));
            if (chatMessages) chatMessages.style.fontSize = `${chatFontSize}px`;
            localStorage.setItem('kiro_chat_font_size', String(chatFontSize));
        }

        // Aplicar valores persistentes guardados
        applyExerciseFontSize(exFontSize);
        applyEditorFontSize(editorFontSize);
        applyChatFontSize(chatFontSize);

        decExBtn?.addEventListener('click', () => applyExerciseFontSize(exFontSize - 1));
        incExBtn?.addEventListener('click', () => applyExerciseFontSize(exFontSize + 1));
        decEditorBtn?.addEventListener('click', () => applyEditorFontSize(editorFontSize - 1));
        incEditorBtn?.addEventListener('click', () => applyEditorFontSize(editorFontSize + 1));
        decChatBtn?.addEventListener('click', () => applyChatFontSize(chatFontSize - 1));
        incChatBtn?.addEventListener('click', () => applyChatFontSize(chatFontSize + 1));
    }

    function refreshMonacoLayout() {
        if (window.KiroEditor?.getInstance()) {
            window.KiroEditor.getInstance().layout();
        }
    }

    function initResizers() {
        const splitView = document.querySelector('.split-view');
        const ep = document.getElementById('exercisePanel');
        const cp = document.getElementById('chatPanel');
        const editorPanel = document.querySelector('.editor-panel');
        const terminalPanel = document.querySelector('.terminal-panel');

        const leftDivider = document.getElementById('leftDivider');
        const rightDivider = document.getElementById('rightDivider');
        const editorTerminalDivider = document.getElementById('editorTerminalDivider');

        if (!splitView) return;

        function bindDrag(handle, onMove, panelToDisableTransition) {
            if (!handle) return;
            let activePointerId = null;

            const move = (event) => {
                if (event.pointerId !== activePointerId) return;
                onMove(event);
            };

            const finish = (event) => {
                if (event.pointerId !== activePointerId) return;
                activePointerId = null;
                handle.releasePointerCapture(event.pointerId);
                handle.classList.remove('dragging');
                if (panelToDisableTransition) panelToDisableTransition.style.transition = '';

                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', finish);
                handle.removeEventListener('pointercancel', finish);

                refreshMonacoLayout();
            };

            handle.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;
                activePointerId = event.pointerId;
                handle.setPointerCapture(event.pointerId);
                handle.classList.add('dragging');
                if (panelToDisableTransition) panelToDisableTransition.style.transition = 'none';

                document.body.style.cursor = (handle === leftDivider || handle === rightDivider) ? 'col-resize' : 'row-resize';
                document.body.style.userSelect = 'none';
                handle.addEventListener('pointermove', move);
                handle.addEventListener('pointerup', finish);
                handle.addEventListener('pointercancel', finish);
                event.preventDefault();
            });
        }

        // Resizer 1: Left Divider (Exercise Panel <-> Editor Panel)
        bindDrag(leftDivider, (event) => {
            if (!ep) return;
            const rect = splitView.getBoundingClientRect();
            const offset = event.clientX - rect.left;
            const collapseThreshold = 140;

            if (offset < collapseThreshold) {
                ep.classList.add('is-collapsed');
            } else {
                ep.classList.remove('is-collapsed');
                const clamped = Math.max(180, Math.min(500, offset));
                ep.style.flex = `0 0 ${clamped}px`;
            }
        }, ep);

        // Resizer 2: Right Divider (Editor Panel <-> Chat Panel)
        bindDrag(rightDivider, (event) => {
            if (!cp) return;
            const rect = splitView.getBoundingClientRect();
            const offset = rect.right - event.clientX;
            const collapseThreshold = 140;

            if (offset < collapseThreshold) {
                cp.classList.add('is-collapsed');
            } else {
                cp.classList.remove('is-collapsed');
                const clamped = Math.max(200, Math.min(550, offset));
                cp.style.flex = `0 0 ${clamped}px`;
            }
        }, cp);

        // Resizer 3: Vertical Divider (Monaco Editor <-> Terminal Panel)
        bindDrag(editorTerminalDivider, (event) => {
            if (!editorPanel || !terminalPanel) return;
            const rect = editorPanel.getBoundingClientRect();
            const offset = rect.bottom - event.clientY;
            const minHeight = 80;
            const maxHeight = rect.height - 100;
            const clamped = Math.max(minHeight, Math.min(maxHeight, offset));

            terminalPanel.style.flex = `0 0 ${clamped}px`;
            terminalPanel.style.height = `${clamped}px`;
        }, null);

        window.addEventListener('resize', refreshMonacoLayout);
    }

    return {
        openSidebar,
        closeSidebar,
        switchTerminalTab,
        showToast,
        initUI,
        initResizers
    };
})();
