
const mongoose = require('mongoose');


const addressSchema= new mongoose.Schema({
  
    addressname:{
      type:String,
      required:true
    },
    name:{
      type:String,
      required:true
    },
    country:{
      type:String,
      required:true
    },
    streetaddress:{
      type:String,
      required:true
    },
    city:{
      type:String,
      required:true
    },
    state:{
      type:String,
      required:true
    },
    pincode :{
      type:Number,
      required:true
    },
    phone:{
      type:Number,
      required:true
    },
    alterphone:{
      type:Number,
      required:true
    },
    is_Default:{
      type:Boolean,
      default:false
    }
  
  
})

module.exports =mongoose.model('address',addressSchema);