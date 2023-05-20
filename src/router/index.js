const routerx = require("express-promise-router");
const authRouter = require("./authRouter");

const Router = routerx();

Router.use("/auth", authRouter);
module.exports = Router;