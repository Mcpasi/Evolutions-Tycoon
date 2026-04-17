/**
 * ui.js — Verbindung zwischen Spielzustand und DOM.
 *
 * Aktualisiert die rechte Seite: Umwelt-Anzeige, Genom-Liste,
 * Evolutions-Log. Keine Spiellogik hier drin, nur Darstellung.
 */

Evo.UI = class UI {
    constructor() {
        this.envGrid = document.getElementById('env-grid');
        this.genomeList = document.getElementById('genome-list');
        this.logList = document.getElementById('log-list');
        this.speciesNameEl = document.getElementById('species-name');
        this.generationEl = document.getElementById('generation-display');
        this.eraEl = document.getElementById('era-display');

        this._envBuilt = false;
    }

    setSpecies(name) {
        this.speciesNameEl.textContent = name;
    }

    updateGeneration(generation) {
        this.generationEl.textContent = `Gen. ${generation}`;
    }

    updateEra(age) {
        // Sehr grobe Ära-Einteilung für Stimmung
        let era = 'Präkambrium';
        if (age > 40) era = 'Archaikum';
        if (age > 100) era = 'Proterozoikum';
        if (age > 200) era = 'Paläozoikum';
        if (age > 400) era = 'Mesozoikum';
        if (age > 700) era = 'Känozoikum';
        this.eraEl.textContent = era;
    }

    updateEnvironment(state, stressObj) {
        if (!this._envBuilt) this._buildEnvGrid();

        for (const key in state) {
            const p = Evo.ENV_PARAMS[key];
            const value = state[key];
            const stress = stressObj[key] || 0;

            const valueEl = this.envGrid.querySelector(`[data-env-value="${key}"]`);
            const barEl = this.envGrid.querySelector(`[data-env-bar="${key}"]`);

            if (valueEl) {
                valueEl.textContent = this._formatValue(key, value);
            }

            if (barEl) {
                const range = p.max - p.min;
                const pct = ((value - p.min) / range) * 100;
                barEl.style.width = `${Evo.util.clamp(pct, 0, 100)}%`;

                barEl.classList.remove('stress', 'critical');
                if (stress > 0.6) barEl.classList.add('critical');
                else if (stress > 0.2) barEl.classList.add('stress');
            }
        }
    }

    _buildEnvGrid() {
        this.envGrid.innerHTML = '';
        for (const key in Evo.ENV_PARAMS) {
            const p = Evo.ENV_PARAMS[key];
            const cell = document.createElement('div');
            cell.className = 'env-cell';
            cell.innerHTML = `
                <div class="env-label">${p.label}</div>
                <div class="env-value" data-env-value="${key}">—</div>
                <div class="env-bar"><div class="env-bar-fill" data-env-bar="${key}"></div></div>
            `;
            this.envGrid.appendChild(cell);
        }
        this._envBuilt = true;
    }

    _formatValue(key, value) {
        const p = Evo.ENV_PARAMS[key];
        const rounded = key === 'acidity' ? value.toFixed(1) : Math.round(value);
        return `${rounded}${p.unit ? ' ' + p.unit : ''}`;
    }

    updateGenome(genome) {
        const items = [
            ['Größe',         genome.size.toFixed(2) + 'x'],
            ['Membran',       (genome.membraneStrength * 100).toFixed(0) + '%'],
            ['Metabolismus',  this._translate(genome.metabolism)],
            ['Sauerstoff',    this._translate(genome.oxygenUse)],
            ['Temp-Toleranz', `${Math.round(genome.tempTolerance[0])}..${Math.round(genome.tempTolerance[1])}°C`],
            ['Geißeln',       genome.flagella],
            ['Zilien',        genome.cilia ? 'ja' : 'nein'],
            ['Zellkern',      genome.nucleus ? 'ja' : 'nein'],
            ['Zellwand',      genome.cellWall ? 'ja' : 'nein']
        ];

        this.genomeList.innerHTML = items.map(([name, value]) => `
            <div class="genome-item">
                <span class="gene-name">${name}</span>
                <span class="gene-value">${value}</span>
            </div>
        `).join('');
    }

    _translate(value) {
        const map = {
            heterotroph: 'heterotroph',
            chemotroph: 'chemotroph',
            phototroph: 'phototroph',
            aerobic: 'aerob',
            anaerobic: 'anaerob',
            facultative: 'fakultativ'
        };
        return map[value] || value;
    }

    log(message, type, generation) {
        const li = document.createElement('li');
        if (type) li.classList.add(type);
        li.innerHTML = `<span class="log-time">G${generation}</span>${message}`;
        this.logList.prepend(li);

        // Log begrenzen
        while (this.logList.children.length > 80) {
            this.logList.removeChild(this.logList.lastChild);
        }
    }
};
