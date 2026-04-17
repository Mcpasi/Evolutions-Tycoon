/**
 * namespace.js — Globaler Namespace.
 * Muss als erstes geladen werden. Alle weiteren Module hängen
 * ihre Klassen und Konstanten an "Evo" an.
 */
var Evo = Evo || {};

// Kleine Utility-Sammlung, die mehrere Module nutzen.
Evo.util = {
    /** Zufallszahl zwischen min und max (inklusive min, exklusive max). */
    rand(min, max) {
        return Math.random() * (max - min) + min;
    },

    /** Zufalls-Integer zwischen min und max (beide inklusive). */
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /** Zufälliges Element aus einem Array. */
    pick(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /** Wert auf ein Intervall begrenzen. */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /** Gewichtete Münze — gibt true mit Wahrscheinlichkeit p zurück. */
    chance(p) {
        return Math.random() < p;
    }
};
