const mongoose = require("mongoose");


const categorySchema = mongoose.Schema({
  categoryName:{
    type:String,
    required:true
  },
  categoryDiscount:{
    type:Number,
    required:true
  },
  categoryDescription:{
    type:String,
    required:true
  },
  is_listed:{
    type:Number,
    default:0
  }
})


module.exports = mongoose.model("category",categorySchema);