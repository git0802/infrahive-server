require("dotenv").config();
const axios = require("axios");




exports.OpenAi = async (req, res) => {
  try {
    const prompt = req.body.prompt; //required
    const model = req.body.model; //required
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
          res.send(prompt + resp);
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
