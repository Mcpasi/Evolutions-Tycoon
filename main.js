/**
 * main.js — Einstiegspunkt.
 * Wird zuletzt geladen. Kümmert sich um den Start-Screen und
 * das Hochfahren des Spiels. Prüft außerdem, ob ein
 * gespeicherter Fortschritt existiert, und bietet ihn an.
 */

(function() {
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startForm = document.getElementById('start-form');
    const speciesInput = document.getElementById('species-input');
    const continueBox = document.getElementById('continue-box');
    const continueButton = document.getElementById('continue-button');
    const continueSpecies = document.getElementById('continue-species');
    const continueInfo = document.getElementById('continue-info');
    const discardButton = document.getElementById('discard-save');

    const extinctionOverlay = document.getElementById('extinction-overlay');
    const restartButton = document.getElementById('restart-button');

    function startGame(speciesName, savedState) {
        startScreen.classList.remove('active');
        gameScreen.classList.add('active');
        extinctionOverlay.classList.remove('active');

        const game = new Evo.Game(speciesName, savedState);
        game.start();

        // Für Debugging in der Konsole greifbar
        window.__game = game;
    }

    function showSaveOption() {
        const saved = Evo.Save.load();
        if (!saved) {
            continueBox.classList.remove('visible');
            return;
        }
        continueSpecies.textContent = saved.organism.speciesName;
        continueInfo.textContent =
            `Gen. ${saved.organism.generation} · Alter ${saved.organism.age}`;
        continueBox.classList.add('visible');
    }

    startForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const speciesName = speciesInput.value.trim();
        if (!speciesName) return;

        // Neue Spezies überschreibt einen alten Speicherstand.
        Evo.Save.clear();
        startGame(speciesName, null);
    });

    continueButton.addEventListener('click', () => {
        const saved = Evo.Save.load();
        if (!saved) {
            showSaveOption();
            return;
        }
        startGame(saved.organism.speciesName, saved);
    });

    discardButton.addEventListener('click', () => {
        if (!confirm('Gespeicherten Fortschritt wirklich löschen?')) return;
        Evo.Save.clear();
        showSaveOption();
        speciesInput.focus();
    });

    restartButton.addEventListener('click', () => {
        // Nach Aussterben: zurück zum Startscreen.
        Evo.Save.clear();
        if (window.__game) window.__game.stop();
        gameScreen.classList.remove('active');
        extinctionOverlay.classList.remove('active');
        startScreen.classList.add('active');
        speciesInput.value = '';
        showSaveOption();
        speciesInput.focus();
    });

    window.addEventListener('load', () => {
        showSaveOption();
        speciesInput.focus();
    });
})();
