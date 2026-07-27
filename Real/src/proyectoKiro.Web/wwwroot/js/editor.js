// editor.js — Módulo de gestión de Monaco Editor, soporte Multi-lenguaje (C#, Java, TypeScript) y persistencia
window.KiroEditor = (function () {
    const storageKeyPrefix = 'kiro_code_';
    let monacoInstance = null;
    let activeExerciseId = null;
    let currentLanguage = localStorage.getItem('kiro_editor_language') || 'csharp';

    const languageMap = {
        'csharp': { monaco: 'csharp', judge0Id: 51, name: 'C#' },
        'java': { monaco: 'java', judge0Id: 62, name: 'Java' },
        'typescript': { monaco: 'typescript', judge0Id: 74, name: 'TypeScript' }
    };

    function getStorageKey(exerciseId, lang = currentLanguage) {
        return `${storageKeyPrefix}${exerciseId}_${lang}`;
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
        const monacoLang = languageMap[currentLanguage]?.monaco || 'csharp';

        monacoInstance = monaco.editor.create(container, {
            value: initialCode || '// Escribe tu código aquí...\n',
            language: monacoLang,
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

    function setLanguage(lang) {
        if (!languageMap[lang]) lang = 'csharp';
        currentLanguage = lang;

        if (monacoInstance && typeof monaco !== 'undefined') {
            const model = monacoInstance.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, languageMap[lang].monaco);
            }
        }
        localStorage.setItem('kiro_editor_language', lang);
    }

    function getCurrentLanguage() {
        return currentLanguage;
    }

    function getJudge0LanguageId() {
        return languageMap[currentLanguage]?.judge0Id || 51;
    }

    function saveCurrentCode() {
        if (!monacoInstance || activeExerciseId === null) return;

        localStorage.setItem(
            getStorageKey(activeExerciseId, currentLanguage),
            monacoInstance.getValue()
        );
    }

    function loadSavedOrStarterCode(exerciseId, starterCode = '', exerciseObj = null) {
        activeExerciseId = String(exerciseId);
        const savedCode = localStorage.getItem(getStorageKey(activeExerciseId, currentLanguage));

        if (savedCode !== null) {
            setValue(savedCode);
        } else {
            const defaultCode = getStarterCodeForLanguage(exerciseObj, starterCode, currentLanguage);
            setValue(defaultCode);
        }
    }

    function getStarterCodeForLanguage(exerciseObj, defaultCode, lang) {
        if (exerciseObj && exerciseObj.starterCodes && exerciseObj.starterCodes[lang]) {
            return exerciseObj.starterCodes[lang];
        }

        if (lang === 'csharp') return defaultCode || exerciseObj?.starterCode || '// Tu solución en C#...\n';

        if (lang === 'java') {
            return `// Solución en Java\nclass Program\n{\n    public static void main(String[] args)\n    {\n        System.out.println("Solución en Java");\n    }\n}\n`;
        }

        if (lang === 'typescript') {
            return `// Solución en TypeScript\n\nfunction solucionar(): void {\n    console.log("Solución en TypeScript");\n}\n\nsolucionar();\n`;
        }

        return defaultCode || '// Escribe tu solución aquí...\n';
    }

    return {
        init,
        getValue,
        setValue,
        setFontSize,
        setLanguage,
        getCurrentLanguage,
        getJudge0LanguageId,
        saveCurrentCode,
        loadSavedOrStarterCode,
        getStarterCodeForLanguage,
        getActiveExerciseId: () => activeExerciseId,
        getInstance: () => monacoInstance
    };
})();
