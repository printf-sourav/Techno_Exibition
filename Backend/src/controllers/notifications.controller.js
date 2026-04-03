import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const ensureObjectId = (value, fieldName) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
};

export const createNotification = asyncHandler(async (req, res) => {
    const { userId, title, message, type, entityType, entityId } = req.body;

    if (!userId || !title || !message) {
        throw new ApiError(400, "userId, title and message are required");
    }

    ensureObjectId(userId, "userId");
    if (entityId) {
        ensureObjectId(entityId, "entityId");
    }

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && String(userId) !== String(req.user.id)) {
        throw new ApiError(403, "You can only create notifications for your own account");
    }

    const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        entityType,
        entityId
    });

    return res.status(201).json(new ApiResponse(201, notification, "Notification created"));
});

export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, notifications, "Notifications fetched"));
});

export const markRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    ensureObjectId(id, "notification id");

    const notification = await Notification.findById(id);
    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    const isAdmin = req.user.role === "admin";
    if (!isAdmin && String(notification.userId) !== String(req.user.id)) {
        throw new ApiError(403, "You are not allowed to modify this notification");
    }

    notification.isRead = true;
    await notification.save();

    return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});