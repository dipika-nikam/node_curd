const express = require("express");
const app = express()
const mongoose = require("mongoose")
const Product =  require("../models/productModel")
const Joi = require('joi');


app.use(express.json())
app.use(express.urlencoded({extended: false}))


app.use((req, res) => {
  console.log(res);
  res.status(404).send('404 - Not Found');
});


//Home page API
app.get("/", (req,res) =>{
    res.send("Hello Home get")
})

//validate request body
const productSchema = Joi.object({
  name: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  price: Joi.number().min(1).required(),
  image: Joi.string().uri(),
});

//Create products
exports.createProduct = async (req, res) => {
  try {
    const { error, value } = productSchema.validate(req.body);
    if (error) {
      return res.status(422).json({ message: error.message });
    }
    const product = await Product.create(value);
    res.status(201).json({message:"Product Created", data:product});
  } catch (error) {
    console.error(error._message);
    res.status(422).json({ message: error.message });
  }
}


//Get all products
exports.getAllProducts = async(req,res) =>{
    try {
        const product = await Product.find({});
        res.status(200).json(product);
      } catch (error) {
        console.error(error);
        res.status(404).json({ error: "Requested id not Data" });
      }
}

//Get Product by id
exports.getProductById = async(req,res) =>{
    try {
        const{id} = req.params;
        const product = await Product.findById(id);
        res.status(200).json(product);
      } catch (error) {
        console.error(error);
        res.status(404).json({ error: "Requested id not found" });
      }
}

const updateProductSchema = Joi.object({
  name: Joi.string(),
  quantity: Joi.number().integer().min(1),
  price: Joi.number().min(1),
  image: Joi.string().uri(),
});

//Update product by id
exports.updateProduct =  async(req,res) =>{
    try {
        const { error, value } = updateProductSchema.validate(req.body);
        if (error) {
          return res.status(422).json({ message: error.message });
        }  
        const{id} = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body);
        if(!product){
            res.status(404).json({ error: "Requested id of product not found" });
        }
        const updatedproduct = await Product.findById(id);
        res.status(201).json({message:"Requested updated successfully",updatedproduct});
      } catch (error) {
        console.error(error);
        res.status(422).json({ message: error.message });
      }
}

//Delete product
exports.deleteProduct = async(req,res) =>{
    try {
        const{id} = req.params;
        const product = await Product.findByIdAndDelete(id, req.body);
        if(!product){
            res.status(404).json({ error: "Requested id of product not found" });
        }
        res.status(200).json({message:"Requested deleted successfully",product});
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
}
