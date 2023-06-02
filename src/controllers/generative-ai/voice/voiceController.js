require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");
const { BASE_URL } = require('../../../../config.js');

//DEEPGRAM => allows only URL 
//Reference: https://developers.deepgram.com/reference/pre-recorded
exports.DeepGramAi = async (req, res) => {
  const url = req.body.url; //required field
  const tier  =req.body.tier || "base"; //optional field
  const model = req.body.model || "general"; //optional field
  const version = req.body.version || "latest"; //optional field
  const language = req.body.language || "en"; //optional field
  const detect_language = req.body.detect_language || true; //optional field
  const profanity_filter = req.body.profanity_filter || false; //optional field
  const punctuate = req.body.punctuate || true; //optional field
  const smart_format = req.body.smart_format || false; //optional field
  const utterances = req.body.utterances || false; //optional field
  const utt_split = req.body.utt_split || 0.8; //optional field

  try {
    let data = JSON.stringify({
      url: url,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `https://api.deepgram.com/v1/listen?model=${model}&tier=${tier}&version=${version}&language=${language}&detect_language=${detect_language}&punctuate=${punctuate}&profanity_filter=${profanity_filter}&smart_format=${smart_format}&utterances=${utterances}&utt_split=${utt_split}`,
      headers: {
        Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        res.send(response.data.results.channels[0].alternatives[0].transcript);
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.error({
      title: "DeepGramAi",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
//Only accepts audio file. No url.
//Reference : https://platform.openai.com/docs/api-reference/audio
exports.WhisperAi = async (req, res) => {
  try {
    let name = req.body.name; //name of the sound file along with the extension example : name = "audio.mp3"
    let model = req.body.model || "whisper-1"; //default to "whisper-1"
    let format = req.body.response_format || "json";
    let temperature = req.body.temperature || 0.4; //defaults to 0.
    let  language = req.body.language || "en"; //defaults to english. Send language in ISO 639.1 format => check wikipedia
    let configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const resp = await openai.createTranscription(
      file= fs.createReadStream(
        `${BASE_URL}/uploads/audio/` +
          name
      ),
      model,
      undefined,
      format,
      temperature, 
      language
    );
    const filePath = `${BASE_URL}/uploads/audio/` + name;

    //delete the file now
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      } else {
        console.log("File deleted successfully");
      }
    });
    res.send(resp.data.text);
  } catch (error) {
    console.error({
      title: "WhisperAi",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};



//to be implemented
exports.AssemblyAi = async (req, res) => {
  try {
    res.send("Inside Assembly Ai. To be implemented");
  } catch (error) {
    console.error({
      title: "AssemblyAi",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
