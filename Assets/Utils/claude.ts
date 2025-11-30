export type callback<Arg> = (args: Arg) => void;

interface ClaudeResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    id: string;
    model: string;
    role: string;
    stop_reason: string;
    stop_sequence: any;
    type: string;
    usage: {
        input_tokens: number;
        output_tokens: number;
    };
}

const BASE_URL = "https://cadence-claude-resource.services.ai.azure.com";
const ENDPOINT = "/anthropic/v1/messages";
const DEPLOYMENT_NAME = "claude-sonnet-4-5";
const API_VERSION = "2023-06-01";

// Calls Azure Foundry Claude resource
export function requestGPTCompletion(
    authorizationHeader: string,
    payload: any,
    onSuccess?: (response: any) => void,
    onError?: (error: any) => void
) {
    const internetModule = (global as any).INTERNET as InternetModule;
    const url = BASE_URL + ENDPOINT + "?api-version=" + API_VERSION;

    var headers: any = {
        "Content-Type": "application/json",
        "x-api-key": authorizationHeader.replace(/^api-key\s+/i, "").replace(/^x-api-key\s+/i, ""),
        "anthropic-version": "2023-06-01"
    };

    print("[requestGPTCompletion] Sending request to Claude: " + url);

    // Transform OpenAI-style payload to Claude format
    const claudePayload = {
        model: DEPLOYMENT_NAME,
        max_tokens: payload.max_tokens || 2000,
        messages: payload.messages || [],
        temperature: payload.temperature || 0
    };

    internetModule
        .fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(claudePayload)
        })
        .then((response) => response.json())
        .then((data) => {
            var claudeResponse = data as ClaudeResponse;
            
            // Extract text from Claude response format
            if (claudeResponse.content && claudeResponse.content.length > 0) {
                const textContent = claudeResponse.content.find(c => c.type === "text");
                if (textContent && onSuccess) {
                    // Transform to OpenAI-like format for compatibility
                    const openAIFormat = {
                        choices: [{
                            message: {
                                content: textContent.text
                            }
                        }]
                    };
                    onSuccess(openAIFormat);
                } else {
                    if (onError) {
                        onError("No text content in response");
                    }
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