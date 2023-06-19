const routerx = require("express-promise-router");
const multer = require("multer");
// const tokenMiddleware = require("../middlewares/token")
const appController = require("../controllers/appController");
const { BASE_URL } = require('../../config.js')

const Router = routerx()
Router.post("/documentSubmit", multer({ dest: `${BASE_URL}/uploads/documents` }).any(), appController.documentSubmit);
Router.post("/loadDcouments", appController.loadDcouments);
Router.post("/loadOneDcoument", appController.loadOnedocument);
Router.post("/getChatText", appController.getChatText);
Router.post("/deleteFile", appController.deleteFile);
Router.post("/publishChatbot", appController.publishChatbot);



module.exports = Router