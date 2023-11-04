const mongoose = require('mongoose');


const adminSchema = new mongoose.Schema(
  {
    name:{
      type:String,
      required:true

    },
    mobile:{
      type:Number,
      required:true
    },
    email:{
      type:String,
      required:true

    },
    password:{
      type:String,
      required:true
    },
    otp:{
      type:String,
      dafault:""
    }
  }
)

module.exports = mongoose.model("admin",adminSchema);