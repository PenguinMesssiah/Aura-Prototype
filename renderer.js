//Initialize Konva, Size, & Colors
const canvasWidth         = 1200
const canvasHeight        = 700
const canvasWidthMargins  = 1100
const canvasHeightMargins = 600
const deltaWidth          = (canvasWidth-canvasWidthMargins)/2
const deltaHeight         = (canvasHeight-canvasHeightMargins)/2 
const stage = new Konva.Stage({
    container: 'web-view',
    width: canvasWidth,
    height: canvasHeight,
    draggable: false
});
const nodeLayer       = new Konva.Layer();
const textLayer       = new Konva.Layer();
const nodeFillColor   = '#8AB3D7' 
const nodeStrokeColor = '#2170B4'
const period          = 2000

const webView = document.getElementById('web-view')
var nodeList = []
var textList = []
var animList = []
var cardList = []


//Linking
function init() {
    linkEvents();
}

function linkEvents() {
    //Link Stage to Layer
    stage.add(nodeLayer);
    stage.add(textLayer);
    
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

        //Check for Start Animation
        if(animList[0]?.isRunning()) animList[0].stop()

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
                //generatePair(element);
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

//Drawing
function addNode() {
    let ran_x = getRandomNumber(deltaWidth+350, canvasWidth)
    let ran_y = getRandomNumber(deltaHeight, canvasHeight-deltaHeight) 
    
    console.log("ran_x", ran_x)
    console.log("ran_y", ran_y)
    
    let circle = new Konva.Circle({
        radius: 25,
        name: "Sub Node",
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

function drawStartAnimation() {
    drawCentralNode()
    drawProcessingMessage()

    //Scaling Animation
    var anim = new Konva.Animation(function(frame) {
        const scale = Math.sin(frame.time * 2 * Math.PI / period) + 5.5;

        nodeList[0].scale({ x: scale/4.75, y: scale/4.75 });
    }, nodeLayer);

    animList.push(anim)
    anim.start();
}

function drawCentralNode() {
    let circle = new Konva.Circle({
        x: canvasWidthMargins/2,
        y: canvasHeightMargins/1.75,
        radius: 175,
        name: "Central Node",
        id: nodeList.length,
        fillLinearGradientStartPoint: { x: -50, y: -50 },
        fillLinearGradientEndPoint: { x: 50, y: 50 },
        fillLinearGradientColorStops: [0, '#CE3608', 1, '#FFA931'],
        //fillRadialGradientColorStops: ['#CE3608', '#8D1F00'],
        //fillRadialGradientStartPoint: { x: 0, y: 0 },
        //fillRadialGradientStartRadius: 0,
        //fillRadialGradientEndPoint: { x: 0, y: 0 },
        //fillRadialGradientEndRadius: 150,
        //fillRadialGradientColorStops: [0, '#8D1F00', 0.5, '#FFA931'],
        strokeWidth: 1,
        zindex: 2
    })

    nodeList.push(circle)
    nodeLayer.add(circle)
}

function drawProcessingMessage() {
    // Simple text
    let processingMsg = new Konva.Text({
    x: canvasWidthMargins/3.25,
    y: 35,
    text: 'Processing your ethical dilemma and\nsystem data to tailor the best response...',
    fontSize: 30,
    fontFamily: 'Poppins',
    fill: 'black'
    });

    textLayer.add(processingMsg)
}

function addLLM_Response(pPrompt) {
    // Create a new Div Element & Append
    let newResposne       = document.createElement("div");
    newResposne.innerHTML = pPrompt;
    newResposne.className = "client-chat";

    let subHeading       = document.createElement("div");
    subHeading.innerText = "Aura"
    subHeading.className = "client-chat-subheading"

    const currentDiv = document.getElementById("msg-box");
    // Find Exising DOM Element & Add
    currentDiv.appendChild(newResposne)
    currentDiv.appendChild(subHeading)
}

function addUserElement(pPrompt, pClassSwitch) {
    // Create a new Div Element & Append
    let newResposne = document.createElement("div");
    let newContent  = document.createTextNode(pPrompt);
    let subHeading  = document.createElement("div");
    
    subHeading.innerText = "You"
    subHeading.className = "client-chat-subheading"
    subHeading.style.margin = "5px 0 5px auto"

    newResposne.appendChild(newContent);
    newResposne.className = "user-chat";
    
    const currentDiv = document.getElementById("msg-box");
    // Find Exising DOM Element & Add
    currentDiv.appendChild(newResposne)
    currentDiv.appendChild(subHeading)
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

//Helper Functions + Toggling
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

    //Draw Opening Node & Text
    if(nodeList.length == 0) {
        drawStartAnimation()
    }
}

function getRandomNumber(pMinIndex, pMaxIndex) {
    return Math.floor(Math.random() * (pMaxIndex - pMinIndex) + pMinIndex)
}



init();
