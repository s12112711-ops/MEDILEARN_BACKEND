const mongoose = require("mongoose");

const userDeviceTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserDeviceToken", userDeviceTokenSchema);