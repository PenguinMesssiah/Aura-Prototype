console.log('LLM_cmd.js starting...');
import OpenAI from 'openai'
import { marked } from 'marked'
//import 'dotenv/config'
import {fileURLToPath} from "url";
import path from "path";
//import {getLlama, LlamaChatSession} from "node-llama-cpp";

//Agent Definitions & Response Formats
import ethicPrompt_json        from '../json/ethic_consultant.json'      with { type: "json" }
import ethicResponse_json      from '../json/ethic_response.json'        with { type: "json" }
import ethicResponseAlt_json   from '../json/ethic_response_potentialAlt.json' with { type: "json" }
import ethicResponseActionPt_json   from '../json/ethic_response_actionPt.json' with { type: "json" }
import legalPrompt_json        from '../json/legal_consultant.json'      with { type: "json" }
//import legalResponse_json      from '../json/legal_response.json'        with { type: "json" }
import financePrompt_json      from '../json/financial_consultant.json'  with { type: "json" }
//import financeResponse_json    from '../json/financial_response.json'    with { type: "json" }
import safetyPrompt_json       from '../json/safety_consultant.json'     with { type: "json" }
//import safetyResponse_json     from '../json/safety_response.json'       with { type: "json" }
import privacyPrompt_json      from '../json/privacy_consultant.json'    with { type: "json" }
//import privacyResponse_json    from '../json/privacy_response.json'      with { type: "json" }
import compliancePrompt_json   from '../json/compliance_consultant.json' with { type: "json" }
//import complianceResponse_json from '../json/compliance_response.json'   with { type: "json" }

//Load DeepSeek Model Locally
/*
const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(__dirname, "../models", "DeepSeek-R1-Distill-Qwen-7B.IQ4_XS.gguf")
    });
    
    //Create Chat Sessions for Multiple Agents
    const context = await model.createContext();
    const ethics_session = new LlamaChatSession({ 
        contextSequence : context.getSequence()
    });
    const legal_session = new LlamaChatSession({ 
        contextSequence : context.getSequence()
        });
        const financial_session = new LlamaChatSession({ 
            contextSequence : context.getSequence()
        });
*/
               
const LEGAL_EXPERT      = 0
const FINANCIAL_EXPERT  = 1
const SAFETY_EXPERT     = 2
const PRIVACY_EXPERT    = 3
const COMPLIANCE_EXPERT = 4

const ethics_str              = JSON.stringify(ethicPrompt_json)
const ethics_response         = JSON.stringify(ethicResponse_json)
const ethics_responseAlt      = JSON.stringify(ethicResponseAlt_json) 
const legal_str               = JSON.stringify(legalPrompt_json)
const ethicResponseActionPt_str = JSON.stringify(ethicResponseActionPt_json)
//const legal_response_str      = JSON.stringify(legalResponse_json)
const finance_str             = JSON.stringify(financePrompt_json)
//const finance_response_str    = JSON.stringify(financeResponse_json)
const safety_str              = JSON.stringify(safetyPrompt_json)
//const safety_response_str     = JSON.stringify(safetyResponse_json)
const privacy_str             = JSON.stringify(privacyPrompt_json)
//const privacy_response_str    = JSON.stringify(privacyResponse_json)
const compliance_str          = JSON.stringify(compliancePrompt_json)
//const compliance_response_str = JSON.stringify(complianceResponse_json)

const __dirname = path .dirname (fileURLToPath(import.meta.url));
               
const ethic_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});
    
const finance_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

const legal_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

const safety_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

const privacy_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

const compliance_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

var ethicsResponsLog    = [];
var subAgentResponseLog = [];

// Keep the process alive
process.stdin.resume();

process.parentPort.on('message', (e) => {
    let type      = e.data.type
    let prompt    = e.data?.userPrompt 
    let expert    = e.data?.expert
    let augPrompt = e.data?.augmentedPrompt 

    console.log('LLM UtilProcess | Received Message = ', e.data)

    switch (type) {
        case 0: // Initialize Models
            initalizeEthicsModel();
            break;
        case 1: // Send API Call to Deepseek
            makeEthicsCall(prompt);
            break;
        case 2: //Send API Call for Potential Alternatives
            makeEthicsCallforAlt(prompt);
            break;
        case 3: //Send Final API Call 
            makeFinalEthicsCall(prompt);
            break;
        case 99: // Send Augmented Prompt to Respective Model 
            switch(expert) {
                case LEGAL_EXPERT:
                    callLegalModel(augPrompt);
                    break;
                case FINANCIAL_EXPERT:
                    callFinancialModel(augPrompt);
                    break;
                case SAFETY_EXPERT:
                    callSafetyModel(augPrompt);
                    break;
                case PRIVACY_EXPERT:
                    callPrivacyModel(augPrompt);
                    break;
                case COMPLIANCE_EXPERT:
                    callComplianceModel(augPrompt);
                    break;
            }
            break;
    }
})

async function initalizeEthicsModel() {
    console.log('LLM UtilProcess | Sending Ethics Call')
    const ethics_completion = await ethic_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: ethics_str }, { 
            role: "system",
            content: ethics_response,
        }
    ]});
            
    console.log("'LLM UtilProcess | Received Initial Message: \n", ethics_completion.choices[0].message.content);

    //Parse & Send to Front-End
    let responseTemp   = ethics_completion.choices[0].message.content
    responseTemp       = responseTemp.replace('```json','')
    responseTemp       = responseTemp.replace('```','')
    var responseAsJson;

    try {
        responseAsJson = parseEthicsResponse(responseTemp);
        responseAsJson = validateEthicsResponse(responseAsJson)
        // Process your parsed JSON
    } catch (error) {
        console.error('Failed to parse ethics response:', error);
        // Handle fallback logic
    }
    
    console.log('LLM UtilProcess | Received JSON Message:', responseAsJson)

    let msg = {
        type: 0,
        initialCall: 1,
        expert: -1, 
        llmResponse: responseAsJson,
    }
    process.parentPort.postMessage(msg)
}

async function makeEthicsCall(pPrompt) {
    console.log('LLM UtilProcess | Sending Ethics Call')

    const ethics_completion = await ethic_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{  
            role: "system",
            content: ethics_str },{  
            role: "system",
            content: ethics_response }, {
            role: "user",
            content: pPrompt
            }
    ]});
            
    console.log("LLM UtilProcess | Received DeepSeek Message: \n", ethics_completion.choices[0].message.content);

    //Catch Calls for Additional Information
    processRequestforMoreInfo(pPrompt, ethics_completion.choices[0].message.content)
    
    //Parse & Send to Front-End
    let responseTemp   = ethics_completion.choices[0].message.content
    let endIndex       = responseTemp.indexOf("```",6)
    let responseSubStr = responseTemp.substring(0,endIndex)
    responseSubStr     = responseSubStr.replace("```json","")
    var responseAsJson;

    try {
        responseAsJson = parseEthicsResponse(responseSubStr);
        responseAsJson = validateEthicsResponse(responseAsJson)
        // Process your parsed JSON
    } catch (error) {
        console.error('Failed to parse ethics response:', error);
        // Handle fallback logic
    }
    
    console.log('LLM UtilProcess | Received JSON Message:', responseAsJson)
    
    //let intro             = responseAsJson.response.introduction
    let trade_offs        = responseAsJson.response.analysis_of_tradeoffs
    let dilemma           = responseAsJson.response.ethical_dilemma
    let unintended        = responseAsJson.response.unintended_consequence
    let followUpQuestions = responseAsJson.response.follow_up_clarification

    //Maintain List
    ethicsResponsLog.push(responseAsJson)
    
    let msg = {
        type: 0,
        initialCall: 0,
        expert: -1,
        llmResponse: trade_offs+dilemma,
        consequences: unintended,
        followUp: followUpQuestions
    }
    process.parentPort.postMessage(msg)
}

async function makeEthicsCallforAlt(pPrompt) {
    console.log('LLM UtilProcess | Sending Ethics Call for Potential Alternatives')
    //console.log('LLM UtilProcess | join = ', subAgentResponseLog.join('').toString())
    const ethics_completion = await ethic_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{  
            role: "system",
            content: ethics_str },{  
            role: "system",
            content: ethics_responseAlt}, {
            role: "user",
            content: pPrompt},{ 
            role:"user",
            content: subAgentResponseLog.join('').toString()}
    ]});
            
    console.log("LLM UtilProcess | Received DeepSeek Message: \n", ethics_completion.choices[0].message.content);

    //Catch Calls for Additional Information
    processRequestforMoreInfo(pPrompt, ethics_completion.choices[0].message.content)
    
    //Parse & Send to Front-End
    let responseTemp   = ethics_completion.choices[0].message.content
    let endIndex       = responseTemp.indexOf("```",6)
    let responseSubStr = responseTemp.substring(0,endIndex)
    responseSubStr     = responseSubStr.replace("```json","")
    //console.log("responseSubStr = ", responseSubStr)
    var responseAsJson;
    try {
        responseAsJson = parseEthicsResponse(responseSubStr);
        responseAsJson = validateEthicsResponse(responseAsJson)
        // Process your parsed JSON
    } catch (error) {
        console.error('Failed to parse ethics response:', error);
        // Handle fallback logic
    }
    
    console.log('LLM UtilProcess | Received JSON Message:', responseAsJson)
    
    let situation         = responseAsJson.response.situation
    let trade_offs        = responseAsJson.response.analysis_of_tradeoffs
    let rationale         = responseAsJson.response.rationale_behind_potential_alternatives
    let potentialAlt      = responseAsJson.response.potential_alternatives
    let followUpQuestions = responseAsJson.response.follow_up_clarification

    console.log("length of potentialAlt = ", potentialAlt.length)
    //Maintain List
    ethicsResponsLog.push(responseAsJson)
    
    console.log("\nSending Message back to front end\n")
    let msg = {
        type: 0,
        initialCall: 0,
        expert: -1,
        llmResponse: trade_offs+rationale,
        potentialAlt: potentialAlt,
        followUp: followUpQuestions
    }
    process.parentPort.postMessage(msg)
}

async function makeFinalEthicsCall(pPrompt) {
    console.log('LLM UtilProcess | Sending Final Ethics Call for Action Points')
    //console.log('LLM UtilProcess | join = ', subAgentResponseLog.join('').toString())
    const ethics_completion = await ethic_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{  
            role: "system",
            content: ethics_str },{  
            role: "system",
            content: ethicResponseActionPt_str}, {
            role: "user",
            content: pPrompt},{ 
            role:"user",
            content: subAgentResponseLog.join('').toString()}
    ]});
            
    console.log("LLM UtilProcess | Received DeepSeek Message: \n", ethics_completion.choices[0].message.content);
    
    //Parse & Send to Front-End
    let responseTemp   = ethics_completion.choices[0].message.content
    let endIndex       = responseTemp.indexOf("```",6)
    let responseSubStr = responseTemp.substring(0,endIndex)
    responseSubStr     = responseSubStr.replace("```json","")
    var responseAsJson;

    try {
        responseAsJson = parseEthicsResponse(responseSubStr);
        responseAsJson = validateEthicsResponse(responseAsJson)
        // Process your parsed JSON
    } catch (error) {
        console.error('Failed to parse ethics response:', error);
        // Handle fallback logic
    }
    
    console.log('LLM UtilProcess | Received JSON Message:', responseAsJson)
    
    let reflection     = responseAsJson.response.conversation_reflection
    let trade_offs     = responseAsJson.response.key_trade_offs
    let solution_value = responseAsJson.response.value_of_solution
    let action_pts     = responseAsJson.response.action_points
    let farewellMsg    = responseAsJson.response.farewell_message

    //Maintain List
    ethicsResponsLog.push(responseAsJson)
    
    let msg = {
        type: 0,
        initialCall: 0,
        expert: -1,
        reflection: reflection,
        llmResponse: trade_offs+solution_value,
        actionPts: action_pts,
        farewellMsg: farewellMsg
    }
    process.parentPort.postMessage(msg)
}

//To-Do: Add Functionality to Catch Multiple Codes for the Same Agent
async function processRequestforMoreInfo(pPrompt, response) {
    //Legal Request
    let legal_parse_check1 = response.search('Code: 100')
    let legal_parse_check2 = response.search('code: 100')
    let legal_parse_check3 = response.search('code:100')
    let legal_parse_check4 = response.search('Code:100')
    
    //Send Call to RAG to Vectorize
    if(legal_parse_check1 != -1 || legal_parse_check2 != -1 || 
        legal_parse_check3 != -1 || legal_parse_check4 != -1)
    {
        let llm_legal_query = response.match(/Code:100\s*[-–—]\s*(.+?\?)/);
        console.log("Legal First Instance:", llm_legal_query?.[0]);
        
        let msg = {
            type: 1,
            expert: LEGAL_EXPERT,
            userPrompt: llm_legal_query?.[0] || pPrompt
        }
        process.parentPort.postMessage(msg)
    }
    
    //Financial Request
    let financial_parse_check1 = response.search('Code: 101')
    let financial_parse_check2 = response.search('code: 101')
    let financial_parse_check3 = response.search('code:101')
    let financial_parse_check4 = response.search('Code:101')
    if(financial_parse_check1 != -1 || financial_parse_check2 != -1 || 
        financial_parse_check3 != -1 || financial_parse_check4 != -1) {
        
        let llm_financial_query = response.match(/Code:101\s*[-–—]\s*(.+?\?)/);
        console.log("Financial First Instance:", llm_financial_query?.[0]);
        
        let msg = {
            type: 1,
            expert: FINANCIAL_EXPERT,
            userPrompt: llm_financial_query?.[0] || pPrompt
        }
        process.parentPort.postMessage(msg)
    }

    //Safety Request
    let safety_parse_check1 = response.search('Code: 102')
    let safety_parse_check2 = response.search('code: 102')
    let safety_parse_check3 = response.search('code:102')
    let safety_parse_check4 = response.search('Code:102')
    if(safety_parse_check1 != -1 || safety_parse_check2 != -1 || 
        safety_parse_check3 != -1 || safety_parse_check4 != -1) {
        
        let llm_safety_query = response.match(/Code:102\s*[-–—]\s*(.+?\?)/);
        console.log("Safety First Instance:", llm_safety_query?.[0]);
        
        let msg = {
            type: 1,
            expert: SAFETY_EXPERT,
            userPrompt: llm_safety_query?.[0] || pPrompt
        }
        process.parentPort.postMessage(msg)
    }

    //Privacy Request
    let privacy_parse_check1 = response.search('Code: 103')
    let privacy_parse_check2 = response.search('code: 103')
    let privacy_parse_check3 = response.search('code:103')
    let privacy_parse_check4 = response.search('Code:103')
    if(privacy_parse_check1 != -1 || privacy_parse_check2 != -1 || 
        privacy_parse_check3 != -1 || privacy_parse_check4 != -1) {
        
        let llm_privacy_query = response.match(/Code:103\s*[-–—]\s*(.+?\?)/);
        console.log("Privacy First Instance:", llm_privacy_query?.[0]);
        
        let msg = {
            type: 1,
            expert: PRIVACY_EXPERT,
            userPrompt: llm_privacy_query?.[0] || pPrompt
        }
        process.parentPort.postMessage(msg)
    }

    //Compliance Request
    let compliance_parse_check1 = response.search('Code: 104')
    let compliance_parse_check2 = response.search('code: 104')
    let compliance_parse_check3 = response.search('code:104')
    let compliance_parse_check4 = response.search('Code:104')
    if(compliance_parse_check1 != -1 || compliance_parse_check2 != -1 || 
        compliance_parse_check3 != -1 || compliance_parse_check4 != -1) {
        
        let llm_compliance_query = response.match(/Code:104\s*[-–—]\s*(.+?\?)/);
        console.log("Compliance First Instance:", llm_compliance_query?.[0]);
        
        let msg = {
            type: 1,
            expert: COMPLIANCE_EXPERT,
            userPrompt: llm_compliance_query?.[0] || pPrompt
        }
        process.parentPort.postMessage(msg)
    }    
}

async function callLegalModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Legal Call')
    
    const legal_completion = await legal_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: legal_str}, {
            //role: "system",
            //content: legal_response_str}, {
            role: 'user',
            content: pPrompt
        }
    ]});

    console.log("'LLM UtilProcess | Received Legal Message: \n", legal_completion.choices[0].message.content);
    //console.log("Object Choices ", legal_completion.choices);
    subAgentResponseLog.push(legal_completion.choices[0].message.content.toString())
    let response = marked.parse(legal_completion.choices[0].message.content)
    //console.log("LLM Util | Sub-Agent Check ", subAgentResponseLog)
    let msg = {
        type: 0,
        initialCall: 0,
        expert: LEGAL_EXPERT,
        llmResponse: response
    }
    process.parentPort.postMessage(msg)
}

async function callFinancialModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Financial Call')
    
    const finance_completion = await finance_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: finance_str}, {
            //role: "system",
            //content: finance_response_str}, {
            role: 'user',
            content: pPrompt
        }
    ]});

    console.log("'LLM UtilProcess | Received Financial Message: \n", finance_completion.choices[0].message.content);
    //console.log("Object Choices ", finance_completion.choices);
    subAgentResponseLog.push(finance_completion.choices[0].message.content.toString())
    let response = marked.parse(finance_completion.choices[0].message.content)
    //console.log("LLM Util | Sub-Agent Check ", subAgentResponseLog)
    let msg = {
        type: 0,
        initialCall: 0,
        expert: FINANCIAL_EXPERT,
        llmResponse: response
    }
    process.parentPort.postMessage(msg)
}

async function callSafetyModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Safety Call')
    
    const safety_completion = await safety_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: safety_str}, {
            //role: "system",
            //content: safety_response_str}, {
            role: 'user',
            content: pPrompt
        }
    ]});

    console.log("'LLM UtilProcess | Received Safety Message: \n", safety_completion.choices[0].message.content);
    subAgentResponseLog.push(safety_completion.choices[0].message.content.toString())
    let response = marked.parse(safety_completion.choices[0].message.content)
    //console.log("LLM Util | Sub-Agent Check ", subAgentResponseLog)
    let msg = {
        type: 0,
        initialCall: 0,
        expert: SAFETY_EXPERT,
        llmResponse: response
    }
    process.parentPort.postMessage(msg)
}

async function callPrivacyModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Privacy Call')
    
    const privacy_completion = await privacy_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: privacy_str}, {
            //role: "system",
            //content: privacy_response_str}, {
            role: 'user',
            content: pPrompt
        }
    ]});

    console.log("'LLM UtilProcess | Received Privacy Message: \n", privacy_completion.choices[0].message.content);
    //console.log("Object Choices ", privacy_completion.choices);
    subAgentResponseLog.push(privacy_completion.choices[0].message.content.toString())
    let response = marked.parse(privacy_completion.choices[0].message.content)
    //console.log("LLM Util | Sub-Agent Check ", subAgentResponseLog)
    let msg = {
        type: 0,
        initialCall: 0,
        expert: PRIVACY_EXPERT,
        llmResponse: response
    }
    process.parentPort.postMessage(msg)
}

async function callComplianceModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Compliance Call')
    
    const compliance_completion = await compliance_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: compliance_str}, {
            //role: "system",
            //content: compliance_response_str}, {
            role: 'user',
            content: pPrompt
        }
    ]});

    console.log("LLM UtilProcess | Received Compliance Message: \n", compliance_completion.choices[0].message.content);
    //console.log("Object Choices ", privacy_completion.choices);
    subAgentResponseLog.push(compliance_completion.choices[0].message.content.toString())
    let response = marked.parse(compliance_completion.choices[0].message.content)    
    //console.log("LLM Util | Sub-Agent Check ", subAgentResponseLog)
    let msg = {
        type: 0,
        initialCall: 0,
        expert: COMPLIANCE_EXPERT,
        llmResponse: response
    }
    process.parentPort.postMessage(msg)
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('LLM Util | Utility process shutting down');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('LLM Util | Utility process interrupted');
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error(' LLM Util | Uncaught Exception in utility process:', error);
  /*
  process.send({
    success: false,
    error: `Uncaught Exception: ${error.message}`
});
*/
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('LLM Util |  Unhandled Rejection in utility process:', reason);
  /*
  process.send({
    success: false,
    error: `Unhandled Rejection: ${reason}`
  });
  */
  process.exit(1);
});

function parseEthicsResponse(responseText) {
  const attempts = [
    // Attempt 1: Direct parse
    () => JSON.parse(responseText),
    
    // Attempt 2: Extract from code blocks
    () => {
      const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) return JSON.parse(codeBlockMatch[1]);
      throw new Error('No code block found');
    },
    
    // Attempt 3: Find JSON object boundaries
    () => {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error('No JSON object found');
    },
    
    // Attempt 4: Sanitize and parse (last resort)
    () => {
      const cleaned = responseText
        .replace(/[\n\r]/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\\/g, '\\\\');
      return JSON.parse(cleaned);
    }
  ];

  for (const attempt of attempts) {
    try {
      return attempt();
    } catch (error) {
      console.log(`Parse attempt failed: ${error.message}`);
    }
  }
  
  throw new Error('All JSON parsing attempts failed');
}

function validateEthicsResponse(parsed) {
  if (!parsed.response) throw new Error('Missing response field');
  //if (!parsed.response.conversation_reflection) throw new Error('Missing conversation_reflection');
  // Add other required field checks
  return parsed;
}