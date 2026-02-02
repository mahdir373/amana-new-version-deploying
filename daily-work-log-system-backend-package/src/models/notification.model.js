const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required'],
      index: true
    },
    type: {
      type: String,
      enum: ['missing_log', 'incomplete_log', 'log_approved', 'duplicate_warning', 'system'],
      required: [true, 'Notification type is required']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    relatedLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DailyLog'
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  }
);

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;
