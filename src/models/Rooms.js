const mongoose = require('mongoose')
const Schema = mongoose.Schema;


const Room = new Schema(
  {
    by: Schema.Types.Mixed,
    name: String,
    memberNames: [{ type: String }],
    memberPictures: [{ type: String }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Room', Room)
