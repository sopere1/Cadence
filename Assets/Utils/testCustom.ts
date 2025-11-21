// This script calls GPT with a simple prompt and prints the result
import { requestGPTCompletion } from './customGPT';
const {template} = require('../Constants/prompts.js');

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
        const prompt = template(
            "C major",
            "Cmaj, Dmin, Emin, Fmaj, Gmaj, Amin, Bdim"
        );

        // Create the payload using the imported prompt
        var payload = {
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0,
            max_tokens: 2000
        };

        print("[TestCustom] Calling requestGPTCompletion...");

        // Call the imported function - function signature is: (authorizationHeader, payload, onSuccess, onError)
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
