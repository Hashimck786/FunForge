const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const productSchema =new mongoose.Schema({
  productName:{
    type:String,
    required:true
  },
  productDescription: {
    type: String,
    required: true
  },  
  productPrice:{
    type:Number,
    required:true
  },
  categoryId: {
    type: ObjectId,
    required: true
  },
  productDiscount: {
    type:Number,
    default:0,
    required:true
  },
  salePrice:{
    type:Number,
    required:true
  },
  Stock:{
    type:Number,
    required:true
  },
  is_listed:{
    type:Number,
    default:0
  },
  image:[
    {
    type:String,
    required:true
  }
]

  
});

module.exports = mongoose.model("product",productSchema);