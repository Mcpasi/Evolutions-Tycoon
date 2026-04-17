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
    constructor(speciesName) {
        this.organism = new Evo.Organism(speciesName);
        this.environment = new Evo.Environment();
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

        this.ui.log(
            `${this.organism.speciesName} erwacht in der Ursuppe.`,
            'mutation',
            1
        );

        this.renderer.animate(this.organism);

        this.running = true;
        this._tickLoop();
    }

    stop() {
        this.running = false;
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

        // 5. Kritischer Stress? (reine Warnung, noch keine Todes-Logik)
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
    }
};
