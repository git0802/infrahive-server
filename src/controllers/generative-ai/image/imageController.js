require("dotenv").config();
const axios = require("axios");
const fetch = require('node-fetch');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");

const { Prompt } = require('../../../models');
const { log } = require("console");

exports.Imgdream = async (req, res) => {
    try {
      const { prompt , samples, style, cfg , cgp ,height ,width , steps } = req.body;
      let data = JSON.stringify({
      text_prompts: [
        {
          text: prompt + " in style " + style,
        },
      ],
      cfg_scale: cfg, 
      clip_guidance_preset: cgp,
      height: height,
      width: width,
      samples: samples,
      steps: steps,
    });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
      },
      data: data,
    };
    axios
      .request(config)
      .then((response) => {
        const resp =[]
        for (let i = 0; i < samples; i++) {
          resp.push(response.data.artifacts[i].base64);
        }
        res.send(resp);
      })
      .catch((error) => {
        console.log(error);
      });

      
    } catch (error) {
      console.error({
        title: "Imgdream",
        message: error.message,
        date: new Date(),
      });
      return res.status(500).send("Server Error");
    }
};


  
exports.Imgdalle = async (req, res) => {
    try {
        const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const { prompt , num_outputs, size , style } = req.body;
        const response = await openai.createImage({
        prompt: prompt + " in style " + style,
        n: num_outputs,
        size: size,
        response_format: "b64_json"
    });
    const respabs = [];
    for (let i = 0; i < num_outputs; i++) {
        respabs.push(response.data.data[i].b64_json);
    }
    res.send(respabs);
        

    } catch (error) {
        console.error({
        title: "Imgdalle",
        message: error.message,
        date: new Date(),
        });
        return res.status(500).send("Server Error");
    }
};

exports.PromptSubmit = async ( req, res ) => {
  try {
    const { promptsName, promptsValue, imageStyle, size, mode } = req.body;

    const agentData = {
      promptsName,
      promptsValue,
      imageStyle,
      size,
      mode,
    };
    await new Prompt(agentData).save();

    res.send({ status: 200, message: "Success" });
  } catch (error) {
    console.error({
      title: "PromptSubmit",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send('Server Error');
  }
}

exports.LoadPrompt = async ( req, res ) => {
  try {
    const { mode } = req.body;
    const data = await Prompt.find({ mode });
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

exports.PromptCode = async ( req, res ) => {
  try {
    const { promptsValue, imageStyle, mode, width, height, size, type } = req.body;

    let data;
    if (type === 'Node') {
      data = mode === 'dream' ? `
  const axios = require("axios");
  const qs = require("qs");
  let data = qs.stringify({
    "prompt": "${promptsValue}",
    "samples": 4,
    "cfg": 7,
    "style": "${imageStyle}",
    "height": ${height},
    "width": ${width},
    "cgp": "NONE",
    "steps": 50
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:2000/api/image/dream",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "${process.env.STABILITY_API_KEY}"
    },
    data : data
  };

  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  });
      ` : `
  const axios = require("axios");
  const qs = require("qs");
  let data = qs.stringify({
    "prompt": "${promptsValue}" + "${imageStyle}",
    "n": 4,
    "size": "${size}",
    "response_format": "b64_json"
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:2000/api/image/dalle",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": "${process.env.OPENAI_API_KEY}"
    },
    data : data
  };

  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
  })
  .catch((error) => {
    console.log(error);
  }); 
      `;
    }

    if (type === 'Python') {
      data = mode === 'dream' ? `
  import requests

  url = "http://localhost:2000/api/image/dream"

  payload = "prompt=${promptsValue}&samples=4&cfg=7&style=${imageStyle}&height=${height}&width=${width}&cgp="NONE"&steps=50"
  headers = {
    "Content-Type": "application/json",
    "Authorization": "${process.env.STABILITY_API_KEY}"
  }

  response = requests.request("POST", url, headers=headers, data=payload)

  print(response.text)
      ` : `
  import requests

  url = "http://localhost:2000/api/image/dalle"

  payload = "prompt=${promptsValue}" + "${imageStyle}&n=4&size=${size}&response_format=b64_json"
  headers = {
    "Content-Type": "application/json",
    "Authorization": "${process.env.OPENAI_API_KEY}"
  }

  response = requests.request("POST", url, headers=headers, data=payload)

  print(response.text)
      `;
    }

    if (type === 'cURL') {
      data = mode === 'dream' ? `
  curl --location 'http://localhost:2000/api/image/dream' \

  --header 'Content-Type: application/json' \

  --data-urlencode 'prompt=${promptsValue}' \

  --data-urlencode 'samples=4' \

  --data-urlencode 'cfg=7' \

  --data-urlencode 'style=${imageStyle}' \

  --data-urlencode 'height=${height}' \

  --data-urlencode 'width=${width}' \

  --data-urlencode 'cgp="NONE"' \

  --data-urlencode 'steps=5'
      ` : `
  curl --location 'http://localhost:2000/api/image/dalle' \

  --header 'Content-Type: application/json' \

  --data-urlencode 'prompt=${promptsValue}" + "${imageStyle}' \

  --data-urlencode 'n=4' \

  --data-urlencode 'size=${size}' \

  --data-urlencode 'response_format="b64_json"'
      `;
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