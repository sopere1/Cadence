// Maps chords to a valid voicing on the treble staff
var chordNotes = {
    "Cmaj": ["E4", "G4", "C5"],
    "Dmin": ["F4", "A4", "D5"],
    "Emin": ["G4", "B4", "E5"],
    "Fmaj": ["A4", "C5", "F5"],
    "Gmaj": ["B4", "D5", "G5"],
    "Amin": ["C5", "E5", "A4"],
    "Bdim": ["D5", "F5", "B4"]
};

// Approximate y-coordinate for each note on the treble staff
var pitchMap = {
    "E4": -2.0, 
    "F4": -1.5, 
    "G4": -1.0, 
    "A4": -0.5,
    "B4": 0.0, 
    "C5": 0.5, 
    "D5": 1.0, 
    "E5": 1.5,
    "F5": 2.0, 
    "G5": 2.5
};

module.exports = {
    pitchMap: pitchMap,
    chordNotes: chordNotes
};
