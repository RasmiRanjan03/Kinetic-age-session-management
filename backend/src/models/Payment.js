import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client ID is required'],
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription ID is required'],
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    amountPaid: {
      type: Number,
      required: [true, 'Amount paid is required'],
      min: [0.01, 'Amount paid must be a positive number'],
    },
    remainingBalance: {
      type: Number,
      required: [true, 'Remaining balance is required'],
      min: [0, 'Remaining balance cannot be negative'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['Cash', 'Card', 'UPI', 'Net Banking'],
        message: '{VALUE} is not a valid payment method',
      },
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['Paid', 'Partially Paid', 'Pending', 'Overdue', 'Refunded'],
        message: '{VALUE} is not a valid payment status',
      },
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      validate: {
        validator: function (v) {
          return new Date(v) <= new Date(Date.now() + 10000); // 10 seconds leeway for lags
        },
        message: 'Payment date cannot be in the future',
      },
    },
    transactionReference: {
      type: String,
      trim: true,
      default: '',
    },
    collectedBy: {
      type: String,
      trim: true,
      default: 'Admin',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
