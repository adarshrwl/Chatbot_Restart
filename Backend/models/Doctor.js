const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DoctorSchema = new Schema(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
  },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", DoctorSchema);
