/**
 * save.js — Persistenz.
 *
 * Legt den vollständigen Spielzustand im localStorage ab, sodass der
 * Fortschritt auch nach dem Schließen des Browsers erhalten bleibt.
 * Das Format ist bewusst versioniert — wenn sich das Schema ändert,
 * werden alte Speicherstände still verworfen statt das Spiel zu
 * verwirren.
 */

Evo.Save = (function() {
    const KEY = 'evolution-tycoon-save';
    const VERSION = 1;

    function _storage() {
        try {
            return window.localStorage;
        } catch (e) {
            return null;
        }
    }

    /** Schreibt den Spielzustand in den localStorage. */
    function save(game) {
        const store = _storage();
        if (!store || !game || !game.organism || !game.organism.alive) return false;

        try {
            const data = {
                version: VERSION,
                timestamp: Date.now(),
                organism: {
                    speciesName: game.organism.speciesName,
                    generation: game.organism.generation,
                    age: game.organism.age,
                    cumulativeStress: game.organism.cumulativeStress,
                    criticalStressTicks: game.organism.criticalStressTicks,
                    genome: game.organism.genome,
                    mutationHistory: game.organism.mutationHistory
                },
                environment: {
                    state: game.environment.state,
                    drift: game.environment.drift
                }
            };
            store.setItem(KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Speichern fehlgeschlagen:', e);
            return false;
        }
    }

    /** Lädt den Spielzustand. Gibt null zurück, wenn keiner existiert. */
    function load() {
        const store = _storage();
        if (!store) return null;

        try {
            const raw = store.getItem(KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || data.version !== VERSION) {
                store.removeItem(KEY);
                return null;
            }
            return data;
        } catch (e) {
            console.warn('Laden fehlgeschlagen:', e);
            return null;
        }
    }

    /** Entfernt einen bestehenden Speicherstand. */
    function clear() {
        const store = _storage();
        if (store) store.removeItem(KEY);
    }

    function hasSave() {
        return load() !== null;
    }

    return { save, load, clear, hasSave };
})();
