const { string } = require("joi");
const mongoose = require("mongoose");



const productSchema = mongoose.Schema(
  {
    product_name: {
      type: String,
      required: [true, "Please enter name"],
      unique: true,
    },
    quantity: {
      type: Number,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer value for quantity',
      },
      min: [0, 'Quantity cannot be negative'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    images:[{type: String}],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

const imageSchema = mongoose.Schema({
    imagePath: {
      type: String,
      required: true,
    },
    product : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
  });
  
  const Image = mongoose.model('Image', imageSchema);

module.exports = { Image, Product };
