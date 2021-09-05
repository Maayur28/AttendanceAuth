const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const validator = require("../utilities/validator");
const otpObj = require("./otp");
const dbModel = require("../utilities/dbConnection");
const modell = require("../model/user");
require("dotenv").config();

authObj = {};

authObj.auth = async (req, res,next) => {
  const token = req.body.accessToken;
  if (token) {
    let decode;
    if (validator.TokenValidator(token)) {
      const ciphertext = token;
      let jwttoken = CryptoJS.AES.decrypt(ciphertext, process.env.CIPHER_TOKEN);
      jwttoken = jwttoken.toString(CryptoJS.enc.Utf8);
      if (!jwttoken) {
        let err = new Error();
        err.status = 400;
        err.message = "Access denied!Please login";
        throw err;
      } else {
        try {
          decode = jwt.verify(jwttoken, process.env.TOKEN_SECRET);
          req.accessToken = token;
          req.userid=decode.userid;
          req.access = true;
          next();
        } catch (error) {
          if(error.message.includes("jwt expired"))
          {
            const payload = jwt.verify(jwttoken, process.env.TOKEN_SECRET, {ignoreExpiration: true} );
          const model = await dbModel.getUserConnection();
          const refreshtoken = await model.findOne(
            { userid: payload.userid },
            { refreshToken: 1, _id: 0 }
          );
          let decoderefresh;
          try {
            decoderefresh = jwt.verify(
              refreshtoken.refreshToken,
              process.env.TOKEN_SECRET
              );
            } catch (error) {
              req.access = false;
              next();
            }
          if(jwttoken==decoderefresh.accessToken)
          {
            const jwtAccessToken = jwt.sign(
              {
                userid: payload.userid,
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
                const userLoginStatus = await modell.LoginStatusUpdate(
                  jwtRefreshToken,
                  payload.userid
                );
                if (userLoginStatus) 
                {
                  req.accessToken=cipherToken;
                  req.userid=payload.userid;
                  req.access = true;
                  next();
                }
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
            }
            else {
              let err = new Error();
              err.status = 503;
              err.message ="Unexpected error occured! Please try again later";
              throw err;
            }
          }
          else {
            req.access = false;
            next();
            }
          }
          req.access = false;
          next();
        }
      }
    } else {
      let err = new Error();
      err.status = 400;
      err.message = "Access denied!Please login";
      throw err;
    }
  } else {
    let err = new Error();
    err.status = 400;
    err.message = "Invalid Request!Session not available";
    throw err;
  }
};
authObj.authOtp = async (req, res, next) => {
  try {
    const token = req.body.sessionId;
    const otp = req.body.otp;
    if (token && otp) {
      if (validator.TokenValidator(token)) {
        let jwttoken = CryptoJS.AES.decrypt(token, process.env.CIPHER_TOKEN);
        jwttoken = jwttoken.toString(CryptoJS.enc.Utf8);
        if (!jwttoken) {
          req.status = false;
          next(error);
        } else {
          try {
            const decode = jwt.verify(jwttoken, process.env.TOKEN_SECRET);
            if (decode) {
              const model = await dbModel.getUserConnection();
              const secret = await model.findOne(
                { userid: decode.userid },
                { secret: 1, _id: 0 }
              );
              if (secret) {
                if (otpObj.verifyOtp(secret.secret, otp)) {
                  req.status = true;
                  req.userid = decode.userid;
                  next();
                } else {
                  req.status = false;
                  next();
                }
              } else {
                let err = new Error();
                err.status = 500;
                err.message = "Server is busy!Please try again later";
                throw err;
              }
            } else {
              let err = new Error();
              err.status = 400;
              err.message = "Invalid Request!";
              throw err;
            }
          } catch (error) {
            next(error);
          }
        }
      } else {
        let err = new Error();
        err.status = 400;
        err.message = "Invalid Request!";
        throw err;
      }
    } else {
      req.status = false;
      next(error);
    }
  } catch (error) {
    req.status = false;
    next(error);
  }
};
module.exports = authObj;
