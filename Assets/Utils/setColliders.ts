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

// Ensure the object has a valid interactable and collider.
export function ensureInteractableAndCollider(obj: SceneObject, colliderSize: vec3): void {
    // Setup Interactable component
    let interactable = obj.getComponent(Interactable.getTypeName() as any) as unknown as Interactable | null;
    if (!interactable) {
        interactable = obj.createComponent(Interactable.getTypeName() as any) as unknown as Interactable;
    }

    interactable.targetingMode = 3;
    (interactable as any).useFilteredPinch = false;
    interactable.allowMultipleInteractors = true;
    interactable.enabled = true;

    // Setup Collider component
    let collider = obj.getComponent("Component.ColliderComponent") as ColliderComponent;
    if (!collider) {
        collider = obj.createComponent("Component.ColliderComponent") as ColliderComponent;
    }

    const shape = Shape.createBoxShape();
    shape.size = colliderSize;
    collider.shape = shape;
    collider.enabled = true;
    collider.debugDrawEnabled = true
}
