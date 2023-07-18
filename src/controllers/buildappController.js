const UploaderManager = require("./filemanager");
const fs = require("fs");
const { TokenTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { OpenAI } = require("langchain/llms/openai");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { loadQAChain } = require("langchain/chains");

// file loaders
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { CSVLoader } = require("langchain/document_loaders/fs/csv");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { JSONLoader } = require("langchain/document_loaders/fs/json");

const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage } = require("langchain/schema");

const { performance } = require("perf_hooks");

const { Configuration, OpenAIApi } = require("openai");

const { Botapp, Bothistory } = require("../models");

require("dotenv").config();

const uniqid = require("uniqid");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

exports.CreateApp = async (req, res) => {
  try {
    const { email, appname, bottype } = req.body;

    const appid = `${uniqid()}`;

    let modeltype =
      bottype === "chatapp"
        ? req.body.modeltype || "gpt-3.5-turbo"
        : req.body.modeltype || "text-davinci-003";
    let temperature = req.body.temperature || 1;
    let max_token = req.body.max_token || 512;
    let top_p = req.body.top_p || 1;
    let presence_penalty = req.body.presence_penalty || 0;
    let frequency_penalty = req.body.frequency_penalty || 0;
    let open_state = req.body.open_state || "true";

    const agentData = {
      email,
      appid,
      appname,
      bottype,
      modeltype,
      temperature,
      top_p,
      presence_penalty,
      frequency_penalty,
      max_token,
      open_state,
    };
    await new Botapp(agentData).save();

    res.send({ status: 200, message: "Success" });
  } catch (error) {
    console.error({
      title: "CreateApp",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.LoadApp = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await Botapp.find({ email });
    let appname = [];
    let appid = [];
    let description = [];
    for (let i in data) {
      appname[i] = data[i].appname;
      appid[i] = data[i].appid;
      description[i] = data[i].description;
    }
    const resData = {
      appid,
      appname,
      description,
    };
    return res.status(200).send(resData);
  } catch (error) {
    console.error({
      title: "LoadApp",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.LoadOneApp = async (req, res) => {
  try {
    const { appid } = req.body;
    const data = await Botapp.find({ appid });
    return res.status(200).send(data);
  } catch (error) {
    console.error({
      title: "LoadOneApp",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.UpdateApp = async (req, res) => {
  try {
    const {
      appid,
      appname,
      description,
      preprompt,
      variable,
      remark,
      pinecone_Id,
      modeltype,
      temperature,
      top_p,
      presence_penalty,
      frequency_penalty,
      max_token,
      open_state,
    } = req.body;

    await Botapp.updateOne(
      { appid: appid },
      {
        $set: {
          appname: appname,
          description: description,
          preprompt: preprompt,
          variable: variable,
          remark: remark,
          pinecone_Id: pinecone_Id,
          modeltype: modeltype,
          temperature: temperature,
          top_p: top_p,
          presence_penalty: presence_penalty,
          frequency_penalty: frequency_penalty,
          max_token: max_token,
          open_state: open_state,
        },
      }
    );
    res.send({ status: 200, message: "Success" });
  } catch (error) {
    console.error({
      title: "UpdateApp",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.DeleteApp = async (req, res) => {
  try {
    const { appid } = req.body;

    await Botapp.remove({ appid });

    res.send({ status: 200, message: "Success" });
  } catch (error) {
    console.error({
      title: "DeleteApp",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.GetChatText = async (req, res) => {
  try {
    const { appid, prompt, token_usage, conversation_id } = req.body;

    const data = await Botapp.find({ appid });
    const {
      modeltype,
      temperature,
      top_p,
      presence_penalty,
      frequency_penalty,
      max_token,
      variable,
      preprompt,
      remark,
      pinecone_Id,
    } = data[0];

    const regex = /{{(.*?)}}/g;

    let modifiedSentence;

    if (pinecone_Id) {
      dataChat(
        pinecone_Id,
        prompt,
        modeltype,
        temperature,
        top_p,
        presence_penalty,
        frequency_penalty,
        max_token,
        conversation_id,
        token_usage
      );
    }

    if (preprompt) {
      modifiedSentence = preprompt.replace(regex, `${variable}`);
    }

    const word_num = max_token / 2;

    if (modeltype == "text-davinci-003") {
      const startTime = performance.now();

      response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Please generate a short summary of the following conversation within ${word_num} words. ${modifiedSentence}\n\nuser: Hello, who are you?\nsystem: I am an AI created by OpenAI. How can I help you today?\nuser: ${prompt}\nsystem:`,
        temperature: Number(temperature),
        max_tokens: Number(max_token),
        top_p: Number(top_p),
        frequency_penalty: Number(frequency_penalty),
        presence_penalty: Number(presence_penalty),
      });

      const promptData = {
        appid: appid,
        message: prompt,
        role: "user",
        token_usage: token_usage,
      };

      await new Bothistory(promptData).save();

      const message = response.data.choices[0].text;

      res.send(message);
      const interaction_time = Math.round(performance.now() - startTime) / 1000;

      const aiData = {
        appid: appid,
        message: message,
        role: "syetem",
        interaction_time: interaction_time,
      };

      await new Bothistory(aiData).save();
    } else {
      if (modifiedSentence) {
        const promptMsg = {
          appid: appid,
          message: `${modifiedSentence}`,
          role: "user",
          token_usage: token_usage,
          conversation_id: conversation_id,
        };

        await new Bothistory(promptMsg).save();

        const aiMsg = {
          appid: appid,
          message: remark ? `${remark}` : "",
          role: "system",
          conversation_id: conversation_id,
        };

        await new Bothistory(aiMsg).save();
      }

      aiChat(
        appid,
        prompt,
        modeltype,
        temperature,
        top_p,
        presence_penalty,
        frequency_penalty,
        max_token,
        conversation_id,
        token_usage,
        res
      );
    }
  } catch (error) {
    console.error({
      title: "GetChatText",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

async function dataChat(
  pinecone_Id,
  prompt,
  modeltype,
  temperature,
  top_p,
  presence_penalty,
  frequency_penalty,
  max_token,
  conversation_id,
  token_usage
) {
  const history = await Bothistory.find({ conversation_id, role: "system" })
    .sort({ createdAt: -1 })
    .limit(1);
  let pastMessages = [];
  for (let i in history) {
    pastMessage = {
      content: history[i].message,
    };
    pastMessages = [...pastMessages, pastMessage];
  }

  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

  const vectorStore = await PineconeStore.fromExistingIndex(
    new OpenAIEmbeddings({ openAIApiKey: process.env.API_KEY }),
    { pineconeIndex, namespace: pinecone_Id }
  );

  const llm = new OpenAI({
    model: modeltype,
    openAIApiKey: process.env.API_KEY,
    temperature: Number(temperature),
    max_tokens: Number(max_token),
    top_p: Number(top_p),
    frequency_penalty: Number(frequency_penalty),
    presence_penalty: Number(presence_penalty),
  });

  const promptData = {
    appid: appid,
    message: prompt,
    role: "user",
    token_usage: token_usage,
  };

  await new Bothistory(promptData).save();

  const newUserMessage = {
    content: `${prompt}`,
  };

  pastMessages = [...pastMessages, newUserMessage];

  const results = await vectorStore.similaritySearch(pastMessages, 5);
  const chain = loadQAChain(llm, { type: "stuff" });

  var rowletter;

  let total = [];
  for (let index = 0; index < results.length; index++) {
    total.push(results[index]);
  }

  const startTime = performance.now();

  await chain
    .call({
      input_documents: total,
      question: `Please generate a short summary of the following conversation.\n[Conversation Start]\n ${prompt}\n[Conversation End]\n\nsummary:`,
    })
    .then((row) => {
      rowletter = row.text;
      return rowletter;
    });

  const interaction_time = Math.round(performance.now() - startTime) / 1000;

  const aiData = {
    appid: appid,
    message: rowletter,
    role: "syetem",
    interaction_time: interaction_time,
  };

  await new Bothistory(aiData).save();

  return res.status(200).send({ text: rowletter });
}

async function aiChat(
  appid,
  prompt,
  modeltype,
  temperature,
  top_p,
  presence_penalty,
  frequency_penalty,
  max_token,
  conversation_id,
  token_usage,
  res
) {
  const history = await Bothistory.find({ conversation_id, role: "system" })
    .sort({ createdAt: -1 })
    .limit(1);
  let pastMessages = [];
  for (let i in history) {
    pastMessage = {
      role: history[i].role,
      content: history[i].message,
    };
    pastMessages = [...pastMessages, pastMessage];
  }

  const newUserMessage = {
    role: "user",
    content: `${prompt}`,
  };

  const promptMsg = {
    appid: appid,
    message: `Please generate a short summary of the following conversation.\n[Conversation Start]\n ${prompt}\n[Conversation End]\n\nsummary:`,
    role: "user",
    token_usage: token_usage,
    conversation_id: conversation_id,
  };

  await new Bothistory(promptMsg).save();

  pastMessages = [...pastMessages, newUserMessage];

  const startTime = performance.now();

  const response = new ChatOpenAI({
    model: modeltype,
    temperature: Number(temperature),
    max_tokens: Number(max_token),
    top_p: Number(top_p),
    frequency_penalty: Number(frequency_penalty),
    presence_penalty: Number(presence_penalty),
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token) {
          res.write(token);
        },
      },
    ],
  });

  const chat = await response.call([new HumanChatMessage(prompt)]);

  const interaction_time = Math.round(performance.now() - startTime) / 1000;

  const aiMsg = {
    appid: appid,
    message: chat.text,
    role: "system",
    interaction_time: interaction_time,
    conversation_id: conversation_id,
  };

  await new Bothistory(aiMsg).save();

  res.end();
}

exports.dataSubmit = async (req, res) => {
  try {
    const { appid } = req.body;
    await UploaderManager(req, "documents", async (data) => {
      const agentData = {
        appid,
        pinecone_Id: data[0].name,
      };
      await new Botapp.updateOne(
        { appid: appid },
        { $set: { pinecone_Id: pinecone_Id } }
      );
      const url = DIR + "/uploads/documents/" + data[0].name;

      const type = data[0].name.split(".")[1];
      switch (type) {
        case "txt":
          loader = new TextLoader(url);
          break;
        case "pdf":
          loader = new PDFLoader(url);
          break;
        case "csv":
          loader = new CSVLoader(url);
          break;
        case "docx":
          loader = new DocxLoader(url);
          break;
        case "json":
          loader = new JSONLoader(url);
          break;
        default:
          break;
      }
      const docs = await loader.load();

      // pinecone
      const splitter = new TokenTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 0,
      });

      console.log([docs[0].pageContent]);

      const output = await splitter.createDocuments([docs[0].pageContent]);

      const client = new PineconeClient();

      await client.init({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT,
      });
      const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

      await PineconeStore.fromDocuments(
        output,
        new OpenAIEmbeddings({ openAIApiKey: process.env.API_KEY }),
        { pineconeIndex, namespace: agentData.pinecone_Id }
      );
    });

    res.send({ status: 200, message: "Success" });
  } catch (error) {
    console.error({
      title: "documentSubmit",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.FollowQuestion = async (req, res) => {
  try {
    const { appid, conversation_id } = req.body;

    const data = await Bothistory.find({
      appid,
      conversation_id,
      role: "system",
    })
      .sort({ createdAt: -1 })
      .limit(1);

    const prompt = data[0].message;

    const question = [
      { role: "system", content: "You are a helpful assistant." },
      {
        role: "user",
        content: `Please help me predict the three most likely questions that human would ask, ${prompt} and keeping each question under 20 characters.`,
      },
      { role: "system", content: `Question:` },
    ];

    let response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: question,
    });

    console.log(response.data.choices[0].message.content);
    res.send(response.data.choices[0].message.content);
  } catch (error) {
    console.error({
      title: "FollowQuestion",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
