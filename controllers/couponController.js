const Coupon = require('../models/couponModel')


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

  res.redirect('/gadgetly/admin/coupons');
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

  res.redirect('/gadgetly/admin/coupons')
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
  res.redirect('/gadgetly/admin/inactivecouponlist')
}

// deactivate coupon.....................................................

const deactivateCoupon =  async(req,res)=>{
  const coupon = req.query.couponId;
  const updated = await Coupon.updateOne({_id:coupon},{$set:{is_Active:false}})
  res.redirect('/gadgetly/admin/coupons')
}

module.exports={
  couponList,
  loadCreateCoupon,
  createCoupon,
  loadEditCoupon,
  editCoupon,
  inactiveCouponList,
  activateCoupon,
  deactivateCoupon
}