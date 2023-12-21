const Coupon = require('../models/couponModel')
const Cart = require('../models/cartModel')
const User = require('../models/userModel')


const couponList = async(req,res)=>{
  const couponData = await Coupon.find({is_Active:true})
  res.render('couponlist',{coupons:couponData})
}

// loading create coupun page..........................

const loadCreateCoupon = async(req,res)=>{
  res.render('createcoupon')
}

// creating a new coupon..............................

const createCoupon = async(req,res)=>{
  const couponCode = req.body.coupon_code;
  const couponDescription =req.body.coupon_description;
  const couponDiscount = req.body.coupon_discount;
  const couponLimit = req.body.coupon_limit;
  const couponExpiry = req.body.coupon_expiry;


  const coupon = new Coupon({
    couponCode:couponCode,
    couponDescription:couponDescription,
    couponDiscount:couponDiscount,
    expirationDate:couponExpiry,
    usageLimit:couponLimit

  })


  const couponData = await coupon.save()

  res.redirect('/admin/coupons');
}


// loading edit coupon page...........................................


const loadEditCoupon = async(req,res)=>{
  const coupon = req.query.couponId;
  const couponData = await Coupon.findOne({_id:coupon});
  res.render('editcoupon',{coupon:couponData})
}

const editCoupon = async(req,res) =>{

  const coupon = req.query.couponId;

  const couponCode = req.body.coupon_code;
  const couponDescription =req.body.coupon_description;
  const couponDiscount = req.body.coupon_discount;
  const couponLimit = req.body.coupon_limit;
  const couponExpiry = req.body.coupon_expiry;


  const updated = await Coupon.updateOne({_id:coupon},{$set:{
    couponCode:couponCode,
    couponDescription:couponDescription,
    couponDiscount:couponDiscount,
    expirationDate:couponExpiry,
    usageLimit:couponLimit
  }})

  res.redirect('/admin/coupons')
}

// loading inactive coupon list ...........................................

const inactiveCouponList = async(req,res)=>{
  const couponData = await Coupon.find({is_Active:false})
  res.render('inactivecouponlist',{coupons:couponData})
}

// activating coupon.....................................................

const activateCoupon = async(req,res)=>{
  const coupon = req.query.couponId;
  const updated = await Coupon.updateOne({_id:coupon},{$set:{is_Active:true}})
  res.redirect('/admin/inactivecouponlist')
}

// deactivate coupon.....................................................

const deactivateCoupon =  async(req,res)=>{
  const coupon = req.query.couponId;
  const updated = await Coupon.updateOne({_id:coupon},{$set:{is_Active:false}})
  res.redirect('/admin/coupons')
}

// applycoupon...........................................................

const applyCoupon = async(req,res)=>{
  try{
    const userId = req.session.data._id;
    const couponId = req.query.couponId;
    const cart = await Cart.findOne({userId:userId})
    if(couponId){
      const coupon = await Coupon.findOne({_id:couponId});
      if(coupon){
        const usedcoupon = await User.findOne({_id:userId,coupons:couponId});
        if(usedcoupon){
          res.json({
            usedcoupon:true
          })
        
        }else{
        const originalGrandTotal = cart.cartSubTotal;
        const discountPercentage = coupon.couponDiscount;
        console.log(originalGrandTotal);
        console.log(discountPercentage);

        // Calculate the discounted amount
        const discountAmount = (originalGrandTotal * discountPercentage) / 100;
        console.log(discountAmount)

        // Calculate the new grandtotal after applying the discount
        const newGrandTotal = originalGrandTotal - discountAmount;
        const updatedgrand = await Cart.updateOne({userId:userId},{$set:{cartGrandtotal:newGrandTotal,couponDiscount:discountAmount,couponId:couponId}})
        console.log(newGrandTotal)
        
         res.json({
          couponapplied:true,
          grandtotal:newGrandTotal,
          couponDiscount:discountAmount

        })
       }
      }else{
       res.json({
        noCoupon:true
      })
    }
  }
  }catch(error){
    console.error(error.message)
  }
  
}

module.exports={
  couponList,
  loadCreateCoupon,
  createCoupon,
  loadEditCoupon,
  editCoupon,
  inactiveCouponList,
  activateCoupon,
  deactivateCoupon,
  applyCoupon
}