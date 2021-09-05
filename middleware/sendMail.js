const nodemailer = require("nodemailer");

sendMailObj = {};
sendMailObj.sendOtpMail = (receiverMail, token) => {
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.email,
      pass: process.env.password,
    },
  });
  const message = {
    from: "attendancemanagementsystem28@gmail.com",
    to: receiverMail,
    subject: "Verify Email Address",
    html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2;color:black">
        <div style="margin:20px auto;width:90%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
        <p style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Deals Tracker</p>
        </div>
        <p style="font-size:1.1em">Hi,</p>
        <p>Thank you for choosing Attendance Management System. Use the <span style="font-weight:800;margin: 0 auto;color:#00274c;width: max-content;padding: 0px 2px">${token}</span> to complete your Sign Up procedures. Valid only for 5 minutes</p>
        <p style="font-size:0.9em;">Regards,<br />AMS</p>
        <hr style="border:none;border-top:1px solid #eee" />
        <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
        <p>Mayur Agarwal</p>
        <p>007, Uttar Pradesh</p>
        <p>India</p>
        </div>
        </div>
        </div>`,
  };
  transport.sendMail(message, (error, info) => {
    if (error) {
      console.log(error);
      throw error;
    } else {
      console.log("success");
    }
  });
};
module.exports = sendMailObj;
