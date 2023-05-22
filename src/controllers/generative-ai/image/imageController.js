require("dotenv").config();
const axios = require("axios");
const fetch = require('node-fetch');
const fs = require('fs');
const { Configuration, OpenAIApi } = require("openai");
exports.Imgdream = async (req, res) => {
    try {
      const { prompt , samples, style, cfg , cgp ,height ,width , steps } = req.body;
       prompt = prompt + "in style" + style;
    let data = JSON.stringify({
      text_prompts: [
        {
          text: prompt,
        },
      ],
      cfg_scale: cfg, 
      clip_guidance_preset: cgp,
      height: height,
      width: width,
      samples: samples,
      steps: steps,
      style_preset: style 
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
        const { prompt , num_outputs, size } = req.body;
        const response = await openai.createImage({
        prompt: prompt,
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