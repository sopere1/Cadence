import {
    AnimationOptions,
    AnimationValueGetter,
    AnimationValueSetter,
    LerpFunction
} from "./AnimationUtils"
import {EasingFunction} from "./Easing";

export class PropertyAnimator {

    private animationEvent: UpdateEvent = null;
    private animationTime: number = 0.0;
    private duration: number;

    private startValue: number | vec2 | vec3 | vec4 | quat = 0.0;
    private endValue: number | vec2 | vec3 | vec4 | quat = 1.0;

    private scriptC: ScriptComponent;

    private getter: AnimationValueGetter;
    private setter: AnimationValueSetter;
    private lerp: LerpFunction;
    private easing: EasingFunction;

    private callbackOnFinish?: () => void;

    constructor(options: AnimationOptions) {
        this.scriptC = options.scriptComponent;
        this.duration = options.defaultDuration;
        this.easing = options.easing || ((t) => t);
    }

    setupAnimation(getter: AnimationValueGetter, setter: AnimationValueSetter, lerp: LerpFunction): void {
        this.getter = getter;
        this.setter = setter;
        this.lerp = lerp;
    }

    setCallbackOnFinish(cb: () => void): void {
        this.callbackOnFinish = cb;
    }

    configureForScreenTransformScale(st: ScreenTransform) {
        this.setupAnimation(
            () => st.scale,
            (value) => { st.scale = value as vec3; },
            vec3.lerp
        );
    }

    configureForScreenTransformRotation(st: ScreenTransform) {
        this.setupAnimation(
            () => st.rotation.toEulerAngles().z * MathUtils.RadToDeg,
            (value) => { st.rotation = quat.fromEulerAngles(0.0, 0.0, value as number * MathUtils.DegToRad); },
            MathUtils.lerp
        );
    }

    configureForScreenTransformAnchorPosition(st: ScreenTransform) {
        this.setupAnimation(
            () => st.anchors.getCenter(),
            (value) => { st.anchors.setCenter(value as vec2); },
            vec2.lerp
        );
    }

    configureForScreenTransformOffsetPosition(st: ScreenTransform) {
        this.setupAnimation(
            () => st.offsets.getCenter(),
            (value) => { st.offsets.setCenter(value as vec2); },
            vec2.lerp
        );
    }

    configureForMeshVisualColor(visual: MaterialMeshVisual | MaterialMeshVisual[]) {
        const isVisualArray = Array.isArray(visual);
        this.setupAnimation(
            () => {
                return isVisualArray ? visual[0].mainPass.baseColor : visual.mainPass.baseColor;
            },
            (value) => {
                if (isVisualArray) {
                    visual.forEach(v => v.mainPass.baseColor = value as vec4);
                } else {
                    visual.mainPass.baseColor = value as vec4;
                }
            },
            vec4.lerp
        );
    }

    configureForTextFillColor(visual: Text | Text[]) {
        const isVisualArray = Array.isArray(visual);
        this.setupAnimation(
            () => {
                return isVisualArray ? visual[0].textFill.color : visual.textFill.color;
            },
            (value) => {
                if (isVisualArray) {
                    visual.forEach(v => v.textFill.color = value as vec4);
                } else {
                    visual.textFill.color = value as vec4;
                }
            },
            vec4.lerp
        );
    }

    startAnimation(endValue: number | vec2 | vec3 | vec4 | quat, duration?: number): void {
        this.endValue = endValue;
        this.startValue = this.getter();
        this.duration = duration || this.duration;
        this.animationTime = 0;

        this.removeAnimationEvent();
        this.animationEvent = this.scriptC.createEvent("UpdateEvent");
        this.animationEvent.bind((ev) => this.update(ev));
    }

    private update(eventData: UpdateEvent) {
        this.animationTime += eventData.getDeltaTime();
        const t = Math.min(this.animationTime / this.duration, 1);
        const easedT = this.easing(t);
        const value = this.lerp(this.startValue, this.endValue, easedT);
        this.setter(value);

        if (t >= 1) {
            this.removeAnimationEvent();
            this.callbackOnFinish && this.callbackOnFinish();
        }
    }

    private removeAnimationEvent(): void {
        if (this.animationEvent) {
            this.scriptC.removeEvent(this.animationEvent);
            this.animationEvent.enabled = false;
            this.animationEvent = null;
        }
    }
}
