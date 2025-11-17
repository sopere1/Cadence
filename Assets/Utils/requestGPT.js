// ChatGPT helper
function requestGPT(question, callback) {
    const request = {
        temperature: 0,
        messages: [{ role: "user", content: question }],
    };

    global.chatGpt.completions(request, (errorStatus, response) => {
        if (!errorStatus && typeof response === "object") {
            const mainAnswer = String(response.choices[0].message.content);
            callback(mainAnswer.trim());
        } else {
            print("GPT error: " + JSON.stringify(response));
            callback(null);
        }
    });
}

module.exports = requestGPT;
