import OpenAI from 'openai'
import { marked } from 'marked'
import 'dotenv/config'
import {fileURLToPath} from "url";
import path from "path";
import {getLlama, LlamaChatSession} from "node-llama-cpp";

import ethicPrompt_json     from '../json/ethic_consultant.json'     with { type: "json" }
import legalPrompt_json     from '../json/legal_consultant.json'     with { type: "json" }
import financePrompt_json   from '../json/financial_consultant.json' with { type: "json" }
import financeResponse_json from '../json/financial_response.json'   with { type: "json" }
import legalResponse_json   from '../json/legal_response.json'       with { type: "json" }

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
               
const LEGAL_EXPERT     = 0
const FINANCIAL_EXPERT = 1

const ethics_str = JSON.stringify(ethicPrompt_json)
const __dirname  = path .dirname (fileURLToPath(import.meta.url));
               
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
/**/

process.parentPort.on('message', (e) => {
    let type      = e.data.type
    let prompt    = e.data?.userPrompt 
    let expert    = e.data?.expert
    let augPrompt = e.data?.augmentedPrompt 

    console.log('LLM UtilProcess | Recevied Message = ', e.data)

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
    //console.log("Object Choices ", ethics_completion.choices);
    
    let converted_resposne = marked.parse(ethics_completion.choices[0].message.content)
    
    //let response = await ethics_session.prompt(ethics_str);
    //console.log('Response = ', response)
    //let converted_resposne = marked.parse(response)

    let msg = {
        type: 0,
        llmResponse: converted_resposne
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
    //console.log("Object Choices ", ethics_completion.choices);

    //Catch Calls for Additional Information
    processRequestforMoreInfo(pPrompt, ethics_completion.choices[0].message.content)
    //TO-DO: Remove Code(s) From Response

    //Parse & Send to Front-End
    let converted_resposne = marked.parse(ethics_completion.choices[0].message.content)

    let msg = {
        type: 0,
        llmResponse: converted_resposne
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
        var llm_legal_query = response.match(/Code:100\s*[-–—]\s*(.+?\?)/);
        console.log("First instance:", llm_legal_query?.[0]);
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
        var llm_financial_query = response.match(/Code:101\s*[-–—]\s*(.+?\?)/);
        console.log("First instance:", llm_financial_query?.[0]);
        let msg = {
            type: 1,
            expert: FINANCIAL_EXPERT,
            userPrompt: llm_financial_query?.[0] || pPrompt
        }
        process.parentPort.postMessage(msg)
    }
}

async function callLegalModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Legal Call')

    let legal_str          = JSON.stringify(legalPrompt_json)
    let legal_response_str = JSON.stringify(legalResponse_json)
        
    let legalPrompt = ethicPrompt_json.conversation_constraints.levels_of_exploration.Level_I_Interpreting_the_Situation.Component_3.prompts.legal_consultant

    const legal_completion = await legal_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: legal_str, legal_response_str}, {
            role: "user",
            content: legalPrompt, pPrompt
        }
    ]});

    console.log("'LLM UtilProcess | Received Legal Message: \n", legal_completion.choices[0].message.content);
    console.log("Object Choices ", legal_completion.choices);

    /*
    let msg = {
        type: 0,
        llmResponse: ethics_completion.choices[0].message.content
    }
    process.parentPort.postMessage(msg)
    */
}

async function callFinancialModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Financial Call')

    let finance_str          = JSON.stringify(financePrompt_json)
    let finance_response_str = JSON.stringify(financeResponse_json)
    
    const finance_completion = await finance_openai.chat.completions.create({
        model: "deepseek-chat",
        temperature: 1.3,
        messages: [{ 
            role: "system",
            content: finance_str, finance_response_str}, {
            role: "user",
            content: pPrompt
        }
    ]});

    console.log("'LLM UtilProcess | Received Financial Message: \n", finance_completion.choices[0].message.content);
    console.log("Object Choices ", finance_completion.choices);

    /*
    let msg = {
        type: 0,
        llmResponse: ethics_completion.choices[0].message.content
    }
    process.parentPort.postMessage(msg)
    */
}