const { Int32 } = require("mongodb");
const mongoose = require("mongoose");


const productschema = mongoose.Schema(
    {
        product_name:{
            type : String,
            require : [true, "Please enter name"],
            unique:true,
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

        price:{
            type : Number,
            require : true,
            min: [0, 'Price cannot be negative'],
        }, 
        
        image:{
            type: [String],
            require:false
        }
    },
    {
        timestamps : true
    }
)

const Product = mongoose.model('Product',productschema);
module.exports = Product;
