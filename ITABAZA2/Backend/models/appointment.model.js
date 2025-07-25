const { supabase } = require("../config/db");

// Supabase table name
const TABLE_NAME = 'appointments';

// Appointment model functions
const AppointmentModel = {
  // Create a new appointment
  async create(appointmentData) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([appointmentData])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Find appointment by ID
  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get appointments by patient ID
  async findByPatientId(patientId) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get appointments by doctor ID
  async findByDoctorId(doctorId) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get all appointments
  async findAll() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get pending appointments
  async findPending() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('status', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get appointments by date
  async findByDate(date) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('appointment_date', date)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Update appointment
  async update(id, updates) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  // Delete appointment
  async delete(id) {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  // Get appointment statistics
  async getStats() {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('status, payment_status');
    
    if (error) throw error;
    
    const total = data.length;
    const pending = data.filter(app => !app.status).length;
    const paid = data.filter(app => app.payment_status).length;
    
    return { total, pending, paid };
  }
};

module.exports = {
  AppointmentModel
};



// APPOINTMENT MODEL
// {
//   "patientId":"64256f28b1fc4d36b5a12be7",
//   "doctorId":"6425319914291e303a3cf2c4",
//   "ageOfPatient":40,
//   "gender":"male",
//   "address":"Mumbai woribali",
//   "problemDescription":"having some problem related to neourology ",
//   "appointmentDate":"30-03-2023",
//   "createdAt":,
//   "updatedAt":,
//   "paymentStatus":false,
//   }
  

// appontmentid
// dateTime
// patientName
// payment
// doctorID
// doctorname
// patientName
// patientID
// problem