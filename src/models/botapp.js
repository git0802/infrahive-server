const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

const botappSchema = new Schema(
    {
        email: { type: String, required: true },
        appid: { type: String },
        appname: { type: String },
        description: { type: String },
        bottype: { type: String },
        preprompt: { type: String },
        variable: { type: String },
        remark: { type: String },
        pinecone_Id: { type: String },
        modeltype: { type: String },
        temperature: { type: Number },
        top_p: { type: Number },
        presence_penalty: { type: Number },
        frequency_penalty: { type: Number },
        max_token: { type: Number },
        open_state: { type: Boolean }
    },
    { timestamps: true }
);

module.exports = {
    Botapp: mongoose.model(tblConf.botapp, botappSchema)
};