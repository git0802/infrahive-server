// import file modudles
const UploaderManager = require('./filemanager');
const fs = require('fs');
const uniqid = require("uniqid");

// import AI modules
const { OpenAIEmbeddings } = require('langchain/embeddings/openai');

const { PineconeClient } = require('@pinecone-database/pinecone');
const { TokenTextSplitter } = require('langchain/text_splitter');
const { OpenAI } = require('langchain/llms/openai');
const { PineconeStore } = require('langchain/vectorstores/pinecone');
const {
  PuppeteerWebBaseLoader,
} = require("langchain/document_loaders/web/puppeteer");

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
        // if (!filename.includes("_customer.url")) {          
        //   const url = DIR + "/uploads/customer/" + filename;
        //   await fs.unlink(url, (err) => {
        //       if (err) throw err;
        //   });
        // }
        await Cust_support.deleteOne({ email, filename });
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

exports.webURLSubmit = async (req, res) => {
  try {
    const { email, orignal_name } = req.body;
    let vectorDoc = [];
    let filename = `${uniqid()}_customer.url`;

    const agentData = {
      email,
      filename: filename,
      orignal_name: orignal_name,
    };

    await new Cust_support(agentData).save();

    if (orignal_name) {
      const loader = new PuppeteerWebBaseLoader(orignal_name, {
        launchOptions: {
          headless: "new",
          args: [
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
          ],
        },
        async evaluate(page) {
          const result = await page.evaluate(() => {
            const scripts = document.body.querySelectorAll("script");
            const noscript = document.body.querySelectorAll("noscript");
            const styles = document.body.querySelectorAll("style");
            const scriptAndStyle = [...scripts, ...noscript, ...styles];
            scriptAndStyle.forEach((e) => e.remove());

            const mainElement = document.querySelector("main");
            return mainElement
              ? mainElement.innerText
              : document.body.innerText;
          });
          return result;
        },
      });
      const docs = await loader.load();
      const splitter = new TokenTextSplitter({
        chunkSize: 300,
        chunkOverlap: 0,
      });

      
      const output = await splitter.createDocuments([docs[0].pageContent]);
      vectorDoc = vectorDoc.concat(output);

    }

    const client = new PineconeClient();

    let state = await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

    await PineconeStore.fromDocuments(
      vectorDoc,
      new OpenAIEmbeddings({ openAIApiKey: process.env.API_KEY }),
      { pineconeIndex, namespace: filename }
    );   
    return res.status(200).json("Success");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Server error");
  }
};

exports.documentSubmit = async (req, res) => {
    try {
      const { email } = req.body;
      const agentData = {};
      await UploaderManager(req, "customer", async (data) => {
        const agentData = {
          email,
          filename: data[0].name,
          orignal_name: data[0].realname,
        };
        await new Cust_support(agentData).save();
        const url = DIR + "/uploads/customer/" + data[0].name;
  
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
      
      if (agentData.filename) {
        const url = DIR + "/uploads/documents/" + agentData.filename;
        await fs.unlink(url, (err) => {
          if (err) {
            throw err;
          }
        }); 
      }      
  
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

exports.rewebURLSubmit = async (req, res) => {
  try {
    const { filename, orignal_name } = req.body;
    let vectorDoc = [];

    // const agentData = {
    //   email,
    //   filename: filename,
    //   orignal_name: orignal_name,
    // };

    // await new Cust_support(agentData).save();
    // await Docu_analysis.updateOne({ filename: filename }, { $set: { publishType: publishType, publishURL: publishURL }});

    if (orignal_name) {
      const loader = new PuppeteerWebBaseLoader(orignal_name, {
        launchOptions: {
          headless: "new",
          args: [
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
          ],
        },
        async evaluate(page) {
          const result = await page.evaluate(() => {
            const scripts = document.body.querySelectorAll("script");
            const noscript = document.body.querySelectorAll("noscript");
            const styles = document.body.querySelectorAll("style");
            const scriptAndStyle = [...scripts, ...noscript, ...styles];
            scriptAndStyle.forEach((e) => e.remove());

            const mainElement = document.querySelector("main");
            return mainElement
              ? mainElement.innerText
              : document.body.innerText;
          });
          return result;
        },
      });
      const docs = await loader.load();
      const splitter = new TokenTextSplitter({
        chunkSize: 300,
        chunkOverlap: 0,
      });

      
      const output = await splitter.createDocuments([docs[0].pageContent]);
      vectorDoc = vectorDoc.concat(output);

    }

    const client = new PineconeClient();

    let state = await client.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });
    const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

    await PineconeStore.fromDocuments(
      vectorDoc,
      new OpenAIEmbeddings({ openAIApiKey: process.env.API_KEY }),
      { pineconeIndex, namespace: filename }
    );   
    return res.status(200).json("Success");
  } catch (err) {
    console.log(err);
    return res.status(500).json("Server error");
  }
};

exports.redocumentSubmit = async (req, res) => {
  try {
    const { filename } = req.body;
    await UploaderManager(req, "customer", async (data) => {
      const agentData = {
        filename: filename,
        orignal_name: data[0].realname,
      };
      // await new Cust_support(agentData).save();
      const url = DIR + "/uploads/customer/" + data[0].name;

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

exports.splitPrompt = async (prompt) => {
    const maxSegmentSize = 4096;
    const promptSegments = [];
  
    for (let i = 0; i < prompt.length; i += maxSegmentSize) {
      promptSegments.push(prompt.slice(i, i + maxSegmentSize)); 
    }
  
    return promptSegments;
}

