// Coordinates for chord labels
const labelPositions = {
    "Cmaj": new vec3(0.00, 0.00, 0.00),
    "Fmaj": new vec3(-1.10, 0.65, 0.08),
    "Dmin": new vec3(-0.55, 1.25, 0.10),
    "Gmaj": new vec3(1.10, 0.65, -0.10),
    "Bdim": new vec3(0.85, 1.35, -0.15),
    "Emin": new vec3(0.55, -1.25, 0.02),
    "Amin": new vec3(-0.95, -0.95, 0.00)
};

// Bridge chord information
const connections = [
    // Cmaj (Tonic)
    { source: "Cmaj", target: "Gmaj", bridge: "Dmin", direction: "Outward" },
    { source: "Cmaj", target: "Amin", bridge: "E7", direction: "Inward" },

    // Fmaj (Predominant)
    { source: "Fmaj", target: "Gmaj", bridge: "Dmin", direction: "Outward" },
    { source: "Fmaj", target: "Cmaj", bridge: "G7", direction: "Inward" },

    // Dmin (Predominant)
    { source: "Dmin", target: "Gmaj", bridge: "Fmaj", direction: "Outward" },
    { source: "Dmin", target: "Cmaj", bridge: "G7", direction: "Inward" },

    // Emin (Tonic substitute)
    { source: "Emin", target: "Amin", bridge: "E7", direction: "Outward" },
    { source: "Emin", target: "Cmaj", bridge: "G7", direction: "Inward" },

    // Gmaj (Dominant)
    { source: "Gmaj", target: "Cmaj", bridge: "G7", direction: "Inward" },
    { source: "Gmaj", target: "Amin", bridge: "G7", direction: "Outward" },

    // Bdim (Leading)
    { source: "Bdim", target: "Cmaj", bridge: "G7", direction: "Inward" },
    { source: "Bdim", target: "Gmaj", bridge: "Dmin", direction: "Outward" },

    // Amin (Tonic substitute)
    { source: "Amin", target: "Cmaj", bridge: "G7", direction: "Inward" },
    { source: "Amin", target: "Dmin", bridge: "A7", direction: "Outward" },
];

// Functions of each chord
const chordFunctions = {
    "Cmaj": { func: "Tonic", color: new vec4(1.0, 1.0, 1.0, 1.0) },
    "Amin": { func: "Tonic substitute", color: new vec4(0.8, 0.8, 0.8, 1.0) },
    "Emin": { func: "Tonic substitute", color: new vec4(0.8, 0.8, 0.8, 1.0) },
    "Dmin": { func: "Predominant", color: new vec4(0.3, 0.7, 1.0, 1.0) },
    "Fmaj": { func: "Predominant", color: new vec4(0.4, 0.8, 1.0, 1.0) },
    "Gmaj": { func: "Dominant", color: new vec4(1.0, 0.7, 0.2, 1.0) },
    "Bdim": { func: "Leading", color: new vec4(1.0, 0.4, 0.3, 1.0) }
};

module.exports = {
    labelPositions: labelPositions,
    connections: connections,
    chordFunctions: chordFunctions,
};
