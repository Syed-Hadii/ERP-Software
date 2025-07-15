const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'HR Manager', 'Finance Manager', 'Crop Manager', 'Dairy Manager', 'Inventory Manager', 'Operations Manager', 'Reporting Manager'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: { type: String },
  initialSalary: {
    type: Number,
    required: function () { return this.role !== 'Admin'; },
    min: 0,
  },
  basicSalary: {
    type: Number,
    required: function () { return this.role !== 'Admin'; },
    min: 0,
  },
  refreshToken: {
    type: String,
    default: null
  }
}, { timestamps: true });

UserSchema.pre('save', function (next) {
  if (this.isNew && this.role !== 'Admin') {
    this.basicSalary = this.initialSalary;
  }
  next();
});

const User = mongoose.model("User", UserSchema);
module.exports = User;