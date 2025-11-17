const {pitchMap} = require("../Constants/chordMap.js");

// Spawns a chord on the parent staff in slotPosition
function spawn(parent, notePre, textPre, noteNames, chordLabel, slotPosition) {
    var chordObj = global.scene.createSceneObject("Chord_" + chordLabel);
    chordObj.setParent(parent);

    // spawn note heads
    for (var i = 0; i < noteNames.length; i++) {
        var noteName = noteNames[i];
        var yOffset = (pitchMap[noteName]) * global.BARSPACE;

        var note = notePre.instantiate(chordObj);
        var nt = note.getTransform();
        nt.setLocalPosition(new vec3(slotPosition.x, slotPosition.y + yOffset, slotPosition.z));

        var noteScale = global.BARSPACE * 0.7;
        nt.setLocalScale(new vec3(noteScale, noteScale, noteScale));
    }

    // create label, position slightly below chord
    var textObj = textPre.instantiate(chordObj);
    var tt = textObj.getTransform();
    tt.setLocalPosition(new vec3(slotPosition.x, slotPosition.y - 2.6 * global.BARSPACE, slotPosition.z));

    // set the label text to the chord name
    var text3D = textObj.getComponent("Component.Text3D");
    text3D.text = chordLabel;

    return chordObj;
}

module.exports = spawn;
