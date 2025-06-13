function init() {
    linkEvents();
}

function linkEvents() {
    const information = document.getElementById('info')
    information.innerText = `This app is using Chrome (v${versions.chrome()}), Node.js (v${versions.node()}), and Electron (v${versions.electron()})`

    window.LLM.onLLM_Response((msg) => {
        let llmResponse = msg.llmResponse

        addLLM_Response(llmResponse, 1)
    })
}

function callAPI() {
    let userPromptField = document.getElementById('userPromptField')
    //Update Msg-Box with User Prompt
    addUserElement(userPromptField.value, 0)
    
    //Call LLM and Populate Text Field
    window.LLM.sendMsg(userPromptField.value);
}

function addLLM_Response(pPrompt) {
    // Create a new Div Element & Append
    let newResposne = document.createElement("div");
    //let newContent  = document.createTextNode(pPrompt);
    //newResposne.appendChild(newContent);
    newResposne.innerHTML = pPrompt;
    newResposne.className = "client-chat";
    
    const currentDiv = document.getElementById("msg-box");
    // Find Exising DOM Element & Add
    currentDiv.appendChild(newResposne)
}

function addUserElement(pPrompt, pClassSwitch) {
    // Create a new Div Element & Append
    let newResposne = document.createElement("div");
    let newContent  = document.createTextNode(pPrompt);
    
    newResposne.appendChild(newContent);
    newResposne.className = "user-chat";
    
    const currentDiv = document.getElementById("msg-box");
    // Find Exising DOM Element & Add
    currentDiv.appendChild(newResposne)
}

init();
