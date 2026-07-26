// judge0.js — Módulo de compilación con Judge0 y ejecución de la Suite de Tests
window.KiroJudge0 = (function () {
    const terminalOutput = document.getElementById('terminalOutput');
    const judge0StatusBadge = document.getElementById('judge0StatusBadge');
    const testResultsContainer = document.getElementById('testResultsContainer');
    const testSummaryBadge = document.getElementById('testSummaryBadge');

    async function compileCode(sourceCode) {
        if (!terminalOutput || !judge0StatusBadge) return;

        terminalOutput.textContent = '⏳ Enviando código a Judge0 API para compilación y ejecución...';
        judge0StatusBadge.textContent = 'Ejecutando...';
        judge0StatusBadge.style.color = '#F59E0B';

        try {
            const res = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceCode: sourceCode,
                    languageId: window.KiroEditor?.getJudge0LanguageId() || 51,
                    customJudge0Url: localStorage.getItem('judge0_url') || 'https://ce.judge0.com'
                })
            });

            const data = await res.json();

            if (!data.success) {
                terminalOutput.textContent = `❌ Error: ${data.errorMessage}`;
                judge0StatusBadge.textContent = 'Error HTTP';
                judge0StatusBadge.style.color = '#EF4444';
                return;
            }

            let outputText = '';
            if (data.status) {
                judge0StatusBadge.textContent = `${data.status.description} (${data.time || '0'}s)`;
                judge0StatusBadge.style.color = data.status.id === 3 ? '#10B981' : '#EF4444';
            }

            if (data.compile_output) outputText += `--- ERRORES DE COMPILACIÓN ---\n${data.compile_output}\n\n`;
            if (data.stderr) outputText += `--- ERRORES DE EJECUCIÓN (STDERR) ---\n${data.stderr}\n\n`;
            if (data.stdout) outputText += `--- SALIDA ESTÁNDAR (STDOUT) ---\n${data.stdout}\n`;
            if (!outputText) outputText = `[Ejecución terminada con estado: ${data.status?.description || 'Desconocido'}]`;

            terminalOutput.textContent = outputText;
            window.KiroUI?.switchTerminalTab('console');
        } catch (err) {
            terminalOutput.textContent = `❌ Error de conexión al servicio de compilación: ${err.message}`;
            judge0StatusBadge.textContent = 'Error Conexión';
            judge0StatusBadge.style.color = '#EF4444';
        }
    }

    async function runTestSuite(sourceCode, activePersonality, onTestComplete) {
        if (!activePersonality || !testResultsContainer || !judge0StatusBadge) return;

        judge0StatusBadge.textContent = 'Ejecutando Tests...';
        judge0StatusBadge.style.color = '#8B5CF6';

        window.KiroUI?.switchTerminalTab('tests');
        testResultsContainer.innerHTML = '<p class="test-placeholder">⏳ Ejecutando casos de prueba en Judge0...</p>';

        try {
            const res = await fetch('/api/compile/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalityId: activePersonality.id,
                    sourceCode: sourceCode,
                    languageId: window.KiroEditor?.getJudge0LanguageId() || 51,
                    customJudge0Url: localStorage.getItem('judge0_url') || 'https://ce.judge0.com'
                })
            });

            const data = await res.json();

            if (!data.success) {
                testResultsContainer.innerHTML = `
                    <div class="test-card failed">
                        <strong style="color: var(--accent-danger);">Error al ejecutar los tests</strong>
                        <p class="test-details" style="white-space: pre-wrap;">${escapeHtml(data.compileOutput || data.errorMessage || 'Error desconocido')}</p>
                    </div>
                `;
                judge0StatusBadge.textContent = 'Falló Compilación';
                judge0StatusBadge.style.color = '#EF4444';
                if (onTestComplete) onTestComplete(false);
                return;
            }

            if (testSummaryBadge) testSummaryBadge.textContent = `${data.passedCount}/${data.totalTests}`;
            judge0StatusBadge.textContent = data.isAllPassed ? '🎉 100% Tests Pasados' : `⚠️ ${data.passedCount}/${data.totalTests} Pasados`;
            judge0StatusBadge.style.color = data.isAllPassed ? '#10B981' : '#F59E0B';

            let html = `
                <div style="margin-bottom: 10px; font-size: 13px; font-weight: 600; color: ${data.isAllPassed ? '#10B981' : '#F59E0B'};">
                    ${data.isAllPassed ? '🎉 ¡Felicidades! Todos los casos de prueba han pasado.' : `Resultado: ${data.passedCount} de ${data.totalTests} tests aprobados.`}
                </div>
            `;

            data.results.forEach(test => {
                html += `
                    <div class="test-card ${test.passed ? 'passed' : 'failed'}">
                        <div class="test-card-header">
                            <span class="test-title">Test ${test.id}: ${escapeHtml(test.description)}</span>
                            <span class="test-badge ${test.passed ? 'pass' : 'fail'}">${test.passed ? 'PASÓ' : 'FALLÓ'}</span>
                        </div>
                        <div class="test-details">
                            <div>Llamada: <code>${escapeHtml(test.methodCall)}</code></div>
                            <div>Esperado: <strong style="color: #10B981;">'${escapeHtml(test.expectedOutput)}'</strong> | Obtenido: <strong style="color: ${test.passed ? '#10B981' : '#EF4444'};">'${escapeHtml(test.actualOutput)}'</strong></div>
                        </div>
                    </div>
                `;
            });

            testResultsContainer.innerHTML = html;
            if (onTestComplete) onTestComplete(data.isAllPassed);
        } catch (err) {
            testResultsContainer.innerHTML = `<p class="test-placeholder" style="color: var(--accent-danger);">❌ Error al conectar con el backend: ${err.message}</p>`;
            judge0StatusBadge.textContent = 'Error Conexión';
            judge0StatusBadge.style.color = '#EF4444';
            if (onTestComplete) onTestComplete(false);
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
        compileCode,
        runTestSuite
    };
})();
