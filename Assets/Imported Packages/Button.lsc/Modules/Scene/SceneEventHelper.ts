export class SceneEventHelper {

    constructor(private readonly script: ScriptComponent) {}

    delayCb(cb: Function, delay: number): void {
        const delayEv: DelayedCallbackEvent = this.script.createEvent("DelayedCallbackEvent");
        delayEv.bind(() => {
            cb();
            this.script.removeEvent(delayEv);
        });
        delayEv.reset(delay);
    }

    touchEventOutsideExceptionAreas(cbObTap: Function, exceptionAreas: ScreenTransform[]): TouchStartEvent {
        const touchEvent: TouchStartEvent = this.script.createEvent("TouchStartEvent");
        touchEvent.bind((data: TouchStartEvent) => {
            if (!exceptionAreas.some(area => area.containsScreenPoint(data.getTouchPosition()))) {
                cbObTap && cbObTap();
            }
        });
        return touchEvent;
    }
}