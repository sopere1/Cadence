function createSlots(root, numSlots) {
    // Add padding to keep slots away from edges
    const edgePadding = global.BARLENGTH * 0.08;
    const usableWidth = global.BARLENGTH - (2 * edgePadding);
    
    // Calculate spacing to fit all slots within usable width
    const adjustedSlotSpacing = numSlots > 1 ? usableWidth / (numSlots - 1) : 0;
    
    // Calculate starting position to center slots within usable area
    const totalWidth = (numSlots - 1) * adjustedSlotSpacing;
    const startX = -totalWidth / 2;
    
    for (let i = 0; i < numSlots; i++) {
        // Position slots in a sequence from left to right, inset from edges
        const xPos = startX + (i * adjustedSlotSpacing);
        const offset = new vec3(xPos, 0, 0);

        const slotObj = global.scene.createSceneObject("Slot_" + i);
        slotObj.setParent(root);

        const slotTransform = slotObj.getTransform();
        slotTransform.setLocalPosition(offset);

        slotObj.slotIndex = i;
        root.slotObjects.push(slotObj);
    }
}

// Spawns a staff that supports one chord per slot
function spawn(staffPre, linePre, fwdDist, verDist, numSlots, staffScale) {
    var staffRoot = staffPre.instantiate(null);

    // compute spawn position for staff root
    var camT = global.CAM.getTransform();
    var spawnPos = camT.getWorldPosition()
        .add(camT.forward.uniformScale(-fwdDist))
        .add(new vec3(0, verDist, 0));
    var t = staffRoot.getTransform();
    t.setWorldPosition(spawnPos);
    t.setWorldScale(new vec3(staffScale, staffScale, staffScale));

    // initialize staff lines
    for (var i = 0; i < 5; i++) {
        var line = linePre.instantiate(staffRoot);
        var lt = line.getTransform();
        lt.setLocalPosition(new vec3(0, (i - 2) * global.BARSPACE, 0));
        lt.setLocalScale(new vec3(global.BARLENGTH, 1, 1));
    }

    // create slot objects
    staffRoot.slotObjects = [];
    createSlots(staffRoot, numSlots)

    staffRoot.enabled = false;
    return staffRoot;
}

module.exports = spawn;
