const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

const bothistorySchema = new Schema(
    {
        appid: { type: String, required: true },
        message: { type: String },
        conversation_id: { type: String },
        role: { type: String },
        token_usage: { type: Number },
        interaction_time : { type: Number },
    },
    { timestamps: true }
);

module.exports = {
    Bothistory: mongoose.model(tblConf.bothistory, bothistorySchema)
};
