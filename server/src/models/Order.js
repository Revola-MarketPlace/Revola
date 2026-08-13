const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0, // Staff sets this manually or defaults to 0 before setting
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['TELEBIRR', 'CHAPA', 'BANK_TRANSFER', 'MOCK'],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PAYMENT_VERIFICATION',
        'CONFIRMED',
        'PROCESSING',
        'READY_FOR_DELIVERY',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'DISPUTED',
        'REFUNDED',
        'COMPLETED',
      ],
      default: 'PENDING_PAYMENT',
    },
    paymentStatus: {
      type: String,
      enum: [
        'PENDING',
        'PROCESSING',
        'PAID',
        'FAILED',
        'REFUNDED',
        'PENDING_VERIFICATION',
      ],
      default: 'PENDING',
    },
    deliveryStatus: {
      type: String,
      enum: [
        'PENDING',
        'ASSIGNED',
        'PICKED_UP',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'FAILED',
      ],
      default: 'PENDING',
    },
    deliveryAddress: {
      streetAddress: { type: String, required: true },
      subCity: { type: String, required: true },
      city: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    trackingNumber: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
