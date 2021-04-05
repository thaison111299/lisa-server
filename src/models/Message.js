const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const Message = new Schema(
  {
    by: Schema.Types.Mixed,
    text: String,
    roomName: String
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', Message);
