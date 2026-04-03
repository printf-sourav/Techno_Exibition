import Notification from "../models/Notification.js";

export const notifyUser = async ({
  userId,
  type,
  title,
  message,
  entityType,
  entityId
}) => {
  if (!userId || !title || !message) {
    return null;
  }

  try {
    return await Notification.create({
      userId,
      type,
      title,
      message,
      entityType,
      entityId
    });
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};
