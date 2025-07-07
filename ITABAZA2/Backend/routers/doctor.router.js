const { DoctorModel } = require("../models/doctor.model");
const doctorRouter = require("express").Router();

// get all doctors
doctorRouter.get("/allDoctor", async (req, res) => {
  try {
    const doctors = await DoctorModel.findAll();
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting doctors:", error);
    res.status(500).send({ msg: "Error in getting doctor info.." });
  }
});

// get only available doctors (status: true and is_available: true)
doctorRouter.get("/availableDoctors", async (req, res) => {
  try {
    const doctors = await DoctorModel.findAvailable();
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting available doctors:", error);
    res.status(500).send({ msg: "Error in getting available doctor info.." });
  }
});

// Add a Doctor
doctorRouter.post("/addDoctor", async (req, res) => {
  let {
    doctorName,
    email,
    qualifications,
    experience,
    phoneNo,
    city,
    departmentId,
    status,
    image,
    isAvailable,
  } = req.body;
  
  try {
    const doctorData = {
      doctor_name: doctorName,
      email,
      qualifications,
      experience,
      phone_no: phoneNo,
      city,
      department_id: departmentId,
      status: status !== undefined ? status : true,
      image,
      is_available: isAvailable !== undefined ? isAvailable : true,
      april_11: ["11-12", "2-3", "4-5", "7-8"],
      april_12: ["11-12", "2-3", "4-5", "7-8"],
      april_13: ["11-12", "2-3", "4-5", "7-8"],
    };

    const doctor = await DoctorModel.create(doctorData);
    res.status(201).send({ msg: "Doctor has been created and is now available for booking", doctor });
  } catch (error) {
    console.error("Error creating doctor:", error);
    res.status(500).send({ 
      msg: "Error in creating doctor due to Non unique email/mobile",
      error: error.message 
    });
  }
});

// SEARCH BY NAME
doctorRouter.get("/search", async (req, res) => {
  let query = req.query;
  try {
    const result = await DoctorModel.searchByName(query.q);
    res.send(result);
  } catch (err) {
    console.error("Error searching doctors:", err);
    res.status(500).send({ "err in getting doctor details": err.message });
  }
});

// DOCTORS BY DEPARTMENT ID
doctorRouter.get("/allDoctor/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const doctors = await DoctorModel.findByDepartment(id);
    if (doctors.length === 0) {
      return res.status(200).send({ msg: "This Department have no doctors" });
    }
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting doctors by department:", error);
    res.status(500).send({ msg: "Error in getting Dr. info.." });
  }
});

// AVAILABLE DOCTORS BY DEPARTMENT ID
doctorRouter.get("/availableDoctors/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const doctors = await DoctorModel.findAvailableByDepartment(id);
    if (doctors.length === 0) {
      return res.status(200).send({ msg: "This Department have no available doctors" });
    }
    res.status(200).send({ total: doctors.length, doctor: doctors });
  } catch (error) {
    console.error("Error getting available doctors by department:", error);
    res.status(500).send({ msg: "Error in getting available Dr. info.." });
  }
});

// DELETE A DOCTOR
doctorRouter.delete("/removeDoctor/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const isDoctorPresent = await DoctorModel.findById(id);
    if (!isDoctorPresent) {
      return res.status(404).send({ msg: "Doctor not found" });
    }
    
    await DoctorModel.delete(id);
    res.status(200).send({ msg: "Doctor deleted" });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).send({ msg: "Error in deleting the doctor" });
  }
});

// DOCTOR PENDING FOR APPROVAL
doctorRouter.get("/docPending", async (req, res) => {
  try {
    const docPending = await DoctorModel.findPending();
    if (!docPending || docPending.length === 0) {
      return res.send({ msg: "No Doc Pending for Approval" });
    }
    res.status(200).send({ msg: "Doc Pending", docPending });
  } catch (error) {
    console.error("Error getting pending doctors:", error);
    res.status(500).send({ msg: "Error getting pending doctors" });
  }
});

// UPDATE THE DOCTOR STATUS
doctorRouter.patch("/updateDoctorStatus/:id", async (req, res) => {
  let id = req.params.id;
  try {
    const isDoctorPresent = await DoctorModel.findById(id);
    if (!isDoctorPresent) {
      return res.status(404).send({ msg: "Doctor not found, check Id" });
    }
    
    if (req.body.status === true) {
      await DoctorModel.update(id, { status: true });
      res.status(200).send({ msg: "Doctor Application Approved" });
    } else if (req.body.status === false) {
      await DoctorModel.delete(id);
      res.status(200).send({ msg: "Doctor Application Rejected" });
    }
  } catch (error) {
    console.error("Error updating doctor status:", error);
    res.status(500).send({ msg: "Server error while updating the doctor Status" });
  }
});

// Update the availability status of a doctor by ID
doctorRouter.patch("/isAvailable/:doctorId", async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    // Check if the doctor with the given ID exists
    const doctor = await DoctorModel.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ msg: "Doctor not found, please check the ID" });
    }

    // Update the availability status of the doctor
    const updatedDoctor = await DoctorModel.update(doctorId, {
      is_available: req.body.isAvailable,
    });
    
    res.json({
      msg: "Doctor's status has been updated",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor availability:", error);
    res.status(500).json({ msg: "Server error while updating the doctor status" });
  }
});

// Real-time doctor updates
doctorRouter.get("/realtime", async (req, res) => {
  try {
    const { supabase } = require("../config/db");
    
    const subscription = supabase
      .channel('doctors_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'doctors' }, 
        (payload) => {
          console.log('Doctor change:', payload);
        }
      )
      .subscribe();

    res.json({ message: "Real-time doctor subscription set up" });
  } catch (error) {
    res.status(500).send({ msg: "Error setting up real-time", error: error.message });
  }
});

module.exports = {
  doctorRouter,
};
