const requestGPT = require("./requestGPT.js");

function explainChordTransition(prev, current, callback) {
    const query =
        "In about 10 words, describe the classical harmonic tendency from " +
        prev +
        " to " +
        current +
        " mentioning tendency tones or resolution. Keep it pedagogical.";

    requestGPT(query, (response) => {
        print("🎵 gptExplain callback: " + response);
        callback(response);
    });
}

module.exports = explainChordTransition;
