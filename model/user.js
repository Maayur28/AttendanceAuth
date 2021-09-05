const dbModel = require("../utilities/dbConnection");
const moment = require("moment");
let userModel = {};

userModel.LoginModel = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const verifyEmail = await model.findOne({ email: userObj.email });
  if (verifyEmail) {
    return verifyEmail;
  } else {
    let err = new Error();
    err.status = 404;
    err.message = "You are not registered";
    throw err;
  }
};
userModel.LoginStatusUpdate = async (refreshToken, userid) => {
  const model = await dbModel.getUserConnection();
  const verifyUserid = await model.findOne({ userid });
  if (verifyUserid) {
    const updateStatus = await model.updateOne(
      { userid: userid, isVerified: true },
      { $set: { refreshToken: refreshToken, isLoggedIn: true } }
    );
    if (updateStatus.nModified) {
      return true;
    } else {
      let err = new Error();
      err.status = 403;
      err.message = "Your email is not verified!";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy!Please try again later";
    throw err;
  }
};
userModel.RegisterUser = async (userObj) => {
  const model = await dbModel.getUserConnection();
  const checkUser = await model.findOne({ email: userObj.email });
  if (checkUser == null) {
    let insertuser = await model.create(userObj);
    if (insertuser) return true;
    else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy! Please try again later";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 400;
    err.message = "User has been already registered";
    throw err;
  }
};
userModel.VerifyOtp = async (userid,jwtRefreshToken) => {
  const model = await dbModel.getUserConnection();
  const updateStatus = await model.updateOne(
    { userid: userid },
    {
      $set: {
        isVerified: true,
        isLoggedIn:true,
        refreshToken:jwtRefreshToken,
        lastUpdateOn: moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a"),
      },
    }
  );
  if (updateStatus.nModified) {
    return true;
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy!Please try again later";
    throw err;
  }
};
module.exports = userModel;
