const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
  userId : {
    type:ObjectId,
    required:true,
  },
  products:[{
    productId:{
      type:ObjectId,
      required:true,
      ref:'product'
    },
    quantity:{
      type:Number,
      default:0
    },
    total:{
      type:Number,
      default:0
    }
  }],
  cartSubTotal:{
    type:Number,
    default:0
  },
  cartGrandtotal:{
    type:Number,
    default:0
  },
  couponDiscount:{
    type:Number,
    default:0
  },
  couponId:{
    type:ObjectId,
  }
});




module.exports = mongoose.model('Cart', cartSchema);