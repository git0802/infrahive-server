const userModel = require("./users");
const permissionModel = require("./permission");
module.exports = {
  ...userModel,
  ...permissionModel,
};
