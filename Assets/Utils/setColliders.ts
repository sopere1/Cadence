// Helper functions to mitigate interactability issues when toggling
// between modes
import { Interactable } from '../SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable';

// Set enable to enabled for all children of root
export function setCollidersEnabled(root: SceneObject, enabled: boolean): void {
    const stack: SceneObject[] = [root];
    while (stack.length) {
        const current = stack.pop() as SceneObject;
        const collider = current.getComponent("Component.ColliderComponent") as ColliderComponent;
        if (collider) {
            collider.enabled = enabled;
        }

        const childCount = current.getChildrenCount();
        for (let i = 0; i < childCount; i++) {
            stack.push(current.getChild(i));
        }
    }
}

// Ensure the label has a valid interactable and collider
export function ensureInteractableAndCollider(label: SceneObject): void {
    let interactable = label.getComponent(Interactable.getTypeName() as any) as unknown as Interactable | null;
    if (!interactable) {
        try {
            interactable = label.createComponent(Interactable.getTypeName() as any) as unknown as Interactable;
        } catch (error) {
            print(`[setColliders] Failed to add Interactable to ${label.name}: ${error}`);
        }
    }

    if (interactable) {
        interactable.targetingMode = 3; // Direct/Indirect
        (interactable as any).useFilteredPinch = false;
        interactable.allowMultipleInteractors = true;
        interactable.enabled = true;
    }

    const text3D = label.getComponent("Component.Text3D") as any;
    if (!text3D || !text3D.getBoundingBox) {
        return;
    }

    const bb = text3D.getBoundingBox();
    const w = Math.max(0.01, bb.right - bb.left);
    const h = Math.max(0.01, bb.top - bb.bottom);
    const d = 0.02;

    let collider = label.getComponent("Component.ColliderComponent") as ColliderComponent;
    if (!collider) {
        collider = label.createComponent("Component.ColliderComponent") as ColliderComponent;
    }

    const shape = Shape.createBoxShape();
    shape.size = new vec3(w, h, d);
    collider.shape = shape;
    collider.enabled = true;
}
