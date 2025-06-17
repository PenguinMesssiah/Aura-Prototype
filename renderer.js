function init() {
    linkEvents();
}

function linkEvents() {
    let welcomeModal  = new bootstrap.Modal(document.getElementById('welcomeModal'))
    let instructModal = document.getElementById('instructModal')
    welcomeModal.show();

    //Populate Chat-Log with LLM Response
    window.LLM.onLLM_Response((msg) => {
        let llmResponse = msg.llmResponse

        addLLM_Response(llmResponse, 1)
    })

    //Show Main View After Modal Close
    instructModal.addEventListener('hidden.bs.modal', event => {
        toggleView()
    })
}

function toggleView() {
    let x = document.getElementById("body-container");
  
    x.style.visibility = 'visible';
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
