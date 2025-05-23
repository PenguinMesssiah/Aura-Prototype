const OpenAI   = require('openai')
const security = require('../security.js')

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: security.get_API()
});

process.parentPort.on('message', (e) => {
    let type   = e.data.type
    var prompt = e.data?.userPrompt 

    console.log('LLM UtilProcess | Recevied Message = ', e.data)

    switch (type) {
        case 0: // Send API Call to Deepseek
            makeDeepSeekCall(prompt);
            break;
    }
})

async function makeDeepSeekCall(pPrompt) {
    console.log('LLM UtilProcess | Sending Deepseek Call')
    
    const completion = await openai.chat.completions.create({
    model: "deepseek-chat",
    temperature: 1.3,
    //ToDo: Read in System Prompt Here
    messages: [{ 
        role: "system",
        content: "You are a helpful assistant."}, 
        {
        role: "user",
        content: pPrompt}
    ]});

  console.log("'LLM UtilProcess | Received DeepSeek Message: ", completion.choices[0].message.content);
  console.log("Object Choices ", completion.choices);
}