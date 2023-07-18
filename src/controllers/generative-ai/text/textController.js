require("dotenv").config();
const axios = require("axios");

const { Configuration, OpenAIApi } = require("openai");

const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
});

const cohere = require("cohere-ai");

//Implementaions:
// 1. OpenAi- [Chatgpt(gpt-3.5-turbo) ,  gpt3(davinci)] - Completed ✅
// 2. Anthropic- [claude-v1 , claude-instant-v1] - Completed ✅
// 3. Cohere- [command , command-light] - Completed ✅
// 4. Bard- [To be implemented] - Not Complete (not available)

/*
//Optional Parameters to be added => Done ✅

API Reference : https://console.anthropic.com/docs/api/reference#parameters

1. stop_sequences - list of strings - default none
2. stream - boolean - default false
3. top_k - int - default (-1)
4. top_p - float - default (-1)

*/
exports.Anthropic = async (req, res) => {
  try {
    let prompt = req.body.prompt; //required
    let model = req.body.model || "claude-v1"; //required {2 types: "claude-v1" and "claude-instant-v1" only} defaults to "claude-v1"
    let max_tokens = req.body.max_tokens || 1000; //optional -defaults to 1000
    let temperature = req.body.temperature || 0.7;
    let top_k = req.body.top_k || -1;
    let top_p = req.body.top_p || -1;

    const stream = await anthropic.completions.create({
      model: String(model),
      max_tokens_to_sample: Number(max_tokens),
      temperature: Number(temperature),
      stream: true,
      top_k: Number(top_k),
      top_p: Number(top_p),
      prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
    });

    for await (const completion of stream) {
      res.write(completion.completion);
    }

    res.end();
  } catch (error) {
    console.error({
      title: "Anthropic Text",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error in Anthropic Text.");
  }
};

/*
// Optional Parameters to be added => Done ✅

API Reference : https://docs.cohere.com/reference/generate

1. num_generations: int - default 1
2. k - int - default 0
3. p - number - default 0.75
4. frequency_penalty - number - default 0.0
5. presence_penalty - number - default 0.0
6. end_sequences - array of strings
7. stop_sequences - array of strings
8. return_likelihoods - string
9. truncate - string

*/
exports.Cohere = async (req, res) => {
  try {
    let prompt = req.body.prompt; //required
    let model = req.body.model || "command"; //required => 2 models available ("command" && "command-light")
    let max_tokens = req.body.max_tokens || 1000; //optional (advanced) => defaults to 1000
    let num_generations = req.body.num_generations || 1; //optional (advanced) => defaults to 0.75
    let k = req.body.k || 0; //optional
    let p = req.body.p || 0.75; //optional
    let frequency_penalty = req.body.frequency_penalty || 0.0; //optional
    let presence_penalty = req.body.presence_penalty || 0.0; //optional
    let end_sequences = req.body.end_sequences || []; //optional
    let stop_sequences = req.body.stop_sequences || []; //optional
    let return_likelihoods = req.body.presence_penalty || "NONE"; //optional
    let truncate = req.body.truncate || "START"; //optional
    let temperature = req.body.temperature || 0.7; //optional

    async function main() {
      cohere.init(process.env.COHERE_API_KEY);

      const generateResponse = await cohere.generate({
        prompt: prompt,
        model: model,
        max_tokens: max_tokens,
        temperature: temperature,
        truncate: truncate,
        return_likelihoods: return_likelihoods,
        frequency_penalty: frequency_penalty,
        presence_penalty: presence_penalty,
        end_sequences: end_sequences,
        stop_sequences: stop_sequences,
        k: k,
        p: p,
        num_generations: num_generations,
      });

      res.send(generateResponse.body.generations[0].text);
    }
    main().catch(console.error);
  } catch (error) {
    console.error({
      title: "Cohere Text",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error in Cohere Text.");
  }
};

exports.OpenAi = async (req, res) => {
  try {
    const prompt = req.body.prompt; //required
    const model = req.body.model || "chatgpt"; //required => 2 models available => ("chatgpt" , "gpt3") :: defaults to "chatgpt"
    let temperature = req.body.temperature || 0.7; // optional
    let max_tokens = req.body.max_tokens || 1000; //optional
    let top_p = req.body.top_p || 1; //optional
    let n = req.body.n || 1; //optional
    let stream = req.body.stream || false; //optional
    let presence_penalty = req.body.presence_penalty || 0; //optional
    let frequency_penalty = req.body.frequency_penalty || 0; //optional
    let best_of = req.body.best_of || 1; //optional

    if (model != "chatgpt" && model != "gpt3" && model != "gpt4") {
      res.send("Please enter a valid model value");
    }

    const messages = [
      {
        "role": "system",
        "content": "You are a helpful assistant.",
      },
      {
        role: "user",
        content: `${prompt}`,
      },
    ];

    let response;

    if (model == "gpt4") {
      response = new ChatOpenAI({
        model: "gpt-4",
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        n: n,
        presence_penalty: presence_penalty,
        frequency_penalty: frequency_penalty,
        streaming: true,
        callbacks: [
            {
                handleLLMNewToken(token) {
                    res.write(token);
                },
            },
        ],
      });
      // res.send(response.data.choices[0].message.content);
      const chat = await response.call([new HumanChatMessage(prompt)]);

      res.end();
    }

    if (model == "chatgpt") {
      response = new ChatOpenAI({
        model: "gpt-3.5-turbo-16k",
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        n: n,
        presence_penalty: presence_penalty,
        frequency_penalty: frequency_penalty,
        streaming: true,
        callbacks: [
            {
                handleLLMNewToken(token) {
                    console.log("New token:", token);
                    res.write(token);
                },
            },
        ],
      });
      // res.send(response.data.choices[0].message.content);
      const chat = await response.call([new HumanChatMessage(prompt)]);
      console.log(chat.text);

      res.end();
    }

    if (model == "gpt3") {
      response = new ChatOpenAI({
        model: "text-davinci-003",
        prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: ${prompt}\nAI:`,
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        n: n,
        frequency_penalty: frequency_penalty,
        presence_penalty: presence_penalty,
        best_of: best_of,
        streaming: true,
        callbacks: [
            {
                handleLLMNewToken(token) {
                    console.log("New token:", token);
                    res.write(token);
                },
            },
        ],
      });
      // res.send(response.data.choices[0].message.content);
      const chat = await response.call([new HumanChatMessage(`The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: ${prompt}\nAI:`)]);
      console.log(chat.text);

      res.end();
    }

  } catch (error) {
    console.error({
      title: "OpenAi Text",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error in openAI Text.");
  }
};

exports.Code = async (req, res) => {
  try {

    let data;
    const { model } = req.body;
    if (model === "gpt3" || model === "chatgpt" || model === 'gpt4') {
      const { prompt, model, temperature, max_tokens, top_p, n, presence_penalty, frequency_penalty, best_of, codeType } = req.body;
      if (codeType === "Node") {
        data = `
var request = require('request');
var options = {
  'method': 'POST',
  'url': 'http://localhost:2000/api/text/openai',
  'headers': {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "prompt": "${prompt}",
    "model": "${model}",
    "temperature": "${temperature}",
    "max_tokens": "${max_tokens}",
    "top_p": "${top_p}",
    "n": "${n}",
    "presence_penalty": "${presence_penalty}",
    "frequency_penalty": "${frequency_penalty}",
    "best_of": "${best_of}",
  })

};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
        `;
      } else if (codeType === "Python") {
        data = `
import requests
import json

url = "http://localhost:2000/api/text/openai"

payload = json.dumps({
  "prompt": "${prompt}",
  "model": "${model}",
  "temperature": "${temperature}",
  "max_tokens": "${max_tokens}",
  "top_p": "${top_p}",
  "n": "${n}",
  "presence_penalty": "${presence_penalty}",
  "frequency_penalty": "${frequency_penalty}",
  "best_of": "${best_of}",
})
headers = {
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)
        `;
      } else {
        data = `
curl --location 'http://localhost:2000/api/text/openai' \
--header 'Content-Type: application/json' \
--data '{
  "prompt": "${prompt}",
  "model": "${model}",
  "temperature": "${temperature}",
  "max_tokens": "${max_tokens}",
  "top_p": "${top_p}",
  "n": "${n}",
  "presence_penalty": "${presence_penalty}",
  "frequency_penalty": "${frequency_penalty}",
  "best_of": "${best_of}",
}
'
        `;
      }
    } else if (model === "clause-v1" || model === "clause-instant-v1") {
      const { prompt, model, max_tokens, temperature, top_k, top_p, API_KEY, codeType } = req.body;
      if (codeType === "Node") {
        data = `
var request = require('request');
var options = {
  'method': 'POST',
  'url': 'http://localhost:2000/api/text/anthropic',
  'headers': {
    'Content-Type': 'application/json',
    'X-Api-Key': '${process.env.ANTHROPIC_API_KEY}'
  },
  body: JSON.stringify({
    "prompt": "${prompt}",
    "model": "${model}",
    "max_tokens": "${max_tokens}",
    "temperature": "${temperature}",
    "top_k": "${top_k}",
    "top_p": "${top_p}",
  })

};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
        `;
      } else if (codeType === "Python") {
        data = `
import requests
import json

url = "http://localhost:2000/api/text/anthropic"

payload = json.dumps({
  "prompt": "${prompt}",
  "model": "${model}",
  "max_tokens": "${max_tokens}",
  "temperature": "${temperature}",
  "top_k": "${top_k}",
  "top_p": "${top_p}",
})
headers = {
  'Content-Type': 'application/json',
  'X-Api-Key': '${process.env.ANTHROPIC_API_KEY}'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)
        `;
      } else {
        data = `
curl --location 'http://localhost:2000/api/text/anthropic' \
--header 'Content-Type: application/json' \
--header 'X-Api-Key': '${process.env.ANTHROPIC_API_KEY}' \
--data '{
  "prompt": "${prompt}",
  "model": "${model}",
  "max_tokens": "${max_tokens}",
  "temperature": "${temperature}",
  "top_k": "${top_k}",
  "top_p": "${top_p}"
}
'
        `;
      }
    } else {
      const { prompt, model, max_tokens, num_generations, k, p, frequency_penalty, presence_penalty, temperature, codeType } = req.body;
      if (codeType === "Node") {
        data = `
var request = require('request');
var options = {
  'method': 'POST',
  'url': 'http://localhost:2000/api/text/cohere',
  'headers': {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${process.env.COHERE_API_KEY}'
  },
  body: JSON.stringify({
    "prompt": "${prompt}",
    "model": "${model}",
    "max_tokens": "${max_tokens}",
    "num_generations": "${num_generations}",
    'k": "${k}",
    "p": "${p}",
    "frequency_penalty": "${frequency_penalty}",
    "presence_penalty": "${presence_penalty}",
    "temperature": "${temperature}"
  })

};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
        `;
      } else if (codeType === "Python") {
        data = `
import requests
import json

url = "http://localhost:2000/api/text/cohere"

payload = json.dumps({
  "prompt": "${prompt}",
  "model": "${model}",
  "max_tokens": "${max_tokens}",
  "num_generations": "${num_generations}",
  'k": "${k}",
  "p": "${p}",
  "frequency_penalty": "${frequency_penalty}",
  "presence_penalty": "${presence_penalty}",
  "temperature": "${temperature}"
})
headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ${process.env.COHERE_API_KEY}'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)
        `;
      } else {
        data = `
curl --location 'http://localhost:2000/api/text/cohere' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer ${process.env.COHERE_API_KEY}' \
--data '{
  "prompt": "${prompt}",
  "model": "${model}",
  "max_tokens": "${max_tokens}",
  "num_generations": "${num_generations}",
  'k": "${k}",
  "p": "${p}",
  "frequency_penalty": "${frequency_penalty}",
  "presence_penalty": "${presence_penalty}",
  "temperature": "${temperature}"
}
'
        `;
      }
    }


    return res.status(200).send(data);
  } catch (error) {
    console.error({
      title: "LoadPrompt",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send('Server Error');
  }
}