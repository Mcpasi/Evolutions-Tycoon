/**
 * organism.js — Der Organismus selbst.
 *
 * Hält das Genom: einen strukturierten Zustandsvektor,
 * der beschreibt, was die Zelle ist und kann. Jede Eigenschaft
 * kann durch Mutation verändert werden. Der Organismus "weiß"
 * nichts über Umwelt — er existiert nur. Die Environment fragt
 * ihn nach seinen Toleranzen, Mutations-Logik verändert sein Genom.
 */

Evo.Organism = class Organism {
    constructor(speciesName) {
        this.speciesName = speciesName;
        this.generation = 1;
        this.age = 0;        // Anzahl Ticks seit Entstehung
        this.cumulativeStress = 0;

        // Das Genom — der ganze Bauplan in einem Objekt
        this.genome = {
            // Größe & Form
            size: 1.0,                      // Multiplikator, 1.0 = Ausgangsgröße
            shape: 'spherical',             // spherical, elongated, irregular
            color: { r: 120, g: 200, b: 170 },

            // Struktur
            membraneStrength: 0.5,          // 0..1
            nucleus: false,                 // echter Zellkern? (Eukaryotisch)
            cellWall: false,                // feste Zellwand?

            // Energie
            metabolism: 'heterotroph',      // heterotroph, chemotroph, phototroph
            oxygenUse: 'anaerobic',         // aerobic, anaerobic, facultative

            // Umweltanpassungen
            tempTolerance:   [10, 50],
            radTolerance:    [0, 30],
            pHTolerance:     [5.5, 8.5],
            nutrientMin:     20,
            oxygenMin:       5,

            // Fortbewegung
            flagella: 0,                    // Anzahl Geißeln
            cilia: false,                   // Wimpern?

            // Fortpflanzung / Rate
            reproductionRate: 1.0
        };

        // Liste aller Mutationen, die je passiert sind
        this.mutationHistory = [];
    }

    toleranceFor(param) {
        switch (param) {
            case 'temperature': return this.genome.tempTolerance;
            case 'radiation':   return this.genome.radTolerance;
            case 'acidity':     return this.genome.pHTolerance;
            case 'nutrients':   return [this.genome.nutrientMin, 100];
            case 'oxygen':      return [this.genome.oxygenMin, 100];
            default:            return [0, 1];
        }
    }

    /** Gesamt-Stress als Skalar (0..1), gemittelt über alle Parameter. */
    totalStress(stressObj) {
        const values = Object.values(stressObj);
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }

    /** Wird vom Game bei jedem Tick aufgerufen. */
    tick(stressObj) {
        this.age += 1;
        this.cumulativeStress += this.totalStress(stressObj);
    }

    recordMutation(description) {
        this.mutationHistory.push({
            generation: this.generation,
            description
        });
        this.generation += 1;
    }
};
