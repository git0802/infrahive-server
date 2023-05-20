const userModel = require("./users");
const permissionModel = require("./permission");
const documentModel = require("./document");
module.exports = {
  ...userModel,
  ...permissionModel,
  ...documentModel
};
