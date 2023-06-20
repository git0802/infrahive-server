const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

// const AutoIncrement = require("mongoose-sequence")(mongoose);

const docuSchema = new Schema(
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
  Docu_analysis: mongoose.model(tblConf.docu_analysis, docuSchema),
};
