// Triggers callback as soon as ChatGPT initialization is done
function waitForChatGPT(script, callback) {
    if (global.chatGpt) {
        callback();
        return;
    }
    const evt = script.createEvent("UpdateEvent");
    evt.bind(() => {
        if (global.chatGpt) {
            evt.enabled = false;
            callback();
        }
    });
}

module.exports = waitForChatGPT;
