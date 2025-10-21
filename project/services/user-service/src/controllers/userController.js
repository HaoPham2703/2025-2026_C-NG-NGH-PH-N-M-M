const User = require("../models/userModel");
const AppError = require("../utils/appError");

// Helper function for async error handling
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("Trang này không dùng để thay đổi mật khẩu", 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated,this is all field can update:
  const filteredBody = filterObj(
    req.body,
    "name",
    "avatar",
    "gender",
    "dateOfBirth",
    "phone"
  );

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: "ban" });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

exports.createAddress = catchAsync(async (req, res) => {
  const user = req.user;
  let arr = user.address;
  let index = arr.length;
  const data = {
    name: req.body.name,
    phone: req.body.phone,
    province: req.body.province,
    district: req.body.district,
    ward: req.body.ward,
    detail: req.body.detail,
  };
  if (index == 0) data.setDefault = true;
  arr.push(data);
  user.address = arr;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: "You have already added address successfully.",
    data: user,
  });
});

exports.updateAddress = catchAsync(async (req, res) => {
  const user = req.user;
  const id = req.body.id;
  if (user.address.length > id) {
    let arr = user.address;
    const data = {
      name: req.body.name,
      phone: req.body.phone,
      province: req.body.province,
      district: req.body.district,
      ward: req.body.ward,
      detail: req.body.detail,
      setDefault: req.body.setDefault,
    };
    arr[id] = data;
    user.address = arr;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "success",
      message: "You have already updated address successfully.",
    });
  }
  res.status(500).json({
    status: "error",
    message: "This data is not exist. Please try again!!!",
    data: user,
  });
});

exports.deleteAddress = catchAsync(async (req, res) => {
  const user = req.user;
  const address = user.address;
  const index = req.body.id;
  if (address.length > index) {
    const check = address[index].setDefault;
    address.splice(index, 1);
    if (check == true && address.length > 0) {
      address[0].setDefault = true;
    }
    user.address = address;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "success",
      message: "Delete address successfully.",
      data: user,
    });
  }
  res.status(500).json({
    status: "error",
    message: "This data is not exist. Please try again!!!",
  });
});

exports.setDefaultAddress = catchAsync(async (req, res) => {
  const user = req.user;
  const address = user.address;
  const index = req.body.id;
  if (address.length > index) {
    const current = await address.findIndex(
      (value) => value.setDefault == true
    );
    address[index].setDefault = true;
    address[current].setDefault = false;
    user.address = address;
    await user.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "success",
      message: "Set default address successfully.",
      data: user,
    });
  }
  res.status(500).json({
    status: "error",
    message: "This data is not exist. Please try again!!!",
  });
});

exports.getUserAddress = (req, res) => {
  console.log("=== DEBUG getUserAddress ===");
  console.log("req.user:", req.user);
  console.log("req.user.address:", req.user.address);
  console.log(
    "address length:",
    req.user.address ? req.user.address.length : "undefined"
  );
  console.log("===========================");

  const address = req.user.address;
  res.status(200).json({
    status: "success",
    data: {
      address,
    },
    message: "Get all user address successfully.",
  });
};

// Generic CRUD operations
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng với ID này", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng với ID này", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("Không tìm thấy người dùng với ID này", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getTableUser = catchAsync(async (req, res, next) => {
  const users = await User.find().select("-password");

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});
