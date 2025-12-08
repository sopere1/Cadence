/**
 * Button
 * Version 0.0.13
 *
 * Description: Sets up the button and allows to fit the label and icon with the background.
 * Triggers events by pressing the button.
 *
 * API:
 *
 * isPressed(): boolean - returns whether the button is pressed at the moment.
 * isActive(): boolean - returns whether the button is active at the moment.
 * enableInteractable(): void - enables button's InteractionComponent.
 * disableInteractable(): void - disables button's InteractionComponent.
 * setTransformType(type: number, defaultValue, pressedValue, disabledValue) - sets transform animation type. Types: 0 - Offset Position, 1 - Anchor Position, 2 - Rotation, 3 - Scale.
 * (readonly) textComponent - TextComponent of label.
 * (readonly) screenTransform - Parent ScreenTransform.
 * (readonly) backgroundScreenTransform - ScreenTransform of background.
 * defaultBackgroundColor: vec4 - background's color in default state.
 * pressedBackgroundColor: vec4 - background's color in pressed state.
 * disabledBackgroundColor: vec4 - background's color in disabled state.
 * defaultLabelColor: vec4 - label's color in default state.
 * pressedBackgroundColor: vec4 - label's color in pressed state.
 * disabledBackgroundColor: vec4 - label's color in disabled state.
 * animationType: number - animation type. 0 - None. 1 - Bounce. 2 - Squish. 3 - Transform.
 * renderOrder: number - button's render order.
 * textSize: number - size of the TextComponent.
 * buttonCenter: vec2 - button's center position.
 * buttonScale: number - button's scale ratio.
 * backgroundEnabled: boolean - whether the background is enabled.
 *
 * Events:
 *
 * onEnabledInteractable
 * onDisabledInteractable
 * onPressUp
 * onPressDown
 * onPress
 *
 * Events Usage:
 *
 * script.onEnabledInteractable.add(callback);
 * script.onPress.add(callback);
 */
import {DestructionHelper} from "./Modules/Scene/DestructionHelper";
import {PropertyAnimator} from "./Modules/Animation/PropertyAnimator";
import {PassHelper} from "./Modules/Scene/PassHelper";
import {Easing} from "./Modules/Animation/Easing";
import {SceneEventHelper} from "./Modules/Scene/SceneEventHelper";
import {ScreenTransformHelper} from "./Modules/Scene/ScreenTransformHelper";
import {Event} from "./Modules/Event/Event";
import {BehaviorEventCallbacks, CallbackType} from "./Modules/BehaviorSupport/BehaviorEventCallbacks";
import {ComponentWithDebug} from "./Modules/Debug/ComponentWithDebug";

type TransformValue = number | vec2 | vec3;

enum Scale {
    ExtraSmall = 0.5,
    Small = 0.75,
    Medium = 1.0,
    Large = 1.25,
    Custom = 0.0
}

enum TransitionState {
    Default = "default",
    Pressed = "pressed",
    Disabled = "disabled"
}

enum ButtonContent {
    Label,
    Icon,
    LabelWithIcon,
}

enum IconAlignment {
    Right,
    Left
}

enum AnimationType {
    None,
    Bounce,
    Squish,
    Transform
}

enum TransformAnimationType {
    Offset,
    Anchor,
    Rotation,
    Scale
}

enum ButtonColor {
    Default,
    Disabled,
    Primary,
    Secondary,
    Custom
}

interface ButtonAnimationI {
    default,
    pressed,
    disabled,
    currentAnimationState: TransitionState
}

@component
export class Button extends ComponentWithDebug {

    @input
    private interactable: boolean;

    @ui.separator

    @input
    private setupTransform: boolean;

    @input
    @showIf("setupTransform", false)
    private fitBackground: boolean;

   @ui.group_start("Button Transform")
   @showIf("setupTransform")

    @input
    private center: vec2;

    @input
    @widget(new ComboBoxWidget()
        .addItem("Extra Small", 0.5)
        .addItem("Small", 0.75)
        .addItem("Medium", 1.0)
        .addItem("Large", 1.25)
        .addItem("Custom", 0))
    private scale: number = 1.0;

    @input
    @showIf("scale", 0)
    private customScale: number = 1.0;

    @ui.group_end

    @ui.separator

    @input("int")
    @widget(new ComboBoxWidget()
        .addItem("Only Label", 0)
        .addItem("Only Icon", 1)
        .addItem("Label with Icon", 2))
    private content: ButtonContent;

    @input
    @label("Label")
    @showIf("content", 0)
    private labelInOnlyLabel: string;

    @input
    @label("Icon")
    @showIf("content", 1)
    private iconInOnlyIcon: Texture;

    @input
    @label("Label")
    @showIf("content", 2)
    private labelInLabelWithIcon: string;

    @input
    @label("Icon")
    @showIf("content", 2)
    private iconInLabelWithIcon: Texture;

    @input("int")
    @showIf("content", 2)
    @widget(new ComboBoxWidget()
        .addItem("Right", 0)
        .addItem("Left", 1))
    private iconAlignment: IconAlignment;

    @ui.separator

    @input("int")
    @widget(new ComboBoxWidget()
        .addItem("Default", 0)
        .addItem("Disabled", 1)
        .addItem("Primary", 2)
        .addItem("Secondary", 3)
        .addItem("Custom", 4))
    private buttonColor: ButtonColor;

    @ui.group_start("Custom Color")
    @showIf("buttonColor", 4)

    @input
    @label("Label Color")
    @widget(new ColorWidget())
    @showIf("content", 0)
    private labelColorInLabelOnly: vec4;

    @input("vec4", "{1.0, 1.0, 1.0, 1.0}")
    @label("Label Color")
    @widget(new ColorWidget())
    @showIf("content", 2)
    private labelColorInLabelWithIcon: vec4;

    @input("vec4", "{0.0, 0.0, 0.0, 1.0}")
    @widget(new ColorWidget())
    private backgroundColor: vec4;

    @ui.group_end

    @ui.separator

    @input("int")
    @hint("This Render Order will be applied to the background. A +1 will be used for text/icons.")
    private _renderOrder: number;

    @ui.separator

    @input
    private eventCallbacks: boolean;

    @ui.group_start("Event Callbacks")
    @showIf("eventCallbacks")

    @input("int", "0")
    @widget(new ComboBoxWidget()
        .addItem("None", 0)
        .addItem("Behavior Script", 1)
        .addItem("Behavior Custom", 2)
        .addItem("Custom Function", 3))
    private callbackType: CallbackType;

    @input
    @showIf("callbackType", 1)
    private onPressDownBehaviors: ScriptComponent[];

    @ui.separator
    @showIf("callbackType", 1)

    @input
    @showIf("callbackType", 1)
    private onPressUpBehaviors: ScriptComponent[];

    @ui.separator
    @showIf("callbackType", 1)

    @input
    @showIf("callbackType", 1)
    private onPressBehaviors: ScriptComponent[];

    @input
    @showIf("callbackType", 2)
    private onPressDownCustomTriggers: string[];

    @ui.separator
    @showIf("callbackType", 2)

    @input
    @showIf("callbackType", 2)
    private onPressUpCustomTriggers: string[];

    @ui.separator
    @showIf("callbackType", 2)

    @input
    @showIf("callbackType", 2)
    private onPressCustomTriggers: string[];

    @input
    @showIf("callbackType", 3)
    @allowUndefined
    private customFunctionScript: ScriptComponent;

    @ui.separator
    @showIf("callbackType", 3)

    @input
    @showIf("callbackType", 3)
    private onPressDownFunctions: string[];

    @ui.separator
    @showIf("callbackType", 3)

    @input
    @showIf("callbackType", 3)
    private onPressUpFunctions: string[];

    @ui.separator
    @showIf("callbackType", 3)

    @input
    @showIf("callbackType", 3)
    private onPressFunctions: string[];

    @ui.group_end

    @input
    private textPrefab: ObjectPrefab;

    @input
    private iconPrefab: ObjectPrefab;

    @input
    private backgroundPrefab: ObjectPrefab;

    onEnabledInteractable: Event = new Event();
    onDisabledInteractable: Event = new Event();
    onPressUp: Event = new Event();
    onPressDown: Event = new Event();
    onPress: Event = new Event();

    private readonly DEFAULT_BACKGROUND_COLOR: vec4 = new vec4(0.95, 0.95, 0.95, 1.0);
    private readonly DEFAULT_PRESSED_ALPHA: number = 0.8;
    private readonly DEFAULT_LABEL_COLOR: vec4 = new vec4(0.0, 0.0, 0.0, 1.0);
    private readonly DISABLED_BACKGROUND_COLOR: vec4 = new vec4(0.25, 0.25, 0.25, 1.0);
    private readonly DISABLED_LABEL_COLOR: vec4 = new vec4(0.5, 0.5, 0.5, 1.0);
    private readonly PRIMARY_BACKGROUND_COLOR: vec4 = new vec4(1.0, 1.0, 0.0, 1.0);
    private readonly PRIMARY_LABEL_COLOR: vec4 = new vec4(0.0, 0.0, 0.0, 1.0);
    private readonly SECONDARY_BACKGROUND_COLOR: vec4 = new vec4(0.15, 0.15, 0.15, 1.0);
    private readonly SECONDARY_LABEL_COLOR: vec4 = new vec4(1.0, 1.0, 1.0, 1.0);

    private readonly BOUNCE_UNIFORM_SCALE: number = 0.8;
    private readonly SQUISH_SCALE: vec3 = new vec3(1.1, 0.8, 1.0);
    private readonly ICON_RATIO: number = 1.5;
    private readonly DEFAULT_SIZE: vec2 = new vec2(0.1, 0.1);
    private readonly DEFAULT_TEXT_SIZE: number = 24;
    private readonly FRAME_DELAY: number = 0.1;
    private readonly BACKGROUND_HEIGHT_RATIO: number = 0.5;
    private readonly LABEL_HEIGHT_RATIO: number = 1.5;
    private readonly TRANSPARENT: vec4 = new vec4(0.0, 0.0, 0.0, 0.0);

    private readonly destructionHelper: DestructionHelper = new DestructionHelper();
    private readonly sceneEventHelper: SceneEventHelper = new SceneEventHelper(this);

    private initialized: boolean = false;

    private buttonAnimation: ButtonAnimationI;
    private _animationType: AnimationType = AnimationType.Bounce;
    private buttonState: TransitionState;
    private transformType: TransformAnimationType;
    private defaultTransformValue: TransformValue;
    private pressedTransformValue: TransformValue;
    private disabledTransformValue: TransformValue;

    private transitionAnimationHelperBackground: PropertyAnimator;
    private transitionAnimationHelperLabel: PropertyAnimator;
    private transformAnimationHelper: PropertyAnimator;

    private _defaultBackgroundColor: vec4;
    private _pressedBackgroundColor: vec4;
    private _disabledBackgroundColor: vec4;

    private _defaultLabelColor: vec4;
    private _pressedLabelColor: vec4;
    private _disabledLabelColor: vec4;

    private so: SceneObject;
    private st: ScreenTransform;
    private interactionC: InteractionComponent;

    private backgroundSO: SceneObject;
    private backgroundImage: Image;
    private backgroundST: ScreenTransform;

    private iconSO: SceneObject;
    private iconImage: Image;
    private iconST: ScreenTransform;

    private labelSO: SceneObject;
    private labelText: Text;
    private labelST: ScreenTransform;
    private labelExtentsSO: SceneObject;
    private labelExtentsST: ScreenTransform;
    private labelTextString: string = "";

    private baseHeightSO: SceneObject;
    private baseHeightText: Text;
    private baseHeightExtentsSO: SceneObject;
    private baseHeightExtentsST: ScreenTransform;

    private pressed: boolean = false;
    private lastPressTime: number;
    private initialTrigger: boolean = false;

    private updateEvent: UpdateEvent;

    onAwake() {
        this.buttonState = (this.interactable) ? TransitionState.Default : TransitionState.Disabled;
        this.so = this.getSceneObject();
        this.initialize();
    }

    set defaultBackgroundColor(color: vec4) {
        this._defaultBackgroundColor = color;
        if (this.buttonState == TransitionState.Default && this.initialized) {
            this.setBackgroundColor(color);
        }
    }

    get defaultBackgroundColor() {
        return this._defaultBackgroundColor;
    }

    set pressedBackgroundColor(color: vec4) {
        this._pressedBackgroundColor = color;
        if (this.buttonState == TransitionState.Pressed && this.initialized) {
            this.setBackgroundColor(color);
        }
    }

    get pressedBackgroundColor() {
        return this._pressedBackgroundColor;
    }

    set disabledBackgroundColor(color: vec4) {
        this._disabledBackgroundColor = color;
        if (this.buttonState == TransitionState.Disabled && this.initialized) {
            this.setBackgroundColor(color);
        }
    }

    get disabledBackgroundColor() {
        return this._disabledBackgroundColor;
    }

    set defaultLabelColor(color: vec4) {
        this._defaultLabelColor = color;
        if (this.buttonState == TransitionState.Default && this.initialized) {
            this.setLabelColor(color);
        }
    }

    get defaultLabelColor() {
        return this._defaultLabelColor;
    }

    set pressedLabelColor(color: vec4) {
        this._pressedLabelColor = color;
        if (this.buttonState == TransitionState.Pressed && this.initialized) {
            this.setLabelColor(color);
        }
    }

    get pressedLabelColor() {
        return this._pressedLabelColor;
    }

    set disabledLabelColor(color: vec4) {
        this._disabledLabelColor = color;
        if (this.buttonState == TransitionState.Disabled && this.initialized) {
            this.setLabelColor(color);
        }
    }

    get disabledLabelColor() {
        return this._disabledLabelColor;
    }

    set animationType(type: AnimationType) {
        this._animationType = type;
        this.initializeAnimations();
    }

    get animationType() {
        return this._animationType;
    }

    set renderOrder(order: number) {
        this._renderOrder = order;
        this.setRenderOrder();
    }

    get renderOrder() {
        return  this._renderOrder;
    }

    set textSize(size: number) {
        if (this.labelText) {
            this.labelText.size = size;
        } else {
            this.printWarning("trying to set size to the invalid Label Text!");
        }

        if (this.baseHeightText) {
            this.baseHeightText.size = size;
        }

        if (this.content == ButtonContent.Label && this.initialized) {
            if (this.setupTransform || this.fitBackground) {
                this.fitBgWithLabel();
            }
        }
        if (this.content == ButtonContent.LabelWithIcon && this.initialized) {
            this.fitBgWithTextAndIcon();
        }
    }

    get textSize() {
        if (this.labelText) {
            return this.labelText.size;
        } else {
            this.printWarning("trying to get size of the invalid Label Text!");
        }
    }

    set backgroundEnabled(enabling: boolean) {
        if (this.backgroundImage) {
            this.backgroundImage.enabled = enabling;
        } else {
            this.printWarning("trying to set enabled to the invalid Button's Image!");
        }
    }

    get backgroundEnabled() {
        if (this.backgroundImage) {
            return this.backgroundImage.enabled;
        } else {
            this.printWarning("trying to get enabled of the invalid Button's Image!");
        }
    }

    set buttonCenter(center: vec2) {
        if (this.st) {
            this.st.anchors.setCenter(center);
        } else {
            this.printWarning("trying to set center to the invalid Button's ScreenTransform!");
        }
    }

    get buttonCenter() {
        if (this.st) {
            return this.st.anchors.getCenter();
        }  else {
            this.printWarning("trying to get center of the invalid Button's ScreenTransform!");
        }
    }

    set buttonScale(scale: number) {
        this.scale = scale;
        if (this.content == ButtonContent.Icon) {
            if (this.setupTransform || this.fitBackground) {
                this.iconST.anchors.setSize(this.DEFAULT_SIZE.uniformScale(this.scale));
                this.fitBgWithIcon();
            } else {
                this.printWarning("use the Custom Component's ScreenTransform to adjust the size of button!");
            }
        } else {
            this.textSize = this.DEFAULT_TEXT_SIZE * this.scale;
        }
    }

    get buttonScale() {
        return this.scale;
    }

    get textComponent() {
        return this.labelText;
    }

    get screenTransform() {
        return this.st;
    }

    get backgroundScreenTransform() {
        return this.backgroundST;
    }

    /**
     * Returns whether the button is pressed.
     */
    isPressed(): boolean {
        return this.pressed;
    }

    /**
     * Returns whether the button is active.
     */
    isActive(): boolean {
        return this.interactable;
    }

    /**
     * Enables Interactable and invokes animations for the new button's state.
     */
    enableInteractable(): void {
        if (this.interactable) return;
        this.interactable = true;
        this.buttonState = (this.pressed) ? TransitionState.Pressed : TransitionState.Default;
        this.invokeVisualTransition();
        this.invokeAnimation(this._animationType);
        this.onEnabledInteractable.trigger();
        this.printDebug("Enabled!");
    }

    /**
     * Disables Interactable and invokes animations for the new button's state.
     */
    disableInteractable(): void {
        if (!this.interactable) return;
        this.interactable = false;
        this.buttonState = TransitionState.Disabled
        this.invokeVisualTransition();
        this.invokeAnimation(this._animationType);
        this.onDisabledInteractable.trigger();
        this.printDebug("Disabled!");
    }

    /**
     * Sets a new type for transform animation.
     * @param transformType - New Animation Type.
     * @param defaultValue - Value when the button is active, but is not pressed.
     * @param pressedValue - Value when the button is pressed.
     * @param disabledValue - Value when the button is inactive.
     */
    setTransformType(transformType: TransformAnimationType, defaultValue: TransformValue, pressedValue: TransformValue,
                     disabledValue: TransformValue): void {
        this.transformType = transformType;
        this.defaultTransformValue = defaultValue;
        this.pressedTransformValue = pressedValue;
        this.disabledTransformValue = disabledValue;
        if (this._animationType == AnimationType.Transform) {
            this.initializeAnimations();
        }
        this.invokeAnimation(this._animationType);
    }

    /**
     * Initializes button.
     * @private
     */
    private initialize(): void {
        this.initializeAnimators();
        this.initializeST();
        this.initializeScale();
        this.parseLabelText();
        this.initializePrefabs();
        this.initializeColors();
        this.initializeAnimations();
        this.initializeEvent();
        this.initializeTouches();
        this.initializeDestroy();
        this.destructionHelper.setRenderLayerRecursively(this.so, this.so.layer);
        this.transitionAnimationHelperBackground.configureForMeshVisualColor([this.backgroundImage]);
        this.transitionAnimationHelperLabel.configureForTextFillColor([this.labelText]);
        this.initializeEventCallbacks();
    }

    /**
     * Initializes instances of PropertyAnimator.
     * @private
     */
    private initializeAnimators(): void {
        this.buttonAnimation = {
            default: 0.0,
            pressed: 0.0,
            disabled: 0.0,
            currentAnimationState: TransitionState.Default
        }

        const TRANSITION_TIME = 0.15;
        const easingFunction = Easing.Back.Out;
        this.transitionAnimationHelperBackground = new PropertyAnimator({
            scriptComponent: this,
            defaultDuration: TRANSITION_TIME,
            easing: easingFunction
        });

        this.transitionAnimationHelperLabel = new PropertyAnimator({
            scriptComponent: this,
            defaultDuration: TRANSITION_TIME,
            easing: easingFunction
        });

        this.transformAnimationHelper = new PropertyAnimator({
            scriptComponent: this,
            defaultDuration: TRANSITION_TIME,
            easing: easingFunction
        });
    }

    private initializeScale(): void {
        if (this.scale == Scale.Custom) {
            this.scale = this.customScale;
        }
    }

    /**
     * Creates or gets the main ScreenTransform.
     * @private
     */
    private initializeST(): void {
        if (this.setupTransform) {
            this.st = this.destructionHelper.addOrOverrideComponent(this.so, "ScreenTransform") as ScreenTransform;
            this.st.anchors.setCenter(this.center);
        } else {
            this.st = this.destructionHelper.getOrAddComponent(this.so, "ScreenTransform") as ScreenTransform;
        }
    }

    /**
     * Instantiates prefabs and places them on the scene.
     * @private
     */
    private initializePrefabs(): void {
        switch (this.content) {
            case ButtonContent.Icon:
                this.setupIconOnly();
                break;
            case ButtonContent.Label:
                this.setupLabelOnly();
                break;
            case ButtonContent.LabelWithIcon:
                this.setupLabelWithIcon();
                break;
        }
        this.setRenderOrder();
        this.showWithFrameDelay();
    }

    /**
     * Initializes colors of the label and background.
     * @private
     */
    private initializeColors(): void {
        switch (this.buttonColor) {
            case ButtonColor.Default:
                this._defaultBackgroundColor = this.DEFAULT_BACKGROUND_COLOR;
                this._pressedBackgroundColor = PassHelper.copyColorWithDifferentAlpha(this.DEFAULT_BACKGROUND_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledBackgroundColor = this.DISABLED_BACKGROUND_COLOR;
                this._defaultLabelColor = this.DEFAULT_LABEL_COLOR;
                this._pressedLabelColor = PassHelper.copyColorWithDifferentAlpha(this.DEFAULT_LABEL_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledLabelColor = this.DISABLED_LABEL_COLOR;
                break;
            case ButtonColor.Disabled:
                this._defaultBackgroundColor = this.DISABLED_BACKGROUND_COLOR;
                this._pressedBackgroundColor = PassHelper.copyColorWithDifferentAlpha(this.DISABLED_BACKGROUND_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledBackgroundColor = this.DISABLED_BACKGROUND_COLOR;
                this._defaultLabelColor = this.DISABLED_LABEL_COLOR;
                this._pressedLabelColor = PassHelper.copyColorWithDifferentAlpha(this.DISABLED_LABEL_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledLabelColor = this.DISABLED_LABEL_COLOR;
                break;
            case ButtonColor.Primary:
                this._defaultBackgroundColor = this.PRIMARY_BACKGROUND_COLOR;
                this._pressedBackgroundColor = PassHelper.copyColorWithDifferentAlpha(this.PRIMARY_BACKGROUND_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledBackgroundColor = this.DISABLED_BACKGROUND_COLOR;
                this._defaultLabelColor = this.PRIMARY_LABEL_COLOR;
                this._pressedLabelColor = PassHelper.copyColorWithDifferentAlpha(this.PRIMARY_LABEL_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledLabelColor = this.DISABLED_LABEL_COLOR;
                break;
            case ButtonColor.Secondary:
                this._defaultBackgroundColor = this.SECONDARY_BACKGROUND_COLOR;
                this._pressedBackgroundColor = PassHelper.copyColorWithDifferentAlpha(this.SECONDARY_BACKGROUND_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledBackgroundColor = this.DISABLED_BACKGROUND_COLOR;
                this._defaultLabelColor = this.SECONDARY_LABEL_COLOR;
                this._pressedLabelColor = PassHelper.copyColorWithDifferentAlpha(this.SECONDARY_LABEL_COLOR, this.DEFAULT_PRESSED_ALPHA);
                this._disabledLabelColor = this.DISABLED_LABEL_COLOR;
                break;
            case ButtonColor.Custom:
                this._defaultBackgroundColor = this.backgroundColor;
                this._pressedBackgroundColor = this.backgroundColor;
                this._disabledBackgroundColor = this.backgroundColor;
                if (this.content == ButtonContent.Label) {
                    this._defaultLabelColor = this.labelColorInLabelOnly;
                    this._pressedLabelColor = this.labelColorInLabelOnly;
                    this._disabledLabelColor = this.labelColorInLabelOnly;
                } else {
                    this._defaultLabelColor = this.labelColorInLabelWithIcon;
                    this._pressedLabelColor = this.labelColorInLabelWithIcon;
                    this._disabledLabelColor = this.labelColorInLabelWithIcon;
                }
                break;
        }

    }

    /**
     * Initializes animations.
     * @private
     */
    private initializeAnimations(): void {
        switch (this._animationType) {
            case AnimationType.Bounce:
                this.buttonAnimation.default = this.st.scale;
                this.buttonAnimation.pressed = this.buttonAnimation.default.uniformScale(this.BOUNCE_UNIFORM_SCALE);
                this.buttonAnimation.disabled = this.buttonAnimation.default;
                this.transformAnimationHelper.configureForScreenTransformScale(this.st);
                break;
            case AnimationType.Squish:
                this.buttonAnimation.default = this.st.scale;
                this.buttonAnimation.pressed = this.buttonAnimation.default.scale(this.SQUISH_SCALE);
                this.buttonAnimation.disabled = this.buttonAnimation.default;
                this.transformAnimationHelper.configureForScreenTransformScale(this.st);
                break;
            case AnimationType.Transform:
                this.buttonAnimation.default = this.defaultTransformValue;
                this.buttonAnimation.pressed = this.pressedTransformValue;
                this.buttonAnimation.disabled = this.disabledTransformValue;
                switch (this.transformType) {
                    case TransformAnimationType.Offset:
                        this.transformAnimationHelper.configureForScreenTransformOffsetPosition(this.st);
                        break;
                    case TransformAnimationType.Anchor:
                        this.transformAnimationHelper.configureForScreenTransformAnchorPosition(this.st);
                        break;
                    case TransformAnimationType.Rotation:
                        this.transformAnimationHelper.configureForScreenTransformRotation(this.st);
                        break;
                    case TransformAnimationType.Scale:
                        this.transformAnimationHelper.configureForScreenTransformScale(this.st);
                }
            case AnimationType.None:
                break;
            default:
                this.printWarning("trying to change the animation type to an invalid animation!");
                break;
        }
        this.buttonAnimation.currentAnimationState = TransitionState.Default;
    }

    /**
     * Initializes UpdateEvent for button's animations.
     * @private
     */
    private initializeEvent(): void {
        this.updateEvent = this.createEvent("UpdateEvent");
        this.updateEvent.bind(() => this.onUpdate());
        this.updateEvent.enabled = false;
    }

    /**
     * Initializes InteractionComponent.
     * @private
     */
    private initializeTouches(): void {
        this.interactionC = this.destructionHelper.getOrAddComponent(this.backgroundSO, "InteractionComponent") as InteractionComponent;
        this.interactionC.onTouchStart.add((e) => this.touchStart(e));
        this.interactionC.onTouchMove.add((e) => this.touchMove(e));
        this.interactionC.onTouchEnd.add((e) => this.touchEnd(e));
    }

    private initializeDestroy(): void {
        this.createEvent("OnDestroyEvent").bind(() => {
            for (const object of this.destructionHelper.destroyObjects) {
                if (!isNull(object) && !isNull(object.destroy)) {
                    object.destroy();
                }
            }
            this.transformAnimationHelper = null;
            this.transitionAnimationHelperBackground = null;
            this.transitionAnimationHelperLabel = null;
        });
    }

    private initializeEventCallbacks(): void {
        if (this.eventCallbacks && this.callbackType !== CallbackType.None) {
            this.onPressUp.add(BehaviorEventCallbacks.invokeCallbackFromInputs(this, "onPressUp"));
            this.onPressDown.add(BehaviorEventCallbacks.invokeCallbackFromInputs(this, "onPressDown"));
            this.onPress.add(BehaviorEventCallbacks.invokeCallbackFromInputs(this, "onPress"));
        }
    }

    private parseLabelText(): void {
        if (this.content == ButtonContent.Label) {
            this.labelTextString = this.labelInOnlyLabel;
        }
        if (this.content == ButtonContent.LabelWithIcon) {
            this.labelTextString = this.labelInLabelWithIcon;
        }
        this.labelTextString = this.labelTextString.replace(/\\n/g, "\n");
    }

    /**
     * Controls pressing time.
     * @private
     */
    private onUpdate() {
        if (this.pressed) {
            const time = getTime();
            if (time - (this.lastPressTime + getDeltaTime()) > this.FRAME_DELAY) {
                this.pressUp();
                return;
            }
            this.lastPressTime = time;
            this.press();
        }
    }

    /**
     * Processes TouchStart event.
     * @param eventData - TouchStart event data.
     * @private
     */
    private touchStart(eventData: TouchStartEventArgs) {
        if (!this.interactable) {
            return;
        }
        this.pressDown();
    }

    /**
     * Processes TouchMove event.
     * @param eventData - TouchMove event data.
     * @private
     */
    private touchMove(eventData: TouchMoveEventArgs) {
        if (!this.interactable) {
            return;
        }
        this.touchOffBoundsCheck(eventData);
    }

    /**
     * Processes TouchEnd event.
     * @param eventData - TouchEnd event data.
     * @private
     */
    private touchEnd(eventData: TouchEndEventArgs) {
        if (!this.interactable) {
            return;
        }
        this.pressUp();
    }

    /**
     * Handles pressing up and invokes animations.
     * @private
     */
    private pressUp() {
        this.updateEvent.enabled = false;
        if (!this.interactable || (this.initialTrigger && !this.pressed)) {
            this.pressed = false;
            return;
        }
        this.pressed = false;
        this.initialTrigger = true;
        this.buttonState = TransitionState.Default;
        this.invokeVisualTransition();
        this.invokeAnimation(this._animationType);
        this.onPressUp.trigger();
        this.printDebug("Press Up Event!");
    }

    /**
     * Handles pressing down and invokes animations.
     * @private
     */
    private pressDown() {
        if (!this.interactable || (this.initialTrigger && this.pressed)) {
            return;
        }
        this.updateEvent.enabled = true;
        this.pressed = true;
        this.initialTrigger = true;
        this.lastPressTime = getTime();
        this.buttonState = TransitionState.Pressed;
        this.invokeVisualTransition();
        this.invokeAnimation(this._animationType);
        this.onPressDown.trigger();
        this.printDebug("Press Down Event!");
    }

    /**
     * Handles pressing and emits event.
     * @private
     */
    private press() {
        if (!this.interactable) {
            return;
        }
        this.onPress.trigger();
        this.printDebug("Press Event!");
    }

    /**
     * Starts transition animations for background and label.
     * @private
     */
    private invokeVisualTransition() {
        const endStateBackground = this["_" + this.buttonState + "BackgroundColor"];
        this.transitionAnimationHelperBackground.startAnimation(endStateBackground);
        if (this.labelSO && this.labelText) {
            const endStateLabel = this["_" + this.buttonState  + "LabelColor"];
            this.transitionAnimationHelperLabel.startAnimation(endStateLabel);
        }
    }

    /**
     * Starts transforms animation.
     * @param animationType
     * @private
     */
    private invokeAnimation(animationType: AnimationType) {
        switch (animationType) {
            case AnimationType.Bounce:
            case AnimationType.Squish:
            case AnimationType.Transform:
                const endState = this.buttonAnimation[this.buttonState];
                if (endState !== undefined) {
                    this.transformAnimationHelper.startAnimation(endState);
                }
                break;
        }
    }

    /**
     * Handles touch off case.
     * @param eventData - touch event data.
     * @private
     */
    private touchOffBoundsCheck(eventData: TouchStartEventArgs | TouchMoveEventArgs | TouchEndEventArgs) {
        if (!this.backgroundST.containsScreenPoint(eventData.position)) {
            this.pressUp();
        }
    }

    /**
     * Shows button with slight delay to avoid flickering.
     * @private
     */
    private showWithFrameDelay(): void {
        this.setBackgroundColor(this.TRANSPARENT);
        if (this.labelText) {
            this.setLabelColor(this.TRANSPARENT);
        }

        this.sceneEventHelper.delayCb(() => {
            this.setBackgroundColor((this.interactable) ? this._defaultBackgroundColor : this._disabledBackgroundColor);
            if (this.labelText) {
                this.setLabelColor((this.interactable) ? this._defaultLabelColor: this._disabledLabelColor);
            }

            this.initialized = true;
        }, this.FRAME_DELAY);
    }

    /**
     * Sets up button in "Icon Only" mode.
     * @private
     */
    private setupIconOnly(): void {
        this.initializeIcon(this.so);
        this.iconImage.mainPass.baseTex = this.iconInOnlyIcon;
        if (this.setupTransform) {
            this.iconST.anchors.setSize(this.DEFAULT_SIZE.uniformScale(this.scale));
            this.fitBgWithIcon();
        } else {
            if (this.fitBackground) {
                this.fitBgWithIcon();
            } else {
                this.initializeBackground(this.so);
            }
            this.iconImage.stretchMode = StretchMode.Fit;
            this.backgroundImage.stretchMode = StretchMode.Stretch;
        }
    }

    /**
     * Sets up button in "Label Only" mode.
     * @private
     */
    private setupLabelOnly(): void {
        this.initializeLabel(this.so);
        this.labelText.text = this.labelTextString;
        this.initializeBackground(this.labelSO);
        if (this.setupTransform) {
            this.labelText.size = this.DEFAULT_TEXT_SIZE * this.scale;
            this.initializeBaseHeight(this.labelSO);
            this.fitBgWithLabel();
        } else {
            this.initializeBaseHeight(this.labelSO);
            if (this.fitBackground) {
                this.fitBgWithLabel();
            }
            this.backgroundImage.stretchMode = StretchMode.Stretch;
        }
    }

    /**
     * Sets up button in "Label With Icon" mode.
     * @private
     */
    private setupLabelWithIcon(): void {
        this.initializeLabel(this.so);
        this.initializeBackground(this.labelSO);
        this.initializeIcon(this.labelSO);
        this.iconImage.mainPass.baseTex = this.iconInLabelWithIcon;
        this.labelText.text = this.labelTextString;
        if (this.setupTransform) {
            this.labelText.size = this.DEFAULT_TEXT_SIZE * this.scale;
        }
        this.initializeBaseHeight(this.labelSO);
        this.fitBgWithTextAndIcon();
    }

    /**
     * Fits background to icon's size.
     * @private
     */
    private fitBgWithIcon(): void {
        const iconExtentsSO = this.destructionHelper.createExtentsTarget(this.iconSO, this.iconImage, "Icon Extents");
        this.initializeBackground(iconExtentsSO);
        this.backgroundST.anchors.setSize(this.backgroundST.anchors.getSize().uniformScale(this.ICON_RATIO));
    }

    /**
     * Fits background to label's size.
     * @private
     */
    private fitBgWithLabel(): void {
        this.sceneEventHelper.delayCb(() => {
            this.alignText();
        }, this.FRAME_DELAY);
    }

    /**
     * Fits background to the size of label with icon.
     * @private
     */
    private fitBgWithTextAndIcon(): void {
        this.sceneEventHelper.delayCb(() => {
            this.alignTextWithIcon();
            if (this.setupTransform) {
                this.centralizeButton();
            }
        }, this.FRAME_DELAY);
    }

    /**
     * Aligns the icon with the text to ensure the desired size and position of the icons.
     * @private
     */
    private alignTextWithIcon(): void {
        this.alignText();
        const baseHeight: number = this.baseHeightExtentsST.anchors.getSize().y;
        let iconSize = this.iconST.anchors.getSize();
        iconSize.x = baseHeight;
        iconSize.y = baseHeight;
        this.iconST.anchors.setSize(iconSize);
        const iconOffset = iconSize.x * this.ICON_RATIO * (this.st.anchors.getSize().y / this.st.anchors.getSize().x);
        let center = this.iconST.anchors.getCenter();
        center.x = this.labelExtentsST.anchors.getCenter().x + (this.labelExtentsST.anchors.getSize().x / 2 + iconOffset) *
            ((this.iconAlignment == IconAlignment.Right) ? 1 : -1);
        this.iconST.anchors.setCenter(center);
        if (this.iconAlignment == IconAlignment.Right) {
            this.backgroundST.anchors.right = this.backgroundST.anchors.right + iconOffset + iconSize.x / 2;
        } else {
            this.backgroundST.anchors.left = this.backgroundST.anchors.left - iconOffset - iconSize.x / 2;
        }
    }

    /**
     * Aligns the text with the background.
     * @private
     */
    private alignText(): void {
        if (this.setupTransform || this.fitBackground) {
            const labelExtentsSize = this.labelExtentsST.anchors.getSize();
            const ratio = this.baseHeightExtentsST.anchors.getSize().y / labelExtentsSize.y;
            const baseHeight = labelExtentsSize.y * ratio;
            const offsetX = baseHeight * (this.st.anchors.getSize().y / this.st.anchors.getSize().x) * this.LABEL_HEIGHT_RATIO;
            const offsetY = baseHeight;

            this.backgroundST.anchors.setSize(labelExtentsSize);
            ScreenTransformHelper.expandRectSidePositions(this.backgroundST.anchors, offsetX, offsetX, offsetY * this.BACKGROUND_HEIGHT_RATIO,
                offsetY * this.BACKGROUND_HEIGHT_RATIO);
        }
    }

    /**
     * Places button in the center.
     * @private
     */
    private centralizeButton(): void {
        const buttonScreenCenter = this.backgroundST.localPointToScreenPoint(this.backgroundST.anchors.getCenter());
        this.labelST.anchors.setCenter(this.labelST.anchors.getCenter().sub(this.labelST.screenPointToParentPoint(buttonScreenCenter).uniformScale(0.5)));
    }

    /**
     * Sets needed render order.
     * @private
     */
    private setRenderOrder(): void {
        let renderOrderIncrement: number = this._renderOrder;
        if (this.backgroundImage) {
            this.backgroundImage.setRenderOrder(renderOrderIncrement++);
        }
        if (this.labelText) {
            this.labelText.setRenderOrder(renderOrderIncrement);
        }
        if (this.iconImage) {
            this.iconImage.setRenderOrder(renderOrderIncrement);
        }
    }

    /**
     * Sets background's color and icon's alpha.
     * @param color - new color.
     * @private
     */
    private setBackgroundColor(color: vec4): void {
        if (this.backgroundImage) {
            this.backgroundImage.mainPass.baseColor = color;
        } else {
            this.printWarning("trying to change color in the invalid Background Image!");
        }
        if (this.iconImage) {
            PassHelper.setBaseColorAlpha(this.iconImage.mainPass, color.a);
        }
    }

    /**
     * Sets label's color.
     * @param color - new color.
     * @private
     */
    private setLabelColor(color: vec4): void {
        if (this.labelText) {
            this.labelText.textFill.color = color;
        } else {
            this.printWarning("trying to change color in the invalid Label Text!");
        }
    }

    /**
     * Initializes Label.
     * @param parent - parent SceneObject.
     * @private
     */
    private initializeLabel(parent: SceneObject): void {
        this.labelSO = this.destructionHelper.findRecursivelyOrInstantiate(this.so, "Label", this.textPrefab);
        this.labelText = this.destructionHelper.getOrAddComponent(this.labelSO, "Text") as Text;
        this.labelST = this.destructionHelper.getOrAddComponent(this.labelSO, "ScreenTransform") as ScreenTransform;
        this.labelExtentsSO = this.destructionHelper.createExtentsTarget(this.labelSO, this.labelText, "Label Extents");
        this.labelExtentsST = this.destructionHelper.getOrAddComponent(this.labelExtentsSO, "ScreenTransform") as ScreenTransform;
    }

    /**
     * Initializes BaseHeight - text with one stroke.
     * @param parent - parent SceneObject.
     * @private
     */
    private initializeBaseHeight(parent: SceneObject): void {
        this.baseHeightSO = this.destructionHelper.findRecursivelyOrInstantiate(this.so, "Base Height", this.textPrefab);
        this.baseHeightText = this.destructionHelper.getOrAddComponent(this.baseHeightSO, "Text") as Text;
        this.baseHeightText.text = "I";
        this.baseHeightText.size = this.labelText.size;
        this.baseHeightText.textFill.color = this.TRANSPARENT;
        this.baseHeightExtentsSO = this.destructionHelper.createExtentsTarget(this.baseHeightSO, this.baseHeightText, "Base Height Extents");
        this.baseHeightExtentsST = this.destructionHelper.getOrAddComponent(this.baseHeightExtentsSO, "ScreenTransform") as ScreenTransform;
    }

    /**
     * Initializes Background.
     * @param parent - parent SceneObject.
     * @private
     */
    private initializeBackground(parent: SceneObject): void {
        this.backgroundSO = this.destructionHelper.findRecursivelyOrInstantiate(parent, "Background", this.backgroundPrefab);
        this.backgroundST = this.destructionHelper.getOrAddComponent(this.backgroundSO, "ScreenTransform") as ScreenTransform;
        this.backgroundImage = this.destructionHelper.getOrAddComponent(this.backgroundSO, "Image") as Image;
        PassHelper.cloneAndReplaceMaterial(this.backgroundImage);
    }

    /**
     * Initializes Icon.
     * @param parent - parent SceneObject.
     * @private
     */
    private initializeIcon(parent: SceneObject): void {
        this.iconSO = this.destructionHelper.findRecursivelyOrInstantiate(parent, "Icon", this.iconPrefab);
        this.iconST = this.destructionHelper.getOrAddComponent(this.iconSO, "ScreenTransform") as ScreenTransform;
        this.iconImage = this.destructionHelper.getOrAddComponent(this.iconSO, "Image") as Image;
        PassHelper.cloneAndReplaceMaterial(this.iconImage);
    }
}
