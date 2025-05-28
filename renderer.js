function init() {
    linkEvents();
}

function linkEvents() {
    const information = document.getElementById('info')
    information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

    window.LLM.onResponse((message) => {
        let llmResponse = message.llmResponse

        addElement(llmResponse, 1)
    })
}

function callAPI() {
    let userPromptField = document.getElementById('userPromptField')
    //Update Msg-Box with User Prompt
    addElement(userPromptField.value, 0)
    
    //Call LLM and Populate Text Field
    window.LLM.sendMsg(userPromptField.value);
}

function addElement(pPrompt, pClassSwitch) {
    // Create a new Div Element & Append
    let newResposne = document.createElement("div");
    let newContent  = document.createTextNode(pPrompt);
    newResposne.appendChild(newContent);
    
    switch(pClassSwitch) {
        case 0:
            newResposne.className = "user-chat";
            break;
        case 1:
            newResposne.className = "client-chat";
            break;
    }
    
    const currentDiv = document.getElementById("msg-box");
    // Find Exising DOM Element & Add
    currentDiv.appendChild(newResposne)
}

init();
