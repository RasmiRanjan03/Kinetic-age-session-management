import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [3, 'Full name must be at least 3 characters long'],
      maxlength: [60, 'Full name cannot exceed 60 characters'],
      validate: {
        validator: function (v) {
          return typeof v === 'string' && v.trim().length >= 3;
        },
        message: 'Full name must be at least 3 characters long',
      },
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      validate: {
        validator: Number.isInteger,
        message: 'Age must be an integer',
      },
      min: [55, 'Age must be between 55 and 120'],
      max: [120, 'Age must be between 55 and 120'],
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender (choose Male, Female, Other)',
      },
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Phone number must contain exactly 10 digits',
      },
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      minlength: [10, 'Address must be at least 10 characters long'],
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Active', 'Inactive'],
        message: '{VALUE} is not a valid status (choose Active or Inactive)',
      },
      default: 'Active',
    },
    subscriptionStatus: {
      type: String,
      enum: {
        values: ['None', 'Active', 'Expired'],
        message: '{VALUE} is not a valid subscription status',
      },
      default: 'None',
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: 'N/A',
    },
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model('Client', clientSchema);

export default Client;
