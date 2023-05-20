const routerx = require("express-promise-router")
const imageController = require("../controllers/imageController")
const imageRouter = routerx()
imageRouter.post("/dalle", imageController.Imgdalle)
imageRouter.post("/dream", imageController.Imgdream)

module.exports = imageRouter;