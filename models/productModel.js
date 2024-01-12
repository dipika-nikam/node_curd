const mongoose = require("mongoose");


const productschema = mongoose.Schema(
    {
        name:{
            type : String,
            require : [true, "Please enter name"]
        },

        quantity:{
            type:Number,
            default: 0,
            min: [0, 'Quantity cannot be negative'],
        },

        price:{
            type : Number,
            require : true,
            min: [0, 'Price cannot be negative'],
        }, 
        
        image:{
            type: String,
            require:false
        }
    },
    {
        timestamps : true
    }
)

const Product = mongoose.model('Product',productschema);
module.exports = Product;
