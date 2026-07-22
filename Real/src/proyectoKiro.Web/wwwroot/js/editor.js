// editor.js — Módulo de gestión de Monaco Editor y persistencia de código
window.KiroEditor = (function () {
    let monacoInstance = null;

    function init(containerId, initialCode = '') {
        const container = document.getElementById(containerId);
        if (!container || typeof monaco === 'undefined') return;

        monacoInstance = monaco.editor.create(container, {
            value: initialCode || '// Escribe tu código C# aquí...\n',
            language: 'csharp',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: false },
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            smoothScrolling: true
        });

        // Persistir automáticamente en LocalStorage por ejercicio
        monacoInstance.onDidChangeModelContent(() => {
            const activeId = window.activePersonalityId;
            if (activeId) {
                localStorage.setItem(`kiro_code_${activeId}`, monacoInstance.getValue());
            }
        });
    }

    function getValue() {
        return monacoInstance ? monacoInstance.getValue() : '';
    }

    function setValue(code) {
        if (monacoInstance) {
            monacoInstance.setValue(code);
        }
    }

    function loadSavedOrStarterCode(exerciseId, starterCode) {
        const saved = localStorage.getItem(`kiro_code_${exerciseId}`);
        setValue(saved !== null ? saved : starterCode);
    }

    return {
        init,
        getValue,
        setValue,
        loadSavedOrStarterCode,
        getInstance: () => monacoInstance
    };
})();
