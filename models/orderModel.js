const mongoose = require('mongoose')


const ordersSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  date:{
    type:Date,
    require:true
  },
  orderValue:{
    type:Number,
    require:true
  },
  paymentMethod:{
    type:String,
    require:true
  },
  couponCode:{
    type:String,
   
  },
  couponDiscount:{
    type:Number,
    default:0
  },
  couponId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Coupon'
  },
  preDiscountAmount:{
    type:Number,
    require:true
  },
  orderStatus:{
    type:String,
    require:true
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Product"
      },
      productName:{
        type:String,
        required:true,
      },
      productPrice:{
        type:Number,
        required:true
      },
      productDescription:{
        type:String,
        required:true
      },
      productImage:{
        type:String,
        required:true
      },
      quantity: {
        type: Number,
        required: true,
        default: 1
      },
      total:{
        type:Number,
        default:0
      }
    }
  ],
  addressDetails: {
    
      name: {
        type:String,
        require:true
      
      },
      phone:{
        type:String,
        require:true
      },
      // addressLine1:{
      //   type:String,
      //   require:true
      // },
      // addressLine2:{
      //   type:String,
      //   require:true
      // },
      streetaddress:{
        type:String,
        require:true
      },
      postcode:{
        type:Number,
        require:true
      },
      // area:{
      //   type:String,
      //   require:true
      // },
      city:{
        type:String,
        require:true
      },
      country:{
        type:String,
        require:true
      }, 
      state:{
        type:String,
        require:true
      }


},
  
  cancellationStatus:{
    type:String,
    default:"Not requested"
    
  },
  cancelledOrder:{
    type:Boolean,
    default:false
  },
  deliveryStatus:{
    type:String,
    default:'Pending'
  }

})

module.exports = mongoose.model('Order',ordersSchema )