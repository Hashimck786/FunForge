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
    }
  }]
});




module.exports = mongoose.model('Cart', cartSchema);