/**
 * game.js — Der Taktgeber.
 *
 * Hält alle Teile zusammen: Environment, Organism, Renderer, UI.
 * Auf jeden Tick:
 *   1. Umwelt driftet weiter.
 *   2. Stress wird für den Organismus berechnet.
 *   3. Mit stressabhängiger Wahrscheinlichkeit mutiert das Genom.
 *   4. Die UI wird aktualisiert.
 *
 * Das Rendering läuft unabhängig per requestAnimationFrame —
 * die Zelle "atmet" also auch zwischen den Ticks.
 */

Evo.Game = class Game {
    constructor(speciesName, savedState) {
        if (savedState) {
            this.organism = Evo.Organism.fromSave(savedState.organism);
            this.environment = Evo.Environment.fromSave(savedState.environment);
            this.resumed = true;
        } else {
            this.organism = new Evo.Organism(speciesName);
            this.environment = new Evo.Environment();
            this.resumed = false;
        }
        this.ui = new Evo.UI();

        const canvas = document.getElementById('organism-canvas');
        this.renderer = new Evo.Renderer(canvas);

        this.tickInterval = 2000; // ms pro Generation
        this.running = false;
    }

    start() {
        this.ui.setSpecies(this.organism.speciesName);
        this.ui.updateGeneration(this.organism.generation);
        this.ui.updateGenome(this.organism.genome);
        this.ui.updateEnvironment(this.environment.state, {});
        this.ui.updateEra(this.organism.age);

        const openingMessage = this.resumed
            ? `${this.organism.speciesName} setzt den Kampf ums Dasein fort.`
            : `${this.organism.speciesName} erwacht in der Ursuppe.`;
        this.ui.log(openingMessage, 'mutation', this.organism.generation);

        this.renderer.animate(this.organism);

        this.running = true;
        this._tickLoop();
    }

    stop() {
        this.running = false;
        this.renderer.stop();
    }

    /** Wird bei Aussterben aufgerufen. Beendet das Spiel dauerhaft. */
    extinguish(cause) {
        if (!this.organism.alive) return;
        this.organism.die(cause);
        this.running = false;

        this.ui.log(
            `AUSSTERBEN: ${cause} (Gen. ${this.organism.generation}, Alter ${this.organism.age})`,
            'critical',
            this.organism.generation
        );
        this.ui.showExtinction(this.organism, cause);

        // Speicherstand entfernen — eine ausgestorbene Spezies lebt nicht weiter.
        Evo.Save.clear();

        // Ein letzter Render, dann stoppen.
        this.renderer.stop();
    }

    _tickLoop() {
        if (!this.running) return;

        this._tick();
        setTimeout(() => this._tickLoop(), this.tickInterval);
    }

    _tick() {
        // 1. Umwelt
        this.environment.tick();

        // 2. Stress berechnen
        const stress = this.environment.stressFor(this.organism);
        this.organism.tick(stress);

        // 3. Event loggen (falls eines aufgetreten ist)
        if (this.environment.lastEvent) {
            this.ui.log(
                this.environment.lastEvent.message,
                'stress',
                this.organism.generation
            );
        }

        // 4. Mutation?
        const chance = Evo.Mutations.mutationChance(stress);
        if (Evo.util.chance(chance)) {
            const description = Evo.Mutations.applyMutation(this.organism, stress);
            if (description) {
                this.ui.log(
                    description,
                    'mutation',
                    this.organism.generation
                );
                this.ui.updateGenome(this.organism.genome);
                this.ui.updateGeneration(this.organism.generation);
            }
        }

        // 5. Kritischer Stress? (Warnung vor dem Aussterben)
        const totalStress = this.organism.totalStress(stress);
        if (totalStress > 0.7 && Evo.util.chance(0.3)) {
            this.ui.log(
                'Die Zelle kämpft gegen die Umwelt.',
                'critical',
                this.organism.generation
            );
        }

        // 6. UI
        this.ui.updateEnvironment(this.environment.state, stress);
        this.ui.updateEra(this.organism.age);

        // 7. Aussterben? Tödliche Bedingungen beenden das Spiel endgültig.
        const cause = this.organism.checkExtinction(stress);
        if (cause) {
            this.extinguish(cause);
            return;
        }

        // 8. Fortschritt sichern
        Evo.Save.save(this);
    }
};
