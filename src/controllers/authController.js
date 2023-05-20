const { WaitList, MainUser, Sessions } = require('../models');
const { signAccessToken } = require('./baseController');
// =============== | authentication part | ================
exports.Login = async (req, res) => {
  try {
    const userData = req.body;
    const existUser = await MainUser.findOne({ email: userData.email });
    if (existUser) {
      const isVerify = existUser.comparePassword(userData.password);
      if (isVerify) {
        const session = signAccessToken(req, res, existUser._id);
        await Sessions.updateOne({ email: existUser.email }, session, {
          new: true,
          upsert: true,
        });
        return res.status(200).json({
          accessToken: session.accessToken,
          user: existUser,
        });
      } else {
        return res.status(400).json("Password doesn't match.");
      }
    } else {
      return res.status(400).json("Email doesn't exist.")
    }


  } catch (error) {
    console.error({ title: "Login", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
};

exports.Register = async (req, res) => {
  try {
    const userData = req.body;
    const existUser = await MainUser.findOne({ email: userData.email });
    if (existUser) {
      return res.status(400).json("Email already exists.")
    }
    else {
      await new MainUser(userData).save();
      return res.status(200).json("Register Success.")
    }
  } catch (error) {
    console.error({ title: "Register", message: error, date: new Date() });
    return res.status(500).send("Server Error");
  }
}


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

// <=========================| Image part |================================>

// TODO: Add environment Variables
