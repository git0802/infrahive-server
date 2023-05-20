const UploaderManager = require("./filemanager");
const fs = require('fs');
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { HumanChatMessage, SystemChatMessage } = require("langchain/schema");

const { Docu_analysis } = require('../models');
const { DIR } = require('../../serverConf');

const openFile = (filename) => {
    let rawdata = fs.readFileSync(filename, "utf8");
    return rawdata;
}

exports.documentSubmit = async (req, res) => {
    try {
        const { email } = req.body;
        await UploaderManager(req, "documents", async (data) => {
            const agentData = { email, filename: data[0].name, orignal_name: data[0].realname }
            await new Docu_analysis(agentData).save();
        });
        res.send({ status: 200, message: 'Success' });
    } catch (error) {
        console.error({ title: "documentSubmit", message: error, date: new Date() });
        return res.status(500).send("Server Error");
    }
};
exports.loadDcouments = async (req, res) => {
    try {
        const { email } = req.body;
        const data = await Docu_analysis.find({ email });
        return res.status(200).send(data);
    } catch (error) {
        console.error({ title: "documentSubmit", message: error, date: new Date() });
        return res.status(500).send("Server Error");
    }
}
exports.getChatText = async (req, res) => {
    try {
        const { message, prompt } = req.body;
        // const data = await openFile(DIR + "/prompt.txt");
        const data = await openFile(DIR + "/uploads/documents/" + prompt);
        const chat = new ChatOpenAI({ openAIApiKey: process.env.API_KEY, temperature: 0 });
        const response = await chat.call([
            new SystemChatMessage(data),
            new HumanChatMessage(
                message
            ),
        ]);
        return res.status(200).send({ text: response.text });
    } catch (error) {
        console.error({ title: "getChatText", message: error.message, date: new Date() });
        return res.status(500).send("Server Error");
    }
}
