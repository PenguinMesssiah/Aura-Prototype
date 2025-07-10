//Initialize Konva, Size, & Colors
const canvasWidth         = 1500
const canvasHeight        = 725
const canvasWidthMargins  = 1400
const canvasHeightMargins = 675
const subNodePos = [ 
    {x:canvasWidthMargins/2+100, y:canvasHeightMargins/3.25}, 
    {x:canvasWidthMargins/2+200, y:canvasHeightMargins/1.8}, 
    {x:canvasWidthMargins/2+100, y:canvasHeightMargins/1.25}]
const stage = new Konva.Stage({
    container: 'web-view',
    width: canvasWidth,
    height: canvasHeight,
    draggable: false
});
const LEGAL_EXPERT      = 0
const FINANCIAL_EXPERT  = 1
const SAFETY_EXPERT     = 2
const PRIVACY_EXPERT    = 3
const COMPLIANCE_EXPERT = 4

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
var internalConsequenceList;
var internalPotentialAltList;
var finalConsiderations = []

var i = 0;
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
        let initialCall     = msg?.initialCall
        let expert          = msg?.expert
        let llmResponse     = msg?.llmResponse
        let unintendedConsequence = msg?.consequences
        let followUp              = msg?.followUp
        let potentialAlt    = msg?.potentialAlt

        console.log("Renderer | Received on onLLM_Response = ", msg)
        
        //Check for Start Animation & Hide Processing Msg
        if(!initialCall && animList[0]?.isRunning()) {
            let processingMsg = textLayer.find('.Processing_Message')[0]
            //console.log("This is my ", ++i, " time run.")
            animList[0].stop()

            processingMsg.hide();

            repositionCenterNode();
            drawSubNodes();
            drawSubNodeTextSet(unintendedConsequence);
            internalConsequenceList = unintendedConsequence;

            //Save Here
            stageJson = {
                nodeLayer: nodeLayer.toJSON(),
                textLayer: textLayer.toJSON()
            }
        } else if(initialCall==10) { //Run Stage 2 of Interaction
            //This if statement never runs bc the conditions on this are true for the above condition as well
            //Hence, we get the write data on the drawSubNodeTextSet() call, but no color change
            animList[0].stop()
            //Update the Chat Log
            
            //Update the Web View
            progression              = 1;
            internalPotentialAltList = potentialAlt;
            redrawDecisionSpace();
        }
        
        //Log Initial Message
        if(initialCall) {
            console.log("Renderer | Received Intialization Message = ", msg.llmResponse)
        }
        else {
            addLLM_Response(llmResponse, expert) //Show Ethics Call Message
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
    let full_inital_msg = "<strong>I recevied:</strong> <br>" + userPromptField.value
    addLLM_Response(full_inital_msg)
    
    //Call LLM
    window.LLM.sendMsg(userPromptField.value);

    drawStartAnimation();
}

function drawStartAnimation() {
    nodeLayer.destroyChildren()
    textLayer.destroyChildren()

    drawCentralNode()
    drawProcessingMessage()

    //Scaling Animation
    console.log("Draw Animation Progression Check = ", progression)
    if(!progression) {
        var anim = new Konva.Animation(function(frame) {
            const scale = Math.sin(frame.time * 2 * Math.PI / period) + 5.5;
            
            let centralNode = nodeLayer.find('.Central_Node')[0]
            centralNode.scale({ x: scale/4.75, y: scale/4.75 });
        }, nodeLayer);

        animList.push(anim)
        anim.start();
    } else {
        animList[0].start();
    }
}

function drawCentralNode() {
    let circle = new Konva.Circle({
        x: stage.width()/1.75,
        y: stage.height()/1.9,
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

function repositionCenterNode() {
    let centralNode = nodeLayer.find('.Central_Node')[0]

    centralNode.radius(200)
    centralNode.x(centralNode.x()-stage.width()*.325)
    centralNode.y(canvasHeightMargins/1.8)
}
/*
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
*/

function drawExplorationNode(i,consequenceListItem) {
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
    centerNode.x(canvasWidthMargins/2-475)
    centerNode.radius(200)
    centerSubNode.x(subNodePos[1].x+175)
    centerSubNodeHeader.x(subNodePos[1].x+250)
    centerSubNodeBody.x(subNodePos[1].x+250)

    //Change Text to Match List item
    let desiredSubNodeHeader = textLayer.find('.subNodeHeader_' + i.toString())[0]
    let desiredSubNodeBody   = textLayer.find('.subNodeContent_' + i.toString())[0]
    centerSubNodeHeader.text(desiredSubNodeHeader.text())
    centerSubNodeBody.text(desiredSubNodeBody.text())
    centerSubNodeBody.y(centerSubNodeHeader.y()+centerSubNodeHeader.height()+10)

    let startPt = centerNode.x()+centerNode.radius()*centerNode.getAbsoluteScale().x
    var baseLine = new Konva.Line({
        points: [startPt, centerSubNode.y(), centerSubNode.x()-centerSubNode.radius(), centerSubNode.y()],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round'
    });
    nodeLayer.add(baseLine)
    
    //Draw Content Nodes
    drawContentNode(startPt,150,centerSubNode.y(),0,consequenceListItem.stakeholders[0])
    drawContentNode(startPt,425,centerSubNode.y(),1,consequenceListItem.stakeholders[1])

    //Draw & Link Btns
    drawButton(centerSubNode.x()+75, centerSubNodeBody.y(),'Add to System',3) 
    drawButton(stage.width()-150, stage.height()-100,'Back',4)
    if(progression) {
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
        
        //Progress Interaction
        progression = 1;
        //Call LLM and Populate Text Field
        let msg = "The user is most concerned about the following unintended consequence: \n" +
            consideration.title + ", regarding : " + consideration.content + "\nFollow the " +
            "provided JSON format to provide potential alternative course of actions that " + 
            "addresses the unintended consequences. In your response, provide at least one " +
            "positive and negative consequence of each potential alternative, respectively." +
            "Additionally, you will receive answers to the clarification question's you asked requested" +
            "earlier. Use theses to increase the detail of the potential altnerative actions." 
        console.log("msg = ", msg)
        window.LLM.sendMsg(msg);

        //Loading Animation
        drawStartAnimation();
    })
    backBtn.on('click', () => {
        console.log("progression 1 check = ", progression)
        console.log("Ran redrawDecisionSpace")
        redrawDecisionSpace()
    })
}

function drawLoadingState() {

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

function redrawDecisionSpace() {
    //Load Old State of Canvas
    stage.destroyChildren();
    nodeLayer = Konva.Node.create(stageJson.nodeLayer)
    textLayer = Konva.Node.create(stageJson.textLayer)
    stage.add(nodeLayer)
    stage.add(textLayer)

    //Update Content on SubNodeText
    if(progression) {

    }
    
    //Link Explore Btns
    for(let i=0;i<3;i++) {
        let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
        //console.log(subNodeBtn)
        subNodeBtn.on('click', () => {
            if(!progression) {
                drawExplorationNode(i, internalConsequenceList[i])
            } else {
                drawExplorationNode(i, internalPotentialAltList[i])
            }
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

function drawContentNode(pStartX,xIndex,pStartY, idx, pStakeholder) {
    var width=240,height=240;
    let x = pStartX + xIndex;
    let y,stakeholder_x,stakeholder_y,content_x,content_y,header_x,header_y;
    switch(idx) {
        case 0:
            y = pStartY-125;
            stakeholder_x = x-width/2
            stakeholder_y = pStartY-160
            content_x     = x-delta-75
            content_y     = pStartY+100
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
            header_y      = pStartY-150
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
        width: width+75,
        //height: height,
        name: 'Content_Node_Stakeholder',
        text: pStakeholder.trade_off_subtitle,
        align: 'center',
        fontSize: 22,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    contentHeader.x(circle.x()-contentHeader.width()/2)
    //Draw Subtitle & Body Content
    let contentBody = new Konva.Text({
        x: content_x,
        y: content_y,
        width: width, 
        //height: height,
        name: 'Content_Node_Header',
        text: pStakeholder.potential_impact_summary,
        align: 'center',
        fontSize: 12,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    contentBody.x(circle.x()-contentBody.width()/2)
    contentBody.y(contentHeader.y()+contentHeader.height()+10)
    //Draw Stakeholder Title
    let stakeholderTxt = new Konva.Text({
        x: stakeholder_x,
        y: stakeholder_y,
        width: width, 
        //height: height,
        name: 'Content_Node_Stakeholder',
        text: pStakeholder.name,
        align: 'center',
        fontSize: 18,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    stakeholderTxt.x(circle.x()-stakeholderTxt.width()/2)

    nodeLayer.add(circle)
    nodeLayer.add(vertLine)
    textLayer.add(contentHeader)
    textLayer.add(contentBody)
    textLayer.add(stakeholderTxt)
}

function drawSubNodeTextSet(consequenceList) {
    for(let i=0;i<consequenceList.length;i++) {
        if(i==3) break; //Error Check: Hard Limit
        
        //Current Consequence
        let cc       = consequenceList[i];
        let header   = cc.title
        let subtitle = cc.subtitle

        var subNodeHeader = new Konva.Text({
            x: subNodePos[i].x+70,
            y: subNodePos[i].y-40,
            width: 280,
            name: 'subNodeHeader_' + i.toString(),
            text: header,
            fontSize: 20,
            fontFamily: 'Calibri',
            fill: 'black'
        });

        var subNodeContent = new Konva.Text({
            x: subNodePos[i].x+70,
            y: (subNodePos[i].y-40)+subNodeHeader.height()+10,
            width: 250,
            name: 'subNodeContent_' + i.toString(),
            text: subtitle,
            fontSize: 12,
            fontFamily: 'Calibri',
            fill: 'black'
        });

        drawButton(subNodePos[i].x+70, subNodeContent.y()-10, 'Explore', i)

        //Link Explore Btns
        let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
        subNodeBtn.on('click', () => {
            if(progression) {
                //Draw Exploration Node for Potential Alt
                console.log("Renderer | Made it here, where potentialALt = ", internalPotentialAltList)
            } else {
                drawExplorationNode(i, consequenceList[i])
            }
        })

        textLayer.add(subNodeHeader)
        textLayer.add(subNodeContent)
    }
}

/*
function makeTextResizeable() {
    for(let i=0;i<5;i++) {
        var textNode = textLayer.find('.')
        
    }
    tr = new Konva.Transformer({
        boundBoxFunc: function (oldBoundBox, newBoundBox) {
            if (newBoundBox.width > 200 || newBoundBox.width < textNode.fontSize()) {
            return oldBoundBox;
            } else if (newBoundBox.height < textNode.fontSize()) {
            return oldBoundBox;
            }
            return newBoundBox
        }
    });
    textLayer.add(tr);
    tr.attachTo(textNode);
    
    
    tr.on('transform', function() {
        textNode.setAttrs({
            width: textNode.width() * textNode.scaleX(),
            height: textNode.height() * textNode.scaleY(),
            scaleX: 1,
            scaleY: 1,
        });
    })
}
*/

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
    
    //console.log("Button name = ", button.name())
    //console.log("button label = ", label)
    nodeLayer.add(button)
}

function drawProcessingMessage() {
    let processingMsg = new Konva.Text({
        x: stage.width()/1.75,
        y: 35,
        name: 'Processing_Message',
        text: 'Processing your ethical dilemma and\nsystem data to tailor the best response...',
        fontSize: 30,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    processingMsg.x((stage.width()/1.75)-processingMsg.width()/2)
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

function addLLM_Response(pPrompt, pExpert) {
    // Create a new Div Element & Append
    let newResposne       = document.createElement("div");
    let innerText         = "Aura" 
    newResposne.innerHTML = pPrompt;
    newResposne.className = "client-chat";

    switch(pExpert) {
        case LEGAL_EXPERT:
            innerText += ", Corporate Lawyer"
            break;
        case FINANCIAL_EXPERT:
            innerText += ", Financial Analyst"
            break;
        case SAFETY_EXPERT:
            innerText += ", Safety Manager"
            break;
        case PRIVACY_EXPERT:
            innerText += ", Data Privacy Officer"
            break;
        case COMPLIANCE_EXPERT:
            innerText += ", Compliance Engineer"
            break;
        default:
            break;
    }

    let subHeading       = document.createElement("div");
    subHeading.innerText = innerText
    subHeading.className = "client-chat-subheading"

    const currentDiv = document.getElementById("msg-box");
    // Find Exising DOM Element & Add
    currentDiv.appendChild(subHeading)
    currentDiv.appendChild(newResposne)
}

/*
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
*/

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
