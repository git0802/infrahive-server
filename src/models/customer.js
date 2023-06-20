const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

const custSchema = new Schema(
    {
        filename: { type: String },
        orignal_name: { type: String },
        publishURL: { type: String },
        publishType: { type: String },
        email: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = {
    Cust_support: mongoose.model(tblConf.cust_support, custSchema)
};