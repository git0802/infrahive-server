require("dotenv").config();
const axios = require("axios");

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

    let data = JSON.stringify({
      prompt: prompt,
      model: model,
      max_tokens_to_sample: max_tokens,
      temperature: temperature,
      stop_sequences: stop_sequences,
      stream: stream,
      top_k: top_k,
      top_p: top_p
    });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.anthropic.com//v1/complete",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.ANTHROPIC_API_KEY,
      },
      data: data,
    };
    axios
      .request(config)
      .then((response) => {
        try {
          res.send(response.data.completion);
        } catch {
          res.send("Error in getting response || Axios Error");
        }
      })
      .catch((error) => {
        console.log(error);
      });
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

/*
// Optional Parameters to be added  => DONE ✅

I. GPT3 - https://platform.openai.com/docs/api-reference/completions/create

1. suffix - string - defualt null
2. top_p - number - default 1
3. n - int - default 1
4. stream - boolean - default false
5. presence_penalty - number - default 0
6. frequency_penalty - number - default 0
7. best_of -integer default 1

I. gpt3.5-turbo - https://platform.openai.com/docs/api-reference/chat/create

1. messages : [
  role: string
  content : string
]
2. top_p - number - default 1
3. n - int - default 1
4. stream - bool - default false
5. presence_penalty - number - default 0
6. frequency_penalty - number - default 0

*/
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

    if (model != "chatgpt" && model != "gpt3") {
      res.send("Please enter a valid model value");
    }
    const url =
      model == "chatgpt"
        ? "https://api.openai.com/v1/chat/completions"
        : "https://api.openai.com/v1/completions";
    //Data
    const messages = [
      {
        role: "user",
        content: prompt,
      },
    ];
    let chatgptData = JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens,
      top_p: top_p,
      n: n,
      stream: stream,
      presence_penalty: presence_penalty,
      frequency_penalty: frequency_penalty,
    });
    let gpt3Data = JSON.stringify({
      model: "davinci",
      prompt: prompt,
      temperature: temperature,
      max_tokens: max_tokens,
      suffix: suffix,
      top_p: top_p,
      n: n,
      stream: stream,
      presence_penalty: presence_penalty,
      frequency_penalty: frequency_penalty,
      best_of: best_of,
    });
    //config
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      data: model == "chatgpt" ? chatgptData : gpt3Data,
    };

    axios
      .request(config)
      .then((response) => {
        try {
          const arr = [];
          if (model == "chatgpt") {
            for (let i = 0; i < response.data.choices.length; i++) {
              arr.push(response.data.choices[i].message.content);
            }
            res.send(arr);
          }

          for (let i = 0; i < response.data.choices.lengthi++; ) {
            arr.push(response.data.choices[i].text);
          }
          res.send(arr);
        } catch {
          res.send("Error occured! Could not answer your query.");
        }
      })
      .catch((error) => {
        console.log("Error occured in Axios!");
      });
  } catch (error) {
    console.error({
      title: "OpenAi Text",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error in openAI Text.");
  }
};
