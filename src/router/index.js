const routerx = require("express-promise-router");
const authRouter = require("./authRouter");
const appRouter = require("./appRouter");
const chatappRouter = require("./chatappRouter");
const Router = routerx();
Router.use("/auth", authRouter);
Router.use("/app", appRouter);
Router.use("/chatapp", chatappRouter);
module.exports = Router;

