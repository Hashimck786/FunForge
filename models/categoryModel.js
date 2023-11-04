const mongoose = require("mongoose");


const categorySchema = mongoose.Schema({
  categoryName:{
    type:String,
    required:true
  },
  categorySlug:{
    type:String,
    required:true
  },
  categoryParent:{
    type:String,
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