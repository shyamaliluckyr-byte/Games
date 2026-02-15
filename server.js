const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let otpStore = {}; // Use DB/Redis in production

/* MAIL CONFIG (Example Gmail) */
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "your-email@gmail.com",
        pass: "your-app-password"
    }
});

/* SEND OTP */
app.post("/send-otp", async (req, res) => {
    const { email } = req.body;

    if (!email) return res.json({ success: false });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 5 * 60 * 1000; // 5 min

    otpStore[email] = { otp, expiry };

    try {
        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is ${otp}`
        });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false });
    }
});

/* VERIFY OTP */
app.post("/verify-otp", (req, res) => {
    const { email, otp } = req.body;
    const record = otpStore[email];

    if (!record)
        return res.json({ success: false, message: "No OTP" });

    if (Date.now() > record.expiry) {
        delete otpStore[email];
        return res.json({ success: false, message: "Expired" });
    }

    if (parseInt(otp) === record.otp) {
        delete otpStore[email];
        return res.json({ success: true });
    }

    res.json({ success: false, message: "Invalid" });
});

/* START SERVER */
app.listen(5000, () =>
    console.log("🚀 Server running on http://localhost:5000")
);