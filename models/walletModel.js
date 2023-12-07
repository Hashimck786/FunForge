const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction', // Assuming you have a Transaction model
    },
  ],
});

module.exports = mongoose.model('Wallet', walletSchema);


