const express = require("express");
const cors = require("cors");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

const { userRouter } = require("./routers/user.router");
const { supabase } = require("./config/db");
// const { authenticate } = require("./middlewares/authenticator.mw");
const { doctorRouter } = require("./routers/doctor.router");
const { departmentRouter } = require("./routers/department.router");
const { appointmentRouter } = require("./routers/appointment.router");
const { enhancedAppointmentRouter } = require("./routers/enhanced-appointment.router");
const { dashboardRouter } = require("./routers/adminDash.router");
// const { authenticate } = require("./middlewares/authenticator.mw");



app.use("/user", userRouter);
app.use("/department",departmentRouter);
app.use("/doctor", doctorRouter);
app.use("/appointment",appointmentRouter);
app.use("/enhanced-appointment", enhancedAppointmentRouter);
app.use("/admin", dashboardRouter);

// Test Supabase connection
app.get("/api/health", async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) throw error;
    res.json({ status: "Connected to Supabase", data });
  } catch (error) {
    res.status(500).json({ status: "Database connection failed", error: error.message });
  }
});

app.listen(process.env.PORT || 8080, async () => {
  try {
    console.log("Connected to Supabase");
    console.log(`Server listening at ${process.env.PORT || 8080}`);
  } catch (error) {
    console.log("Error connecting to database:", error);
  }
});
