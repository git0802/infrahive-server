const routerx = require("express-promise-router");
const authRouter = require("./authRouter");
const appRouter = require("./appRouter");
const chatappRouter = require("./chatappRouter");
const buildappRouter = require("./buildappRouter");
const Router = routerx();
Router.use("/auth", authRouter);
Router.use("/app", appRouter);
Router.use("/chatapp", chatappRouter);
Router.use("/buildapp", buildappRouter);
module.exports = Router;

