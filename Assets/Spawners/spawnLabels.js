// Uses GPT to generate a harmonic chord map (first user only), 
// syncs the config across users via StorageProperty, and creates 
// interactive labels with audio, occluders, and 3D positioning 
// based on the generated coordinates. 

// Non-owners wait for the config via a StorageProperty change 
// listener before creating their labels.

const chordIndex = require("../Constants/chordIndex.js");
const { generateCrds } = require("../Constants/prompts.js");
const { requestGPTCompletion } = require("../Utils/customGPT");

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

    // apply visual components for visibility
    const rmv = plate.createComponent("Component.RenderMeshVisual");
    rmv.mesh = mb.getMesh();
    mb.updateMesh();
    rmv.mainMaterial = mat;
    const look = plate.createComponent("Component.LookAtComponent");
    look.target = global.CAM.getSceneObject();
    look.aimVectors = LookAtComponent.AimVectors.ZAimYUp;
}

// Create a single chord label at a given position
function createLabel(prefab, container, labelMap, pos, chordName, chords) {
    const label = prefab.instantiate(container);
    const text3D = label.getComponent("Component.Text3D");
    text3D.text = chordName;
    const t = label.getTransform();
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

// Parse GPT response to extract chord data
function parseGPTResponse(responseText) {
    const chords = [];
    const lines = responseText.split('\n');
    let headerFound = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // look for table header
        if (line.includes('Chord') && line.includes('Function') && line.includes('x')) {
            headerFound = true;
            continue;
        }

        // skip separator line
        if (headerFound && line.match(/^\|[\s-:]+$/)) {
            continue;
        }

        // parse table rows for chord information
        if (headerFound && line.startsWith('|') && !line.match(/^\|[\s-:]+$/)) {
            const parts = line.split('|').map(p => p.trim()).filter(p => p);
            if (parts.length >= 5) {
                const chordName = parts[0];
                const functionLabel = parts[1];
                const x = parseFloat(parts[2]);
                const y = parseFloat(parts[3]);
                const z = parseFloat(parts[4]);
                if (!isNaN(x) && !isNaN(y) && !isNaN(z) && chordName) {
                    chords.push({
                        name: chordName,
                        function: functionLabel,
                        position: new vec3(x, y, z)
                    });
                }
            }
        } else if (headerFound && line.length > 0 && !line.startsWith('|')) {
            // hit non-table content, terminate parsing
            break;
        }
    }
    return chords;
}

// Convert chord data array to string array format for syncing
function chordDataToConfig(chordData) {
    const config = [];
    for (let i = 0; i < chordData.length; i++) {
        const chord = chordData[i];
        // Format: "chordName,function,x,y,z"
        config.push(chord.name + "," + (chord.function || "") + "," + chord.position.x + "," + chord.position.y + "," + chord.position.z);
    }
    return config;
}

// Convert synced config string array back to chord data
function configToChordData(config) {
    const chordData = [];
    for (let i = 0; i < config.length; i++) {
        const parts = config[i].split(',');
        if (parts.length >= 5) {
            chordData.push({
                name: parts[0],
                function: parts[1],
                position: new vec3(parseFloat(parts[2]), parseFloat(parts[3]), parseFloat(parts[4]))
            });
        }
    }
    return chordData;
}

// Create labels from chord data (shared by both owner and non-owner)
function createLabelsFromConfig(chordData, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady) {
    for (let i = 0; i < chordData.length; i++) {
        const chord = chordData[i];
        const pos = chord.position;

        // Scale positions to fit the ring radius
        const scaledPos = new vec3(
            pos.x * (global.RINGRADIUS),
            pos.z * (global.RINGRADIUS),
            pos.y * (global.RINGRADIUS)
        );

        const label = createLabel(labelPre, container, labelMap, scaledPos, chord.name, chords);
        const text3D = label.getComponent("Component.Text3D");
        
        // Store function on label for bridge generation later
        label.chordFunction = chord.function;
        
        // Add occluder behind text
        addOccluder(label, text3D, 0.02, occluderMat);
    }

    // Store chord data for later bridge generation (includes function)
    container.chordData = chordData;
    container.labelMap = labelMap;

    // Notify caller when labels have been created
    if (typeof onReady === "function") {
        try {
            onReady(container);
        } catch (err) {
            print("Error in callback: " + err);
        }
    }
}

// Spawn all chord labels around a ring
function spawn(ringPre, labelPre, occluderMat, textMaterial, chords, fwdDist, verDist, apiKey, onReady) {
    // Create ring container and position in front of camera
    const container = ringPre.instantiate(null);
    const labelMap = {};

    const camT = global.CAM.getTransform();
    const haloCenter = camT.getWorldPosition()
        .add(camT.forward.uniformScale(-fwdDist))
        .add(new vec3(0, verDist, 0));
    container.getTransform().setWorldPosition(haloCenter);

    // Get SessionStateSync
    const sessionSync = global.sessionStateSync;

    // Get my connection ID and check configuration
    const { SessionController } = require('../SpectaclesSyncKit.lspkg/Core/SessionController');
    const sessionController = SessionController.getInstance();
    const myConnectionId = sessionController.getLocalConnectionId();
    checkAndGenerateConfig(sessionSync, myConnectionId, apiKey, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);

    return container;
}

// Check if config exists, generate if owner, wait if not
function checkAndGenerateConfig(sessionSync, myConnectionId, apiKey, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady) {
    // Check if configuration already exists
    if (sessionSync.hasLabelConfig()) {
        // Config exists, use it
        const config = sessionSync.getLabelConfig();
        const chordData = configToChordData(config);
        createLabelsFromConfig(chordData, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);
        return;
    }

    // No config yet, check if I should generate it
    const currentOwner = sessionSync.getLabelConfigOwner();
    if (!currentOwner) {
        // no owner yet, I will become the owner
        sessionSync.setLabelConfigOwner(myConnectionId);
        generateAndStoreConfig(sessionSync, apiKey, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);
    } else {
        // someone else is owner, wait for config to appear
        waitForConfig(sessionSync, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);
    }
}

// Generate configuration and store it in SessionStateSync (owner only)
function generateAndStoreConfig(sessionSync, apiKey, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady) {
    const prompt = generateCrds("C major");
    const payload = {
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 4000
    };

    requestGPTCompletion(
        apiKey,
        payload,
        (response) => {
            if (response && response.choices && response.choices.length > 0) {
                const responseText = response.choices[0].message.content;
                const chordData = parseGPTResponse(responseText);
                
                // Convert to config format and store
                const config = chordDataToConfig(chordData);
                sessionSync.setLabelConfig(config);
                
                // Create labels from this config
                createLabelsFromConfig(chordData, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);
            }
        },
    );
}

// Wait for configuration to appear
function waitForConfig(sessionSync, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady) {
    // Check immediately first
    if (sessionSync.hasLabelConfig()) {
        const config = sessionSync.getLabelConfig();
        const chordData = configToChordData(config);
        createLabelsFromConfig(chordData, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);
        return;
    }
    
    // Set up listener on the labelConfig property change event
    const configListener = sessionSync.labelConfig.onAnyChange.add(() => {
        // Check if config is now available
        if (sessionSync.hasLabelConfig()) {
            const config = sessionSync.getLabelConfig();
            const chordData = configToChordData(config);
            createLabelsFromConfig(chordData, container, labelMap, chords, textMaterial, occluderMat, labelPre, onReady);
            
            // Remove the listener once we've got the config
            sessionSync.labelConfig.onAnyChange.remove(configListener);
        }
    });
}

module.exports = spawn;
