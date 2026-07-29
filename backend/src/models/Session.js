import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    therapistName: {
      type: String,
      required: [true, 'Therapist name is required'],
      trim: true,
    },
    programType: {
      type: String,
      required: [true, 'Program type is required'],
      enum: {
        values: [
          'Physiotherapy', 
          'Yoga', 
          'Mobility Training', 
          'Balance Training', 
          'Stretching', 
          'Strength Training', 
          'Rehabilitation Exercise', 
          'Custom Program'
        ],
        message: '{VALUE} is not a valid program type',
      },
    },
    sessionDate: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    attendance: {
      type: String,
      enum: {
        values: ['Present', 'Absent', 'Late', 'Excused'],
        message: '{VALUE} is not a valid attendance status',
      },
      default: 'Absent',
    },
    status: {
      type: String,
      enum: {
        values: ['Scheduled', 'Completed', 'Missed', 'Cancelled', 'Rescheduled', 'Pending Approval', 'Rejected'],
        message: '{VALUE} is not a valid session status',
      },
      default: 'Scheduled',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Session notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
