// tests.js — Módulo de compilación Judge0 y suite de pruebas automatizadas
window.KiroTests = (function () {

    function renderTestResults(resultsContainerId, testResults) {
        const container = document.getElementById(resultsContainerId);
        if (!container) return;

        container.innerHTML = '';
        if (!testResults || testResults.length === 0) {
            container.innerHTML = '<p class="test-placeholder">No hay casos de prueba registrados para este ejercicio.</p>';
            return;
        }

        testResults.forEach((test, idx) => {
            const card = document.createElement('div');
            card.className = `test-card ${test.passed ? 'passed' : 'failed'}`;
            card.innerHTML = `
                <div class="test-card-header">
                    <span>${test.passed ? '✅' : '❌'} Caso ${idx + 1}: ${escapeHtml(test.description || '')}</span>
                    <span class="test-badge ${test.passed ? 'badge-pass' : 'badge-fail'}">${test.passed ? 'PASÓ' : 'FALLÓ'}</span>
                </div>
                <div class="test-card-body">
                    <p><strong>Llamada:</strong> <code>${escapeHtml(test.methodCall || '')}</code></p>
                    <p><strong>Esperado:</strong> <code>${escapeHtml(test.expectedOutput || '')}</code></p>
                    <p><strong>Obtenido:</strong> <code>${escapeHtml(test.actualOutput || '')}</code></p>
                </div>
            `;
            container.appendChild(card);
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
        renderTestResults
    };
})();
