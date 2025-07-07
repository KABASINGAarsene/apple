const { UserModel } = require("../models/user.model");
const userRouter = require("express").Router();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const redis = require("redis");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

userRouter.use(cors());
var otp;

userRouter.get("/", async (req, res) => {
  res.send({ msg: "Home Page" });
});

userRouter.post("/emailVerify", async (req, res) => {
  otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  let { email } = req.body;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Here is your OTP for Medistar Login",
    text: otp,
  };

  transporter
    .sendMail(mailOptions)
    .then((info) => {
      console.log(info.response);
      res.send({ msg: "Mail has been Send", otp, email });
    })
    .catch((e) => {
      console.log(e);
      res.send(e);
    });
});

userRouter.post("/signup", async (req, res) => {
  let { first_name, last_name, email, mobile, password } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(500).send({
        msg: "User already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 5);
    
    // Create user data
    const userData = {
      first_name,
      last_name,
      email,
      mobile,
      password: hashedPassword,
    };

    // Create user in Supabase
    const user = await UserModel.create(userData);
    res.status(201).send({ msg: "Signup Successful", user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send({
      msg: "Error during signup",
      error: error.message
    });
  }
});

userRouter.post("/signin", async (req, res) => {
  let { payload, password } = req.body;
  
  try {
    // Try to find user by email first
    let user = await UserModel.findByEmail(payload);
    
    // If not found by email, try mobile
    if (!user) {
      user = await UserModel.findByMobile(payload);
    }
    
    if (!user) {
      return res.status(500).send({ msg: "User not Found" });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(500).send({ msg: "Wrong Password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userID: user.id, email: user.email },
      process.env.JWT_SECRET || "masai"
    );

    res.send({
      message: "Login Successful",
      token,
      id: user.id,
      name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      mobile: user.mobile,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send({ msg: "Error in Login", error: error.message });
  }
});

// Real-time user updates using Supabase
userRouter.get("/realtime", async (req, res) => {
  try {
    const { supabase } = require("../config/db");
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' }, 
        (payload) => {
          console.log('User change:', payload);
        }
      )
      .subscribe();

    res.json({ message: "Real-time subscription set up" });
  } catch (error) {
    res.status(500).send({ msg: "Error setting up real-time", error: error.message });
  }
});

// userRouter.use(express.text());
// const client = redis.createClient({
//   password: process.env.redisPassword,
//   socket: {
//     host: process.env.redisHost,
//     port: process.env.redisPort,
//   },
// });
// client.on("error", (err) => console.log(err, "ERROR in REDIS"));
// client.connect();

// userRouter.get("/logout", async (req, res) => {
//   const token = req.headers.authorization;
//   // console.log(token)
//   if (!token) {
//     return res.status(500).send({ msg: "No Token in Headers" });
//   }
//   try {
//     await client.LPUSH("token", token);
//     // await client.lpush("token", token)
//     res.status(200).send({ msg: "You are Logged out" });
//   } catch (error) {
//     return res.status(500).send({ msg: "Error in Redis" });
//   }
// });

module.exports = {
  userRouter,
};
