const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');


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
    ],
    coupons:[
      {
        type:mongoose.Schema.Types.ObjectId,
        required:true
      }
    ],
    referralCode: {
      type: String,
      default: uuidv4(),
    },
    referredBy:{
      type:String
    }
    
  }
)

// userSchema.pre('save', function (next) {
//   if (!this.referralCode) {
//     this.referralCode = uuidv4();
//   }
//   next();
// });

module.exports = mongoose.model("User",userSchema);