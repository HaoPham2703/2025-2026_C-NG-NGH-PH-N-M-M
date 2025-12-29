const mongoose = require("mongoose");

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nhãn hiệu phải có tên"],
      unique: true,
      trim: true,
      maxlength: [
        40,
        "Nhãn hiệu tối đa 40 kí tự",
      ],
      minlength: [2, "Nhãn hiệu tối thiểu 2 kí tự"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate
brandSchema.virtual("products", {
  ref: "Product",
  foreignField: "brand",
  localField: "_id",
});

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand;
