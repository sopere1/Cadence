// This script calls GPT with a simple prompt and prints the result

import { requestGPTCompletion } from './customGPT';

@component
export class TestCustom extends BaseScriptComponent {
    @input("string") apiKey: string = "";
    private internetModule: InternetModule = require("LensStudio:InternetModule");

    onAwake() {
        (global as any).INTERNET = this.internetModule;
        const startEvent = this.createEvent("OnStartEvent");
        startEvent.bind(() => {
            this.runTest();
        });
    }

    private runTest() {
        print("[TestCustom] Starting test...");

        // Create the payload with our test prompt
        var payload = {
            messages: [
                {
                    role: "user",
                    content: "return the text hello and nothing else"
                }
            ],
            temperature: 0,
            max_tokens: 50
        };

        requestGPTCompletion(
            this.apiKey,
            payload,
            (response: any) => {
                print("[TestCustom] ===== SUCCESS =====");
                if (response && response.choices && response.choices.length > 0) {
                    var message = response.choices[0].message.content;
                    print("[TestCustom] GPT Response: " + message);
                } else {
                    print("[TestCustom] Unexpected response format: " + JSON.stringify(response));
                }
            },
            (error: any) => {
                print("[TestCustom] ===== FAILED =====");
                print("[TestCustom] Error: " + error);
            }
        );
    }
}
