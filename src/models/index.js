const userModel = require("./users");
const permissionModel = require("./permission");
const documentModel = require("./document");
const CustomerModel = require('./customer');
module.exports = {
  ...userModel,
  ...permissionModel,
  ...documentModel,
  ...CustomerModel,
};
