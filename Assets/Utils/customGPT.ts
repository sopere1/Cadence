export type callback<Arg> = (args: Arg) => void;

class Event<Arg = void> {
    private subscribers: callback<Arg>[];

    constructor(...callbacks: (callback<Arg> | undefined)[]) {
        this.subscribers = callbacks.filter(
            (cb) => cb !== undefined
        ) as callback<Arg>[];
    }

    public add(handler: callback<Arg>) {
        this.subscribers.push(handler);
    }

    public remove(handler: callback<Arg>) {
        this.subscribers = this.subscribers.filter((h) => {
            return h !== handler;
        });
    }

    public invoke(arg: Arg) {
        this.subscribers.forEach((handler) => {
            handler(arg);
        });
    }
}

interface AzureOpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

const BASE_URL = "https://cadence-instance.openai.azure.com";
const ENDPOINT = "/openai/deployments/gpt-4.1-mini/chat/completions?api-version=2024-02-15-preview";

@component
export class CustomGPTClient extends BaseScriptComponent {
    @input("string") authorizationHeader: string = "";
    
    private internetModule: InternetModule = require("LensStudio:InternetModule");
    private url = BASE_URL + ENDPOINT;

    gptResponseReceived: Event<string>;

    onAwake() {
        this.gptResponseReceived = new Event<string>();
        
        const startEvent = this.createEvent("OnStartEvent");
        startEvent.bind(() => {
            this.runTest();
        });
    }

    public requestCompletion(payload: any, onSuccess?: (response: any) => void, onError?: (error: any) => void) {
        var headers: any = {
            "Content-Type": "application/json",
            "api-key": this.authorizationHeader.replace(/^api-key\s+/i, "")
        };

        this.internetModule
            .fetch(this.url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload)
            })
            .then((response) => response.json())
            .then((data) => {
                var openAIResponse = data as AzureOpenAIResponse;
                
                if (openAIResponse.choices && openAIResponse.choices.length > 0) {
                    var message = openAIResponse.choices[0].message.content;
                    this.gptResponseReceived.invoke(message);
                    
                    if (onSuccess) {
                        onSuccess(data);
                    }
                } else {
                    if (onError) {
                        onError("Unexpected response format");
                    }
                }
            })
            .catch((error) => {
                if (onError) {
                    onError(error);
                }
            });
    }

    private runTest() {
        var payload = {
            messages: [
                {
                    role: "user",
                    content: "Return only the numbers 1 through 10, separated by commas, with nothing else. No explanation, no text, just the numbers."
                }
            ],
            temperature: 0,
            max_tokens: 50
        };
        
        print("[CustomGPTClient] Sending request...");
        
        this.requestCompletion(
            payload,
            (response) => {
                print("[CustomGPTClient] ===== SUCCESS =====");
                var openAIResponse = response as AzureOpenAIResponse;
                if (openAIResponse.choices && openAIResponse.choices.length > 0) {
                    var message = openAIResponse.choices[0].message.content;
                    print("[CustomGPTClient] GPT Response: " + message);
                }
            },
            (error) => {
                print("[CustomGPTClient] ===== FAILED =====");
                print("[CustomGPTClient] Error: " + error);
            }
        );
    }
}
