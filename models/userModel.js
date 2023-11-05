const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema(
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
    is_verified:{
      type:Number,  // changed string into number in both ises
      default:0
    },
    is_block:{
      type:Number,
      default:0
    },
    otp:{
      type:String,
      default:""
    },
    wishlist:[
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      }
    ],
    address:[
      {
        type:mongoose.Schema.Types.ObjectId,
        required:true
      }
    ]
      
    
  }
)

module.exports = mongoose.model("user",userSchema);