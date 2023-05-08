const { Sessions } = require("../models");
const config = require("../../serverConf");

exports.check_token = async (req, res, next) => {
  let acesstoken = req.headers.authorization;
  try {
    let sessionData = await Sessions.findOne({ acesstoken });
    let timestamp = new Date().valueOf();
    if (sessionData) {
      if (sessionData.updatedAt * 1 + config.session.expiretime < timestamp) {
        req.user = sessionData;
        await Sessions.findOneAndDelete({ acesstoken });
        return res.status(401).send("Session expired");
      } else {
        await Sessions.findOneAndUpdate({ acesstoken });
        next();
      }
    } else {
      return res.status(401).send("Session expired");
    }
  } catch (e) {
    console.error({
      title: "sessionCheck",
      message: e.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
