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

        // Lebensstatus. Wird false, wenn die Spezies ausstirbt.
        this.alive = true;
        this.causeOfDeath = null;

        // Zählt aufeinanderfolgende Ticks mit lebensbedrohlichem Stress.
        // Erholung (niedriger Stress) baut den Wert wieder ab.
        this.criticalStressTicks = 0;

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
        const total = this.totalStress(stressObj);
        this.cumulativeStress += total;

        // Tödliche Bedingungen: akkumulieren bei hohem Stress, erholen bei niedrigem.
        const maxStress = Math.max(...Object.values(stressObj));
        if (maxStress >= 0.95 || total >= 0.75) {
            this.criticalStressTicks += (maxStress >= 0.99 ? 2 : 1);
        } else if (total < 0.25) {
            this.criticalStressTicks = Math.max(0, this.criticalStressTicks - 1);
        }
    }

    /**
     * Prüft, ob der Organismus an den aktuellen Umweltbedingungen stirbt.
     * Rückgabe: eine Todesursachen-Nachricht, oder null wenn (noch) am Leben.
     */
    checkExtinction(stressObj) {
        const maxStress = Math.max(...Object.values(stressObj));
        const total = this.totalStress(stressObj);

        // Schwelle: 8 kritische Ticks reichen, bei extrem hohem Stress schneller.
        const threshold = maxStress >= 0.99 ? 4 : 8;
        if (this.criticalStressTicks < threshold) return null;

        // Todesursache = Parameter mit dem größten Leid
        let worstKey = null;
        let worstValue = 0;
        for (const k in stressObj) {
            if (stressObj[k] > worstValue) {
                worstValue = stressObj[k];
                worstKey = k;
            }
        }

        const causes = {
            temperature: 'Die Zelle erliegt den Temperaturen.',
            radiation:   'Die Strahlung zerreißt die DNA.',
            acidity:     'Der pH-Wert zersetzt die Membran.',
            nutrients:   'Die Zelle verhungert.',
            oxygen:      'Die Zelle erstickt.'
        };
        return causes[worstKey] || 'Die Zelle erliegt der Umwelt.';
    }

    die(cause) {
        this.alive = false;
        this.causeOfDeath = cause;
    }

    recordMutation(description) {
        this.mutationHistory.push({
            generation: this.generation,
            description
        });
        this.generation += 1;
    }

    /** Stellt einen Organismus aus gespeicherten Daten wieder her. */
    static fromSave(data) {
        const o = new Evo.Organism(data.speciesName);
        o.generation = data.generation;
        o.age = data.age;
        o.cumulativeStress = data.cumulativeStress || 0;
        o.criticalStressTicks = data.criticalStressTicks || 0;
        if (data.genome) o.genome = data.genome;
        o.mutationHistory = data.mutationHistory || [];
        return o;
    }
};
