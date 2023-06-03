require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { Configuration, OpenAIApi } = require("openai");
const { BASE_URL } = require("../../../../config.js");

//DEEPGRAM => allows only URL
//Reference: https://developers.deepgram.com/reference/pre-recorded
exports.DeepGramAi = async (req, res) => {
  const url = req.body.url; //required field
  const tier = req.body.tier || "base"; //optional field
  const model = req.body.model || "general"; //optional field
  const version = req.body.version || "latest"; //optional field
  const language = req.body.language || "en"; //optional field
  const detect_language = req.body.detect_language || true; //optional field
  const profanity_filter = req.body.profanity_filter || false; //optional field
  const punctuate = req.body.punctuate || true; //optional field
  const smart_format = req.body.smart_format || true; //optional field
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
    let language = req.body.language || "en"; //defaults to english. Send language in ISO 639.1 format => check wikipedia
    let configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const resp = await openai.createTranscription(
      (file = fs.createReadStream(`${BASE_URL}/uploads/audio/` + name)),
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

// REFERENCE: https://www.assemblyai.com/docs/Guides/transcribing_an_audio_file

//from frontend user can:
//1. send a file (make sure you send the name the file along with it!!)
//2. send url of audio file
//3. send both => then I will consider the url to process.


exports.AssemblyAi = async (req, res) => {
  const apikey = process.env.ASSEMBLY_API_KEY;
  let obj = {
    audio_url: req.body.audio_url || "none",
    name : req.body.name || "none",
    language_code: req.body.language_code || "en_us",
    entity_detection: req.body.entity_detection || false,
    sentiment_analysis: req.body.sentiment_analysis || false,
    content_safety : req.body.content_safety || false,
    format_text : req.body.format_text || true,
    audio_start_from : Number(req.body.audio_start_from) || 0,
    audio_end_at : Number(req.body.audio_end_at) || "none",

  };
  try {
    if (obj.audio_url != "none") {
      //make url request only here
      const transcript = await transcribeAudioUrl(
        process.env.ASSEMBLY_API_KEY,
        obj
      );
      if (transcript != "error") {
        res.send(transcript);
      } else {
        res.send("Error in transcription");
      }
    } else {
      //make request for audio file transcription
      const name = req.body.name || "none";
      if(name != "none"){
        
      const path = `${BASE_URL}/uploads/audio/` + name;
      const uploadUrl = await upload_file(apikey, path);
      // console.log(uploadUrl);
      if (!uploadUrl) {
        res.send("Unable to convert file to text");
      } else {
        const transcript = await transcribeAudioFile(
          process.env.ASSEMBLY_API_KEY,
          obj,
          uploadUrl
        );
        if (transcript != "error") {
          res.send(transcript);
        } else {
          res.send("Error in transcription");
        }
      }
      fs.unlink(path, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
    }
    else{
      res.send("You must provide a name for the file in multipart form data")
    }
  }
  
  } catch (error) {
    console.error({
      title: "AssemblyAi",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
async function upload_file(api_token, path) {
  const data = fs.createReadStream(path);
  const url = "https://api.assemblyai.com/v2/upload";

  try {
    
    const response = await axios.post(url, data, {
      headers: {
        "Content-Type": "application/octet-stream",
        Authorization: api_token,
      },
    });
    if (response.status === 200) {
      return response.data["upload_url"];
    } else {
      console.error(`Error: ${response.status} - ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    return null;
  }
}
async function transcribeAudioUrl(api_token, obj) {
  //parameters here
  // console.log("inside transcribeAudioUrl")
  let audio_url = obj.audio_url;
  let language_code = obj.language_code || "en_us";
  let entity_detection = obj.entity_detection || false;
  let sentiment_analysis = obj.sentiment_analysis || false;
  let content_safety  = obj.content_safety || false;
  let format_text  = obj.format_text || true;
  let audio_start_from = obj.audio_start_from || 0;
  let audio_end_at = obj.audio_end_at || "none";

  const headers = {
    authorization: api_token,
    "content-type": "application/json",
  };
  let body = JSON.stringify({
    audio_url : audio_url,
    language_code : language_code,
    entity_detection: entity_detection,
    sentiment_analysis : sentiment_analysis,
    content_safety: content_safety,
    format_text : format_text,
    audio_start_from : audio_start_from,
    audio_end_at : audio_end_at,

  });
  if(audio_end_at == "none"){
    body = JSON.stringify({
      audio_url : audio_url,
      language_code : language_code,
      entity_detection: entity_detection,
      sentiment_analysis : sentiment_analysis,
      content_safety: content_safety,
      format_text : format_text,
      audio_start_from : audio_start_from,
    });
  }
  
  const response = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    body: body,
    headers,
  });
  const responseData = await response.json();
  const transcriptId = responseData.id;
  //keep checking till status becomes completed
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  while (true) {
    const pollingResponse = await fetch(pollingEndpoint, { headers });
    const transcriptionResult = await pollingResponse.json();
    if (transcriptionResult.status === "completed") {
      return transcriptionResult.text;
    } else if (transcriptionResult.status === "error") {
      return "error";
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function transcribeAudioFile(api_token, obj , url) {
  //parameters here
  let language_code = obj.language_code || "en_us";
  let entity_detection = obj.entity_detection || false;
  let sentiment_analysis = obj.sentiment_analysis || false;
  let content_safety  = obj.content_safety || false;
  let format_text  = obj.format_text || true;
  let audio_start_from = obj.audio_start_from || 0;
  let audio_end_at = obj.audio_end_at || "none";

  const headers = {
    authorization: api_token,
    "content-type": "application/json",
  };

  let body = JSON.stringify({
    audio_url : url,
    language_code : language_code,
    entity_detection: entity_detection,
    sentiment_analysis : sentiment_analysis,
    content_safety: content_safety,
    format_text : format_text,
    audio_start_from : audio_start_from,
  });
  if(audio_end_at != "none"){
    body = JSON.stringify({
      audio_url : url,
      language_code : language_code,
      entity_detection: entity_detection,
      sentiment_analysis : sentiment_analysis,
      content_safety: content_safety,
      format_text : format_text,
      audio_start_from : audio_start_from,
      audio_end_at : audio_end_at,
    });
  }

  const response = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    body: body,
    headers,
  });
  const responseData = await response.json();
  const transcriptId = responseData.id;
  //keep checking till status becomes completed
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
  while (true) {
    const pollingResponse = await fetch(pollingEndpoint, { headers });
    const transcriptionResult = await pollingResponse.json();
    if (transcriptionResult.status === "completed") {
      return transcriptionResult.text;
    } else if (transcriptionResult.status === "error") {
      return "error";
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}
