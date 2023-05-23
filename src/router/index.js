const routerx = require("express-promise-router");
const authRouter = require("./authRouter");
const appRouter = require("./appRouter");
const Router = routerx();
Router.use("/auth", authRouter);
Router.use("/app", appRouter);
module.exports = Router;

