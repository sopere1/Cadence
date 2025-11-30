import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { InteractorInputType } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import { SIK } from '../SpectaclesInteractionKit.lspkg/SIK';
import { handleRightLabelPinch } from './rightLabelPinch'
import { setCollidersEnabled, ensureInteractableAndCollider } from '../Utils/setColliders';
const { chordNotes } = require('../Constants/chordMap.js');
const spawnChord = require('../Spawners/spawnChord');

@component
export class toggleMode extends BaseScriptComponent {
    @input('Asset.Material')
    highlightMaterial: Material;

    private ringContainer: SceneObject = (global as any).ringContainer as SceneObject;
    private labels: SceneObject[] = this.ringContainer.children;
    private staffContainer: SceneObject = (global as any).staffContainer as SceneObject;

    private prevSelected: SceneObject | null = null;
    private activeLabel: SceneObject | null = null;
    private lastChordName: string = 'Cmaj';
    private nextSlotIndex: number = 0;
    private slotChords: SceneObject[] = [];

    private lastToggleTime = 0;
    private readonly toggleCooldown = 0.3;

    onAwake() {
        setCollidersEnabled(this.staffContainer, false);
        this.setupLabelInteractions();
        this.setupHandModeToggle();
    }

    // Helper to ensure a chord label is interactive
    private ensureLabelInteractive(label: any){
        const text3D = label.getComponent("Component.Text3D") as any;
        if (!text3D || !text3D.getBoundingBox) return;
        
        // calculate the collider size
        const bb = text3D.getBoundingBox();
        const w = Math.max(10, bb.right - bb.left);
        const h = Math.max(10, bb.top - bb.bottom);
        const d = 10;
        const size = new vec3(w, h, d);
        ensureInteractableAndCollider(label, size);
    }

    // Setup left and right-hand pinch on each label
    private setupLabelInteractions() {
        for (let i = 0; i < this.labels.length; i++) {
            const label = this.labels[i];
            this.ensureLabelInteractive(label);
            
            const interactable = label.getComponent(Interactable.getTypeName() as any) as any;
            const audioComponent = label.getComponent('Component.AudioComponent');
            
            const handler = (event: InteractorEvent) => {
                const inputType = (event.interactor as any)?.inputType;

                if (inputType === InteractorInputType.LeftHand) {
                    this.handleLeftHandLabelPinch(label);
                } else if (inputType === InteractorInputType.RightHand) {
                    handleRightLabelPinch(
                        label, 
                        audioComponent, 
                        this.lastChordName,
                        (labelObj: SceneObject) => {
                            this.destroyActiveLabel();
                            this.activeLabel = labelObj;
                        },
                        this
                    );
                }
            };
            (interactable.onInteractorTriggerStart as any).add(handler as any);
        }
    }

    // Left-hand pinch: hide ring, show staff, place a chord
    private handleLeftHandLabelPinch(label: SceneObject) {
        const chordName = (label as any).chord as string;
        const slotObjects = (this.staffContainer as any).slotObjects as SceneObject[];

        // Switch to staff mode
        this.ringContainer.enabled = false;
        this.staffContainer.enabled = true;
        setCollidersEnabled(this.staffContainer, true);

        // Update selection visuals
        this.restorePreviousSelectionMaterial();
        this.destroyActiveLabel();
        this.highlightSelectedLabel(label);

        const notes: string[] = (chordNotes as any)[chordName];   
        // Get slot position from slot object's transform
        const slotObj = slotObjects[this.nextSlotIndex];
        const slotPos = slotObj.getTransform().getLocalPosition();

        // Track and clear existing chord in this slot
        const existingChord = this.slotChords[this.nextSlotIndex] as SceneObject;
        if (existingChord) {
            existingChord.destroy();
        }

        // Spawn the chord on the staff
        const chordObj = spawnChord(this.staffContainer, (global as any).notePre, (global as any).TEXTPREFAB, notes, chordName, slotPos);
        this.slotChords[this.nextSlotIndex] = chordObj;
        // Store chord name for later retrieval
        (chordObj as any).chordName = chordName;

        // Advance slot index and remember last chord
        this.nextSlotIndex = (this.nextSlotIndex + 1) % slotObjects.length;
        this.lastChordName = chordName;
    }

    private restorePreviousSelectionMaterial() {
        if (!this.prevSelected) { return; }
        const prevText = this.prevSelected.getComponent('Component.Text3D') as any;
        if (prevText && (prevText as any).originalMaterial) {
            prevText.mainMaterial = (prevText as any).originalMaterial;
        }
    }

    private destroyActiveLabel() {
        if (this.activeLabel) {
            this.activeLabel.destroy();
            this.activeLabel = null;
        }
    }

    private highlightSelectedLabel(label: SceneObject) {
        const text3D = label.getComponent('Component.Text3D') as any;
        if (text3D && !(text3D as any).originalMaterial) {
            (text3D as any).originalMaterial = text3D.mainMaterial;
        }

        const highlightMat = this.highlightMaterial;
        text3D.mainMaterial = highlightMat;

        this.prevSelected = label;
    }

    // Left-hand pinch down anywhere: toggle from staff back to ring mode
    private setupHandModeToggle() {
        const handInput = SIK.HandInputData;
        const leftHand = handInput.getHand('left');

        leftHand.onPinchDown.add(() => {
            const now = getTime();
            if (now - this.lastToggleTime < this.toggleCooldown) {
                return;
            }
            this.lastToggleTime = now;
            this.toggleToRingMode();
        });
    }

    private toggleToRingMode() {
        this.staffContainer.enabled = false;
        setCollidersEnabled(this.staffContainer, false);
        this.ringContainer.enabled = true;

        for (let i = 0; i < this.labels.length; i++) {
            this.ensureLabelInteractive(this.labels[i])
        }
    }
}
