const mongoose = require("mongoose");


const userSchema = mongoose.Schema({
    username:{
        type: String, 
        unique: true, 
        required: true 
    },
    
    email: {
        type:String,
        require : true
    },

    password:{
        type: String,
        required: true
    },
  
},
{
    timestamps: true,
}
);

module.exports = mongoose.model('User', userSchema);