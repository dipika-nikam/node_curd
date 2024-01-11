const express = require("express");
const app = express()
const mongoose = require("mongoose")
const Product =  require("./models/productModel")

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.get("/", (req,res) =>{
    res.send("Hello Home get")
})

app.get("/get/products", async(req,res) =>{
    try {
        const product = await Product.find({});
        res.status(201).json(product);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

app.get("/get/products/:id", async(req,res) =>{
    try {
        const{id} = req.params;
        const product = await Product.findById(id);
        res.status(201).json(product);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

app.put("/update/products/:id", async(req,res) =>{
    try {
        const{id} = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body);
        if(!product){
            res.status(500).json({ error: "Can't find Id/ product" });
        }
        const updatedproduct = await Product.findById(id);
        res.status(201).json(updatedproduct);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

app.delete("/delete/products/:id", async(req,res) =>{
    try {
        const{id} = req.params;
        const product = await Product.findByIdAndDelete(id, req.body);
        if(!product){
            res.status(500).json({ error: "Can't find Id/ product" });
        }
        res.status(201).json(product);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
      }
})

app.post("/product", async (req, res) => {
    try {
      const product = await Product.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


mongoose.connect('mongodb+srv://dipikainfynno:FL6wIn87lN5pXTVr@cluster0.og2h1ju.mongodb.net/').then(()=>{
    console.log("connected to mongoDB");
    app.listen(3000, ()=>{
        console.log("server is running on 3000");
    })
    
}).catch((error) => {
    console.log(error)
})