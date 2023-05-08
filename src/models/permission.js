const mongoose = require("mongoose");
const tblConfig = require("../config/tablemanage");
const Schema = mongoose.Schema;

const MainPermissionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  pid: {
    type: String,
    default: 1,
  },
});

module.exports = {
  MainPermission: mongoose.model(
    tblConfig.main_permission,
    MainPermissionSchema
  ),
};
