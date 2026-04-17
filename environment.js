/**
 * environment.js — Die Welt um den Organismus herum.
 *
 * Jeder Parameter driftet kontinuierlich. Gelegentlich treten
 * Ereignisse auf (Vulkanausbruch, Strahlungssturm, Eiszeit ...),
 * die Parameter stark verschieben. Das erzeugt Stress-Phasen,
 * in denen Mutationen wahrscheinlicher werden.
 *
 * Die Umwelt "will" nichts — sie ist nur ein Zustandsvektor,
 * der über die Zeit driftet. Alles andere ergibt sich aus der
 * Interaktion mit dem Organismus.
 */

Evo.ENV_PARAMS = {
    temperature: { label: 'Temperatur', unit: '°C', min: -20, max: 120, comfort: [20, 45] },
    radiation:   { label: 'Strahlung',  unit: 'Sv',  min: 0,   max: 100, comfort: [0, 25] },
    acidity:     { label: 'pH-Wert',    unit: '',    min: 0,   max: 14,  comfort: [6, 8] },
    nutrients:   { label: 'Nährstoffe', unit: '%',   min: 0,   max: 100, comfort: [30, 100] },
    oxygen:      { label: 'Sauerstoff', unit: '%',   min: 0,   max: 100, comfort: [10, 100] }
};

Evo.ENV_EVENTS = [
    { name: 'Vulkanausbruch',   param: 'temperature', delta: +15, message: 'Die Erde kocht — Temperatur steigt rapide.' },
    { name: 'Eiszeit',          param: 'temperature', delta: -25, message: 'Die Welt gefriert. Eiszeit.' },
    { name: 'Strahlungssturm',  param: 'radiation',   delta: +20, message: 'Ein Strahlungssturm fegt durch die Atmosphäre.' },
    { name: 'Säureregen',       param: 'acidity',     delta: -1.5, message: 'Saurer Regen fällt auf die Welt.' },
    { name: 'Basische Quelle',  param: 'acidity',     delta: +1.2, message: 'Alkalische Quellen sprudeln hervor.' },
    { name: 'Nährstoffblüte',   param: 'nutrients',   delta: +25, message: 'Nährstoffe wuchern — ein Festmahl.' },
    { name: 'Hungersnot',       param: 'nutrients',   delta: -30, message: 'Die Nährstoffe werden knapp.' },
    { name: 'Sauerstoffanstieg',param: 'oxygen',      delta: +15, message: 'Sauerstoff sammelt sich in der Atmosphäre.' },
    { name: 'Anoxisches Ereignis', param: 'oxygen',   delta: -20, message: 'Der Sauerstoff schwindet.' }
];

Evo.Environment = class Environment {
    constructor() {
        // Startwerte: warm, leicht strahlungsaktiv, neutraler pH, viel da zum Fressen
        this.state = {
            temperature: 30,
            radiation: 15,
            acidity: 7,
            nutrients: 70,
            oxygen: 20
        };

        // Driftrichtung pro Parameter (ändert sich langsam)
        this.drift = {
            temperature: 0,
            radiation: 0,
            acidity: 0,
            nutrients: 0,
            oxygen: 0
        };

        this.lastEvent = null;
    }

    /**
     * Ein Tick. Jeder Parameter wird leicht verschoben.
     * Mit kleiner Wahrscheinlichkeit tritt ein Umwelt-Ereignis auf.
     */
    tick() {
        for (const key in this.state) {
            const p = Evo.ENV_PARAMS[key];

            // Drift-Richtung gelegentlich umkehren oder anpassen
            if (Evo.util.chance(0.15)) {
                this.drift[key] = Evo.util.rand(-1, 1) * (p.max - p.min) * 0.01;
            }

            this.state[key] += this.drift[key] + Evo.util.rand(-0.5, 0.5);
            this.state[key] = Evo.util.clamp(this.state[key], p.min, p.max);
        }

        // Ereignis mit 8% Chance pro Tick
        this.lastEvent = null;
        if (Evo.util.chance(0.08)) {
            const event = Evo.util.pick(Evo.ENV_EVENTS);
            const p = Evo.ENV_PARAMS[event.param];
            this.state[event.param] = Evo.util.clamp(
                this.state[event.param] + event.delta,
                p.min,
                p.max
            );
            this.lastEvent = event;
        }
    }

    /**
     * Wie stark leidet ein Organismus unter der aktuellen Umwelt?
     * Rückgabe: Objekt mit Stress-Wert pro Parameter (0 = wohl, 1 = tödlich).
     */
    stressFor(organism) {
        const stress = {};
        for (const key in this.state) {
            stress[key] = this._computeStress(key, organism);
        }
        return stress;
    }

    _computeStress(key, organism) {
        const value = this.state[key];
        const tolerance = organism.toleranceFor(key);
        // tolerance ist [min, max] — außerhalb davon steigt der Stress
        if (value >= tolerance[0] && value <= tolerance[1]) return 0;

        const p = Evo.ENV_PARAMS[key];
        const range = p.max - p.min;
        const distance = value < tolerance[0]
            ? tolerance[0] - value
            : value - tolerance[1];

        return Evo.util.clamp(distance / (range * 0.4), 0, 1);
    }
};
