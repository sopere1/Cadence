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

// Spawn all chord labels around a ring and their connecting bridges
function spawn(ringPre, labelPre, occluderMat, textMaterial, chords, fwdDist, verDist, apiKey, onReady) {
    // create ring container and position in front of camera
    const container = ringPre.instantiate(null);
    const labelMap = {};

    const camT = global.CAM.getTransform();
    const haloCenter = camT.getWorldPosition()
        .add(camT.forward.uniformScale(-fwdDist))
        .add(new vec3(0, verDist, 0));
    container.getTransform().setWorldPosition(haloCenter);

    // call GPT to get chord coordinates
    const prompt = generateCrds("C major");
    const payload = {
        messages: [
            {
                role: "user",
                content: prompt
            }
        ],
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

                // spawn labels dynamically from GPT response
                for (let i = 0; i < chordData.length; i++) {
                    const chord = chordData[i];
                    const pos = chord.position;

                    // scale positions to fit the ring radius
                    const scaledPos = new vec3(
                        pos.x * (global.RINGRADIUS),
                        pos.z * (global.RINGRADIUS),
                        pos.y * (global.RINGRADIUS)
                    );

                    const label = createLabel(labelPre, container, labelMap, scaledPos, chord.name, chords, textMaterial);
                    const text3D = label.getComponent("Component.Text3D");
                    // add occluder behind text to help with depth sorting
                    addOccluder(label, text3D, 0.02, occluderMat);
                }

                // store chord data for later bridge generation
                container.chordData = chordData;
                container.labelMap = labelMap;

                // Notify caller when labels have been created
                if (typeof onReady === "function") {
                    try {
                        onReady(container);
                    }
                    catch (err) {
                        print("Error in callback: " + err);
                    }
                }
            } else {
                print("ERROR: Invalid GPT response format");
                if (onReady) {
                    onReady(container);
                }
            }
        },
        (error) => {
            print("ERROR: GPT request failed: " + error);
            if (onReady) {
                onReady(container);
            }
        }
    );
    return container;
}

module.exports = spawn;
