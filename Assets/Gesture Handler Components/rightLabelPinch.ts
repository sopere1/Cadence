const explainChordTransition = require('../Utils/gptExplain.js');

// Right-hand pinch: play audio and show GPT explanation
export function handleRightLabelPinch(label: SceneObject, audioComponent: any, lastChord: string) {
    const chordName = (label as any).chord as string;
    audioComponent.play(1);

    explainChordTransition(lastChord, chordName, (response: string | null) => {
        spawnGPTLabel(label, response);
    });
}

function spawnGPTLabel(label: SceneObject, response: string) {
    const evt = this.createEvent('DelayedCallbackEvent');
    evt.bind(() => {
        const prefab = (global as any).TEXTPREFAB as any;
        const labelObj = prefab ? prefab.instantiate(label) : global.scene.createSceneObject('GPT_Label');
        if (!prefab) {
            labelObj.setParent(label);
        }

        const text3D = labelObj.getComponent('Component.Text3D') as any;
        if (text3D) {
            text3D.text = response;
            text3D.size = 400;
        }
        this.activeLabel = labelObj;

        const t = labelObj.getTransform();
        t.setLocalPosition(new vec3(0, 0.65, 0));
        t.setLocalScale(new vec3(0.01, 0.01, 0.01));
    });
    evt.reset(0);
}
