function createSlots(root, numSlots){
    const slotSpacing = global.BARLENGTH * 0.25;

    for (let i = 0; i < numSlots; i++) {
        const sign = i % 2 === 0 ? -1 : 1;
        const offset = new vec3(sign * slotSpacing, 0, 0);

        const slotObj = global.scene.createSceneObject("Slot_" + i);
        slotObj.setParent(root);
        
        const slotTransform = slotObj.getTransform();
        slotTransform.setLocalPosition(offset);
        
        slotObj.slotIndex = i;
        root.slotObjects.push(slotObj);
    }
}

// Spawns a staff that supports one chord per slot
function spawn(staffPre, linePre, fwdDist, verDist, numSlots) {
    var staffRoot = staffPre.instantiate(null);

    // compute spawn position for staff root
    var camT = global.CAM.getTransform();
    var spawnPos = camT.getWorldPosition()
        .add(camT.forward.uniformScale(-fwdDist))
        .add(new vec3(0, verDist, 0));
    var t = staffRoot.getTransform();
    t.setWorldPosition(spawnPos);
    t.setWorldScale(new vec3(global.STAFFSCALE, global.STAFFSCALE, global.STAFFSCALE));

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
