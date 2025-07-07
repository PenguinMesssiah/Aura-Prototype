import OpenAI from 'openai'
import { marked } from 'marked'
//import { parse } from 'node-html-parser';
import 'dotenv/config'
import {fileURLToPath} from "url";
import path from "path";
//import jsdom from "jsdom";
//import {getLlama, LlamaChatSession} from "node-llama-cpp";

//Agent Definitions & Response Formats
import ethicPrompt_json        from '../json/ethic_consultant.json'      with { type: "json" }
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
const legal_str               = JSON.stringify(legalPrompt_json)
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
//const parser    = new DOMParser();
               
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

var ethicsResponsLog = [];

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
            content: ethics_str}
    ]});
            
    console.log("'LLM UtilProcess | Received DeepSeek Message: \n", ethics_completion.choices[0].message.content);

    let full_resposne_conv = marked.parse(ethics_completion.choices[0].message.content)
    let split_resposne = parseMarkdownSections(full_resposne_conv)
    
    //console.log("'LLM UtilProcess | Full_Response_Conv: \n", full_resposne_conv);
    //console.log("'LLM UtilProcess | split_converted: \n",split_resposne);
    
    let msg = {
        type: 0,
        initalCall: 1, 
        showInChat: 0,
        showInWeb: 0,
        llmResponse: full_resposne_conv,
        llmResponse_arr: split_resposne
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
            content: ethics_str }, {
            role: "user",
            content: pPrompt
            }
    ]});
            
    console.log("LLM UtilProcess | Received DeepSeek Message: \n", ethics_completion.choices[0].message.content);

    //Catch Calls for Additional Information
    processRequestforMoreInfo(pPrompt, ethics_completion.choices[0].message.content)
    //TO-DO: Remove Code(s) From Response

    //Parse & Send to Front-End
    let full_resposne_conv = marked.parse(ethics_completion.choices[0].message.content)
    let split_resposne = parseMarkdownSections(full_resposne_conv)

    //Maintain List
    ethicsResponsLog.push(split_resposne)
    //console.log("LLM UtilProcess | Ethic's Call Converted Message = ", final_conversion)
    console.log("\nSending Message back to front end\n")
    let msg = {
        type: 0,
        initalCall: 0, 
        showInChat: 1,
        showInWeb: 1,
        llmResponse: full_resposne_conv,
        llmResponse_arr: split_resposne
    }
    process.parentPort.postMessage(msg)
}

// Function to parse markdown sections split by <br>
function parseMarkdownSections(pMarkdown) {
  // Split by <br> tag, which may have surrounding whitespace or newlines
  var rawSections = pMarkdown.split(/\s*~\s*/);
  
  // Trim each section and filter out empty strings
  var sections = rawSections
    .map(section => section.trim())
    .filter(section => section.length > 0);
  
  return sections;
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
    let response = marked.parse(legal_completion.choices[0].message.content)
    let msg = {
        type: 0,
        showInChat: 1,
        showInWeb: 0,
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
    let response = marked.parse(finance_completion.choices[0].message.content)
    let msg = {
        type: 0,
        showInChat: 1,
        showInWeb: 0,
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
    //console.log("Object Choices ", safety_completion.choices);
    let response = marked.parse(safety_completion.choices[0].message.content)
    let msg = {
        type: 0,
        showInChat: 1,
        showInWeb: 0,
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
    let response = marked.parse(privacy_completion.choices[0].message.content)
    let msg = {
        type: 0,
        showInChat: 1,
        showInWeb: 0,
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
    let response = marked.parse(compliance_completion.choices[0].message.content)    
    let msg = {
        type: 0,
        showInChat: 1,
        showInWeb: 0,
        llmResponse: response
    }
    process.parentPort.postMessage(msg)
}