import OpenAI   from 'openai'
import { get_API } from '../security.js'
import { marked } from 'marked'

import ethicPrompt_json     from '../json/ethic_consultant.json'     with { type: "json" }
import legalPrompt_json     from '../json/legal_consultant.json'     with { type: "json" }
import financePrompt_json   from '../json/financial_consultant.json' with { type: "json" }
import financeResponse_json from '../json/financial_response.json'   with { type: "json" }
import legalResponse_json   from '../json/legal_response.json'       with { type: "json" }

const ethics_str = JSON.stringify(ethicPrompt_json)

const ethic_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: get_API()
});

const finance_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: get_API()
});

const legal_openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: get_API()
});

process.parentPort.on('message', (e) => {
    let type   = e.data.type
    var prompt = e.data?.userPrompt 

    console.log('LLM UtilProcess | Recevied Message = ', e.data)

    switch (type) {
        case 0: // Initialize Models
            initalizeEthicsModel();
            break;
        case 1: // Send API Call to Deepseek
            makeEthicsCall(prompt);
            break;
        case 2: // Initalize Supporting Model
            callLegalModel(prompt);
            callFinancialModel(prompt);
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
    
    let msg = {
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
            
    console.log("'LLM UtilProcess | Received DeepSeek Message: \n", ethics_completion.choices[0].message.content);
    console.log("Object Choices ", ethics_completion.choices);

    //Catch Calls for Additional Information
    processRequestforMoreInfo(ethics_completion.choices[0].message.content)
    //TO-DO: Remove Code(s) From Response

    //Parse & Send to Front-End
    let converted_resposne = marked.parse(ethics_completion.choices[0].message.content)

    let msg = {
        llmResponse: converted_resposne
    }
    process.parentPort.postMessage(msg)
}

async function processRequestforMoreInfo(response) {
    //Legal Request
    let legal_request = response.search('Code: 100')
    console.log("legal_request search =  ", legal_request)
    if(legal_request != -1) {
        callLegalModel(response)
    }
    
    //Financial Request
    let financial_request = response.search('Code: 101')
    console.log("financial_request search =  ", financial_request)
    if(financial_request != -1) {
        callFinancialModel(response)
    }
}

async function callLegalModel(pPrompt) {
    console.log('LLM UtilProcess | Sending Legal Call')

    let legal_str          = JSON.stringify(legalPrompt_json)
    let legal_response_str = JSON.stringify(legalResponse_json)
        
    let legalPrompt     = ethicPrompt_json.conversation_constraints.levels_of_exploration.Level_I_Interpreting_the_Situation.Component_3.prompts.legal_consultant
    let financialPrompt = ethicPrompt_json.conversation_constraints.levels_of_exploration.Level_I_Interpreting_the_Situation.Component_3.prompts.financial_consultant

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
        llmResponse: ethics_completion.choices[0].message.content
    }
    process.parentPort.postMessage(msg)
    */
}