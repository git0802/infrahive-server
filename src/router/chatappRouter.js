const routerx = require("express-promise-router");
const multer = require("multer");
// const tokenMiddleware = require("../middlewares/token")
const chatappController = require("../controllers/chatappController");
const { BASE_URL } = require('../../config.js')

const Router = routerx()
Router.post("/documentSubmit", multer({ dest: `${BASE_URL}/uploads/documents` }).any(), chatappController.documentSubmit);
Router.post("/loadDcouments", chatappController.loadDcouments);
Router.post("/loadOneDcoument", chatappController.loadOnedocument);
Router.post("/getChatText", chatappController.getChatText);
Router.post("/deleteFile", chatappController.deleteFile);
Router.post("/publishChatbot", chatappController.publishChatbot);

module.exports = Router