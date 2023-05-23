const routerx = require("express-promise-router");
const authRouter = require("./authRouter");
const appRouter = require("./appRouter");
const imageRouter = require("./imageRouter");
const Router = routerx();


Router.use("/auth", authRouter);

Router.use("/app", appRouter);
Router.use("/image", imageRouter);
module.exports = Router;

