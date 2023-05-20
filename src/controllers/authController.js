const { WaitList } = require('../models');

// =============== | authentication part | ================
exports.Login = async (req, res) => {
  try {
    res.send("hello login page")

  } catch (error) {
    console.error({ title: "Login", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

exports.sessionCheck = async (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.error({
      title: "sessionCheck",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};

exports.Logout = async (req, res) => {
  try {
  } catch (error) {
    console.error({
      title: "Logout",
      message: error.message,
      date: new Date(),
    });
    return res.status(500).send("Server Error");
  }
};
// =============== | WaitList part | ================
exports.JoinWaitList = async (req, res) => {
  try {
    const waitListData = req.body;
    console.log(waitListData, ":::waitListData");
    const existUser = await WaitList.findOne({ work_email: waitListData.work_email });
    if (existUser) {
      return res.status(500).send("Work Email is already joined.");
    } else {
      await new WaitList(waitListData).save();
      return res.status(200).send("Joined successfully.")
    }
  } catch (error) {
    console.error({ title: "JoinWaitList", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

