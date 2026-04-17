/**
 * main.js — Einstiegspunkt.
 * Wird zuletzt geladen. Kümmert sich um den Start-Screen und
 * das Hochfahren des Spiels.
 */

(function() {
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const startForm = document.getElementById('start-form');
    const speciesInput = document.getElementById('species-input');

    startForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const speciesName = speciesInput.value.trim();
        if (!speciesName) return;

        startScreen.classList.remove('active');
        gameScreen.classList.add('active');

        const game = new Evo.Game(speciesName);
        game.start();

        // Für Debugging in der Konsole greifbar
        window.__game = game;
    });

    window.addEventListener('load', () => {
        speciesInput.focus();
    });
})();
