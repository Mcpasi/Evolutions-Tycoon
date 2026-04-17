/**
 * mutations.js — Die Maschinerie des Wandels.
 *
 * Mutationen sind zufällig, aber nicht uniform. Das Prinzip:
 * je stärker ein bestimmter Umwelt-Parameter den Organismus
 * stresst, desto wahrscheinlicher ist eine Mutation, die sich
 * mit diesem Parameter befasst. Das ist keine lamarckistische
 * Absicht — nur statistische Gewichtung. Eine gestresste
 * Zelle repliziert DNA fehlerhafter, und die Selektion
 * filtert: wer nicht passt, dessen Mutation bleibt nicht.
 *
 * (Hier simulieren wir den sichtbaren Output dieses Prozesses.)
 */

Evo.Mutations = (function() {

    /**
     * Pool aller möglichen Mutationen. Jede hat:
     * - param: mit welchem Umweltparameter sie zu tun hat (oder 'any')
     * - apply: funktion, die das Genom verändert und eine Beschreibung zurückgibt
     */
    const POOL = [
        // Temperatur-Mutationen
        {
            param: 'temperature',
            apply: (g) => {
                g.tempTolerance[1] += Evo.util.rand(2, 8);
                return 'Hitzeschock-Proteine verbessert';
            }
        },
        {
            param: 'temperature',
            apply: (g) => {
                g.tempTolerance[0] -= Evo.util.rand(2, 8);
                return 'Kälteresistente Lipidmembran entwickelt';
            }
        },

        // Strahlungs-Mutationen
        {
            param: 'radiation',
            apply: (g) => {
                g.radTolerance[1] += Evo.util.rand(3, 10);
                return 'DNA-Reparaturmechanismus verbessert';
            }
        },
        {
            param: 'radiation',
            apply: (g) => {
                g.color = { r: 60, g: 60, b: 70 };
                return 'Pigmentierung zum Strahlungsschutz';
            }
        },

        // pH-Mutationen
        {
            param: 'acidity',
            apply: (g) => {
                g.pHTolerance[0] -= Evo.util.rand(0.3, 1);
                return 'Säure-Pumpen in Membran integriert';
            }
        },
        {
            param: 'acidity',
            apply: (g) => {
                g.pHTolerance[1] += Evo.util.rand(0.3, 1);
                return 'Alkali-Toleranz erweitert';
            }
        },

        // Nährstoff-Mutationen
        {
            param: 'nutrients',
            apply: (g) => {
                g.nutrientMin = Math.max(0, g.nutrientMin - Evo.util.rand(3, 8));
                return 'Metabolismus effizienter geworden';
            }
        },
        {
            param: 'nutrients',
            apply: (g) => {
                if (g.metabolism === 'heterotroph') {
                    g.metabolism = 'chemotroph';
                    return 'Chemosynthese entwickelt';
                } else if (g.metabolism === 'chemotroph') {
                    g.metabolism = 'phototroph';
                    g.color = { r: 80, g: 200, b: 120 };
                    return 'Photosynthese entwickelt — grüne Pigmente';
                }
                return null;
            }
        },

        // Sauerstoff-Mutationen
        {
            param: 'oxygen',
            apply: (g) => {
                if (g.oxygenUse === 'anaerobic') {
                    g.oxygenUse = 'facultative';
                    return 'Fakultativer Sauerstoff-Stoffwechsel';
                } else if (g.oxygenUse === 'facultative') {
                    g.oxygenUse = 'aerobic';
                    return 'Aerobe Atmung etabliert';
                }
                return null;
            }
        },
        {
            param: 'oxygen',
            apply: (g) => {
                g.oxygenMin = Math.max(0, g.oxygenMin - Evo.util.rand(1, 4));
                return 'Sauerstoff-Nutzung optimiert';
            }
        },

        // Allgemeine strukturelle Mutationen
        {
            param: 'any',
            apply: (g) => {
                g.size *= Evo.util.rand(1.05, 1.2);
                return 'Zellgröße nimmt zu';
            }
        },
        {
            param: 'any',
            apply: (g) => {
                g.membraneStrength = Math.min(1, g.membraneStrength + Evo.util.rand(0.05, 0.15));
                return 'Zellmembran verstärkt';
            }
        },
        {
            param: 'any',
            apply: (g) => {
                if (g.flagella < 4) {
                    g.flagella += 1;
                    return 'Neue Geißel entwickelt';
                }
                return null;
            }
        },
        {
            param: 'any',
            apply: (g) => {
                if (!g.cilia && g.flagella === 0) {
                    g.cilia = true;
                    return 'Wimpern (Zilien) entstehen';
                }
                return null;
            }
        },
        {
            param: 'any',
            apply: (g) => {
                if (!g.nucleus && g.size > 1.5) {
                    g.nucleus = true;
                    return 'Echter Zellkern — Übergang zur Eukaryotie';
                }
                return null;
            }
        },
        {
            param: 'any',
            apply: (g) => {
                if (!g.cellWall) {
                    g.cellWall = true;
                    return 'Zellwand ausgebildet';
                }
                return null;
            }
        },
        {
            param: 'any',
            apply: (g) => {
                // Farbdrift
                g.color.r = Evo.util.clamp(g.color.r + Evo.util.rand(-20, 20), 40, 240);
                g.color.g = Evo.util.clamp(g.color.g + Evo.util.rand(-20, 20), 40, 240);
                g.color.b = Evo.util.clamp(g.color.b + Evo.util.rand(-20, 20), 40, 240);
                return 'Pigmentierung verändert';
            }
        }
    ];

    /**
     * Berechnet die Mutations-Wahrscheinlichkeit für diesen Tick.
     * Basislast + Stress-Anteil. Je mehr Stress, desto mehr Mutation.
     */
    function mutationChance(stressObj) {
        const stressValues = Object.values(stressObj);
        const maxStress = Math.max(...stressValues);
        // Basisrate ~2%, kann bis ~30% bei voller Belastung steigen
        return 0.02 + maxStress * 0.28;
    }

    /**
     * Wählt eine Mutation und wendet sie an.
     * Gewichtet nach Stress: die Parameter mit dem höchsten Stress
     * bekommen die höchste Chance.
     */
    function applyMutation(organism, stressObj) {
        // Höchsten Stress-Parameter finden (kann auch "any" sein)
        let topParam = null;
        let topStress = 0;
        for (const key in stressObj) {
            if (stressObj[key] > topStress) {
                topStress = stressObj[key];
                topParam = key;
            }
        }

        // Kandidaten: Mutationen, die zum Top-Stress passen, oder allgemeine
        let candidates;
        if (topStress > 0.1 && topParam && Evo.util.chance(0.7)) {
            candidates = POOL.filter(m => m.param === topParam);
        } else {
            candidates = POOL.filter(m => m.param === 'any');
        }

        if (candidates.length === 0) candidates = POOL;

        // Wir versuchen mehrfach, falls die gewählte Mutation null zurückgibt
        for (let i = 0; i < 5; i++) {
            const mutation = Evo.util.pick(candidates);
            const description = mutation.apply(organism.genome);
            if (description) {
                organism.recordMutation(description);
                return description;
            }
        }
        return null;
    }

    return { mutationChance, applyMutation };
})();
