export type callback<Arg> = (args: Arg) => void;

interface AzureOpenAIResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

const BASE_URL = "https://cadence-instance.openai.azure.com";
const ENDPOINT = "/openai/deployments/gpt-4.1-mini/chat/completions?api-version=2024-02-15-preview";

// Calls Azure ChatGPT resource with parameters in payload
export function requestGPTCompletion(
    authorizationHeader: string,
    payload: any,
    onSuccess?: (response: any) => void,
    onError?: (error: any) => void
) {
    const internetModule = (global as any).INTERNET as InternetModule;
    const url = BASE_URL + ENDPOINT;

    var headers: any = {
        "Content-Type": "application/json",
        "api-key": authorizationHeader.replace(/^api-key\s+/i, "")
    };

    print("[requestGPTCompletion] Sending request to: " + url);

    internetModule
        .fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload)
        })
        .then((response) => response.json())
        .then((data) => {
            var openAIResponse = data as AzureOpenAIResponse;
            if (openAIResponse.choices && openAIResponse.choices.length > 0) {
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
            print("[requestGPTCompletion] HTTP request failed: " + error);
            if (onError) {
                onError(error);
            }
        });
}
