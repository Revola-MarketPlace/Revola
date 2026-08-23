const Product = require("../models/Product");
const Category = require("../models/Category");
const MaterialType = require("../models/MaterialType");
const AuditLog = require("../models/AuditLog");
const StorageService = require("../services/StorageService");
const AppError = require("../utils/appError");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

// Helper for parsing filters
const buildFilters = async (query) => {
  const filter = {};

  // Public listings are ONLY approved products
  filter.approvalStatus = "APPROVED";

  // Category filter (support ID or Slug)
  if (query.category) {
    if (mongoose.Types.ObjectId.isValid(query.category)) {
      filter.category = query.category;
    } else {
      const cat = await Category.findOne({ slug: query.category });
      if (cat) filter.category = cat._id;
    }
  }

  // Material type filter (support ID or Slug)
  if (query.materialType) {
    if (mongoose.Types.ObjectId.isValid(query.materialType)) {
      filter.materialType = query.materialType;
    } else {
      const mat = await MaterialType.findOne({ slug: query.materialType });
      if (mat) filter.materialType = mat._id;
    }
  }

  // Condition filter
  if (query.condition) {
    const conditions = Array.isArray(query.condition)
      ? query.condition
      : query.condition.split(",");
    filter.condition = { $in: conditions };
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // Text search on name & description
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  // Stock availability
  if (query.inStock === "true") {
    filter.quantity = { $gt: 0 };
  }

  return filter;
};

// 1. Get all public products (with filters & pagination)
exports.getPublicProducts = asyncHandler(async (req, res, next) => {
  const filter = await buildFilters(req.query);

  // Pagination params
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Sorting
  let sortOption = { createdAt: -1 }; // default newest
  if (req.query.sortBy) {
    if (req.query.sortBy === "price-low") sortOption = { price: 1 };
    if (req.query.sortBy === "price-high") sortOption = { price: -1 };
    if (req.query.sortBy === "newest") sortOption = { createdAt: -1 };
  }

  const products = await Product.find(filter)
    .populate("category", "name slug")
    .populate("materialType", "name slug")
    .populate("seller", "name email")
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    pages: Math.ceil(total / limit),
    page,
    products,
  });
});

// 2. Get Single Product
exports.getProductDetails = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .populate("materialType", "name slug")
    .populate("seller", "name email");

  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  // Rule: Only Approved products are public. Sellers can view their own non-approved products. Admin/Staff can view all.
  const isApproved = product.approvalStatus === "APPROVED";
  const isSeller =
    req.user && req.user._id.toString() === product.seller._id.toString();
  const isAdminOrStaff = req.user && ["ADMIN", "STAFF"].includes(req.user.role);

  if (!isApproved && !isSeller && !isAdminOrStaff) {
    return next(
      new AppError("You do not have permission to view this product.", 403),
    );
  }

  // Fetch related products (same category, excluding current product)
  const relatedProducts = await Product.find({
    category: product.category._id,
    approvalStatus: "APPROVED",
    _id: { $ne: product._id },
  })
    .limit(4)
    .select("name price condition images");

  res.status(200).json({
    success: true,
    product,
    relatedProducts,
  });
});

// ================= SELLER PRODUCT CONTROLLERS =================

// Create Product (defaults to DRAFT)
exports.createProduct = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    price,
    quantity,
    category,
    materialType,
    condition,
    location,
    images,
  } = req.body;

  if (!images || images.length === 0) {
    return next(new AppError("At least one product image is required.", 400));
  }

  const newProduct = await Product.create({
    name,
    description,
    price,
    quantity,
    category,
    materialType,
    condition,
    images,
    seller: req.user._id,
    approvalStatus: "DRAFT", // Always starts as Draft
    location: location || { subCity: "Adama Kebele 04", city: "Adama" },
  });

  res.status(201).json({
    success: true,
    product: newProduct,
  });
});

// Get seller's own products
exports.getMyProducts = asyncHandler(async (req, res, next) => {
  const products = await Product.find({ seller: req.user._id })
    .populate("category", "name slug")
    .populate("materialType", "name slug")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: products.length,
    products,
  });
});

// Edit Product
exports.updateProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  // Strict ownership check
  if (product.seller.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not own this product.", 403));
  }

  // If a product is updated, reset it to DRAFT unless it was already a DRAFT
  // Let the user make changes and then explicitly submit it for approval again.
  const fieldsToUpdate = { ...req.body };
  delete fieldsToUpdate.seller; // cannot change seller

  if (product.approvalStatus !== "DRAFT") {
    fieldsToUpdate.approvalStatus = "DRAFT";
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    success: true,
    product: updatedProduct,
  });
});

// Submit Product for Approval
exports.submitForApproval = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  // Strict ownership check
  if (product.seller.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not own this product.", 403));
  }

  if (product.approvalStatus === "APPROVED") {
    return next(new AppError("Product is already approved.", 400));
  }

  product.approvalStatus = "PENDING_APPROVAL";
  await product.save();

  res.status(200).json({
    success: true,
    message:
      "Product submitted for approval. An administrator will review it shortly.",
    product,
  });
});

// Delete Product (Only seller can delete their own non-active products, or admins can delete any)
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found.", 404));
  }

  const isSeller = product.seller.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "ADMIN";

  if (!isSeller && !isAdmin) {
    return next(
      new AppError("You do not have permission to delete this product.", 403),
    );
  }

  // Delete product images from storage
  for (const imgUrl of product.images) {
    await StorageService.deleteImage(imgUrl);
  }

  await product.deleteOne();

  res.status(200).json({
    success: true,
    message: "Product deleted successfully.",
  });
});

// Upload Product Images
exports.uploadProductImages = asyncHandler(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError("No files uploaded.", 400));
  }

  const urls = [];
  for (const file of req.files) {
    const url = await StorageService.uploadImage(file);
    urls.push(url);
  }

  res.status(200).json({
    success: true,
    urls,
  });
});
