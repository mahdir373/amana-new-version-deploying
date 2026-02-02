const Notification = require('../models/notification.model');
const DailyLog = require('../models/dailyLog.model');
const User = require('../models/user.model');

// Get notifications for the current user
exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .populate('relatedLog', 'date project')
      .populate('relatedProject', 'name');
    
    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving notifications'
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }
    
    // Check if user is authorized (must be the recipient)
    if (notification.recipient.toString() !== req.userId) {
      return res.status(403).json({
        message: 'You are not authorized to mark this notification as read'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    return res.status(200).json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while marking notification as read'
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );
    
    return res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while marking all notifications as read'
    });
  }
};

// Create a notification for missing logs (used by scheduled job)
exports.createMissingLogNotifications = async () => {
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    // Get all team leaders
    const teamLeaders = await User.find({ role: 'Team Leader' });
    
    // Check each team leader for missing logs
    for (const teamLeader of teamLeaders) {
      // Check if log exists for yesterday
      const log = await DailyLog.findOne({
        teamLeader: teamLeader._id,
        date: {
          $gte: yesterday,
          $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      // If no log exists, create a notification
      if (!log) {
        const notification = new Notification({
          recipient: teamLeader._id,
          type: 'missing_log',
          message: `You have not submitted a daily log for ${yesterday.toLocaleDateString()}`,
          createdAt: Date.now()
        });
        
        await notification.save();
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating missing log notifications:', error);
    return false;
  }
};

// Create a notification for incomplete logs (used by scheduled job)
exports.createIncompleteLogNotifications = async () => {
  try {
    // Get all draft logs that are older than 24 hours
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1);
    
    const incompleteLogs = await DailyLog.find({
      status: 'draft',
      createdAt: { $lt: cutoffDate }
    }).populate('teamLeader', '_id');
    
    // Create notifications for each incomplete log
    for (const log of incompleteLogs) {
      const notification = new Notification({
        recipient: log.teamLeader._id,
        type: 'incomplete_log',
        message: `You have an incomplete daily log for ${new Date(log.date).toLocaleDateString()} that needs to be submitted`,
        relatedLog: log._id,
        relatedProject: log.project,
        createdAt: Date.now()
      });
      
      await notification.save();
    }
    
    return true;
  } catch (error) {
    console.error('Error creating incomplete log notifications:', error);
    return false;
  }
};

// Create a notification when a log is approved (called from log controller)
exports.createLogApprovedNotification = async (logId) => {
  try {
    const log = await DailyLog.findById(logId)
      .populate('teamLeader', '_id')
      .populate('project', 'name');
    
    if (!log) {
      return false;
    }
    
    const notification = new Notification({
      recipient: log.teamLeader._id,
      type: 'log_approved',
      message: `Your daily log for ${new Date(log.date).toLocaleDateString()} at ${log.project.name} has been approved`,
      relatedLog: log._id,
      relatedProject: log.project._id,
      createdAt: Date.now()
    });
    
    await notification.save();
    return true;
  } catch (error) {
    console.error('Error creating log approved notification:', error);
    return false;
  }
};

// Create a notification for duplicate log warning (called from log controller)
exports.createDuplicateWarningNotification = async (teamLeaderId, date, projectId) => {
  try {
    const notification = new Notification({
      recipient: teamLeaderId,
      type: 'duplicate_warning',
      message: `You attempted to create a duplicate log for ${new Date(date).toLocaleDateString()}. Please edit your existing log instead.`,
      relatedProject: projectId,
      createdAt: Date.now()
    });
    
    await notification.save();
    return true;
  } catch (error) {
    console.error('Error creating duplicate warning notification:', error);
    return false;
  }
};
