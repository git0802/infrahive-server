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

const { PineconeClient } = require("@pinecone-database/pinecone");
const { VectorDBQAChain } = require("langchain/chains");
const { TokenTextSplitter } = require("langchain/text_splitter");
const { OpenAI } = require("langchain/llms/openai");
const { PineconeStore } = require("langchain/vectorstores/pinecone");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const {
  ConversationalRetrievalQAChain,
  LLMChain,
  loadQAChain,
  StuffDocumentsChain,
} = require("langchain/chains");

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

    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);
    await pineconeIndex.delete1({ deleteAll: true, namespace: filename });

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

      // pinecone
      const splitter = new TokenTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 0,
      });
      
      const output = await splitter.createDocuments([docs[0].pageContent]);

      const client = new PineconeClient();

      let state = await client.init({
        apiKey: process.env.PINECONE_API_KEY,
        environment: process.env.PINECONE_ENVIRONMENT,
      });
      const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

      await PineconeStore.fromDocuments(
        output,
        new OpenAIEmbeddings({ openAIApiKey: process.env.API_KEY }),
        { pineconeIndex, namespace: agentData.filename }
      );



      // await docs.map(async (item) => {
      //   const vector = await embedding.embedQuery(item.pageContent);
      //   const text = "user:" + item.pageContent;
      //   await new Nexus({
      //     email,
      //     vector,
      //     text,
      //     filename: data[0].name,
      //   }).save();
      // });
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
exports.loadOnedocument = async (req, res) => {
  try {
    const { filename } = req.body;
    const data = await Docu_analysis.find({ filename });
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
exports.publishChatbot = async (req, res) => {
  try {
    const { email, filename, publishURL, publishType } = req.body;
    await Docu_analysis.updateOne({ filename: filename }, { $set: { publishType: publishType, publishURL: publishURL }});
    res.send({ status: 200, message: "Success" });
  } catch(error) {
    console.log({
      title: "publish",
      message: error,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
}
exports.getChatText = async (req, res) => {
  try {
    // const { message, prompt, email } = req.body;
    // const embedding = new OpenAIEmbeddings({
    //   openAIApiKey: process.env.API_KEY,
    // });

    // let conversation = await loadMessages(email, prompt);
    // console.log(conversation);
    // console.log("hhhhhhhhhhhhhhhhhhhhhhhh");
    // let vector = await embedding.embedQuery(message);

    // let info = { email, vector, text: `user:${message}`, filename: prompt };
    // await new Nexus(info).save();

    // let memories = fetchMemories(vector, conversation, 30);
    // let notes = await summarizeMemories(memories, message);

    // vector = await embedding.embedQuery(notes);
    // info = { email, vector, text: `ai:${notes}`, filename: prompt };
    // await new Nexus(info).save();
    // return res.status(200).send({ text: notes });

    const { message, prompt, email } = req.body;

    const client = new PineconeClient();
    await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings({ openAIApiKey: process.env.API_KEY }),
      { pineconeIndex, namespace: prompt }
    );

    const llm = new OpenAI({
      openAIApiKey: process.env.API_KEY,
      temperature: 0,
    });
    const results = await vectorStore.similaritySearch(message, 5);
    const chain = loadQAChain(llm, { type: "stuff" });

    var rowletter;

    let total = [];
    for (let index = 0; index < results.length; index++) {
      total.push(results[index]);
    }

    const result = await chain
      .call({
        input_documents: total,
        question: message,
      })
      .then((row) => {
        rowletter = row.text;
        return rowletter;
      });

      return res.status(200).send({ text: rowletter });

  } catch (error) {
    console.error({
      title: "getChatText",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.splitPrompt = async (prompt) => {
  const maxSegmentSize = 4096;
  const promptSegments = [];

  for (let i = 0; i < prompt.length; i += maxSegmentSize) {
    promptSegments.push(prompt.slice(i, i + maxSegmentSize)); 
  }

  return promptSegments;
}
const generatAnswer = async (message, prompt) => {
  const chat = new ChatOpenAI({
    openAIApiKey: process.env.API_KEY,
    temperature: 0,
    maxTokens: 4000,
    streaming: true,
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
