const userModel = require("./users");
const permissionModel = require("./permission");
const documentModel = require("./document");
const CustomerModel = require('./customer');
const PromptModel = require('./prompt');
const BotappModel = require('./botapp');
const BothistoryModel = require('./bothistory');
module.exports = {
  ...userModel,
  ...permissionModel,
  ...documentModel,
  ...CustomerModel,
  ...PromptModel,
  ...BotappModel,
  ...BothistoryModel,
};
