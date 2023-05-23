const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const tblConf = require("../config/tablemanage");

// const AutoIncrement = require("mongoose-sequence")(mongoose);

const docuSchema = new Schema(
  {
    filename: { type: String },
    orignal_name: { type: String },
    email: { type: String, required: true },
  },
  { timestamps: true }
);

const nexusSchema = new Schema(
  {
    email: { type: String, required: true },
    filename: { type: String },
    vector: { type: Array },
    text: { type: String },
  },
  { timestamps: true }
);
module.exports = {
  Docu_analysis: mongoose.model(tblConf.docu_analysis, docuSchema),
  Nexus: mongoose.model(tblConf.nexus, nexusSchema),
};
