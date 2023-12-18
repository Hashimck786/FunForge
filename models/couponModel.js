const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode:{
    type:String,
    required:true
  },
  couponDescription:{
    type:String,
    required:true
  },
  couponDiscount:{
    type:Number,
    min:0,
    max:100
  },
  expirationDate:{
    type:Date,
    required:true,
  },
  is_Active:{
    type:Boolean,
    default:true,
  },
  usageLimit:{
    type:Number,
    required:true
  },
  created_at:{
    type:Date,
    default: () => Date.now()

  },
  
})

module.exports = mongoose.model('Coupon',couponSchema)