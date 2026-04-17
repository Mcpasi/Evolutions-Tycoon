/**
 * renderer.js — Der Maler.
 *
 * Rendert den Organismus auf einem Canvas. Liest das Genom
 * und zeichnet daraus ein visuelles Bild. Die Darstellung ist
 * bewusst abstrakt — was wir hier sehen, ist eine symbolische
 * Übersetzung des Zustandsvektors, kein biologisches Abbild.
 */

Evo.Renderer = class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.time = 0;

        this._resize();
        window.addEventListener('resize', () => this._resize());
    }

    _resize() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.width = rect.width;
        this.height = rect.height;
    }

    /** Kontinuierliche Render-Schleife. */
    animate(organism) {
        const loop = () => {
            this.time += 0.016;
            this._draw(organism);
            this._rafId = requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
    }

    _draw(organism) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const cx = this.width / 2;
        const cy = this.height / 2;
        const g = organism.genome;

        // Basis-Radius ergibt sich aus Größe und Viewport
        const baseRadius = Math.min(this.width, this.height) * 0.12;
        const radius = baseRadius * g.size;

        // Leichte Atem-Bewegung
        const breath = Math.sin(this.time * 2) * radius * 0.03;
        const r = radius + breath;

        // Geißeln zuerst zeichnen (hinter der Zelle)
        this._drawFlagella(ctx, cx, cy, r, g);

        // Zellwand (falls vorhanden) als äußerer Ring
        if (g.cellWall) {
            ctx.beginPath();
            ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(180, 150, 100, 0.4)';
            ctx.lineWidth = 4;
            ctx.stroke();
        }

        // Zilien (Wimpern) am Rand
        if (g.cilia) {
            this._drawCilia(ctx, cx, cy, r);
        }

        // Zellkörper — Gradient
        const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        const { red, green, blue } = this._rgbOf(g.color);
        grad.addColorStop(0, `rgba(${red + 40}, ${green + 40}, ${blue + 40}, 0.9)`);
        grad.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0.55)`);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Membran — Stärke zeigt sich in der Linienbreite
        ctx.lineWidth = 1 + g.membraneStrength * 3;
        ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.95)`;
        ctx.stroke();

        // Zellkern
        if (g.nucleus) {
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(30, 30, 50, 0.65)';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(200, 200, 230, 0.8)';
            ctx.stroke();
        }

        // Organellen-Punkte (rein dekorativ, skaliert mit Größe)
        this._drawOrganelles(ctx, cx, cy, r, g);

        // Text: Spezies-Name leicht unter der Zelle
        ctx.fillStyle = 'rgba(180, 190, 200, 0.45)';
        ctx.font = 'italic 13px ' + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText(organism.speciesName, cx, cy + r + 30);
    }

    _rgbOf(color) {
        return {
            red: Math.round(Evo.util.clamp(color.r, 0, 255)),
            green: Math.round(Evo.util.clamp(color.g, 0, 255)),
            blue: Math.round(Evo.util.clamp(color.b, 0, 255))
        };
    }

    _drawFlagella(ctx, cx, cy, r, g) {
        if (g.flagella === 0) return;

        ctx.strokeStyle = 'rgba(200, 210, 220, 0.5)';
        ctx.lineWidth = 1.5;

        for (let i = 0; i < g.flagella; i++) {
            const angle = (i / g.flagella) * Math.PI * 2 + this.time * 0.3;
            const sx = cx + Math.cos(angle) * r;
            const sy = cy + Math.sin(angle) * r;
            const length = r * 1.2;

            ctx.beginPath();
            ctx.moveTo(sx, sy);

            // Wellenförmige Linie nach außen
            const steps = 15;
            for (let s = 1; s <= steps; s++) {
                const t = s / steps;
                const x = sx + Math.cos(angle) * length * t;
                const y = sy + Math.sin(angle) * length * t;
                const wave = Math.sin(this.time * 8 + t * 8) * 4;
                const ox = -Math.sin(angle) * wave;
                const oy = Math.cos(angle) * wave;
                ctx.lineTo(x + ox, y + oy);
            }
            ctx.stroke();
        }
    }

    _drawCilia(ctx, cx, cy, r) {
        const count = 30;
        ctx.strokeStyle = 'rgba(200, 210, 220, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const wave = Math.sin(this.time * 5 + i * 0.5) * 2;
            const sx = cx + Math.cos(angle) * r;
            const sy = cy + Math.sin(angle) * r;
            const ex = cx + Math.cos(angle) * (r + 6 + wave);
            const ey = cy + Math.sin(angle) * (r + 6 + wave);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
    }

    _drawOrganelles(ctx, cx, cy, r, g) {
        // Anzahl Organellen skaliert mit Größe
        const count = Math.floor(3 + g.size * 2);
        const seed = g.color.r + g.color.g + g.color.b; // stabil-pseudo
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + seed * 0.01;
            const dist = r * (0.5 + ((i * 7) % 10) / 25);
            if (g.nucleus && dist < r * 0.45) continue; // nicht in den Kern malen

            const ox = cx + Math.cos(angle) * dist;
            const oy = cy + Math.sin(angle) * dist;
            const size = 2 + (i % 3);

            ctx.beginPath();
            ctx.arc(ox, oy, size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.fill();
        }
    }
};
