//Initialize Konva, Size, & Colors
const canvasWidth         = 1200
const canvasHeight        = 500
const canvasWidthMargins  = 1100
const canvasHeightMargins = 400
const deltaWidth          = (canvasWidth-canvasWidthMargins)/2
const deltaHeight         = (canvasHeight-canvasHeightMargins)/2 
const stage = new Konva.Stage({
    container: 'web-view',
    width: canvasWidth,
    height: canvasHeight,
    draggable: false
});
const nodeLayer       = new Konva.Layer();
const nodeFillColor   = '#8AB3D7' 
const nodeStrokeColor = '#2170B4'

const webView   = document.getElementById('web-view')
var nodeList    = []
var nodePosList = []
var cardList    = []

function init() {
    linkEvents();
}

function linkEvents() {
    //Link Stage to Layer
    stage.add(nodeLayer);
    
    let welcomeModal  = new bootstrap.Modal(document.getElementById('welcomeModal'))
    let instructModal = document.getElementById('instructModal')
    welcomeModal.show();

    //Populate Chat-Log with LLM Response
    window.LLM.onLLM_Response((msg) => {
        let llmResponse     = msg.llmResponse
        let llmResponse_arr = msg?.llmResponse_arr
        let showInWeb       = msg.showInWeb
        let showInChat      = msg.showInChat

        console.log("Renderer | Received on onLLM_Response = ", msg)

        //Show Initial Message
        if((showInChat || showInWeb) != 1)
            addLLM_Response('Tell me what\'s on your mind?', 1)

        //Show Ethics Call Message
        if(showInChat) addLLM_Response(llmResponse, 1)
        
        //console.log("llmResponse_arr = ", llmResponse_arr)
        //Show in Web
        if(showInWeb) {
            llmResponse_arr.forEach(element => {
                console.log("Generating Pair for element = ", element)
                generatePair(element);
            });
        }
    })

    //Show Main View After Modal Close
    instructModal.addEventListener('hidden.bs.modal', event => {
        toggleView()
    })
    
    var matchingCard;
    stage.on('click', function (e) {
        //Error Handling       
        if(typeof e.target.id() != 'number') {
            console.log("Canvas Error Handler: Clicked on Invalid Canvas Location")
            return
        }

        matchingCard = cardList[e.target.id()]
        //console.log('matchingCard', matchingCard)
        //console.log('cardList = ', cardList)
        
        //Toggle Visibility
        if(matchingCard.style.visibility == 'hidden') 
            matchingCard.style.visibility = 'visible';
        else 
            matchingCard.style.visibility = 'hidden';
    })
}

function generatePair(pContent) {
    let pos = addNode()
    addCard(pos[0], pos[1], pContent);
    //Maintain List
    nodePosList.push(pos)
}

function addCard(x, y, pContent) {
    //Create Card
    let card     = document.createElement('div')
    let cardBody = document.createElement('div')
    //let title    = document.createElement('h5');
    let cardText = document.createElement('p')
    
    //Apply Class Styling
    card.className     = 'card card-float';
    cardBody.className = 'card-body'
    //title.className    = 'card-title text-center';
    cardText.className = 'card-text text-start'
    
    //Apply Content: Extract Heading & Content
    let headingMatch   = pContent.match(/^\s*\*\*(.+?)\*\*\s*$/gm);
    headingMatch       = headingMatch ? headingMatch[1] : null; 
    //title.innerText    = headingMatch;
    let content        = pContent.replace(/^\s*#+\s.+(\r?\n)/, '').trim();
    cardText.innerHTML = content
    
    //Add to HTML
    //cardBody.appendChild(title);
    cardBody.append(cardText)
    card.appendChild(cardBody);
    webView.appendChild(card);

    //Maintain List
    cardList.push(card)
    
    //Apply Positioning
    card.style.left = (x+65).toString()+'px';
    card.style.top  = (y-card.clientHeight/2).toString()+'px';
    card.style.visibility = 'hidden';
}

function getRandomNumber(pMinIndex, pMaxIndex) {
    return Math.floor(Math.random() * (pMaxIndex - pMinIndex) + pMinIndex)
}

function addNode() {
    let ran_x = getRandomNumber(deltaWidth+350, canvasWidth)
    let ran_y = getRandomNumber(deltaHeight, canvasHeight-deltaHeight) 
    
    console.log("ran_x", ran_x)
    console.log("ran_y", ran_y)
    
    let circle = new Konva.Circle({
        radius: 25,
        name: "temp name",
        id: nodeList.length,
        x: ran_x,
        y: ran_y,
        fill: nodeFillColor,
        stroke: nodeStrokeColor,
        strokeWidth: 1,
        zindex: 2
    })

    nodeList.push(circle)
    nodeLayer.add(circle)
    //console.log('nodeList = ', nodeList.at(0))

    return [ran_x, ran_y];
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
