const express = require("express");
const app = express()
const mongoose = require("mongoose")
const { Image, Product } = require('../models/productModel');
const Joi = require('joi');
const { upload, handleMulterError } = require('../middleware/multer');


app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.use((req, res) => {
  console.log(res);
  res.status(404).send('404 - Not Found');
});


//Home page API
app.get("/", (req, res) => {
  res.send("Hello Home get")
})

//validate request body
const productSchema = Joi.object({
  product_name: Joi.string()
    .regex(/^[A-Za-z]+(?: [A-Za-z0-9.,()\-]+)*$/)
    .trim()
    .required(),
  quantity: Joi.number().integer().min(0)
    .required(),
  price: Joi.number()
    .min(0)
    .required(),
});

//Create products
exports.createProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      if (error.message.includes('"product_name"')) {
        if (error.message.includes('"product_name" is required')){
          return res.status(422).json({
            message: 'Product name is required please add product name.',
          });
        }
        return res.status(422).json({
          message: 'Product names must begin with a letter and only include letters.',
        });
      } else if (error.message.includes('"price"')) {
        if(error.message.includes('"price" is required')){
          return res.status(422).json({
            message: 'Price is required please add price.',
          });
        }
        return res.status(422).json({
          message: 'Please provide a numerical and positive value for the price to proceed',
        });
      } else if (error.message.includes('"quantity"')) {
        if(error.message.includes('"quantity" is required')){
          return res.status(422).json({
            message: 'Quantity is required please add quantity.',
          });
        }
        return res.status(422).json({
          message: 'Please provide a numerical and positive value for the quantity to proceed',
        });
      }
    }
    const file = req.files;
    if (!file) {
      const product = await Product.create({
        ...value,
      });
      res.status(201).json({ message: 'Congratulations! Your product has been successfully created.', data: product });
    } else {
      const imagePaths = [];
      try {
        const productPromises = file.map(async (file) => {
          if (!file.mimetype.startsWith('image')) {
            throw new Error('Invalid image file');
          }
          const filePath = 'uploads/' + file.filename;
          imagePaths.push(filePath);        
        });
        await Promise.all(productPromises);
        const product = await Product.create({
          product_name: value.product_name,
          quantity: value.quantity,
          price: value.price,
          images: imagePaths
        });
        const imagePromises = imagePaths.map(async (filePath) => {
          const image = await Image.create({
            imagePath: filePath,
            product: product._id,
          });
          return image;
        });
        await Promise.all(imagePromises);
        res.status(201).json({ message: 'Congratulations! Your product has been successfully created.', data: product });
      } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue) {
          const duplicateKeyName = Object.keys(error.keyPattern)[0];
          const duplicateKeyValue = error.keyValue[duplicateKeyName];
          return res.status(400).json({ message: `Product with the same name already exists.` });
        } else {
          console.error('Error during product creation:', error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
      }
    }
  } catch (error) {
    const errorMessage = error.message.replace(/\\|"/g, '');

  if (errorMessage.includes('E11000 duplicate key error')) {
    const fieldName = errorMessage.match(/index: (.+?) dup key/);
    const duplicateValue = errorMessage.match(/dup key: { (.+?) }/);

    return res.status(422).json({
      message: `Product with the same name already exists.`,
    });
  }
  }
}

//Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const product = await Product.find({});
    res.status(200).json({message:"Retrieve all product data",data:product});
  } catch (error) {
    console.error(error);
    res.status(404).json({error: "Requested id Data not found" });
  }
}

//Get Product by id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product){
    res.status(200).json({message:"Can't retrieve requested product data",data:product});
    }
    res.status(200).json({message:"Retrieve requested product data",data:product});
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Requested id not found" });
  }
}

const updateProductSchema = Joi.object({
  product_name: Joi.string()
    .regex(/^[A-Za-z]+(?: [A-Za-z0-9.,()\-]+)*$/)
    .trim(),
  quantity: Joi.string()
  .regex(/^\d{1,10}(?:,\d{3})*$/)
    .min(0),
  price: Joi.string()
  .regex(/^\d{1,10}(?:,\d{3})*$/)
    .min(0),
});

//Update product by id
exports.updateProduct = async (req, res) => {
  try {
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) {
      if (error.message.includes('"product_name"')) {
        if (error.message.includes('"product_name" is required')){
          return res.status(422).json({
            message: 'Product name is required please add product name.',
          });
        }
        return res.status(422).json({
          message: 'Product names must begin with a letter and only include letters.',
        });
      } else if (error.message.includes('"price"')) {
        if(error.message.includes('"quantity" is required')){
          return res.status(422).json({
            message: 'Quantity is required please add number of quantity.',
          });
        }
        return res.status(422).json({
          message: 'Please provide a numerical and positive value for the price to proceed',
        });
      } else if (error.message.includes('"quantity"')) {
        if(error.message.includes('"quantity" is required')){
          return res.status(422).json({
            message: 'Price is required please add price.',
          });
        }
        return res.status(422).json({
          message: 'Please provide a numerical and positive value for the quantity to proceed',
        });
      }
    }else{
      const { id } = req.params;
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({ error: 'Requested product not found' });
      }
      if (req.files && req.files.length > 0) {
        return res.status(422).json({ message: "You can't update image" });
      }
      const updatedProduct = await Product.findByIdAndUpdate(id, value, {
        new: true, 
        runValidators: true,
      });

      res.status(200).json({
        message: 'Update request has been processed and confirmed successfully',
        updatedProduct,
      });
    }
  } catch (error) {
    console.log(error);
    const errorMessage = error.message.replace(/\\|"/g, '');
      if (errorMessage.includes('E11000 duplicate key error')) {
        const fieldName = errorMessage.match(/index: (.+?) dup key/);
        const duplicateValue = errorMessage.match(/dup key: { (.+?) }/);

        return res.status(422).json({
          message: `Product with the same name already exists.`,
        });
      }
   }
};


exports.findProductAndImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const hasOtherParameters = Object.keys(req.params).some(param => param !== 'id' && param !== 'imageId');
    if (hasOtherParameters || Object.keys(req.query).length > 0 || Object.keys(req.body).length > 0) {
      return res.status(400).json({ error: 'Only file uploads are allowed, no other parameters are permitted' });
    }
    const foundProduct = await Product.findById(id);
    if (!foundProduct) {
      return res.status(404).json({ error: 'Requested product not found' });
    }
    const foundImage = await Image.findOne({ product: id, _id: imageId });
    if (!foundImage) {
      return res.status(404).json({ error: 'Image not found for the given product' });
    }
    try{
      res.status(200).json({
        foundProduct,
        foundImage,
      });
    }catch(error){
      console.log(error);
    }
    
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Your ID is not valid Please Check it' });
    } 
    res.status(500).json({ error: 'Internal server error' });
  }
};

//Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id, req.body);
    if (!product) {
      res.status(404).json({ error: "Requested product not found" });
    }
    res.status(200).json({ message: "Deletion successful: Your requested data has been removed.", product });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
