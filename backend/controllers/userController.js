const ErrorHandler = require("../utils/errorhandler");
const User = require("../models/userModel");
const sendToken = require("../utils/jwttoken");
const sendEmail = require("../utils/sendEmail");
const catchAsyncErrors = require("../middleware/catchSyncErrors");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { send } = require("process");

// Registering user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please fill all details ", 400));
  }
  const isUser = await User.findOne({ email: email });
  if (isUser) {
    return next(new ErrorHandler("Email already exists", 400));
  }
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is a sample id ",
      url: "profilepicUrl",
    },
  });
  await user.save();
  sendToken(user, 201, res);
});

//Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  //Verifying  all fields are filled or not
  if (!email || !password) {
    return next(new ErrorHandler("Please fill both Email and Password ", 400));
  }
  const user = await User.findOne({ email: email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password ", 401));
  }
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email or Password ", 401));
  }
  sendToken(user, 200, res);
});

//Logout User
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

//Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not Found", 404));
  }
  if (req.body.email !== req.user.email) {
    return next(new ErrorHandler("Enter your Registered Email ", 404));
  }
  //Get Reset Password Token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
  const message = `Your password reset token is :\n\n ${resetPasswordUrl} \n\n If you have not requested this email then please ignore it`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce  Password  Recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

//Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  //creating hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new ErrorHandler(
        "Reset Password Token is Invalid or has been Expired",
        400
      )
    );
  }
  if (req.body.newPassword !== req.body.confirmNewPassword) {
    return next(new ErrorHandler("Passwords does not match", 400));
  }
  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

//Get User Datails
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    sucess: true,
    user,
  });
});

//Update User Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!oldPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler("Please fill all the details ", 400));
  }
  const user = await User.findById(req.user.id).select("+password");
  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old Password is incorrect ", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("Passwords does not match", 400));
  }
  if (oldPassword === newPassword) {
    return next(
      new ErrorHandler("New Password must be different from Old Password", 400)
    );
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

//Update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id : ${req.user.id}`, 404)
    );
  } else {
    const { name, email } = req.body;
    const newUserData = {
      name: name,
      email: email,
    };
    const isOtherUserData = await User.findOne({ email: email });
    if (isOtherUserData) {
      if (req.user.email === email) {
        //we will addd cloudinary later (for avatar)
        const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
          new: true,
          runValidators: true,
          useFindAndModify: false,
        });
        res.status(200).json({
          success: true,
          message: "Profile Updated Successfully",
        });
      } else {
        return next(
          new ErrorHandler(
            "Email is already in use,Please choose a different email",
            400
          )
        );
      }
    }
  }
});

//Get All Users -Admin
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

//Get Single User -Admin
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id : ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    success: true,
    user,
  });
});

//Update User Role -Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id : ${req.params.id}`, 404)
    );
  } else {
    //we will add cloudinary later (for avatar)
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    res.status(200).json({
      success: true,
      message: "Profile Updated Successfully",
    });
  }
});

//Delete User -Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id : ${req.params.id}`, 404)
    );
  }
  await user.remove();
  res.status(200).json({
    success: true,
    message: "User Removed Successfully",
  });
});
