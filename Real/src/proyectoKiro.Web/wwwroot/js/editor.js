// editor.js — Módulo de gestión de Monaco Editor y persistencia de código
window.KiroEditor = (function () {
    const storageKeyPrefix = 'kiro_code_';
    let monacoInstance = null;
    let activeExerciseId = null;

    function getStorageKey(exerciseId) {
        return `${storageKeyPrefix}${exerciseId}`;
    }

    function init(containerId, initialCode = '', onReady) {
        if (monacoInstance) {
            if (onReady) onReady(monacoInstance);
            return monacoInstance;
        }

        const container = document.getElementById(containerId);
        if (!container) return null;

        if (typeof monaco !== 'undefined') {
            createInstance(container, initialCode, onReady);
        } else if (window.require) {
            window.require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
            window.require(['vs/editor/editor.main'], () => {
                createInstance(container, initialCode, onReady);
            });
        }
        return null;
    }

    function createInstance(container, initialCode, onReady) {
        if (monacoInstance || typeof monaco === 'undefined') return;

        const savedFontSize = parseInt(localStorage.getItem('kiro_editor_font_size') || '14', 10);

        monacoInstance = monaco.editor.create(container, {
            value: initialCode || '// Escribe tu código C# aquí...\n',
            language: 'csharp',
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: savedFontSize,
            minimap: { enabled: false },
            padding: { top: 12, bottom: 12 },
            scrollBeyondLastLine: false,
            smoothScrolling: true
        });

        monacoInstance.onDidChangeModelContent(saveCurrentCode);
        window.addEventListener('beforeunload', saveCurrentCode);

        if (onReady) onReady(monacoInstance);
    }

    function getValue() {
        return monacoInstance ? monacoInstance.getValue() : '';
    }

    function setValue(code) {
        if (monacoInstance) {
            monacoInstance.setValue(code || '');
        }
    }

    function setFontSize(size) {
        const clampedSize = Math.max(10, Math.min(30, size));
        if (monacoInstance) {
            monacoInstance.updateOptions({ fontSize: clampedSize });
        }
        localStorage.setItem('kiro_editor_font_size', String(clampedSize));
        return clampedSize;
    }

    function saveCurrentCode() {
        if (!monacoInstance || activeExerciseId === null) return;

        localStorage.setItem(
            getStorageKey(activeExerciseId),
            monacoInstance.getValue()
        );
    }

    function loadSavedOrStarterCode(exerciseId, starterCode = '') {
        activeExerciseId = String(exerciseId);
        const savedCode = localStorage.getItem(getStorageKey(activeExerciseId));
        setValue(savedCode !== null ? savedCode : starterCode);
    }

    return {
        init,
        getValue,
        setValue,
        setFontSize,
        saveCurrentCode,
        loadSavedOrStarterCode,
        getActiveExerciseId: () => activeExerciseId,
        getInstance: () => monacoInstance
    };
})();
