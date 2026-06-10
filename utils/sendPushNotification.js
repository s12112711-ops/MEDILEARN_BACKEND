const admin = require("../config/firebaseAdmin");
const UserDeviceToken = require("../models/UserDeviceToken");

function shortenText(text, maxLength = 90) {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function buildNotificationTitle({ doctorName, category, priority }) {
  if (priority === "high" || category === "urgent") {
    return "Urgent Medical Announcement";
  }

  if (doctorName && doctorName.trim()) {
    return `${doctorName.trim()} posted an update`;
  }

  return "New Medical Announcement";
}

async function sendPushNotificationToStudents({
  title,
  body,
  data = {},
  doctorName = "",
  category = "general",
  priority = "normal",
}) {
  try {
    const tokensDocs = await UserDeviceToken.find({
      fcmToken: { $exists: true, $ne: "" },
    });

    const tokens = tokensDocs.map((doc) => doc.fcmToken).filter(Boolean);

    if (!tokens.length) {
      console.log("No device tokens found for push notification.");
      return;
    }

    const notificationTitle = buildNotificationTitle({
      doctorName,
      category,
      priority,
    });

    const notificationBody = shortenText(body, 90);

    const message = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        screen: "notifications",
        originalTitle: String(title || ""),
        originalBody: String(body || ""),
        doctorName: String(doctorName || ""),
        category: String(category || "general"),
        priority: String(priority || "normal"),
        type: "announcement",
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, String(value)])
        ),
      },
      tokens,
      android: {
        priority: "high",
        notification: {
          channelId: "medilearn_channel",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("Push notification sent.");
    console.log("Success count:", response.successCount);
    console.log("Failure count:", response.failureCount);

    if (response.failureCount > 0) {
      const failedTokens = [];

      response.responses.forEach((resp, index) => {
        if (!resp.success) {
          console.error(
            `Failed token ${tokens[index]}:`,
            resp.error?.message || resp.error
          );
          failedTokens.push(tokens[index]);
        }
      });

      if (failedTokens.length > 0) {
        await UserDeviceToken.deleteMany({
          fcmToken: { $in: failedTokens },
        });
        console.log("Removed invalid tokens from database.");
      }
    }
  } catch (error) {
    console.error("Send push notification error:", error);
  }
}

module.exports = sendPushNotificationToStudents;