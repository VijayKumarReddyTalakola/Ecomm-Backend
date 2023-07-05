const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const ApiFeatures = require("../utils/apifeatures");
const catchAsyncErrors = require("../middleware/catchSyncErrors");

//Create Product --Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  //req.body.user = req.user.id;
  const {name,description,price,category} = req.body;
  if (!name || !description || !price || !category) {
    return next(new ErrorHandler("Please fill all details ", 400));
  }
  const isExist = await Product.findOne({name:name});
  if (isExist) {
    return next(new ErrorHandler("Product already exists", 400));
  }
  const product = await Product.create(req.body);
  res.status(201).json({
    success: true,
    product
  });
});


//Get All products
exports.getAllProducts = catchAsyncErrors(async (req,res)=>{
    const resultPerpage = 5;
    //const productCount = await Product.countDocuments();
    const apiFeature = new ApiFeatures(Product.find(),req.query)
    .search()
    .filter()
    .pagination(resultPerpage);
    const products = await apiFeature.query;
    const productCount = products.length;
    res.status(200).json({
      success: true,
      productCount,
      products
    });
});


//Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req,res,next) => {

    const product = await Product.findById(req.params.id);
    if(!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }
    res.status(200).json({
      success: true,
      product
    });
});  


//Update a product -Admin
exports.updateProduct = catchAsyncErrors(async (req,res,next)=>{
 
    let product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }
    product = await Product.findByIdAndUpdate(req.params.id,req.body,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    res.status(200).json({
      success: true,
      product
    });
});

//Delete Product -Admin
exports.deleteProduct = catchAsyncErrors(async (req,res,next)=>{

    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }
    await product.remove();
    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
});

//Create new reviews  or update reviews
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const {rating,comment,productId} = req.body;
    const review ={
      user:req.user.id,
      name:req.user.name,
      rating:Number(rating),
      comment
    }
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }
    const isReviewed = product.reviews.find((rev)=>rev.user.toString() === req.user.id.toString());
    if(isReviewed){
        product.reviews.forEach(rev=>{
          if(rev.user.toString() === req.user.id.toString())
            (rev.rating = Number(rating)),
            (rev.comment = comment);
        })
    }else{
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
    }
    //Calculate ratings
    let avg=0;
    Number(product.reviews.forEach( rev => { 
        avg = avg + rev.rating 
        })
    );
    product.ratings = Number(avg / product.reviews.length).toFixed(1);
    await product.save();
    res.status(201).json({
      success: true,
      message:"Product Reviewed Successfully"
    });
});

//Get All Reviews  of a Product
exports.getProductReviews = catchAsyncErrors(async (req,res,next)=>{
    const product = await Product.findById(req.query.id);
    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    } 
    res.status(200).json({
      success: true,
      reviews:product.reviews
    });
})

//Delete Review of a Product
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
      return next(new ErrorHandler("Product Not Found", 404));
    }
    const reviews = product.reviews.filter(rev=>rev._id.toString()!==req.query.id.toString());
    let avg = 0;
    Number(reviews.forEach((rev) => {
        avg = avg + rev.rating;
      })
    );
    const ratings = Number(avg / reviews.length).toFixed(1);
    const numOfReviews = reviews.length;
    await Product.findByIdAndUpdate(
      req.query.productId,
      {
        reviews,
        ratings,
        numOfReviews,
      },{
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );
    res.status(200).json({
      success: true
  });
});