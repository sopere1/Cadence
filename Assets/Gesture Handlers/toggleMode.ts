import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { InteractorInputType } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import { SIK } from '../SpectaclesInteractionKit.lspkg/SIK';
import { PlayButton } from './playButton';
import { ChordProgressionPlayer } from './progressionPlayer';
import { handleRightLabelPinch } from './rightLabelPinch';
import { ensureInteractableAndCollider } from '../Utils/setColliders';
import { SessionStateSync } from '../Control Components/main';
import { SessionController } from '../SpectaclesSyncKit.lspkg/Core/SessionController';
import { PersonalStaffManager } from '../Control Components/staffManager';

@component
export class toggleMode extends BaseScriptComponent {
    @input('Asset.Material')
    highlightMaterial: Material;
    
    @input('Asset.ObjectPrefab')
    playButtonPrefab: ObjectPrefab;

    @input('Asset.ObjectPrefab')
    submitButtonPrefab: ObjectPrefab;

    // containers for chord labels and staff
    private ringContainer: SceneObject = (global as any).ringContainer as SceneObject;
    private labels: SceneObject[] = this.ringContainer.children;

    // tracks progression state for playback and submission
    private playButton: PlayButton | null = null;
    private progressionPlayer: ChordProgressionPlayer | null = null;
    private hasSubmitted: boolean = false;

    // tracks active chord state for highlight, explanation labels, etc.
    private prevSelected: SceneObject | null = null;
    private activeLabel: SceneObject | null = null;
    private lastChordName: string = 'Cmaj';

    // prevents left pinch from accidentally triggering rapid toggle
    private lastToggleTime = 0;
    private readonly toggleCooldown = 0.3;

    // multiplayer components
    private personalStaff: PersonalStaffManager | null = null;
    private sessionSync: SessionStateSync | null = null;
    private isInDisplayPhase: boolean = false;

    onAwake() {
        // get the PersonalStaffManager component
        const staffManagerObj = (global as any).personalStaffManager as SceneObject;
        const scriptComp = staffManagerObj.getComponent("ScriptComponent") as ScriptComponent;
        this.personalStaff = scriptComp as unknown as PersonalStaffManager;

        // setup chord labels and toggle handlers
        this.personalStaff.hide();
        this.setupLabelInteractions();
        this.setupHandModeToggle();

        // initialize play button
        this.playButton = new PlayButton(this.personalStaff, this.playButtonPrefab);
        this.playButton.create();
        this.playButton.setOnPlayCallback(() => {
            this.handlePlayProgression();
        });

        // initialize progression player
        this.progressionPlayer = new ChordProgressionPlayer(this);
        this.progressionPlayer.setOnCompleteCallback(() => {
            this.playButton.stopAnimation(this);
        });

        // setup session sync
        this.sessionSync = (global as any).sessionStateSync as SessionStateSync;
        this.setupSyncListeners();
    }

    private setupSyncListeners(): void {
        // Listen for phase changes
        this.sessionSync.sessionPhase.onAnyChange.add(() => {
            const phase = this.sessionSync?.getSessionPhase() || 0;
            if (phase === 1) {
                this.handleAllSubmitted();
            }
        });

        // Listen for all submitted event
        if (this.sessionSync.onAllSubmittedEvent) {
            this.sessionSync.onAllSubmittedEvent.onRemoteEventReceived.add(() => {
                this.handleAllSubmitted();
            });
        }
    }

    // Helper to ensure a chord label is interactive
    private ensureLabelInteractive(label: any) {
        const text3D = label.getComponent("Component.Text3D") as any;
        if (!text3D || !text3D.getBoundingBox) return;

        // Calculate the collider size
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

                // Mouse input = left hand pinch (for preview testing)
                if (inputType === InteractorInputType.Mouse) {
                    this.handleLeftHandLabelPinch(label);
                } else if (inputType === InteractorInputType.LeftHand) {
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

    // Left-hand pinch: add chord to personal staff (local only)
    private handleLeftHandLabelPinch(label: SceneObject) {
        // Don't allow adding chords if in display phase
        if (this.isInDisplayPhase) return;

        const chordName = (label as any).chord as string;
        // Switch to staff mode (show personal staff)
        this.ringContainer.enabled = false;
        this.personalStaff.show();
        this.playButton.show();

        // Update selection visuals
        this.restorePreviousSelectionMaterial();
        this.destroyActiveLabel();
        this.highlightSelectedLabel(label);

        // Add to PERSONAL staff (not synced)
        if (this.personalStaff) {
            const added = this.personalStaff.addChordToStaff(chordName);

            if (!added) {
                print("Staff is full!");
                return;
            }

            // Check if staff is full, auto-submit once
            if (this.personalStaff.isFull() && !this.hasSubmitted) {
                this.submitProgression();

                // Hide everything until display phase
                this.ringContainer.enabled = false;
                this.personalStaff.hide();
                this.playButton.hide();
            }
        }

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

    // Handle playing the entire chord progression
    private handlePlayProgression(): void {
        if (this.playButton.isCurrentlyPlaying()) {
            return;
        }

        const chordsToPlay = this.personalStaff.getChordsForPlayback(this.labels);
        this.playButton.startAnimation(this);
        this.progressionPlayer.playSequence(chordsToPlay, 2.0);
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
        if (this.isInDisplayPhase) return;
        this.personalStaff.hide();
        this.playButton.hide();
        this.ringContainer.enabled = true;

        for (let i = 0; i < this.labels.length; i++) {
            this.ensureLabelInteractive(this.labels[i]);
        }
    }

    public submitProgression(): void {
        const progression = this.personalStaff.getProgression();
        const sessionController = SessionController.getInstance();
        const myConnectionId = sessionController.getLocalConnectionId();
        if (myConnectionId) {
            this.sessionSync.submitProgression(myConnectionId, progression);
            this.hasSubmitted = true;
        }
    }

    // When all progressions have been submitted, set up group display
    private handleAllSubmitted(): void {
        this.isInDisplayPhase = true;
    }
}
