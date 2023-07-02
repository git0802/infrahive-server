const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

const promptSchema = new Schema(
    {
        promptsName: { type: String },
        promptsValue: { type: String },
        imageStyle: { type: String },
        size: { type: String },
        mode: { type: String },
    },
    { timestamps: true }
);

module.exports = {
    Prompt: mongoose.model(tblConf.prompt, promptSchema)
};