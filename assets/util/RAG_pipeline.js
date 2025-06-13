// Import the necessary class from LangChain
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { getLlama } from 'node-llama-cpp';
import * as fs from 'node:fs/promises';
import 'dotenv/config';

// Load the Llama model for Word Embeddings
const llama   = await getLlama();
const model   = await llama.loadModel({
    modelPath: path.join("./assets/models", "Meta-Llama-3.1-8B-Instruct-IQ2_M.gguf")
});
const context  = await model.createEmbeddingContext();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Constants
const matchThreshold = 0.5;
const matchCount     = 5;

//Handle Calls to Vectorization of User Prompts
process.parentPort.on('message', (e) => {
    let type   = e.data.type
    let expert = e.data?.expert
    let prompt = e.data?.userPrompt 

    console.log('RAG UtilProcess | Recevied Message = ', e.data)

    switch (type) {
        case 0: // Vectorize User Prompt
            vectorizePrompt(prompt, expert);
            break;
    }
})

async function vectorizePrompt(pPrompt, expert) {
    console.log("RAG UtilProcess | Entering vectorizePrompt")
    //Create Word Embedded
    try {
        var embedding = await context.getEmbeddingFor(pPrompt);
        var embedding = embedding.vector 
        //Error Checks on the Created Embedding
        if (!Array.isArray(embedding)) {
            throw new Error('Invalid embedding format');
        }
        if (embedding.length !== 4096) {
            throw new Error(`Embedding dimension mismatch: expected 1536, got ${embedding.length}`);
        }
    } catch (error) {
        console.log("RAG UtilProcess | Caught getEmbeddingFor ", error)
    }

    // Validate parameters before RPC call
    if (!embedding || typeof matchThreshold !== 'number' || typeof matchCount !== 'number') {
        throw new Error('Invalid parameters for RPC call');
    }

    //console.log("RAG UtilProcess | vars = ", embedding, matchThreshold, matchCount)
    //Query Supabase
    try {
        var { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
        });
        if (error) throw error;
    } catch (error) {
        console.log("RAG UtilProcess | Caught supabase ", error)
    }

    console.log("RAG UtilProcess | Supabase Returned = ", data)

    // Step 3: Concatenate retrieved content for LLM context
    let contextText = data?.map(row => row.content).join('\n---\n') || '';
    
    console.log("RAG UtilProcess | contextText = ", contextText)

    // Step 4: Compose the prompt for the LLM
    let augmentedPrompt = `Use the following context to answer the user's question:\n${contextText}\n\nUser question: ${pPrompt}`;

    console.log("RAG UtilProcess | Final Prompt = ", augmentedPrompt)

    /*
    */
    let msg = {
        expert: expert,
        augmentedPrompt: augmentedPrompt
    }
    process.parentPort.postMessage(msg)
}

// Step 1: Function to split a document into smaller chunks
async function splitDocument(pathToDocument) {
    // Read the document content (assuming it's a text file)
    const text = (await fs.readFile(pathToDocument, 'utf-8')).toString();

    // Create a text splitter with specified chunk size and overlap
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 40 
    });

    // Split the text into chunks
    const output = await splitter.createDocuments([text]);

    // Return only the content of each chunk (pageContent contains the actual text)
    return output.map(document => document.pageContent);
};

// Step 2:  Function to create embeddings for each document chunk
async function embedDocuments(documents){
    const embeddings = [];

    // For each document chunk, create its embedding
    await Promise.all(
        documents.map(async (document) => {
            const embedding = await context.getEmbeddingFor(document); // Get the embedding for the document
            embeddings.push({ content: document, embedding: embedding.vector }); // Store the chunk and its embedding
            console.debug(`${embeddings.length}/${documents.length} documents embedded`); // Debug log for progress tracking
        })
    );

    // Return all embeddings
    return embeddings;
};

// Step 3: Insert Embeddings into Supabase DB
async function insertEmbeddings(embeddings){
    // Insert embeddings into the 'handbook_docs' table
    const { error } = await supabase
        .from('handbook_docs')
        .insert(embeddings); // Insert all embeddings at once

    // Handle any errors that occur during the insertion
    if (error) {
        console.error('Error inserting embeddings:', error);
    } else {
        console.log('Embeddings inserted successfully!');
    }
};

//Execute Steps 1-3
async function main() {
    // Create a context for generating embeddings
    const handbookChunks = await splitDocument('../txt/Client_Privacy_Statement.txt'); 
    
    // Example usage: Create embeddings for all chunks of the handbook
    const documentEmbeddings = await embedDocuments(handbookChunks);

    //Store in Vector Database
    // Create a Supabase client using the URL and API key from the .env file
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
    
    await insertEmbeddings(documentEmbeddings);
}