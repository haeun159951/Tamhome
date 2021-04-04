const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  title: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  pic: {
    type: String,
    require: true,
  },
});

module.exports = mongoose.model("Room", roomSchema);
