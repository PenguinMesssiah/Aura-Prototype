#Imports
import os
import re
import nltk
import requests
import numpy as np
import pandas as pd
import torch

from nltk import word_tokenize
from nltk.probability import FreqDist
#from nltk.corpus import stopwords
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from transformers import AutoTokenizer, AutoModelForCausalLM, AutoModelForQuestionAnswering, TrainingArguments, Trainer

#Help Function for Data Preparation
def extract_last_sentence(paragraph):
    if not paragraph:
        return None

    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|!)\s', paragraph)
    if sentences:
        return sentences[-1].strip()
    else:
        return None
    
def preprocess_function(examples):
    questions = [q.strip() for q in examples["question"]]
    inputs = tokenizer(
        questions,
        examples["context"],
        max_length=384,
        truncation="only_second",
        return_offsets_mapping=True,
        padding="max_length",
    )

    offset_mapping = inputs.pop("offset_mapping")
    answers = examples["answers"]
    start_positions = []
    end_positions = []

    for i, offset in enumerate(offset_mapping):
        answer = answers[i]
        start_char = answer["answer_start"][0]
        end_char = answer["answer_start"][0] + len(answer["text"][0])
        sequence_ids = inputs.sequence_ids(i)

        # Find the start and end of the context
        idx = 0
        while sequence_ids[idx] != 1:
            idx += 1
        context_start = idx
        while sequence_ids[idx] == 1:
            idx += 1
        context_end = idx - 1

        # If the answer is not fully inside the context, label it (0, 0)
        if offset[context_start][0] > end_char or offset[context_end][1] < start_char:
            start_positions.append(0)
            end_positions.append(0)
        else:
            # Otherwise it's the start and end token positions
            idx = context_start
            while idx <= context_end and offset[idx][0] <= start_char:
                idx += 1
            start_positions.append(idx - 1)

            idx = context_end
            while idx >= context_start and offset[idx][1] >= end_char:
                idx -= 1
            end_positions.append(idx + 1)

    inputs["start_positions"] = start_positions
    inputs["end_positions"] = end_positions
    return inputs

#Data Collection
unesco_df = pd.read_csv("hf://datasets/ktiyab/ethical-framework-UNESCO-Ethics-of-AI/unesco_ethics_of_artificial_intelligence.csv")
#print("obj is ", unesco_df.shape)
#print("unesco contains = ", unesco_df.columns)

#Data Preparation
instruct_reg = []
context_reg  = []

for x in range(0, unesco_df.shape[0]):
    vParagraph  = unesco_df['instruction'][x]
    last_sent   = extract_last_sentence(vParagraph)
    context_par = unesco_df['instruction'][x].replace(last_sent, '')
    instruct_reg.append(last_sent)
    context_reg.append(context_par)

unesco_df.insert(3, "Instructions", instruct_reg)
unesco_df.insert(3, "Context", context_reg)
unesco_df.pop('instruction')
print("unesco contains = ", unesco_df.columns)

# Split the data into training and testing sets (75% train, 25% test)
x_train_instruct, x_train_context, X_test_response, y_train_instruct, y_train_context, y_test_response = train_test_split(
    unesco_df['Instructions'], unesco_df['Context'], unesco_df['response'], test_size=0.25)

#Check MPS Configuration
if torch.backends.mps.is_available():
    mps_device = torch.device("mps")
    x = torch.ones(1, device=mps_device)
    print (x)
else:
    print ("MPS device not found.")

tokenizer    = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1", trust_remote_code=False, padding_side="left")
#model        = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1", device_map="auto", trust_remote_code=False)
model        = AutoModelForQuestionAnswering.from_pretrained("mistralai/Mistral-7B-v0.1", device_map="auto", trust_remote_code=False)
model_inputs = tokenizer(["Who are you?"], return_tensors="pt").to("mps")


'''
# Split the data into training and testing sets (75% train, 25% test)
X_train, X_test, y_train, y_test = train_test_split(
    unesco_df['instruction'], unesco_df['response'], test_size=0.25)

#Model Initialization
#quantization_config = BitsAndBytesConfig(load_in_4bit=True)
model        = AutoModelForCausalLM.from_pretrained("mistralai/Mistral-7B-v0.1", device_map="auto", trust_remote_code=False)
tokenizer    = AutoTokenizer.from_pretrained("mistralai/Mistral-7B-v0.1", trust_remote_code=False, padding_side="left")
model_inputs = tokenizer(["Who are you?"], return_tensors="pt").to("mps")

#Generate Tokens & Decode
generated_ids = model.generate(**model_inputs, max_new_tokens=50)
print(tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0])
'''

#Training Task