import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
    },
    planDescription: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    durationMonths: {
      type: Number,
      required: [true, 'Duration in months is required'],
      validate: {
        validator: Number.isInteger,
        message: 'Duration must be a whole number',
      },
      min: [1, 'Duration must be at least 1 month'],
    },
    totalSessions: {
      type: Number,
      default: 0,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    remainingSessions: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
      validate: {
        validator: function (v) {
          return this.startDate ? new Date(v) > new Date(this.startDate) : true;
        },
        message: 'End date must be after start date',
      },
    },
    status: {
      type: String,
      required: [true, 'Subscription status is required'],
      enum: {
        values: ['Active', 'Expired', 'Expiring Soon', 'Cancelled', 'Completed'],
        message: '{VALUE} is not a valid subscription status',
      },
      default: 'Active',
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['Paid', 'Unpaid', 'Partially Paid'],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'Unpaid',
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: [0, 'Remaining balance cannot be negative'],
    },
    renewalHistory: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        price: { type: Number, required: true },
        amountPaid: { type: Number, required: true },
        renewalDate: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
