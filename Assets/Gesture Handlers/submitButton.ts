import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';
import { InteractorEvent } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent';
import { InteractorInputType } from '../SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor';
import { ensureInteractableAndCollider } from '../Utils/setColliders';

export class SubmitButton {
    private buttonObj: SceneObject | null = null;
    private onSubmit: (() => void) | null = null;
    private personalStaff: any; // PersonalStaffManager
    private buttonPrefab: ObjectPrefab;

    constructor(personalStaff: any, buttonPrefab: ObjectPrefab) {
        this.personalStaff = personalStaff;
        this.buttonPrefab = buttonPrefab;
    }

    create(): void {
        const staffObj = this.personalStaff.getStaffObject();
        if (!staffObj) return;

        const btn = this.buttonPrefab.instantiate(staffObj);
        btn.name = "SubmitButton";

        // Ensure interactable
        ensureInteractableAndCollider(btn, new vec3(14, 14, 10));
        const interactable = btn.getComponent(Interactable.getTypeName() as any) as any;
        const handler = (event: InteractorEvent) => {
            const inputType = (event.interactor as any)?.inputType;
            if (inputType === InteractorInputType.RightHand || inputType === InteractorInputType.Mouse) {
                this.handlePress();
            }
        };
        (interactable.onInteractorTriggerStart as any).add(handler as any);

        btn.enabled = false; // hidden initially
        this.buttonObj = btn;
    }

    setOnSubmit(cb: () => void): void {
        this.onSubmit = cb;
    }

    show(): void {
        if (this.buttonObj) this.buttonObj.enabled = true;
    }

    hide(): void {
        if (this.buttonObj) this.buttonObj.enabled = false;
    }

    showIfFull(isFull: boolean): void {
        if (isFull) this.show();
        else this.hide();
    }

    private handlePress(): void {
        if (this.onSubmit) this.onSubmit();
        this.hide(); // hide after submit
    }
}
