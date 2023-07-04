require("dotenv").config();
const axios = require("axios");

const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    let stop_sequences = req.body.stop_sequences || []; //optional -defaults to 0.7
    let temperature = req.body.temperature || 0.7;
    let stream = req.body.stream || false;
    let top_k = req.body.top_k || -1;
    let top_p = req.body.top_p || -1;

    const Anthropic = require("@anthropic-ai/sdk");

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY, // defaults to process.env["ANTHROPIC_API_KEY"]
    });

    const params = {
      prompt: prompt,
      max_tokens_to_sample: 300,
      model: 'claude-1',
    };
    const completion = await anthropic.completions.create(params)
    .catch((err) => {
      if (err instanceof Anthropic.APIError) {
        console.log(err.status); // 400
        console.log(err.name); // BadRequestError
        console.log(err.headers); // {server: 'nginx', ...}
      }
    });

    console.log(completion);

    // const completion = await anthropic.completions.create({
    //   model: model,
    //   max_tokens_to_sample: max_tokens,
    //   temperature: temperature,
    //   stop_sequences: stop_sequences,
    //   stream: stream,
    //   top_k: top_k,
    //   top_p: top_p,
    //   prompt: prompt,
    // });

    // let data = JSON.stringify({
    //   prompt: prompt,
    //   model: model,
    //   max_tokens_to_sample: max_tokens,
    //   temperature: temperature,
    //   stop_sequences: stop_sequences,
    //   stream: stream,
    //   top_k: top_k,
    //   top_p: top_p
    // });
    // let config = {
    //   method: "post",
    //   maxBodyLength: Infinity,
    //   url: "https://api.anthropic.com//v1/complete",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-API-Key": process.env.ANTHROPIC_API_KEY,
    //   },
    //   data: data,
    // };
    // axios
    //   .request(config)
    //   .then((response) => {
    //     try {
    //       res.send(response.data.completion);
    //     } catch {
    //       res.send("Error in getting response || Axios Error");
    //     }
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   });
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

    let data = JSON.stringify({
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
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.cohere.ai/v1/generate",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        try {
          const arr = [];

          for (let i = 0; i < response.data.generations.length; i++) {
            arr.push(response.data.generations[i].text);
          }
          res.send(arr);
        } catch {
          res.send("Axios Error in Cohere Text.");
        }
      })
      .catch((error) => {
        console.log(error);
      });
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
    let suffix = req.body.suffix || null; //optional
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
      response = await openai.createChatCompletion({
        model: "gpt-4-32k-0613",
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        n: n,
        stream: stream,
        presence_penalty: presence_penalty,
        frequency_penalty: frequency_penalty,
      });
      res.send(response.data.choices[0].message.content);
    }

    if (model == "chatgpt") {
      response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k",
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        n: n,
        stream: stream,
        presence_penalty: presence_penalty,
        frequency_penalty: frequency_penalty,
      });
      res.send(response.data.choices[0].message.content);
    } 

    if (model == "gpt3") {
      response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: ${prompt}\nAI:`,
        temperature: temperature,
        max_tokens: max_tokens,
        top_p: top_p,
        suffix: suffix,
        n: n,
        stream: stream,
        frequency_penalty: frequency_penalty,
        presence_penalty: presence_penalty,
        best_of: best_of,
      });

      res.send(response.data.choices[0].text);
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