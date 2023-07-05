const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchSyncErrors");
const ApiFeatures = require("../utils/apifeatures");

//Create new Order -Admin
exports.newOrder = catchAsyncErrors( async(req,res,next)=>{
    const {shippingInfo,orderItems,paymentInfo,itemsPrice,taxPrice,shippingPrice,totalPrice} = req.body;
    // const product = await Product.findById(orderItems.product);
    // console.log(product);
    // console.log(product.stock);
    // console.log(req.body.quantity);
    // if(product.stock<1) {
    //     return next(new ErrorHandler("Product Out of Stock", 404));
    // }
    // if(product.stock<req.body.quantity) {
    //     return next(new ErrorHandler("Requested quantity is unavailable", 404));
    // }
    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidOn:Date.now(),
      user:req.user.id
    });
    res.status(201).json({
      success: true,
      message:"Order Placed Successfully",
      order
    });
})

//Get Single Order 
exports.getSingleOrder = catchAsyncErrors(async(req, res, next)=>{
    const order = await Order.findById(req.params.id).populate("user","name email");
    if(!order){
        return next(new ErrorHandler("Order not found with this id", 404));
    }
    res.status(201).json({
      success: true,
      order
    });
});

//Get Logged In User Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({user:req.user._id});
  const orderCount = orders.length;
  res.status(201).json({
    success: true,
    orderCount,
    orders
  });
});

//Get All Orders -Admin
exports.getAllOrders = catchAsyncErrors(async (req, res, next) => {
    // const resultPerpage = 5;
    // const totalOrders = await Order.countDocuments();
    const apiFeature = new ApiFeatures(Order.find(),req.query)
      .search()
      .filter()
      //.pagination(resultPerpage);
    const orders = await apiFeature.query;
    const totalOrders = orders.length;
    let totalAmount = 0;
    orders.forEach((order)=>{
        totalAmount += order.totalPrice;
    })
      res.status(201).json({
        success: true,
        totalAmount,
        totalOrders,
        orders
      });
});

//Update Order Status -Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ErrorHandler("Order not found with this id", 404));
    }
    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler(`You have already deleivered this product`,400));
    }
    order.orderItems.forEach( async (o)=>{
        await updateStock(o.product,o.quantity)
    })
    order.orderStatus = req.body.status;
    if(req.body.status === "Delivered"){
        order.deliveredOn = Date.now();
    }
    await order.save({validateBeforeSave:false});
    res.status(201).json({
      success: true,
    });
});

async function updateStock(id,quantity){
    const product = await Product.findById(id);
    product.stock -= quantity;
    await product.save({validateBeforeSave:false})
}


//Delete Order -Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler("Order not found with this id", 404));
  }
  await order.remove()
  res.status(201).json({
    success: true,
  });
});