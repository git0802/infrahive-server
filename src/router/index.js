const routerx = require("express-promise-router");
const authRouter = require("./authRouter");
const imageRouter = require("./imageRouter");

const Router = routerx();

Router.use("/auth", authRouter);
Router.use("/image", imageRouter);
module.exports = Router;
