const routerx = require("express-promise-router");
const multer = require("multer");

const buildappController = require('../controllers/buildappController');
const { BASE_URL } = require('../../config.js')

const Router = routerx()
Router.post("/CreateApp", buildappController.CreateApp);
Router.post("/LoadApp", buildappController.LoadApp);
Router.post("/LoadOneApp", buildappController.LoadOneApp);
Router.post("/UpdateApp", buildappController.UpdateApp);
Router.post("/DeleteApp", buildappController.DeleteApp);
Router.post("/GetChatText", buildappController.GetChatText);
Router.post("/dataSubmit", multer({ dest: `${BASE_URL}/uploads/documents` }).any(), buildappController.dataSubmit);
Router.post("/FollowQuestion", buildappController.FollowQuestion);



module.exports = Router