export enum CallbackType {
    None,
    Behavior,
    BehaviorCustom,
    CustomFunction
}

declare namespace global {
    let behaviorSystem: BehaviorSystem
}

interface BehaviorScript {
    trigger: () => void;
}

export class BehaviorEventCallbacks {

    static invokeCallbackFromInputs(script: BaseScriptComponent, eventName: string): (data: any) => void {
        const callbackType: CallbackType = script["callbackType"];
        if (isNull(callbackType)) {
            print("Warning: Wrong Callback Type input.");
        }
        switch (callbackType) {
            case CallbackType.Behavior:
                return () => {
                    const behaviors: BehaviorScript[] = script[eventName + "Behaviors"];
                    if (!behaviors) {
                        print("Warning: No event with name: " + eventName);
                        return;
                    }
                    for (const behavior of behaviors) {
                        behavior?.trigger?.();
                    }
                }
            case CallbackType.BehaviorCustom:
                return () => {
                    if (!global.behaviorSystem) {
                        print("The global behavior system has not been instantiated yet! Make sure a Behavior script is present somewhere!");
                        return;
                    }
                    const triggerNames: string[] = script[eventName + "CustomTriggers"];
                    for (const triggerName of triggerNames) {
                        if (triggerName.length == 0) {
                            print("You are trying to send an empty string custom trigger!");
                            continue;
                        }
                        global.behaviorSystem.sendCustomTrigger(triggerName);
                    }
                }
            case CallbackType.CustomFunction:
                return (eventData: any) => {
                    const listenerScript: ScriptComponent = script["customFunctionScript"];
                    if (!listenerScript) {
                        print("Does not have a Script Component with custom functions assigned, but you are trying to invoke custom callbacks!");
                        return;
                    }
                    const functionNames: string[] = script[eventName + "Functions"];
                    for (const functionName of functionNames) {
                        if (functionName.length == 0) {
                            print("You are trying to invoke an empty string function!");
                            continue;
                        }
                        if (!listenerScript[functionName]) {
                            print("Cannot find the " + functionName + " function in the assigned Script Component!");
                            continue;
                        }
                        listenerScript[functionName](eventData);
                    }
                }
        }
    }
}
