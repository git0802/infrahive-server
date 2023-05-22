// import file modules
const UploaderManager = require("./filemanager");
const fs = require("fs");
// import ai modules
// const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const {
  HumanChatMessage,
  SystemChatMessage,
  AIChatMessage,
} = require("langchain/schema");

// const { PineconeClient } = require("@pinecone-database/pinecone");
const { VectorDBQAChain } = require("langchain/chains");
const { OpenAI } = require("langchain/llms/openai");
// const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

// file loaders
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { CSVLoader } = require("langchain/document_loaders/fs/csv");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { JSONLoader } = require("langchain/document_loaders/fs/json");

const { DIR } = require("../../serverConf");
const { Docu_analysis, Nexus } = require("../models");

const openFile = (filename) => {
  let rawdata = fs.readFileSync(filename, "utf8");
  return rawdata;
};
exports.deleteFile = async (req, res) => {
  try {
    const { email, filename } = req.body;
    const url = DIR + "/uploads/documents/" + filename;
    await fs.unlink(url, (err) => {
      if (err) throw err;
    });
    await Docu_analysis.remove({ email, filename });
    await Nexus.remove({ email, filename });
    res.send({ status: 200, message: "Success" });
  } catch (error) {
    console.error({ title: "deleteFile", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};
exports.documentSubmit = async (req, res) => {
  try {
    const { email } = req.body;
    await UploaderManager(req, "documents", async (data) => {
      const agentData = {
        email,
        filename: data[0].name,
        orignal_name: data[0].realname,
      };
      await new Docu_analysis(agentData).save();
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

      const embedding = new OpenAIEmbeddings({
        openAIApiKey: process.env.API_KEY,
      });

      await docs.map(async (item) => {
        const vector = await embedding.embedQuery(item.pageContent);
        const text = "user:" + item.pageContent;
        await new Nexus({
          email,
          vector,
          text,
          filename: data[0].name,
        }).save();
      });
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
exports.loadDcouments = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await Docu_analysis.find({ email });
    return res.status(200).send(data);
  } catch (error) {
    console.error({
      title: "documentSubmit",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
exports.getChatText = async (req, res) => {
  try {
    const { message, prompt, email } = req.body;
    const embedding = new OpenAIEmbeddings({
      openAIApiKey: process.env.API_KEY,
    });

    let conversation = await loadMessages(email, prompt);
    let vector = await embedding.embedQuery(message);

    let info = { email, vector, text: `user:${message}`, filename: prompt };
    await new Nexus(info).save();

    let memories = fetchMemories(vector, conversation, 30);
    let notes = await summarizeMemories(memories, message);

    vector = await embedding.embedQuery(notes);
    info = { email, vector, text: `ai:${notes}`, filename: prompt };
    await new Nexus(info).save();
    return res.status(200).send({ text: notes });
  } catch (error) {
    console.error({
      title: "getChatText",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

const generatAnswer = async (message, prompt) => {
  const chat = new ChatOpenAI({
    openAIApiKey: process.env.API_KEY,
    temperature: 0,
  });
  const response = await chat.call([
    new AIChatMessage(prompt),
    new HumanChatMessage(message),
  ]);
  return response.text;
};

const loadMessages = async (email, filename) => {
  let result = [];
  const d = await Nexus.find({ email, filename });
  d.map((data) => {
    result.push(data);
  });
  return result;
};

const fetchMemories = (vector, logs, count) => {
  let scores = [];
  for (let i of logs) {
    if (vector == i["vector"]) continue;
    let score = similarity(i["vector"], vector);
    i["score"] = score;
    scores.push(i);
  }

  let ordered = scores.sort((a, b) => {
    if (a.score < b.score) {
      return -1;
    }
    if (a.score > b.score) {
      return 1;
    }
    return 0;
  });

  return ordered.slice(0, count);
};

function similarity(A, B) {
  var dotproduct = 0;
  var mA = 0;
  var mB = 0;
  for (let i = 0; i < A.length; i++) {
    // here you missed the i++
    dotproduct += A[i] * B[i];
    mA += A[i] * A[i];
    mB += B[i] * B[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  var similarity = dotproduct / (mA * mB); // here you needed extra brackets
  return similarity;
}

const summarizeMemories = async (memories, currentMessage) => {
  memories = memories.sort((a, b) => {
    if (a.createdAt < b.createdAt) {
      return -1;
    }
    if (a.createdAt > b.createdAt) {
      return 1;
    }
    return 0;
  });
  let block = "";
  memories.map((memory) => {
    block += memory["text"] + "\n\n";
  });
  block = block.trim();
  let prompt = openFile(DIR + "/prompt.txt")
    .replace("<<CONVERSATION>>", block)
    .replace("<<MESSAGE>>", currentMessage);
  let notes = await generatAnswer(currentMessage, prompt);
  return notes || "I am sorry.Some error in communication.";
};
