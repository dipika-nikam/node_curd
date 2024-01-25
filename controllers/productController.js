const express = require("express");
const app = express()
const fs = require('fs');
const path = require('path'); 
const { Image, Product } = require('../models/productModel');
const Joi = require('joi');
const jwt = require('jsonwebtoken');



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
            success : false,
            message: 'Product name is required please add product name.',
          });
        }
        return res.status(422).json({
          success : false,
          message: 'Product names must begin with a letter and only include letters.',
        });
      } else if (error.message.includes('"price"')) {
        if(error.message.includes('"price" is required')){
          return res.status(422).json({
            success : false,
            message: 'Price is required please add price.',
          });
        }
        return res.status(422).json({
          success : false,
          message: 'Please provide a numerical and positive value for the price to proceed',
        });
      } else if (error.message.includes('"quantity"')) {
        if(error.message.includes('"quantity" is required')){
          return res.status(422).json({
            success : false,
            message: 'Quantity is required please add quantity.',
          });
        }
        return res.status(422).json({
          success : false,
          message: 'Please provide a numerical and positive value for the quantity to proceed',
        });
      }
    }
    const file = req.files;
    const user = req.user
    if (!file) {
      const product = await Product.create({
        ...value,
      });
      res.status(201).json({
        success : true, 
        data: product,
        message: 'Congratulations! Your product has been successfully created.' });
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
        product.user_id = user.id;
        await product.save();
        const imagePromises = imagePaths.map(async (filePath) => {
          const image = await Image.create({
            imagePath: filePath,
            product: product._id,
          });
          return image;
        });
        await Promise.all(imagePromises);
        const responseUser = { ...product.toObject() };
        delete responseUser.user_id;
        res.status(201).json({ success : true,
          data: responseUser ,
          message: 'Congratulations! Your product has been successfully created.'});
      } catch (error) {
        if (error.code === 11000 && error.keyPattern && error.keyValue) {
          const duplicateKeyName = Object.keys(error.keyPattern)[0];
          const duplicateKeyValue = error.keyValue[duplicateKeyName];
          return res.status(400).json({success : false, message: `Product with the same name already exists.` });
        } else {
          console.error('Error during product creation:', error);
          return res.status(500).json({success : false, message: 'Internal Server Error' });
        }
      }
    }
  } catch (error) {
    const errorMessage = error.message.replace(/\\|"/g, '');

  if (errorMessage.includes('E11000 duplicate key error')) {
    const fieldName = errorMessage.match(/index: (.+?) dup key/);
    const duplicateValue = errorMessage.match(/dup key: { (.+?) }/);

    return res.status(422).json({
      success : false, 
      message: `Product with the same name already exists.`,
    });
  }
  }
}

//Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const tokenWithoutBearer = token.split(' ')[1];
    const decodedToken = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET); 
    console.log(decodedToken);
    const product = await Product.find({});
    res.status(200).json({success : true, data : product, message:"Retrieve all product data"});
  } catch (error) {
    console.error(error);
    res.status(404).json({message: "Requested user Data not found" });
  }
}

//Get Product by id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product){
    res.status(200).json({success:true,data:product, message:"Can't retrieve requested product data"});
    }
    res.status(200).json({success:true, data:product, message:"Retrieve requested product data"});
  } catch (error) {
    console.error(error);
    res.status(404).json({success : false, message: "Requested id not found" });
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
            success: false,
            message: 'Product name is required please add product name.',
          });
        }
        return res.status(422).json({
          success: false,
          message: 'Product names must begin with a letter and only include letters.',
        });
      } else if (error.message.includes('"price"')) {
        if(error.message.includes('"quantity" is required')){
          return res.status(422).json({
            success: false,
            message: 'Quantity is required please add number of quantity.',
          });
        }
        return res.status(422).json({
          success: false,
          message: 'Please provide a numerical and positive value for the price to proceed',
        });
      } else if (error.message.includes('"quantity"')) {
        if(error.message.includes('"quantity" is required')){
          return res.status(422).json({
            success: false,
            message: 'Price is required please add price.',
          });
        }
        return res.status(422).json({
          success: false,
          message: 'Please provide a numerical and positive value for the quantity to proceed',
        });
      }
    }else{
      const { id } = req.params;
      const existingProduct = await Product.findById(id);

      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: 'Requested product not found' 
        });
      }

      const existingImages = await Image.find({ product: existingProduct._id });
      if (req.files && req.files.length > 0) {
        if (existingImages.length === 1 &&  req.files.length === 1){
          const newImages = [];
          for (const file of req.files) {
            try {
              if (!file.mimetype.startsWith('image')) {
                throw new Error('Invalid image file');
              }
              const filePath = 'uploads/' + file.filename;
              const newImage = new Image({ imagePath: filePath, product: id });
              await newImage.save();
              newImages.push(newImage.imagePath);
            } catch (error) {
              console.error('Error creating new image:', error);
              return res.status(400).json({
                success: false,
                message: 'Invalid image file' 
              });
            }
          }
        
          // Update the existing product with the new images
          const updatedProduct = await Product.findByIdAndUpdate(id, { $push: { images: { $each: newImages } } }, {
            new: true,
            runValidators: true,
          });
        
          res.status(200).json({
            success: true,
            updatedProduct,
            message: 'Update request has been processed and confirmed successfully',
          });
        }else if (req.files.length === 2 && existingImages.length === 2){
          for (const image of existingImages) {
            const imagePath = path.join(process.cwd(), '/public/', image.imagePath);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            } else {
              console.log("File does not exist at path:", imagePath);
            }

            await Image.findByIdAndDelete(image._id);
          }

          const newImages = [];
          for (const file of req.files) {
            const filePath = 'uploads/' + file.filename;
            const newImage = new Image({ imagePath: filePath, product: id });
            await newImage.save();
            newImages.push(newImage.imagePath);
          }
          value.images = newImages;
          const updatedProduct = await Product.findByIdAndUpdate(id, value, {
            new: true,
            runValidators: true,
          });

          res.status(200).json({
            success: true,
            data: updatedProduct,
            message: 'Update request has been processed and confirmed successfully',
          });
        }else if (existingImages.length === 2 && req.files.length === 1) {
          res.status(400).json({
            success:false,
            message : "Your product contains two Images, but you provided only one Image."
          })
        }else{
          res.status(400).json({
            success:false,
            message : "Your product contains one Image, but you provided two images."
          })
        }
      } else {
        const updatedProduct = await Product.findByIdAndUpdate(id, value, {
          new: true,
          runValidators: true,
        });

        res.status(200).json({
          success:true,
          data:updatedProduct,
          message: 'Update request has been processed and confirmed successfully',
        });
      }
    }

  } catch (error) {
    console.log(error);
    const errorMessage = error.message.replace(/\\|"/g, '');
      if (errorMessage.includes('E11000 duplicate key error')) {
        const fieldName = errorMessage.match(/index: (.+?) dup key/);
        const duplicateValue = errorMessage.match(/dup key: { (.+?) }/);

        return res.status(422).json({
          success:false,
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
      return res.status(400).json({
        success:false,
        message: 'Only Image uploads are allowed, no other Data are permitted' });
    }

    const foundProduct = await Product.findById(id);

    if (!foundProduct) {
      return res.status(404).json({ 
        success:false,
        message: 'Requested product not found' });
    }

    const foundImage = await Image.findOne({ product: id, _id: imageId });

    if (!foundImage) {
      return res.status(404).json({ 
        success:false,
        message: 'Image not found for the given product' });
    }

    const imagePath = path.join(process.cwd(), '/public/', foundImage.imagePath);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    } else {
      console.log("File does not exist at path:", imagePath);
    }

    await Image.findByIdAndDelete(foundImage._id);

    const newImages = [];
    const file = req.file;
    const filePath = 'uploads/' + file.filename;
    const newImage = new Image({ imagePath: filePath, product: id });
    await newImage.save();
    newImages.push(newImage.imagePath);

    const allImagesPaths = (await Image.find({ product: id })).map(image => image.imagePath);
    const value = { images: allImagesPaths };
    const updatedProduct = await Product.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      success:true,
      data:updatedProduct,
      message: 'Image update successful',
    });

  } catch (error) {
    console.error(error);

    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({
        success:false,
        message: 'Your ID is not valid. Please check it' });
    } 
    res.status(500).json({ 
      success:false,
      message: 'Internal server error' });
  }
};


//Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id, req.body);
    if (!product) {
      res.status(404).json({
        success:false,
        message: "Requested product not found" });
    }
    res.status(200).json({ 
      success:true,
      data:product,
      message: "Deletion successful: Your requested data has been removed.",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success:false,
      message: "Internal Server Error" });
  }
}
