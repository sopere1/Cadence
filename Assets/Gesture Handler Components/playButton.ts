import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { InteractorInputType } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import { ensureInteractableAndCollider } from '../Utils/setColliders';

export class PlayButton {
    private buttonObj: SceneObject | null = null;
    private isPlaying: boolean = false;
    private animationEvent: SceneEvent | null = null;
    private onPlayCallback: (() => void) | null = null;
    private staffContainer: SceneObject;
    private buttonPrefab: ObjectPrefab;

    constructor(staffContainer: SceneObject, buttonPrefab: ObjectPrefab) {
        this.staffContainer = staffContainer;
        this.buttonPrefab = buttonPrefab;
    }

    // Create the play button from prefab
    create(): void {
        const buttonObj = this.buttonPrefab.instantiate(this.staffContainer);
        buttonObj.name = "PlayButton";
        
        // position at top right of staff
        const buttonTransform = buttonObj.getTransform();
        const buttonOffset = new vec3(
            (global as any).BARLENGTH * 0.5 + 8,
            (global as any).BARSPACE * 2.5,
            0
        );
        buttonTransform.setLocalPosition(buttonOffset);
        
        // ensure interactivity
        const colliderSize = new vec3(15, 15, 10);
        ensureInteractableAndCollider(buttonObj, colliderSize);
        
        // set up interaction handler
        const interactable = buttonObj.getComponent(Interactable.getTypeName() as any) as any;
        const handler = (event: InteractorEvent) => {
            const inputType = (event.interactor as any)?.inputType;
            if (inputType === InteractorInputType.RightHand) {
                this.handlePress();
            }
        };
        (interactable.onInteractorTriggerStart as any).add(handler as any);
        
        this.buttonObj = buttonObj;
        buttonObj.enabled = false;
    }

    private handlePress(): void {
        if (this.isPlaying || !this.onPlayCallback) {
            return;
        }
        this.onPlayCallback();
    }

    setOnPlayCallback(callback: () => void): void {
        this.onPlayCallback = callback;
    }

    startAnimation(scriptComponent: BaseScriptComponent): void {
        if (!this.buttonObj || this.isPlaying) return;
        
        this.isPlaying = true;
        
        const rotateEvent = scriptComponent.createEvent("UpdateEvent");
        let rotationSpeed = 180;
        let currentRotation = 0;
        
        rotateEvent.bind(() => {
            if (!this.isPlaying || !this.buttonObj) {
                rotateEvent.enabled = false;
                return;
            }
            
            const dt = getDeltaTime();
            currentRotation += rotationSpeed * dt;
            
            if (currentRotation >= 360) {
                currentRotation -= 360;
            }
            
            const transform = this.buttonObj.getTransform();
            transform.setLocalRotation(quat.angleAxis(currentRotation, vec3.forward()));
        });
        
        this.animationEvent = rotateEvent;
    }

    stopAnimation(): void {
        this.isPlaying = false;
        
        if (this.animationEvent) {
            this.animationEvent.enabled = false;
            this.animationEvent = null;
        }
        
        if (this.buttonObj) {
            this.buttonObj.getTransform().setLocalRotation(quat.angleAxis(0, vec3.forward()));
        }
    }

    // Ensure button visibility/interactivity when toggling the mode
    show(): void {
        if (this.buttonObj) {
            this.buttonObj.enabled = true;
            const colliderSize = new vec3(15, 15, 10);
            ensureInteractableAndCollider(this.buttonObj, colliderSize);
        }
    }

    hide(): void {
        if (this.buttonObj) {
            this.buttonObj.enabled = false;
        }
    }

    isCurrentlyPlaying(): boolean {
        return this.isPlaying;
    }
}