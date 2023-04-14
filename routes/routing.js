const express = require("express");
const authObj = require("../middleware/auth");
const service = require("../services/user");
const routes = express.Router();

routes.post("/login", async (req, res, next) => {
  try {
    let { cipherToken, jwtRefreshToken } = await service.LoginService(req.body);
    res.status(200);
    res.json({ cipherToken, jwtRefreshToken });
  } catch (error) {
    next(error);
  }
});

routes.post("/register", async (req, res, next) => {
  try {
    let authToken = await service.RegisterService(req.body);
    res.status(200);
    res.json({ authToken });
  } catch (error) {
    next(error);
  }
});

routes.post("/verifyotp", authObj.authOtp, async (req, res, next) => {
  try {
    if (req.status) {
      const { accessToken, jwtRefreshToken } = await service.VerifyOtp(
        req.userid
      );
      return res.json({ accessToken, jwtRefreshToken }).status(200);
    } else {
      return res.json({ sessionId: false }).status(400);
    }
  } catch (error) {
    next(error);
  }
});
routes.post("/verifyaccess", authObj.auth, async (req, res) => {
  if (req.access) {
    const accessToken = await service.verifyAccess(req.accessToken);
    res.json({ accessToken: accessToken, userid: req.userid }).status(200);
  } else {
    res.json({ accessToken: false }).status(400);
  }
});
routes.get("/", async (req, res, next) => {
  try {
    res.json("Ping Successful").status(200);
  } catch (error) {
    next(error);
  }
});
module.exports = routes;
