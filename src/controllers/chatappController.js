// import file modudles
const UploaderManager = require('./filemanager');
const fs = require('fs');

// import AI modules
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

const { PineconeClient } = require('@pinecone-database/pinecone');
const { TokenTextSplitter } = require('langchain/chains');
const { OpenAI } = require('langchain/llms/openai');
const { PineconeStore } = require('langchain/vectorstores/pinecone');

const { loadQAChain } = require('langchain/chains');

// file loaders
const { TextLoader } = require("langchain/document_loaders/fs/text");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { CSVLoader } = require("langchain/document_loaders/fs/csv");
const { DocxLoader } = require("langchain/document_loaders/fs/docx");
const { JSONLoader } = require("langchain/document_loaders/fs/json");

const { DIR } = require("../../serverConf");
const { Cust_support } = require("../models");

exports.deleteFile = async (req, res) => {
    try {
        const { email, filename } = req.body;
        const url = DIR + "/uploads/documents" + filename;
        await fs.unlink(url, (err) => {
            if (err) throw err;
        });
        await Cust_support.remove({ email, filename });
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
}

exports.documentSubmit = async (req, res) => {
    try {
      const { email } = req.body;
      await UploaderManager(req, "documents", async (data) => {
        const agentData = {
          email,
          filename: data[0].name,
          orignal_name: data[0].realname,
        };
        await new Cust_support(agentData).save();
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
      const data = await Cust_support.find({ email });
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
      const data = await Cust_support.find({ filename });
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
      await Cust_support.updateOne({ filename: filename }, { $set: { publishType: publishType, publishURL: publishURL }});
      res.send({ status: 200, message: "Success" });
    } catch(error) {
      console.log({
        title: "publish",
        message: error,
        date: new Date(),
      });
      return res.status(500).send("Server Error");
    }
};

exports.getChatText = async (req, res) => {
    try {
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