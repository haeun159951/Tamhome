const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true
    },
    roomId:{
        type: String,
        required: true
    },
    checkIn:{
        type:Date,
        required:true,
    },
    checkOut:{
        type:Date,
        required:true,
    },
    total:{
        type:Number,
        required:true
    }
});


module.exports = new mongoose.model("Book", bookSchema);