require("dotenv").config();
const axios = require("axios");


//Implementaions:
// 1. OpenAi- [Chatgpt(gpt-3.5-turbo) ,  gpt3(davinci)] - Completed ✅
// 2. Anthropic- [Claude-v1 , Claude-instant-v1.1] - Completed ✅
// 3. Cohere- [command , Command-light] - Completed ✅
// 4. Bard- [To be implemented] - Not Complete (not available) 

exports.Anthropic = async (req, res) => {
  try {
    let prompt = req.body.prompt; //required
    let model = req.body.model || "claude-v1"; //required {2 types: "claude-v1" and "claude-instant-v1.1" only} defaults to "claude-v1"
    let max_tokens = req.body.max_tokens || 1000; //optional -defaults to 1000
    let temperature = req.body.temperature || 0.7; //optional -defaults to 0.7
    let data = JSON.stringify({
      prompt: prompt,
      model: model,
      max_tokens_to_sample: max_tokens,
      temperature: temperature,
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

exports.Cohere = async (req, res) => {
  try {
    let prompt = req.body.prompt; //required
    let model = req.body.model || "command"; //required => 2 models available ("command" && "command-light")
    let max_tokens = req.body.max_tokens || 1000; //optional (advanced) => defaults to 1000
    let temperature = req.body.temperature || 0.75; //optional (advanced) => defaults to 0.75
    let data = JSON.stringify({
      prompt: prompt,
      model: model,
      max_tokens: max_tokens,
      temperature: temperature,
      truncate: "START",
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
          res.send(response.data.generations[0].text);
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
    const model = req.body.model || "chatgpt"; //required => defaults to "chatgpt"
    let temperature = req.body.temperature || 0.7; // optional
    let max_tokens = req.body.max_tokens || 1000; //optional
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
    });
    let gpt3Data = JSON.stringify({
      model: "davinci",
      prompt: prompt,
      temperature: temperature,
      max_tokens: max_tokens,
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
          const resp =
            model == "chatgpt"
              ? response.data.choices[0].message.content
              : response.data.choices[0].text;
          res.send(resp);
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
