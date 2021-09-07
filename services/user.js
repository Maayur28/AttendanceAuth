// const model = require("../models/user");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const validator = require("../utilities/validator");
const model = require("../model/user");
const { nextTick } = require("async");
const moment = require("moment");
const CryptoJS = require("crypto-js");
const otpObj = require("../middleware/otp");
const sendMailObj = require("../middleware/sendMail");
require("dotenv").config();
let userService = {};

userService.LoginService = async (userObj) => {
  try {
    if (validator.LoginValidator(userObj)) {
      const getUser = await model.LoginModel(userObj);
      if (getUser) {
        if (await bcrypt.compare(userObj.password, getUser.password)) {
          delete userObj.password;
          const getUserId = getUser.userid;
          if (getUserId) {
            const jwtAccessToken = jwt.sign(
              {
                userid: getUserId,
              },
              process.env.TOKEN_SECRET,
              { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY_TIME }
            );
            const jwtRefreshToken = jwt.sign(
              { accessToken: jwtAccessToken },
              process.env.TOKEN_SECRET,
              { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME }
            );
            if (jwtAccessToken && jwtRefreshToken) {
              const cipherToken = CryptoJS.AES.encrypt(
                jwtAccessToken,
                process.env.CIPHER_TOKEN
              ).toString();
              if (cipherToken) {
                const userLoginStatus = await model.LoginStatusUpdate(
                  jwtRefreshToken,
                  getUserId
                );
                if (userLoginStatus) return {cipherToken,jwtRefreshToken};
                else {
                  let err = new Error();
                  err.status = 500;
                  err.message = "Server is busy!Please try again later";
                  throw err;
                }
              } else {
                let err = new Error();
                err.status = 503;
                err.message =
                  "Unexpected error occured! Please try again later";
                throw err;
              }
            } else {
              let err = new Error();
              err.status = 503;
              err.message = "Unexpected error occured! Please try again later";
              throw err;
            }
          } else {
            let err = new Error();
            err.status = 500;
            err.message = "Server is busy! Please try again later";
            throw err;
          }
        } else {
          delete userObj.password;
          let err = new Error();
          err.status = 401;
          err.message = "Invalid username or password";
          throw err;
        }
      } else {
        let err = new Error();
        err.status = 404;
        err.message = "Invalid username or password";
        throw err;
      }
    } else {
      npm;
      let err = new Error();
      err.status = 400;
      err.message = "Invalid credentials!!!";
      throw err;
    }
  } catch (error) {
    let err = new Error();
    err.status = 400;
    err.message =error.message || "Invalid credentials!!!";
    throw err;
  }
};

userService.RegisterService = async (userObj) => {
  try {
    const valid = await validator.RegisterValidator(userObj);
    if (valid) {
      userObj.userid = uuidv4();
      userObj = _.pick(userObj, [
        "userid",
        "name",
        "email",
        "password",
      ]);
      userObj.password = await bcrypt.hash(
        userObj.password,
        await bcrypt.genSalt(11)
      );
      const jwtAccessToken = jwt.sign(
        {
          userid: userObj.userid,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.JWT_VERIFY_ACCESS_TOKEN_EXPIRY_TIME }
      );
      if (jwtAccessToken) {
        userObj.accountCreatedOn = moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a");
        userObj.lastUpdatedOn = moment()
          .utcOffset("+05:30")
          .format("MMMM Do YYYY, h:mm:ss a");
        const obj = otpObj.generateOtp();
        userObj.secret = obj.secret;
        userObj.otp = obj.token;
        const registerStatus = await model.RegisterUser(userObj);
        if (registerStatus) {
          const sessionToken = CryptoJS.AES.encrypt(
            jwtAccessToken,
            process.env.CIPHER_TOKEN
          ).toString();
          sendMailObj.sendOtpMail(userObj.email, obj.token);
          return sessionToken;
        } else {
          let err = new Error();
          err.status = 500;
          err.message = "Server is busy! Please try again later";
          throw err;
        }
      } else {
        let err = new Error();
        err.status = 500;
        err.message = "Server is busy! Please try again later";
        throw err;
      }
    } else {
      let err = new Error();
      err.status = 400;
      err.message = "Invalid credentials!!!";
      throw err;
    }
  } catch (error) {
    let err = new Error();
    err.status = 400;
    err.message = error.message || error || "Invalid credentials!!!";
    throw err;
  }
};

userService.VerifyOtp = async (userid) => {
  const jwtAccessToken = jwt.sign(
    {
      userid: userid,
    },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY_TIME }
  );
  const jwtRefreshToken = jwt.sign(
    { accessToken: jwtAccessToken },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY_TIME }
  );
  if (jwtAccessToken && jwtRefreshToken) {
    let verify = await model.VerifyOtp(userid, jwtRefreshToken);
    if (verify) {
      let accessToken=CryptoJS.AES.encrypt(
        jwtAccessToken,
        process.env.CIPHER_TOKEN
      ).toString()
      return {accessToken,jwtRefreshToken};
    } else {
      let err = new Error();
      err.status = 500;
      err.message = "Server is busy! Please try again later";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 500;
    err.message = "Server is busy! Please try again later";
    throw err;
  }
};
userService.verifyAccess=async(accessToken)=>{
  return accessToken;
}

module.exports = userService;
