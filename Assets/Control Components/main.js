// @input Component.Camera camera
// @input Component.Camera camera

// @input Asset.ObjectPrefab sessionStateSyncPrefab
// @input Asset.ObjectPrefab personalStaffManagerPrefab

// @input Asset.ObjectPrefab ringPre
// @input Asset.ObjectPrefab labelPre
// @input Asset.ObjectPrefab bridgePre
// @input Asset.Material occluderMat
// @input Asset.AudioTrackAsset[] chords
// @input float ringRadius
// @input float chordFwdDist
// @input float chordVerDist
// @input float chordScale
// @input string keyGPT

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

// Set global variables for Spawners
global.INTERNET = require("LensStudio:InternetModule");
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

// sync components
const sessionSyncObj = script.sessionStateSyncPrefab.instantiate(null);
global.sessionStateSync = sessionSyncObj;

function onStart() {
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
        script.occluderMat,
        script.textMat,
        script.chords,
        script.chordFwdDist,
        script.chordVerDist,
        script.keyGPT,
        function (ringContainer) {
            global.ringContainer = ringContainer;
            global.staffContainer = staff;
            
            const staffManagerObj = script.personalStaffManagerPrefab.instantiate(null);
            global.personalStaffManager = staffManagerObj;
            // initialize mode toggle
            script.containerPrefab.instantiate(null);
        }
    );
}

script.createEvent("OnStartEvent").bind(onStart);


const mainContainer = script.containerPrefab.instantiate(null);

const sessionSyncObj = script.sessionStateSyncPrefab.instantiate(mainContainer);
sessionSyncObj.name = "SessionStateSync";
global.sessionStateSync = sessionSyncObj;

const staffManagerObj = script.personalStaffManagerPrefab.instantiate(mainContainer);
staffManagerObj.name = "PersonalStaffManager";
global.personalStaffManager = staffManagerObj;

// Get SessionStateSync component and wait for it to be ready BEFORE onStart
const SessionStateSync = require('../Control Components/sessionSync');
const sessionSync = sessionSyncObj.getComponent(SessionStateSync.getTypeName());

// Wait for sync to be ready, THEN execute onStart
sessionSync.notifyOnReady(() => {
    // Now sync is ready - safe to run onStart
    onStart();
});

function onStart() {
    const staff = spawnStaff(
        script.staffPre,
        script.linePre,
        script.staffFwdDist,
        script.staffVerDist,
        script.numSlots
    );

    // Set staff container immediately
    global.staffContainer = staff;

    // Now spawn labels (sessionSync is already ready)
    spawnLabels(
        script.ringPre,
        script.labelPre,
        script.occluderMat,
        script.textMat,
        script.chords,
        script.chordFwdDist,
        script.chordVerDist,
        script.keyGPT,
        function (ringContainer) {
            global.ringContainer = ringContainer;
            
            // Initialize mode toggle (container already created above)
            // The container prefab should have toggleMode component attached
        }
    );
}

// Don't bind onStart to OnStartEvent - we call it manually after sync is ready
// script.createEvent("OnStartEvent").bind(onStart);  // ← Remove this line