/*
 * Copyright 2025 William Scott
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//Initialize Konva, Size, & Colors
const canvasWidth         = 1500
const canvasHeight        = 725
const canvasWidthMargins  = 1400
const canvasHeightMargins = 675
const subNodePos = [ 
    {x:canvasWidthMargins/2+50, y:canvasHeightMargins/4.5}, 
    {x:canvasWidthMargins/2+150, y:canvasHeightMargins/1.8}, 
    {x:canvasWidthMargins/2+50, y:canvasHeightMargins/1.175}]
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
const FRONTLINE_EXPERT  = 5


var nodeLayer = new Konva.Layer();
var textLayer = new Konva.Layer();
const period  = 2000
const delta   = 50

const webView = document.getElementById('web-view')
var progression  = 0;
var stageTwoInit = 0;
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
        let potentialAlt          = msg?.potentialAlt
        let reflection = msg?.reflection
        let actionPts  = msg?.actionPts
        let farewellMsg = msg?.farewellMsg

        console.log("Renderer | Received on onLLM_Response = ", msg)
        
        //Check for Start Animation & Hide Processing Msg
        if(!initialCall && unintendedConsequence!=undefined && animList[0]?.isRunning()) {
            console.log("\nRenderer | Initiated Stage 1")
            let processingMsg = textLayer.find('.Processing_Message')[0]
            let instruct    = "Unintended Consequences"
            let description = "Explore the nodes before choosing one to add to the system."
            //console.log("This is my ", ++i, " time run.")
            animList[0].stop()

            processingMsg.hide();

            repositionCenterNode();
            drawSubNodes();
            drawSubNodeTextSet(unintendedConsequence);
            drawProgressBar(instruct, description, 0);
            internalConsequenceList = unintendedConsequence;

            //Save Here
            stageJson = {
                nodeLayer: nodeLayer.toJSON(),
                textLayer: textLayer.toJSON()
            }
        } else if(!initialCall && potentialAlt!=undefined && animList[0]?.isRunning()) { //Run Stage 2 of Interaction
            console.log("\nRenderer | Initiated Stage 2")
            animList[0].stop()
            let instruct    = "Potential Alternatives"
            let description = "Explore the nodes before choosing one to add to the system."
            
            //Update the Web View
            progression              = 1;
            stageTwoInit             = 1;
            internalPotentialAltList = potentialAlt;
            redrawDecisionSpace(1);
            drawSubNodeTextSet(potentialAlt);
            drawProgressBar(instruct, description, 1);

            //Save Here
            stageJson = {
                nodeLayer: nodeLayer.toJSON(),
                textLayer: textLayer.toJSON()
            }
        }else if(!initialCall && actionPts!=undefined && animList[0]?.isRunning()) {
            console.log("\nRenderer | Initiated Finial Stage")
            animList[0].stop()
             let instruct   = "Action Points"
            let description = "Explore the recommendations for actionable steps you can take."

            drawActionPoints(actionPts)
            drawProgressBar(instruct, description, 2);
            addLLM_Response(reflection,-1)
            addLLM_Response(farewellMsg,-1)
        }
        
        //Log Initial Message
        if(initialCall) {
            console.log("Renderer | Received Intialization Message = ", msg.llmResponse)
        }
        else {
            addLLM_Response(llmResponse, expert) //Show Ethics Call Message
        }
    })
}

//Drawing Functions 
function drawProgressBar(pHeader, pBody, pId) {
    let header           = document.getElementById('aura-header')
    let progressBarTitle = document.getElementById("progressBar-header");
    let progressBarBody  = document.getElementById("progressBar-body"); 
    let oldSVG           = document.getElementById('progressBar_svg')

    if(progressBarBody == null && progressBarTitle == null) {
        progressBarTitle = document.createElement("h5");
        progressBarBody  = document.createElement("p"); 
        progressBarTitle.innerText = pHeader
        progressBarBody.innerText  = pBody
        progressBarBody.id         = 'progressBar-body'
        progressBarTitle.id        = 'progressBar-header'
        progressBarBody.className  = "progressBar-body"
        progressBarBody.classList.remove('h3')
    } else {
        progressBarTitle.innerText = pHeader
        progressBarBody.innerText  = pBody
    }
    
    let svgPath;
    switch(pId) {
        case 0:
            svgPath = "./assets/imgs/progressBar_unintended.svg"
            break;
        case 1:
            svgPath = "./assets/imgs/progressBar_potentialAlt.svg"
            //console.log("old svg = ", oldSVG)
            oldSVG?.remove()
            break;
        case 2:
            svgPath = "./assets/imgs/progressBar_actionPts.svg"
            //console.log("old svg = ", oldSVG)
            oldSVG?.remove()
            break;
    }
    fetch(svgPath)
    .then(response => response.text())
    .then(svgText => {
        let parser = new DOMParser();
        let svgDoc = parser.parseFromString(svgText, "image/svg+xml");
        svgElement = svgDoc.documentElement;
        svgElement.setAttribute("width", "387");
        svgElement.setAttribute("height", "10");
        svgElement.setAttribute("id", "progressBar_svg");
        header.appendChild(svgElement);
        header.appendChild(progressBarTitle)
        header.appendChild(progressBarBody)
    });
}
    

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
    
    //Error Check if Input Not Long Enough
    if(userPromptField.value.length <= 200) {
        console.log("Renderer | Input not long enough")
        return;
    }

    //Chat Home -> Decision Space
    chatHome.style.visibility = 'hidden'
    main.style.visibility = 'visible'

    //Update Msg-Box with User Prompt
    let full_inital_msg = "<strong style=font-weight:600;>I recevied:</strong> <br>" + userPromptField.value
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
            //console.log("centralNode = ", centralNode)
            centralNode.scale({ x: scale/4.75, y: scale/4.75 });
        }, nodeLayer);

        animList.push(anim)
        anim.start();
    } else {
        let centralNode   = nodeLayer.find('.Central_Node')[0]
        let processingMsg = textLayer.find('.Processing_Message')[0]

        centralNode.fillLinearGradientColorStops([0, '#CB98C9', 1, '#9600BC']);
        processingMsg.y(processingMsg.y()-20)
        processingMsg.text("Generating potential alternatives based\n     on your decision and system data\n             to tailor the best response...")
        processingMsg.lineHeight(1.5);
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
        fillLinearGradientStartPoint: { x: 175, y: -175 },
        fillLinearGradientEndPoint: { x: 20, y: 150 },
        fillLinearGradientColorStops: [1,'rgba(206, 54, 8, .8)', 0, 'rgba(255, 169, 49, .8)'],
        fillRadialGradientStartPoint: { x: 175, y: 175},
        fillRadialGradientEndPoint: { x: 175, y: 0},
        fillRadialGradientStartRadius: 25,
        fillRadialGradientEndRadius: 175,
        fillRadialGradientColorStops: [0, '#8D2501', 1, '#FB9F54'],
        strokeWidth: 1,
        zindex: 2
    })

    nodeLayer.add(circle)
}

function repositionCenterNode() {
    let centralNode = nodeLayer.find('.Central_Node')[0]

    centralNode.skewX(0)
    centralNode.skewY(0)
    centralNode.radius(220)
    centralNode.x(centralNode.x()-stage.width()*.2975)
    centralNode.y(canvasHeightMargins/1.8)
}

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
    centerNode.x(canvasWidthMargins/2-460)
    centerNode.radius(210)
    centerSubNode.x(subNodePos[1].x+250)
    centerSubNodeHeader.x(subNodePos[1].x+325)
    centerSubNodeBody.x(subNodePos[1].x+325)

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
        strokeWidth: 1,
        lineJoin: 'round'
    });
    nodeLayer.add(baseLine)
    
    //Draw Content Nodes
    drawContentNode(startPt,150,centerSubNode.y(),0,consequenceListItem.stakeholders[0])
    drawContentNode(startPt,425,centerSubNode.y(),1,consequenceListItem.stakeholders[1])

    //Draw & Link Btns
    drawButton(centerSubNode.x()+75, centerSubNodeHeader.y()+centerSubNodeHeader.height()+centerSubNodeBody.height()+18,'Explore mitigations',3) 
    drawButton(stage.width()-150, stage.height()-100,'View All',4)
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
        let msg = "CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. No other text. \
                \
                JSON VALIDATION CHECKLIST - Verify before responding: \
                □ Every { has a matching } \
                □ Every [ has a matching ] \
                □ Every \" has a matching \" \
                □ No trailing commas after last items \
                □ All strings properly escaped \
                □ Structure matches the required schema exactly \
                \
            TASK: Think deeply to identify and evaluate three potential alternatives that mitigate " +
            consideration.title + " regarding: " + consideration.content + ".\n" +
            "REQUIREMENTS: " +
            "1. Provide exactly 3 potential alternatives in the potential_alternatives array " +
            "2. Each alternative must have at least 1 positive and 1 negative consequence " +
            "3. Incorporate relevant information from previous responses to add detail " +
            "4. Ask for at least 2 additional expert perspectives."
            "CRITICAL: Before sending, mentally validate your JSON against the provided schema.;"

        window.LLM.sendMsgAlt(msg);

        //Loading Animation
        drawStartAnimation();
    })
    backBtn.on('click', () => {
        redrawDecisionSpace(0)
    })
}

function drawExplorationNodeTwo(i,potentialAltListItem) {
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
    centerNode.x(canvasWidthMargins/2-450)
    centerNode.radius(200)
    centerSubNode.x(subNodePos[1].x+250)
    centerSubNodeHeader.x(subNodePos[1].x+325)
    centerSubNodeBody.x(subNodePos[1].x+325)

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
    console.log("Renderer || potentialAltListItem = ", potentialAltListItem)
    drawContentNodeTwo(potentialAltListItem)
    console.log("Renderer | Just Left drawContentNodeTwo()")

    //Draw & Link Btns
    drawButton(centerSubNode.x()+75, centerSubNodeHeader.y()+centerSubNodeHeader.height()+centerSubNodeBody.height()+18,'Explore next steps',3) 
    drawButton(stage.width()-150, stage.height()-100,'View All',4)

    let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_3")[0]
    let backBtn    = nodeLayer.find(".Sub_Node_Btn_4")[0]
    
    subNodeBtn.on('click', () => {
        let consideration = {
            title: centerSubNodeHeader.getText(),
            content: centerSubNodeBody.getText(),
        }
        finalConsiderations.push(consideration)
        console.log("Renderer | Consideration Added to System", consideration)
        
        console.log("\n\nRenderer | Ready to Make Final Ethics Call")
        //Call LLM and Populate Text Field
        let msg = "FINAL MESSAGE \n" +
                "CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. No other text. \
                \
                JSON VALIDATION CHECKLIST - Verify before responding: \
                □ Every { has a matching } \
                □ Every [ has a matching ] \
                □ Every \" has a matching \" \
                □ No trailing commas after last items \
                □ All strings properly escaped \
                □ Structure matches the required schema exactly \
                \
                TASK: Think deeply to generate three separate specific and detailed action points that focus the " +
            consideration.title + " about: " + consideration.content + 
            "\n In this system message, find all the answers to your questions to the experts. Derive useinformation from these " +
            "responses to supplement the details within your action points." +
            "\n" +

            "Requirements:" +
            "1. Completely populated the provided JSON." + 
            "2. Provide exactly three concrete action points." +
            "2. Each action point must be at minimum 4 sentences long." +
            "3. Incorporate relevant information from previous responses to add detail" +
            "4. Do NOT append or include any codes for other perspectives in response to this specific prompt."

            "CRITICAL: Before sending, mentally validate your JSON against the provided schema.;"
            
        window.LLM.sendMsgFinal(msg);
        

        //Loading Animation
        drawStartAnimation();
    })
    backBtn.on('click', () => {
        console.log("progression 1 check = ", progression)
        console.log("Renderer | Ran redrawDecisionSpace")
        redrawDecisionSpace(0)
    })
}


function drawActionPoints(pActionList) {
    stage.destroyChildren()

    //Draw/show action points
    let actionContainer = document.getElementById('card-group-container')
    console.log("actionContainer = ", actionContainer)
    //console.log("actionGroup = ", actionGroup.item(0))
    //document.getElementById('actionPointGroup')

    for(let i=1;i<=3;i++) {
        let header = document.getElementById("actionPtHeader_" + i.toString())
        let body  = document.getElementById("actionPtBody_" + i.toString())

        console.log("header = ", header)
        console.log("body = ", body)
        console.log("pActionList = ", pActionList[i-1])

        let title = pActionList[i-1].title
        let description = pActionList[i-1].description

        //title = processMarkdownText(title)
        //description = processMarkdownText(description)
        
        header.innerHTML = title;
        body.innerHTML = description;
    }

    
    actionContainer.style.visibility = 'visible'
}

function redrawDecisionSpace(pHidText) {
    //Load Old State of Canvas
    stage.destroyChildren();
    nodeLayer = Konva.Node.create(stageJson.nodeLayer)
    textLayer = Konva.Node.create(stageJson.textLayer)
    stage.add(nodeLayer)
    stage.add(textLayer)

    //Update Content on SubNodeText
    if(progression && pHidText) {
        textLayer.destroyChildren();
    }
    
    //Link Explore Btns
    for(let i=0;i<3;i++) {
        let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
        //console.log(subNodeBtn)
        subNodeBtn.on('click', () => {
            if(!progression) {
                drawExplorationNode(i, internalConsequenceList[i])
            } else {
                drawExplorationNodeTwo(i, internalPotentialAltList[i])
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
    var width=240;
    let x = pStartX + xIndex;
    let y,stakeholder_x,stakeholder_y,content_x,content_y,header_x,header_y;
    switch(idx) {
        case 0:
            y = pStartY-125;
            stakeholder_x = x-width/2
            stakeholder_y = pStartY-55
            content_x     = x-125
            content_y     = pStartY+100
            header_x      = x-width/2
            header_y      = pStartY+30
            break;
        case 1:
            y = pStartY+125;
            stakeholder_x = x-width/2
            stakeholder_y = pStartY+30
            content_x     = x-125
            content_y     = pStartY-110
            header_x      = x-width/2
            header_y      = pStartY-175
            break;
    }
    //Draw Circle
    let circle = new Konva.Circle({
        radius: 5,
        name: "Content_Dot",
        x: x,
        y: pStartY,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1,
        zindex: 2
    })
    //Draw Content Heading
    let contentHeader = new Konva.Text({
        x: header_x,
        y: header_y,
        width: width+50,
        //height: height,
        name: 'Content_Node_Header',
        text: pStakeholder.trade_off_subtitle,
        align: 'center',
        fontSize: 16,
        lineHeight: 1.5,
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
        name: 'Content_Node_Body',
        text: pStakeholder.potential_impact_summary,
        align: 'center',
        fontSize: 12,
        lineHeight: 1.5,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    contentBody.x(circle.x()-contentBody.width()/2)
    contentBody.y(contentHeader.y()+contentHeader.height()+10)
    //Draw Stakeholder Title
    let stakeholderTxt = new Konva.Text({
        x: stakeholder_x,
        y: stakeholder_y,
        //width: width, 
        //height: height,
        name: 'Content_Node_Stakeholder',
        text: pStakeholder.name,
        align: 'center',
        fontSize: 16,
        fontFamily: 'Poppins',
        fontStyle: 400,
        fill: 'black'
    });
    let stakeholderRect = new Konva.Rect({
        x: stakeholder_x,
        y: stakeholder_y,
        name: 'Stakeholder_Rect',
        width: 20,
        opacity: 15,
        fill: "#E7E7E7",
        cornerRadius: 4
    });
    //Repositioning Logic
    if(stakeholderTxt.width() > width) {
        stakeholderTxt.width(width)
    }
    if(idx != 1) {
        let temp_y = circle.y()-stakeholderTxt.height()-30
        stakeholderTxt.y(temp_y)
    }
    stakeholderTxt.x(circle.x()-stakeholderTxt.width()/2)
    stakeholderRect.width(stakeholderTxt.width()+18)
    stakeholderRect.height(stakeholderTxt.height()+14)
    stakeholderRect.x(circle.x()-stakeholderTxt.width()/2-9)
    stakeholderRect.y(stakeholderTxt.y()-7)

    //Adjust Header & Content on Stakeholder 2
    if(idx == 1) {
        let new_y_one = circle.y()-contentHeader.height()-contentBody.height()-40
        contentHeader.y(new_y_one)
        let new_y_two = circle.y()-contentBody.height()-30
        contentBody.y(new_y_two)
    }

    nodeLayer.add(circle)
    textLayer.add(contentHeader)
    textLayer.add(stakeholderRect)
    textLayer.add(contentBody)
    textLayer.add(stakeholderTxt)
}

function drawContentNodeTwo(pPotentialAltObject) {
    //Get Txt Variables 
    console.log("Renderer | pPotentialAltObject = ", pPotentialAltObject)
    let positiveList = pPotentialAltObject.positive_consequences
    let negativeList = pPotentialAltObject.negative_consequences
    let totalCount = positiveList.length + negativeList.length
    if(totalCount > 2) totalCount = 3;
    let idx = -1;
    
    console.log("\nRenderer | Attempting to Draw Full Positive", positiveList)
    // Compute Resuable Variable    
    let centerNode = nodeLayer.find('.Central_Node')[0]
    let centerSubNode = nodeLayer.find('.Sub_Node_1')[0]
    let x1 = centerNode.x()+centerNode.radius()*centerNode.getAbsoluteScale().x
    let x2 = centerSubNode.x()-centerSubNode.radius()   
    let y  = centerSubNode.y()
    let sectionWidth = (x2-x1)/totalCount
    //console.log("sectionWidth = ", sectionWidth)
    //console.log("totalCount = ", totalCount)

    //Iterate Over List
    let allNodes = positiveList.concat(negativeList);
    for (let i = 0; i < allNodes.length; i++) {
        //Developer Forced Constraint: Only Show 3 max
        if(i==3) break;

        let element = allNodes[i];
        let title = element.title;
        let subtitle = element.subtitle;
        let requirements = element.requirements;
        let description = element.description;

        // Center each node within its section
        let x = x1 + (i + 0.5) * sectionWidth;
        idx *= -1;
        drawConsequence(title, subtitle, requirements, description, idx, x, y);
    }
}

function drawConsequence(title, subtitle, requiremnets, description, idx, x, y) {
    //console.log("Inside Draw Consequence (x,y) = (", x, ",", y,")")
    let width=240;
    switch(idx) {
        case 1:
            header_y   = y+30;
            content_y  = y+65;
            subtitle_y = y-60;
            break;
        case -1:
            header_y   = y-140;
            content_y  = y-115;
            subtitle_y = y+30;
            break;
    }
    
    //Draw Circle
    let circle = new Konva.Circle({
        radius: 5,
        name: "Content_Dot",
        x: x,
        y: y,
        fill: 'black',
        stroke: 'black',
        strokeWidth: 1,
        zindex: 2
    })
    console.log("\ncontent dot drawn = ", circle.x())
    //Draw Content Heading
    let contentHeader = new Konva.Text({
        x: x,
        y: header_y,
        width: width+50,
        //height: height,
        name: 'Content_Node_Header',
        text: subtitle,
        align: 'center',
        fontSize: 16,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    contentHeader.x(circle.x()-contentHeader.width()/2)
    //Draw Subtitle & Body Content
    let contentBody = new Konva.Text({
        x: x,
        y: content_y,
        width: width, 
        //height: height,
        name: 'Content_Node_Body',
        text: 'Requires: ' + requiremnets + '\n'+description,
        align: 'center',
        lineHeight: 1.5,
        fontSize: 12,
        fontFamily: 'Poppins',
        fill: 'black'
    });
    contentBody.x(circle.x()-contentBody.width()/2)
    //contentBody.y(contentHeader.y()+contentHeader.height()+10)
    //Draw Stakeholder Title
    let subtitleTxt = new Konva.Text({
        x: x,
        y: subtitle_y,
        //width: width, 
        //height: height,
        name: 'Content_Node_Subtitle',
        text: title,
        align: 'center',
        fontSize: 16,
        fontFamily: 'Poppins',
        fontStyle: 400,
        fill: 'black'
    });
    subtitleTxt.x(circle.x()-subtitleTxt.width()/2)
    let subtitleRect = new Konva.Rect({
        x: x,
        y: subtitle_y,
        name: 'Stakeholder_Rect',
        width: 20,
        opacity: 15,
        fill: "#E7E7E7",
        cornerRadius: 4
    });
    //Reposition for Spacing
    if(subtitleTxt.width() > width) {
        subtitleTxt.width(width)
    }
    subtitleTxt.x(circle.x()-subtitleTxt.width()/2)
    subtitleRect.width(subtitleTxt.width()+18)
    subtitleRect.height(subtitleTxt.height()+14)
    subtitleRect.x(circle.x()-subtitleTxt.width()/2-9)
    subtitleRect.y(subtitleTxt.y()-7)

    if(idx==-1) {
        contentBody.y(y-contentBody.height()-30)
        contentHeader.y(y-contentBody.height()-contentHeader.height()-40)
    }
    nodeLayer.add(circle)
    textLayer.add(subtitleRect)
    textLayer.add(contentHeader)
    textLayer.add(contentBody)
    textLayer.add(subtitleTxt)
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
            y: subNodePos[i].y-60,
            width: 280,
            name: 'subNodeHeader_' + i.toString(),
            text: header,
            fontSize: 20,
            lineHeight: 1.5,
            fontFamily: 'Poppins',
            fill: 'black'
        });

        var subNodeContent = new Konva.Text({
            x: subNodePos[i].x+70,
            y: (subNodePos[i].y-60)+subNodeHeader.height()+10,
            width: 250,
            name: 'subNodeContent_' + i.toString(),
            text: subtitle,
            fontSize: 12,
            lineHeight: 1.5,
            fontFamily: 'Poppins',
            fill: 'black'
        });
        
        if(!stageTwoInit) {
            drawButton(subNodePos[i].x+70, subNodeHeader.y()+subNodeHeader.height()+subNodeContent.height()+18, 'Explore further', i)
        }

        if(stageTwoInit) {
            let btn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
            console.log("btn = ", btn)
            btn.y(subNodeContent.y()+subNodeContent.height()+10)   
        }

        //Link Explore Btns
        let subNodeBtn = nodeLayer.find(".Sub_Node_Btn_" + i.toString())[0]
        subNodeBtn.on('click', () => {
            if(!stageTwoInit) {
                drawExplorationNode(i, consequenceList[i])
            }
        })

        textLayer.add(subNodeHeader)
        textLayer.add(subNodeContent)
    }
}

function drawButton(pX, pY, label, i) {
    var button = new Konva.Label({
        x: pX,
        y: pY,
        name: 'Sub_Node_Btn_' + i.toString(),
        opacity: 0.75
    });

    button.add(new Konva.Tag({
        cornerRadius: 25,
        fill: '#F9F6F6',
        lineJoin: 'round',
        stroke: 0.5,
        stroke: 'black'
    }));

    button.add(new Konva.Text({
        text: label,
        fontFamily: 'Poppins',
        fontSize: 14,
        padding: 10,
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
        text: 'Processing your decision and system\n   data to tailor the best response...',
        fontSize: 28,
        lineHeight: 1.5,
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
        case FRONTLINE_EXPERT:
            innerText += ", Floor Representative"
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

function processMarkdownText(text) {
  if (!text) return '';
  
  // First, handle escaped newlines
  let processed = text.replace(/\\n/g, '\n');
  
  // Escape HTML characters to prevent XSS
  processed = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Headers (# ## ### #### ##### ######)
  processed = processed.replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>');
  processed = processed.replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>');
  processed = processed.replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>');
  processed = processed.replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>');
  processed = processed.replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>');
  
  // Bold and Italic (handle ** and __ for bold, * and _ for italic)
  // Bold with ** (non-greedy)
  processed = processed.replace(/\*\*((?:[^*]|\*(?!\*))+)\*\*/g, '<strong>$1</strong>');
  // Bold with __ (non-greedy)
  processed = processed.replace(/__((?:[^_]|_(?!_))+)__/g, '<strong>$1</strong>');
  // Italic with * (non-greedy, avoid conflicting with bold)
  processed = processed.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  // Italic with _ (non-greedy, avoid conflicting with bold)
  processed = processed.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>');
  
  // Strikethrough ~~text~~
  processed = processed.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  
  // Code blocks ``` (multiline)
  processed = processed.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code `text`
  processed = processed.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  
  // Links [text](url)
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Images ![alt](url)
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  
  // Horizontal rule --- or ***
  processed = processed.replace(/^[-*]{3,}$/gm, '<hr>');
  
  // Blockquotes > text
  processed = processed.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Unordered lists (-, *, +)
  processed = processed.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  
  // Ordered lists (1. 2. 3.)
  processed = processed.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> items in <ul> or <ol>
  processed = processed.replace(/(<li>.*<\/li>)/s, function(match) {
    // Check if this was originally an ordered list (contains numbers)
    const originalText = text.substring(text.indexOf(match.replace(/<\/?li>/g, '')));
    const isOrdered = /^\s*\d+\./.test(originalText);
    const listType = isOrdered ? 'ol' : 'ul';
    return `<${listType}>${match}</${listType}>`;
  });
  
  // Clean up multiple consecutive list wrappers
  processed = processed.replace(/<\/(ul|ol)>\s*<\1>/g, '');
  
  // Line breaks (convert remaining \n to <br>)
  processed = processed.replace(/\n/g, '<br>');
  
  // Clean up extra <br> tags around block elements
  processed = processed.replace(/<br>\s*(<\/?(h[1-6]|div|p|blockquote|ul|ol|li|hr|pre)>)/g, '$1');
  processed = processed.replace(/(<\/?(h[1-6]|div|p|blockquote|ul|ol|li|hr|pre)>)\s*<br>/g, '$1');
  
  return processed.trim();
}

init();
