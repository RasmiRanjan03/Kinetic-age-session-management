import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
      validate: {
        validator: function (v) {
          if (this.authProvider === 'Google') return true; // Bypass alphabet validation for Google names
          return /^[A-Za-z\s]+$/.test(v);
        },
        message: 'Name can only contain alphabets and spaces',
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
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === 'local';
        },
        'Password is required',
      ],
      validate: {
        validator: function (v) {
          if (this.authProvider === 'Google' && !v) return true; // Password optional for Google login
          // Allow pre-existing bcrypt hashes to pass validation during updates
          if (v && (v.startsWith('$2a$') || v.startsWith('$2b$'))) return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,20}$/.test(v);
        },
        message: 'Password must be 8-20 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      },
    },
    googleId: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      default: 'local',
      enum: ['local', 'Google'],
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: '{VALUE} is not a valid role',
      },
      default: 'user',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare input password to database hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
