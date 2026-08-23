const User = require("../models/User");
const Address = require("../models/Address");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const { sendTokenCookies, clearTokenCookies } = require("../utils/tokens");
const jwt = require("jsonwebtoken");

// 1. Register Buyer or Seller
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Basic check on roles
  if (role && !["BUYER", "SELLER"].includes(role)) {
    return next(
      new AppError("You can only register as a BUYER or SELLER.", 400),
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email address is already in use.", 400));
  }

  // Create new user
  const newUser = await User.create({
    name,
    email,
    password,
    role: role || "BUYER",
    isActive: true, // Default active
  });

  // Generate tokens & set cookies
  const tokens = sendTokenCookies(newUser, res);

  // Save refresh token in DB
  newUser.refreshToken = tokens.refreshToken;
  await newUser.save({ validateBeforeSave: false });

  // Hide password
  newUser.password = undefined;

  res.status(201).json({
    success: true,
    user: newUser,
  });
});

// 2. Login User
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide both email and password.", 400));
  }

  // Find user and select password
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Incorrect email or password.", 401));
  }

  if (!user.isActive) {
    return next(new AppError("Your account has been suspended.", 403));
  }

  // Generate tokens & set cookies
  const tokens = sendTokenCookies(user, res);

  // Save refresh token in DB
  user.refreshToken = tokens.refreshToken;
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  res.status(200).json({
    success: true,
    user,
  });
});

// 3. Refresh Access Token
exports.refresh = asyncHandler(async (req, res, next) => {
  let rToken;

  if (req.cookies && req.cookies.refreshToken) {
    rToken = req.cookies.refreshToken;
  }

  if (!rToken) {
    return next(
      new AppError("Refresh token is missing. Please log in again.", 401),
    );
  }

  try {
    const decoded = jwt.verify(rToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || !user.isActive || user.refreshToken !== rToken) {
      return next(
        new AppError(
          "Invalid refresh session. Please authenticate again.",
          401,
        ),
      );
    }

    // Refresh cookies
    const tokens = sendTokenCookies(user, res);
    user.refreshToken = tokens.refreshToken;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    return next(new AppError("Expired or invalid refresh token.", 401));
  }
});

// 4. Logout User
exports.logout = asyncHandler(async (req, res, next) => {
  let rToken;

  if (req.cookies && req.cookies.refreshToken) {
    rToken = req.cookies.refreshToken;
  }

  if (rToken) {
    // Clear in database
    const decoded = jwt.decode(rToken);
    if (decoded && decoded.id) {
      await User.findByIdAndUpdate(decoded.id, { $unset: { refreshToken: 1 } });
    }
  }

  clearTokenCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// 5. Get current authenticated user details
exports.getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// 6. Update user profile details
exports.updateMe = asyncHandler(async (req, res, next) => {
  const { name, email } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (email) {
    const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existing) {
      return next(new AppError("Email already in use.", 400));
    }
    updates.email = email;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

// ================= ADDRESS MANAGEMENT =================

// Add new address
exports.addAddress = asyncHandler(async (req, res, next) => {
  const {
    title,
    streetAddress,
    subCity,
    city,
    state,
    postalCode,
    phoneNumber,
    isDefault,
  } = req.body;

  const newAddress = await Address.create({
    user: req.user._id,
    title,
    streetAddress,
    subCity,
    city,
    state,
    postalCode,
    phoneNumber,
    isDefault: !!isDefault,
  });

  res.status(201).json({
    success: true,
    address: newAddress,
  });
});

// Get user addresses
exports.getMyAddresses = asyncHandler(async (req, res, next) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.status(200).json({
    success: true,
    addresses,
  });
});

// Update Address
exports.updateAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  const address = await Address.findById(addressId);
  if (!address) {
    return next(new AppError("Address not found.", 404));
  }

  // Strict ownership check
  if (address.user.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not own this address.", 403));
  }

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    { ...req.body, user: req.user._id }, // user cannot be changed
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    address: updatedAddress,
  });
});

// Delete Address
exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const { addressId } = req.params;

  const address = await Address.findById(addressId);
  if (!address) {
    return next(new AppError("Address not found.", 404));
  }

  // Strict ownership check
  if (address.user.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not own this address.", 403));
  }

  await address.deleteOne();

  res.status(200).json({
    success: true,
    message: "Address deleted successfully.",
  });
});
