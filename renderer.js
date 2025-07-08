//Initialize Konva, Size, & Colors
const canvasWidth         = 1200
const canvasHeight        = 725
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
var nodeLayer       = new Konva.Layer();
var textLayer       = new Konva.Layer();
const nodeFillColor   = '#8AB3D7' 
const nodeStrokeColor = '#2170B4'
const period          = 2000
const delta           = 50

const webView  = document.getElementById('web-view')
var progression = 0;
var stageJson;
var animList = []
var finalConsiderations = []


//Linking
function init() {
    linkEvents();
}

function linkEvents() {
    //Link Stage to Layers
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

            let processingMsg = textLayer.find('.Processing_Message')[0]
            processingMsg.hide();

            drawSubNodes();
            drawSubNodeTextSet();

            //Save Here
            stageJson = stage.toJSON();
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
    
    /*
    stage.on('click', function (e) {
    })
    */
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
        
        let centralNode = nodeLayer.find('.Central_Node')[0]
        centralNode.scale({ x: scale/4.75, y: scale/4.75 });
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
        id: 0,
        fillLinearGradientStartPoint: { x: -50, y: -50 },
        fillLinearGradientEndPoint: { x: 50, y: 50 },
        fillLinearGradientColorStops: [0, '#CE3608', 1, '#FFA931'],
        strokeWidth: 1,
        zindex: 2
    })

    nodeLayer.add(circle)
}

function next() {
    animList[0].stop()
    
    let processingMsg = textLayer.find('.Processing_Message')[0]
    processingMsg.hide();

    drawSubNodes()
    drawSubNodeTextSet()

    stageJson = {
        nodeLayer: nodeLayer.toJSON(),
        textLayer: textLayer.toJSON()
    }
    //console.log("Stage Json = ", stageJson )
}

function drawExplorationNode(subNode_idx) {
    let centerNode          = nodeLayer.find('.Central_Node')[0]
    let centerSubNode       = nodeLayer.find('.Sub_Node_1')[0]
    let centerSubNodeHeader = textLayer.find('.subNodeHeader_1')[0]
    let centerSubNodeBody   = textLayer.find('.subNodeContent_1')[0]
    let textNodes           = textLayer.find('Text')
    let subNodes            = nodeLayer.find('Circle')
    let btns                = nodeLayer.find('Label')
    
    //Hide Elements
    textNodes.forEach((element => {
        if(element.name() != 'subNodeHeader_1' &&
            element.name() != 'subNodeContent_1') element.hide()
    }));
    subNodes.forEach((element => {
        if(element.name() != 'Sub_Node_1' && element.name() != 'Central_Node') element.hide()
    }))
    btns.forEach((element => {
        element.hide()
    }))

    //Reposition Canvas Elements
    centerNode.x(canvasWidthMargins/2-500)
    centerNode.radius(175)
    centerSubNode.x(subNodePos[1].x+35)
    centerSubNodeHeader.x(subNodePos[1].x+100)
    centerSubNodeBody.x(subNodePos[1].x+100)

    //Update SubNode Text To Match from (subNode_idx)


    let startPt = centerNode.x()+centerNode.radius()*centerNode.getAbsoluteScale().x
    var baseLine = new Konva.Line({
        points: [startPt, centerSubNode.y(), centerSubNode.x()-centerSubNode.radius(), centerSubNode.y()],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round'
    });
    nodeLayer.add(baseLine)
    
    //Draw Content Nodes
    drawContentNode(startPt,150,centerSubNode.y(),0)
    drawContentNode(startPt,425,centerSubNode.y(),1)

    //Draw & Link Btns
    drawButton(subNodePos[1].x+100, centerSubNode.y()-20,'Add to System',3) 
    drawButton(stage.width()-150, stage.height()-100,'Back',4)
    if(!progression) {
        drawButton(stage.width()-110, stage.height()-100,'Explore Alternatives',5)
        
        let altBtn     = nodeLayer.find(".Sub_Node_Btn_5")[0]
        altBtn.on('click', () => {
            progression = 1;
            redrawDecisionSpace()
        })
    }
    else {
        drawButton(stage.width()-110, stage.height()-100,'Finish',6)
        
        let finishBtn  = nodeLayer.find(".Sub_Node_Btn_6")[0]
        finishBtn.on('click', () => {
            drawActionPoints()
        })
    }

    let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_3")[0]
    let backBtn    = nodeLayer.find(".Sub_Node_Btn_4")[0]
    
    subNodeBtn.on('click', () => {
        let consideration = {
            title: centerSubNodeHeader.getText(),
            content: centerSubNodeBody.getText(),
        }
        finalConsiderations.push(consideration)
        
        console.log("Renderer | Consideration Added to System", consideration)
    })
    backBtn.on('click', () => {
        redrawDecisionSpace()
    })
}

function drawActionPoints() {
    stage.destroyChildren()

    //Draw/show action points
    let actionGroup = document.getElementsByClassName('card-group')
    console.log("actionGroup = ", actionGroup)
    console.log("actionGroup = ", actionGroup.item(0))
    //document.getElementById('actionPointGroup')
    
    actionGroup.item(0).style.visibility = 'visible'
}

function redrawDecisionSpace(pIdx) {
    //Load Old State of Canvas
    stage.destroyChildren();
    nodeLayer = Konva.Node.create(stageJson.nodeLayer)
    textLayer = Konva.Node.create(stageJson.textLayer)
    stage.add(nodeLayer)
    stage.add(textLayer)
    //Link Explore Btns
    for(let i=0;i<3;i++) {
        let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
        //console.log(subNodeBtn)
        subNodeBtn.on('click', () => {
            drawExplorationNode(i)
        })
    }

    //Change Color
    if(progression) {
        for(let i=0;i<3;i++) {
            let centralNode = nodeLayer.find('.Central_Node')[0]
            let subNode   = nodeLayer.find('.Sub_Node_'+i.toString())[0]

            //[0, '#CE3608', 1, '#FFA931']
            centralNode.fillLinearGradientColorStops([0, '#CB98C9', 1, '#9600BC'])
            subNode.fill('#9600BC')
            subNode.stroke('#9600BC')
        }
    }
}

function drawContentNode(pStartX,xIndex,pStartY, idx) {
    var width=240,height=240;
    let x = pStartX + xIndex;
    let y,stakeholder_x,stakeholder_y,content_x,content_y,header_x,header_y;
    switch(idx) {
        case 0:
            y = pStartY-125;
            stakeholder_x = x-width/2
            stakeholder_y = pStartY-160
            content_x     = x-delta-75
            content_y     = pStartY+60
            header_x      = x-width/2
            header_y      = pStartY+30
            break;
        case 1:
            y = pStartY+125;
            stakeholder_x = x-width/2
            stakeholder_y = pStartY+140
            content_x     = x-delta-75
            content_y     = pStartY-90
            header_x      = x-width/2
            header_y      = pStartY-125
            break;
    }
    //Draw Circle
    let circle = new Konva.Circle({
        radius: 12,
        name: "Content_Dot",
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
    //Draw Stakeholder Title
    let stakeholderTxt = new Konva.Text({
        x: stakeholder_x,
        y: stakeholder_y,
        width: width, 
        height: height,
        name: 'Content_Node_Stakeholder',
        text: 'Employee',
        align: 'center',
        fontSize: 18,
        fontFamily: 'Poppins',
        fill: 'black'
    });

    nodeLayer.add(circle)
    nodeLayer.add(vertLine)
    textLayer.add(contentHeader)
    textLayer.add(contentBody)
    textLayer.add(stakeholderTxt)
}

function drawSubNodeTextSet() {
    for(let i=0;i<3;i++) {
        var subNodeHeader = new Konva.Text({
            x: subNodePos[i].x+70,
            y: subNodePos[i].y-40,
            name: 'subNodeHeader_' + i.toString(),
            text: 'Unintended Consequence',
            fontSize: 20,
            fontFamily: 'Calibri',
            fill: 'black'
        });

        var subNodeContent = new Konva.Text({
            x: subNodePos[i].x+70,
            y: subNodePos[i].y-10,
            name: 'subNodeContent_' + i.toString(),
            text: 'Unintended Consequence Body Content',
            fontSize: 12,
            fontFamily: 'Calibri',
            fill: 'black'
        });

        drawButton(subNodePos[i].x+70, subNodePos[i].y-20, 'Explore', i)

        //Link Explore Btns
        let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
        subNodeBtn.on('click', () => {
            drawExplorationNode(i)
        })

        textLayer.add(subNodeHeader)
        textLayer.add(subNodeContent)
    }
}

function drawButton(pX, pY, label, i) {
    var button = new Konva.Label({
        x: pX,
        y: pY+50,
        name: 'Sub_Node_Btn_' + i.toString(),
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
        text: label,
        fontFamily: 'Calibri',
        fontSize: 12,
        padding: 5,
        fill: 'black'
    }));
    
    nodeLayer.add(button)
}

function drawProcessingMessage() {
    let processingMsg = new Konva.Text({
        x: canvasWidthMargins/3.25,
        y: 35,
        name: 'Processing_Message',
        text: 'Processing your ethical dilemma and\nsystem data to tailor the best response...',
        fontSize: 30,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    textLayer.add(processingMsg)
}

function drawSubNodes() {
    for(let i=0; i<subNodePos.length; i++) {
        let circle = new Konva.Circle({
            radius: 50,
            name: "Sub_Node_" + i.toString(),
            x: subNodePos[i].x,
            y: subNodePos[i].y,
            fill: '#FF8650',
            stroke: '#FB5A09',
            strokeWidth: 1,
            zindex: 2
        })
        nodeLayer.add(circle)
    }
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
    let nodeCheck = nodeLayer.find('.Central_Node')
    if(nodeCheck.length == 0) {
        drawStartAnimation()
    }
}


init();
