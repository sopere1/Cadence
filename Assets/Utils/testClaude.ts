// This script tests Claude with the generateCrds prompt and prints the result
import { requestGPTCompletion } from './claude';
const { generateCrds } = require('../Constants/prompts.js');

@component
export class TestClaude extends BaseScriptComponent {
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
        // Use generateCrds with "C major"
        const prompt = generateCrds("C major");

        // Create the payload
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

        print("[TestClaude] ===== Starting Claude Test =====");
        print("[TestClaude] API Key: " + (this.apiKey ? "Provided" : "MISSING - Please set in Inspector!"));
        print("[TestClaude] Using generateCrds prompt for C major");
        print("[TestClaude] Prompt length: " + prompt.length + " characters");

        // Call Claude
        requestGPTCompletion(
            this.apiKey,
            payload,
            (response: any) => {
                print("[TestClaude] ===== SUCCESS =====");
                if (response && response.choices && response.choices.length > 0) {
                    var message = response.choices[0].message.content;
                    print("[TestClaude] Claude Response: " + message);
                } else {
                    print("[TestClaude] Unexpected response format:");
                    print("[TestClaude] " + JSON.stringify(response));
                }
            },
            (error: any) => {
                print("[TestClaude] ===== FAILED =====");
                print("[TestClaude] Error: " + error);
            }
        );
    }
}
