import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { InteractorInputType } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import { ensureInteractableAndCollider } from '../Utils/setColliders';
import { PersonalStaffManager } from '../Control Components/staffManager';

export class PlayButton {
    private buttonObj: SceneObject | null = null;
    private isPlaying: boolean = false;
    private animationEvent: SceneEvent | null = null;
    private onPlayCallback: (() => void) | null = null;
    private personalStaff: PersonalStaffManager;
    private buttonPrefab: ObjectPrefab;
    private renderVisual: RenderMeshVisual | null = null;
    private originalColor: vec4 | null = null;
    private colorAnimationEvent: SceneEvent | null = null;

    constructor(personalStaff: PersonalStaffManager, buttonPrefab: ObjectPrefab) {
        this.personalStaff = personalStaff;
        this.buttonPrefab = buttonPrefab;
    }

    // Create the play button from prefab
    create(): void {
        // Get staff object from PersonalStaffManager
        const staffObj = this.personalStaff.getStaffObject();
        if (!staffObj) {
            print("Error: Staff object not available for PlayButton");
            return;
        }
        
        const buttonObj = this.buttonPrefab.instantiate(staffObj);
        buttonObj.name = "PlayButton";
        
        // Position at bottom right corner of staff
        const buttonTransform = buttonObj.getTransform();
        
        // Calculate staff dimensions
        const staffRight = (global as any).BARLENGTH * 0.5;
        const staffBottom = -(global as any).BARSPACE * 2;
        
        // Button size (scaled)
        const buttonScale = 0.4;
        const buttonSize = 15 * buttonScale;
        
        // Position so button's bottom-right corner aligns with staff's bottom-right
        const buttonOffset = new vec3(
            staffRight + buttonSize * 0.5,
            staffBottom + buttonSize * 0.5,
            0
        );
        buttonTransform.setLocalPosition(buttonOffset);
        
        // Make it smaller
        buttonTransform.setLocalScale(new vec3(buttonScale, buttonScale, buttonScale));
        
        // Store reference to render visual
        this.renderVisual = buttonObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual;
        
        // Store original color and set to gray
        if (this.renderVisual && this.renderVisual.mainMaterial) {
            this.originalColor = new vec4(0.7, 0.7, 0.7, 1.0);
            this.renderVisual.mainMaterial.mainPass.baseColor = this.originalColor;
        }
        
        // Ensure interactivity
        const colliderSize = new vec3(15, 15, 10);
        ensureInteractableAndCollider(buttonObj, colliderSize);
        
        // Set up interaction handler
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
        
        // Change color to yellow
        this.changeColorToYellow(scriptComponent);
        
        // Start rotation animation
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

    // Animate color change to yellow
    private changeColorToYellow(scriptComponent: BaseScriptComponent): void {
        if (!this.renderVisual || !this.renderVisual.mainMaterial) return;
        
        const targetColor = new vec4(1.0, 0.84, 0.0, 1.0); // Yellow
        const startColor = this.originalColor || new vec4(0.7, 0.7, 0.7, 1.0);
        
        let colorTime = 0;
        const colorDuration = 0.3; // 0.3 seconds to transition
        
        this.colorAnimationEvent = scriptComponent.createEvent("UpdateEvent");
        this.colorAnimationEvent.bind(() => {
            if (!this.isPlaying || !this.renderVisual || !this.renderVisual.mainMaterial) {
                if (this.colorAnimationEvent) {
                    this.colorAnimationEvent.enabled = false;
                }
                return;
            }
            
            colorTime += getDeltaTime();
            const t = Math.min(1.0, colorTime / colorDuration);
            
            // Smooth interpolation
            const r = startColor.x + (targetColor.x - startColor.x) * t;
            const g = startColor.y + (targetColor.y - startColor.y) * t;
            const b = startColor.z + (targetColor.z - startColor.z) * t;
            
            this.renderVisual.mainMaterial.mainPass.baseColor = new vec4(r, g, b, 1.0);
            
            if (t >= 1.0) {
                if (this.colorAnimationEvent) {
                    this.colorAnimationEvent.enabled = false;
                }
            }
        });
    }

    // Animate color change back to gray/white
    private changeColorToGray(scriptComponent: BaseScriptComponent): void {
        if (!this.renderVisual || !this.renderVisual.mainMaterial) return;
        
        const targetColor = this.originalColor || new vec4(0.7, 0.7, 0.7, 1.0); // Gray
        const startColor = this.renderVisual.mainMaterial.mainPass.baseColor;
        
        let colorTime = 0;
        const colorDuration = 0.3; // 0.3 seconds to transition
        
        this.colorAnimationEvent = scriptComponent.createEvent("UpdateEvent");
        this.colorAnimationEvent.bind(() => {
            if (this.isPlaying || !this.renderVisual || !this.renderVisual.mainMaterial) {
                if (this.colorAnimationEvent) {
                    this.colorAnimationEvent.enabled = false;
                }
                return;
            }
            
            colorTime += getDeltaTime();
            const t = Math.min(1.0, colorTime / colorDuration);
            
            // Smooth interpolation
            const r = startColor.x + (targetColor.x - startColor.x) * t;
            const g = startColor.y + (targetColor.y - startColor.y) * t;
            const b = startColor.z + (targetColor.z - startColor.z) * t;
            
            this.renderVisual.mainMaterial.mainPass.baseColor = new vec4(r, g, b, 1.0);
            
            if (t >= 1.0) {
                if (this.colorAnimationEvent) {
                    this.colorAnimationEvent.enabled = false;
                }
            }
        });
    }

    stopAnimation(scriptComponent: BaseScriptComponent): void {
        this.isPlaying = false;
        
        if (this.animationEvent) {
            this.animationEvent.enabled = false;
            this.animationEvent = null;
        }
        
        if (this.colorAnimationEvent) {
            this.colorAnimationEvent.enabled = false;
            this.colorAnimationEvent = null;
        }
        
        // Change color back to gray
        this.changeColorToGray(scriptComponent);
        
        // Reset rotation
        if (this.buttonObj) {
            this.buttonObj.getTransform().setLocalRotation(quat.angleAxis(0, vec3.forward()));
        }
    }

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
