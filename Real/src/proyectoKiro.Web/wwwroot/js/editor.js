// editor.js — Módulo de gestión de Monaco Editor y persistencia de código
window.KiroEditor = (function () {
    const storageKeyPrefix = 'kiro_code_';
    let monacoInstance = null;
    let activeExerciseId = null;

    function getStorageKey(exerciseId) {
        return `${storageKeyPrefix}${exerciseId}`;
    }

    function init(containerId, initialCode = '') {
        if (monacoInstance) return monacoInstance;

        const container = document.getElementById(containerId);
        if (!container || typeof monaco === 'undefined') return null;

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

        monacoInstance.onDidChangeModelContent(saveCurrentCode);
        window.addEventListener('beforeunload', saveCurrentCode);

        return monacoInstance;
    }

    function getValue() {
        return monacoInstance ? monacoInstance.getValue() : '';
    }

    function setValue(code) {
        if (monacoInstance) {
            monacoInstance.setValue(code || '');
        }
    }

    function saveCurrentCode() {
        if (!monacoInstance || activeExerciseId === null) return;

        localStorage.setItem(
            getStorageKey(activeExerciseId),
            monacoInstance.getValue()
        );
    }

    function loadSavedOrStarterCode(exerciseId, starterCode = '') {
        if (!monacoInstance || exerciseId === null || exerciseId === undefined) return;

        // Guardar el ejercicio anterior antes de cambiar el ID activo.
        saveCurrentCode();

        activeExerciseId = String(exerciseId);
        const savedCode = localStorage.getItem(getStorageKey(activeExerciseId));
        setValue(savedCode !== null ? savedCode : starterCode);
    }

    return {
        init,
        getValue,
        setValue,
        saveCurrentCode,
        loadSavedOrStarterCode,
        getActiveExerciseId: () => activeExerciseId,
        getInstance: () => monacoInstance
    };
})();
