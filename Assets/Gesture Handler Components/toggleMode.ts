import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { InteractorInputType } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import { SIK } from '../SpectaclesInteractionKit.lspkg/SIK';
import {handleRightLabelPinch } from './rightLabelPinch'
import { setCollidersEnabled, ensureInteractableAndCollider } from '../Utils/setColliders';
const { chordNotes } = require('../Constants/chordMap.js');
const spawnChord = require('../Spawners/spawnChord');

@component
export class toggleMode extends BaseScriptComponent {
    @input('Asset.Material')
    highlightMaterial: Material;

    private ringContainer: SceneObject = (global as any).ringContainer as SceneObject;
    private staffContainer: SceneObject = (global as any).staffContainer as SceneObject;

    private prevSelected: SceneObject | null = null;
    private activeLabel: SceneObject | null = null;
    private lastChordName: string = 'Cmaj';

    private lastToggleTime = 0;
    private readonly toggleCooldown = 0.3;

    onAwake() {
        setCollidersEnabled(this.staffContainer, false);
        this.setupLabelInteractions();
        this.setupHandModeToggle();
    }

    // Setup left and right-hand pinch on each label
    private setupLabelInteractions() {
        const labels = this.ringContainer.children;
        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            ensureInteractableAndCollider(label);

            const interactable = label.getComponent(Interactable.getTypeName() as any) as any;
            const audioComponent = label.getComponent('Component.AudioComponent');

            const handler = (event: InteractorEvent) => {
                const inputType = (event.interactor as any)?.inputType;
                if (inputType === InteractorInputType.LeftHand) {
                    this.handleLeftHandLabelPinch(label);
                } else if (inputType === InteractorInputType.RightHand) {
                    handleRightLabelPinch(label, audioComponent, this.lastChordName);
                }
            };
            (interactable.onInteractorTriggerStart as any).add(handler as any);
        }
    }

    // Left-hand pinch: hide ring, show staff, place a chord
    private handleLeftHandLabelPinch(label: SceneObject) {
        const chordName = (label as any).chord as string;

        // Compute slots and wrap index by slot count
        const slots: vec3[] = ((this.staffContainer as any).slotPositions || []) as vec3[];
        const totalSlots = slots.length > 0 ? slots.length : 2;
        const currentSlot = ((global as any).nextSlotIndex ?? 0) % totalSlots;

        // Switch to staff mode
        this.ringContainer.enabled = false;
        this.staffContainer.enabled = true;
        setCollidersEnabled(this.staffContainer, true);

        // Update selection visuals
        this.restorePreviousSelectionMaterial();
        this.destroyActiveLabel();
        this.highlightSelectedLabel(label);

        // Spawn chord notes on the staff
        const notes: string[] | undefined = (chordNotes as any)[chordName];
        const slotPos = slots[currentSlot];
        const notePre = (global as any).notePre as any;
        const textPre = (global as any).chordTextPre as any;

        // Track and clear existing chord in this slot
        (global as any).slotChords = (global as any).slotChords || {};
        const existingChord = (global as any).slotChords[currentSlot] as SceneObject | undefined;
        if (existingChord) {
            existingChord.destroy();
        }

        if (notes && slotPos && notePre && textPre) {
            const chordObj = spawnChord(this.staffContainer, notePre, textPre, notes, chordName, slotPos);
            (global as any).slotChords[currentSlot] = chordObj;
        }

        // Advance slot index and remember last chord
        (global as any).nextSlotIndex = (currentSlot + 1) % totalSlots;
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

        const highlightMat = this.highlightMaterial || (global as any).highlightMaterial || null;
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

        if (this.ringContainer) {
            this.ringContainer.enabled = true;

            const labelsBack = this.ringContainer.getChildrenCount() ? this.ringContainer.children : [];
            for (let i = 0; i < labelsBack.length; i++) {
                ensureInteractableAndCollider(labelsBack[i]);
            }
        }
    }
}
