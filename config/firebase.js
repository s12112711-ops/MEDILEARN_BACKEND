const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const keyPath = path.join(__dirname, "..", "serviceAccountKey.json");

if (!admin.apps.length) {
  if (fs.existsSync(keyPath)) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized");
  } else {
    console.warn(
      "serviceAccountKey.json not found — push notifications disabled. " +
      "Download it from Firebase Console > Project Settings > Service Accounts."
    );
  }
}

module.exports = admin;
