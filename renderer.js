//Initialize Konva, Size, & Colors
const canvasWidth         = 1200
const canvasHeight        = 700
const canvasWidthMargins  = 1100
const canvasHeightMargins = 600
const deltaWidth          = (canvasWidth-canvasWidthMargins)/2
const deltaHeight         = (canvasHeight-canvasHeightMargins)/2 
const subNodePos = [ 
    {x:canvasWidthMargins/2+275, y:canvasHeightMargins/3.25}, 
    {x:canvasWidthMargins/2+350, y:canvasHeightMargins/1.8}, 
    {x:canvasWidthMargins/2+275, y:canvasHeightMargins/1.25}]
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
const delta           = 50

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

    //Populate Chat-Log with LLM Response
    window.LLM.onLLM_Response((msg) => {
        let llmResponse     = msg.llmResponse
        let llmResponse_arr = msg?.llmResponse_arr
        let showInWeb       = msg.showInWeb
        let showInChat      = msg.showInChat
        let initalCall      = msg?.initalCall

        console.log("Renderer | Received on onLLM_Response = ", msg)

        //Check for Start Animation & Hide Processing Msg
        if(!initalCall && animList[0]?.isRunning()) {
            animList[0].stop()
            textList[0]?.hide()

            drawSubNodes();
        }
        
        //Log Initial Message
        if((showInChat || showInWeb) != 1)
            console.log("Renderer | Received Intialization Message = ", msg.llmResponse)

        //Show Ethics Call Message
        if(showInChat) addLLM_Response(llmResponse, 1)
        
        //Show in Web
        if(showInWeb) {
            /*
            llmResponse_arr.forEach(element => {
                console.log("Generating Pair for element = ", element)
            });
            */
        }
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

//Drawing Functions 
function showAgentDetailsPage() {
    let header = document.getElementById('onboarding-heading')
    let txt    = document.getElementById('onboarding-text') 
    
    //Change Header & Remove Text
    header.innerText = 'Meet the agents'
    txt.remove()

    //Draw Cards with Agent Definitions
    drawSvgElement('./assets/imgs/allCards.svg')
}

function drawSvgElement(pPathToSVG) {
    //Maybe Make Function Dynamic for DOMelement Width/Height
    let body = document.getElementById('onboarding-body')

    fetch(pPathToSVG)
    .then(response => response.text())
    .then(svgText => {
        let parser = new DOMParser();
        let svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        svgElement = svgDoc.documentElement;
        svgElement.setAttribute("width", "1129");
        svgElement.setAttribute("height", "250");
        body.appendChild(svgElement);
    });
}

function drawChatHome() {
    let onboarding = document.getElementById("onboarding-container")
    let chatHome   = document.getElementById("chatHome-container")

    onboarding.style.visibility = 'hidden';
    chatHome.style.visibility = 'visible';
}

function drawDecisionSpace() {
    let chatHome        = document.getElementById("chatHome-container")
    let main            = document.getElementById("body-container");
    let userPromptField = document.getElementById('chatHome-userPromptField')
    
    //Chat Home -> Decision Space
    chatHome.style.visibility = 'hidden'
    main.style.visibility = 'visible'

    //Update Msg-Box with User Prompt
    addUserElement(userPromptField.value, 0)
    
    //UNCOMMENT____Call LLM and Populate Text Field
    //window.LLM.sendMsg(userPromptField.value);

    drawStartAnimation();
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
        x: canvasWidthMargins/2, //550
        y: canvasHeightMargins/1.75, //343
        radius: 175,
        name: "Central_Node",
        id: nodeList.length,
        fillLinearGradientStartPoint: { x: -50, y: -50 },
        fillLinearGradientEndPoint: { x: 50, y: 50 },
        fillLinearGradientColorStops: [0, '#CE3608', 1, '#FFA931'],
        strokeWidth: 1,
        zindex: 2
    })

    nodeList.push(circle)
    nodeLayer.add(circle)
}

function next() {
    animList[0].stop()
    textList[0]?.hide()

    drawSubNodes()
    drawDetails()
}

function drawExplorationNode() {
    //Hide Other Txt Elements
    textList.forEach((element => {
        if(element.id() != 1) element.hide()
    }));
    //Hide Other Node Elements
    nodeList.forEach((element => {
        if(element.id() != 2 //Sub Node 2
            && element.id() != 0 //Center Node
            && element.id() != 5) //Explore Btn 
            element.hide()
    }))

    //Perform Expansion: If time, add animation here
    /*
    let amplitude = 50;
    const anim = new Konva.Animation(function(frame) {
    nodeList[2].x(
        amplitude * Math.sin((frame.time * 2 * Math.PI) / period) +
        window.innerWidth / 2
        );
    }, nodeLayer);
    anim.start();
    */
    let centerNode = nodeLayer.find('.Central_Node')[0]
    let centerSubNode    = nodeLayer.find('.Sub_Node_1')[0]
    let centerSubNodeTxt = textLayer.find('.Sub_Node_1_Txt')[0]
    let centerSubNodeBtn = nodeLayer.find('.Sub_Node_Btn')[1]

    //console.log("centerSubNode = ", centerSubNode)
    //console.log("centerSubNodeTxt = ", centerSubNodeTxt)
    //console.log("centerSubNodeBtn = ", centerSubNodeBtn)

    //Reposition Canvas Elements
    centerNode.x(canvasWidthMargins/2-500)
    centerNode.radius(175)
    centerSubNode.x(subNodePos[1].x+35) //Update Sub Node 2
    centerSubNodeTxt.x(subNodePos[1].x+100) //Update Sub Node 2 Text
    centerSubNodeBtn.x(subNodePos[1].x+100) //Update Sub Node 2 Btn

    //console.log("centerNode.x = ", centerNode.x())
    //console.log("centerSubNode.x = ", centerSubNode.x())
    //console.log("centerNode.getAbsoluteScale().x = ", centerNode.getAbsoluteScale().x)

    // line segments with a length of 33px with a gap of 10px
    let startPt = centerNode.x()+centerNode.radius()*centerNode.getAbsoluteScale().x
    var baseLine = new Konva.Line({
        points: [startPt, centerSubNode.y(), centerSubNode.x()-centerSubNode.radius(), centerSubNode.y()],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round'
    });

    nodeLayer.add(baseLine)
    
    //Draw Entire Content Node
    let idx = 0;
    drawContentNode(startPt,150,centerSubNode.y(),0)
    drawContentNode(startPt,425,centerSubNode.y(),1)
}

function drawContentNode(pStartX,xIndex,pStartY, idx) {
    var width=240,height=240;
    let x = pStartX + xIndex;
    let y,stakeholder_x,stakeholder_y,content_x,content_y,header_x,header_y;
    switch(idx) {
        case 0:
            y = pStartY-125;
            stakeholder_x = x-delta
            stakeholder_y = pStartY+20
            content_x     = x-delta-75
            content_y     = pStartY+60
            header_x      = x-width/2
            header_y      = pStartY+30
            break;
        case 1:
            y = pStartY+125;
            stakeholder_x = x-delta
            stakeholder_y = pStartY-20
            content_x     = x-delta-75
            content_y     = pStartY-80
            header_x      = x-width/2
            header_y      = pStartY-125
            break;
    }
    //Draw Circle
    let circle = new Konva.Circle({
        radius: 12,
        name: "Content_Dot",
        id: nodeList.length,
        x: x,
        y: pStartY,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1,
        zindex: 2
    })
    //Draw Line
    let vertLine = new Konva.Line({
        points: [x, pStartY, x, y],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round'
    });
    //Draw Content Heading
    let contentHeader = new Konva.Text({
        x: header_x,
        y: header_y,
        width: width,
        name: 'Content_Node_Stakeholder',
        text: 'Subtitle',
        align: 'center',
        fontSize: 22,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    //Draw Subtitle & Body Content
    let contentBody = new Konva.Text({
        x: content_x,
        y: content_y,
        width: width, 
        height: height,
        name: 'Content_Node_Header',
        text: 'Transitioning to semi-autonomous systems may lead to workforce reductions or require significant retraining. The human cost here is substantial.',
        align: 'center',
        fontSize: 12,
        fontFamily: 'Poppins',
        fill: 'black'
    });

    textList.push(contentHeader)
    textList.push(contentBody)
    nodeList.push(circle)
    nodeLayer.add(circle)
    nodeLayer.add(vertLine)
    textLayer.add(contentHeader)
    textLayer.add(contentBody)
}

function drawDetails() {
   //Sub Node 0: Details & Button
    var subNodeText_0 = new Konva.Text({
        x: subNodePos[0].x+70,
        y: subNodePos[0].y-40,
        id: 0,
        text: 'Unintended Consequence\nbody goes here',
        fontSize: 16,
        fontFamily: 'Calibri',
        fill: 'black'
    });
    drawButton(subNodePos[0].x+70, subNodePos[0].y-40)

    var subNodeText_1 = new Konva.Text({
        x: subNodePos[1].x+70,
        y: subNodePos[1].y-40,
        name:'Sub_Node_1_Txt',
        id: 1,
        text: 'Unintended Consequence\nbody goes here',
        fontSize: 16,
        fontFamily: 'Calibri',
        fill: 'black'
    });
    drawButton(subNodePos[1].x+70, subNodePos[1].y-40)

    var subNodeText_2 = new Konva.Text({
        x: subNodePos[2].x+70,
        y: subNodePos[2].y-40,
        id: 2,
        text: 'Unintended Consequence\nbody goes here',
        fontSize: 16,
        fontFamily: 'Calibri',
        fill: 'black'
    });
    drawButton(subNodePos[2].x+70, subNodePos[2].y-40)

    //Update List
    textList.push(subNodeText_0)
    textList.push(subNodeText_1)
    textList.push(subNodeText_2)

    textLayer.add(subNodeText_0)
    textLayer.add(subNodeText_1)
    textLayer.add(subNodeText_2)
}

function drawButton(pX, pY) {
    var button = new Konva.Label({
        x: pX,
        y: pY+50,
        name: 'Sub_Node_Btn',
        id: nodeList.length,
        opacity: 0.75
    });

    button.add(new Konva.Tag({
        cornerRadius: 25,
        fill: '#F9F6F6',
        lineJoin: 'round',
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: 10,
        shadowOpacity: 0.2
    }));

    button.add(new Konva.Text({
        text: 'Explore',
        fontFamily: 'Calibri',
        fontSize: 12,
        padding: 5,
        fill: 'black'
    }));
    //Update List
    nodeList.push(button)

    nodeLayer.add(button)
}

function drawProcessingMessage() {
    let processingMsg = new Konva.Text({
        x: canvasWidthMargins/3.25,
        y: 35,
        id: 99,
        text: 'Processing your ethical dilemma and\nsystem data to tailor the best response...',
        fontSize: 30,
        fontFamily: 'Poppins',
        fill: 'black'
    });

    textList.push(processingMsg)
    textLayer.add(processingMsg)
}

function drawSubNodes() {
    for(let i=0; i<subNodePos.length; i++) {
        let circle = new Konva.Circle({
            radius: 50,
            name: "Sub_Node_" + (i).toString(),
            id: nodeList.length,
            x: subNodePos[i].x,
            y: subNodePos[i].y,
            fill: '#FF8650',
            stroke: '#FB5A09',
            strokeWidth: 1,
            zindex: 2
        })

        nodeList.push(circle)
        nodeLayer.add(circle)
    }

    //console.log('nodeList = ', nodeList.at(0))
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

//Helper Functions + Toggling
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
