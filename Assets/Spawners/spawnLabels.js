const chordIndex = require("../Constants/chordIndex.js");
const config = require("../Constants/labelConfig.js");

// Create a bridge chord between startObj and endObj
function spawnBridge(prefab, parent, startObj, endObj, colorA, colorB, bridgeName, chords) {
    // instantiate and orient bridge at the midpoint
    const start = startObj.getTransform().getWorldPosition();
    const end = endObj.getTransform().getWorldPosition();
    const dir = end.sub(start);
    const length = dir.length;
    const mid = start.add(end).uniformScale(0.5);

    const bridge = prefab.instantiate(parent);
    const t = bridge.getTransform();
    t.setWorldPosition(mid);

    const fwd = dir.normalize();
    const up = new vec3(0, 1, 0);
    const rot = quat.lookAt(fwd, up);
    t.setWorldRotation(rot);
    t.setLocalScale(new vec3(global.BRIDGE_THICKNESS, global.BRIDGE_THICKNESS, length * 0.65));

    // clone and customize bridge material per-instance
    const vis = bridge.getComponent("Component.MaterialMeshVisual");
    if (vis) {
        vis.mainMaterial = vis.mainMaterial.clone();
        const pass = vis.mainMaterial.mainPass;
        pass.colorA = colorA;
        pass.colorB = colorB;
        pass.scrollSpeed = global.SCROLLSPEED;
        pass.pulseSpeed = global.PULSESPEED;
        pass.brightness = global.BRIGHTNESS;
    }

    // attach chord audio
    const audioIndex = chordIndex[bridgeName];
    if (audioIndex !== undefined && chords[audioIndex]) {
        const audio = bridge.createComponent("Component.AudioComponent");
        audio.audioTrack = chords[audioIndex];
    } else {
        print(`[spawnLabels] No audio found for bridge ${bridgeName}`);
    }
    bridge.enabled = false;
    return bridge;
}

// Add occluder behind text so objects behind don't visually leak
function addOccluder(labelSO, text3D, padding, mat) {
    // use Text3D bounding box to size occluder
    const bb = text3D.getBoundingBox();
    const w = (bb.right - bb.left) + padding;
    const h = (bb.top - bb.bottom) + padding;

    const plate = global.scene.createSceneObject("OccluderPlate");
    plate.setParent(labelSO);

    const pt = plate.getTransform();
    pt.setLocalPosition(new vec3(0, 0, -0.002));
    pt.setLocalScale(new vec3(w, h, 1));

    // build occluder mesh from scratch
    const mb = new MeshBuilder([
        { name: "position", components: 3 },
        { name: "normal", components: 3 },
        { name: "texture0", components: 2 },
    ]);
    mb.topology = MeshTopology.Triangles;
    mb.indexType = MeshIndexType.UInt16;

    const L = -0.5, R = 0.5, T = 0.5, B = -0.5;
    mb.appendVerticesInterleaved([
        L, T, 0, 0, 0, 1, 0, 1,
        L, B, 0, 0, 0, 1, 0, 0,
        R, B, 0, 0, 0, 1, 1, 0,
        R, T, 0, 0, 0, 1, 1, 1
    ]);
    mb.appendIndices([0, 1, 2, 2, 3, 0]);

    const rmv = plate.createComponent("Component.RenderMeshVisual");
    rmv.mesh = mb.getMesh();
    mb.updateMesh();
    if (mat) {
        rmv.mainMaterial = mat;
    }

    const look = plate.createComponent("Component.LookAtComponent");
    look.target = global.CAM.getSceneObject();
    look.aimVectors = LookAtComponent.AimVectors.ZAimYUp;
}

// Create a single chord label at a given position
function createLabel(prefab, container, labelMap, pos, chordName, chords, textMaterial) {
    const label = prefab.instantiate(container);
    const text3D = label.getComponent("Component.Text3D");
    text3D.text = chordName;
    const t = label.getTransform();

    // position and scale the label within the ring
    t.setLocalPosition(pos);
    t.setLocalScale(new vec3(global.LABELSCALE, global.LABELSCALE, global.LABELSCALE));

    // attach audio for this specific chord label
    const audio = label.createComponent("Component.AudioComponent");
    const audioIndex = chordIndex[chordName];
    if (audioIndex !== undefined && chords[audioIndex]) {
        audio.audioTrack = chords[audioIndex];
    }

    // store reference for later bridge connections
    label.chord = chordName;
    labelMap[chordName] = label;
    return label;
}

// Spawn all chord labels around a ring and their connecting bridges
function spawn(ringPre, labelPre, bridgePre, occluderMat, textMaterial, chords, fwdDist, verDist, onReady) {
    // create ring container and position in front of camera
    const container = ringPre.instantiate(null);
    const labelMap = {};

    const camT = global.CAM.getTransform();
    const haloCenter = camT.getWorldPosition()
        .add(camT.forward.uniformScale(-fwdDist))
        .add(new vec3(0, verDist, 0));
    container.getTransform().setWorldPosition(haloCenter);

    // create label for each chord
    const chordNames = Object.keys(config.labelPositions);
    for (let i = 0; i < chordNames.length; i++) {
        const chordName = chordNames[i];
        const raw = config.labelPositions[chordName];
        const pos = new vec3(
            raw.x * global.RINGRADIUS,
            raw.z * (global.RINGRADIUS * 0.6),
            raw.y * global.RINGRADIUS
        );

        const label = createLabel(labelPre, container, labelMap, pos, chordName, chords, textMaterial);
        const text3D = label.getComponent("Component.Text3D");
        // add occluder behind text to help with depth sorting
        addOccluder(label, text3D, 0.02, occluderMat);
    }

    // create bridges between chords
    const conns = config.connections;
    const funcs = config.chordFunctions;
    for (let i = 0; i < conns.length; i++) {
        const conn = conns[i];
        const startObj = labelMap[conn.source];
        const endObj = labelMap[conn.target];

        if (!startObj || !endObj) {
            print(`[spawnLabels] Missing label for ${conn.source} or ${conn.target}; skipping bridge ${conn.bridge}`);
            continue;
        }
        const colorA = funcs[conn.source]?.color || new vec4(1, 1, 1, 1);
        const colorB = funcs[conn.target]?.color || new vec4(1, 1, 1, 1);

        spawnBridge(bridgePre, container, endObj, startObj, colorB, colorA, conn.bridge, chords);
    }

    // notify caller when labels have been created
    if (typeof onReady === "function") {
        try { onReady(container); }
        catch (err) { print("Error in callback: " + err); }
    }
    return container;
}

module.exports = spawn;
