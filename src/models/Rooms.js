const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const Room = new Schema(
  {
    by: Schema.Types.Mixed,
    name: String,
    picture: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', Room)
