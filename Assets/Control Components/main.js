// @input Component.Camera camera
// @input Component.Camera camera

// @input Asset.ObjectPrefab ringPre
// @input Asset.ObjectPrefab labelPre
// @input Asset.ObjectPrefab bridgePre
// @input Asset.Material occluderMat
// @input Asset.AudioTrackAsset[] chords
// @input float ringRadius
// @input float chordFwdDist
// @input float chordVerDist
// @input float chordScale

// @input Asset.ObjectPrefab staffPre
// @input Asset.ObjectPrefab linePre
// @input Asset.ObjectPrefab notePre
// @input float staffFwdDist
// @input float staffVerDist
// @input float barLength
// @input float barSpace
// @input float staffScale
// @input float numSlots

// @input Asset.ObjectPrefab containerPrefab
// @input Asset.Material textMat

const spawnLabels = require('../Spawners/spawnLabels');
const spawnStaff = require('../Spawners/spawnStaff');
const waitForGPT = require('../Utils/waitForGPT');

// Set global variables for Spawners
global.CAM = script.camera;
global.BARLENGTH = script.barLength;
global.BARSPACE = script.barSpace;
global.STAFFSCALE = script.staffScale;
global.RINGRADIUS = script.ringRadius;
global.LABELSCALE = script.chordScale;
global.BRIDGE_THICKNESS = 60; // cylindrical girth
global.SCROLLSPEED = 0.6;
global.PULSESPEED = 0.6;
global.BRIGHTNESS = 1.0;

// Prefabs/materials used elsewhere
global.TEXTPREFAB = script.labelPre;
global.textMaterial = script.textMat;
global.notePre = script.notePre;
global.chordTextPre = script.labelPre;

// Start Spawners when ChatGPT server is connected
function onStart() {
    waitForGPT(script, function () {
        const staff = spawnStaff(
            script.staffPre,
            script.linePre,
            script.staffFwdDist,
            script.staffVerDist,
            script.numSlots
        );

        spawnLabels(
            script.ringPre,
            script.labelPre,
            script.bridgePre,
            script.occluderMat,
            script.textMat,
            script.chords,
            script.chordFwdDist,
            script.chordVerDist,
            function (ringContainer) {
                global.ringContainer = ringContainer;
                global.staffContainer = staff;
                script.containerPrefab.instantiate(null);
            }
        );
    });
}

script.createEvent("OnStartEvent").bind(onStart);
