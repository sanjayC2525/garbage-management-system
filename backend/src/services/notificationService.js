const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NotificationService {
  static async createNotification(userId, title, message, type = 'INFO', category = 'SYSTEM', relatedId = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          category,
          relatedId,
        },
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  static async createBulkNotifications(notifications) {
    try {
      const createdNotifications = await prisma.notification.createMany({
        data: notifications,
      });

      return createdNotifications;
    } catch (error) {
      console.error('Failed to create bulk notifications:', error);
      return null;
    }
  }

  static async getUserNotifications(userId, options = {}) {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    try {
      const where = { userId };
      if (unreadOnly) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return [];
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId,
        },
        data: { isRead: true },
      });

      return notification.count > 0;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  static async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });

      return result.count;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return 0;
    }
  }

  static async getUnreadCount(userId) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return count;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId,
        },
      });

      return result.count > 0;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  // Specific notification creators for different events
  static async notifyReportStatusChange(citizenId, reportId, oldStatus, newStatus) {
    const title = 'Report Status Updated';
    const message = `Your garbage report #${reportId} status changed from ${oldStatus} to ${newStatus}`;
    
    return this.createNotification(citizenId, title, message, 'INFO', 'REPORT', reportId);
  }

  static async notifyTaskAssigned(workerId, taskId, reportId) {
    const title = 'New Task Assigned';
    const message = `You have been assigned a new task #${taskId} for garbage report #${reportId}`;
    
    return this.createNotification(workerId, title, message, 'INFO', 'TASK', taskId);
  }

  static async notifyFeedbackSubmitted(adminIds, feedbackId, citizenName) {
    const notifications = adminIds.map(adminId => ({
      userId: adminId,
      title: 'New Feedback Submitted',
      message: `${citizenName} submitted new feedback #${feedbackId}`,
      type: 'INFO',
      category: 'FEEDBACK',
      relatedId: feedbackId,
    }));

    return this.createBulkNotifications(notifications);
  }

  static async notifyIssueSubmitted(adminIds, issueId, citizenName) {
    const notifications = adminIds.map(adminId => ({
      userId: adminId,
      title: 'New Issue Reported',
      message: `${citizenName} reported a new issue #${issueId}`,
      type: 'WARNING',
      category: 'ISSUE',
      relatedId: issueId,
    }));

    return this.createBulkNotifications(notifications);
  }

  static async notifyTaskCompleted(citizenId, taskId, workerName) {
    const title = 'Task Completed';
    const message = `Your garbage report task has been completed by ${workerName}`;
    
    return this.createNotification(citizenId, title, message, 'SUCCESS', 'TASK', taskId);
  }

  static async notifyFeedbackStatusChange(citizenId, feedbackId, status) {
    const title = 'Feedback Status Updated';
    const message = `Your feedback #${feedbackId} status has been updated to ${status}`;
    
    return this.createNotification(citizenId, title, message, 'INFO', 'FEEDBACK', feedbackId);
  }

  static async notifyIssueStatusChange(citizenId, issueId, status) {
    const title = 'Issue Status Updated';
    const message = `Your issue #${issueId} status has been updated to ${status}`;
    
    return this.createNotification(citizenId, title, message, 'INFO', 'ISSUE', issueId);
  }

  static async notifyWorkerUnable(adminIds, taskId, workerName, reason) {
    const notifications = adminIds.map(adminId => ({
      userId: adminId,
      title: 'Worker Unable to Complete Task',
      message: `${workerName} marked task #${taskId} as unable to complete. Reason: ${reason}`,
      type: 'WARNING',
      category: 'TASK',
      relatedId: taskId,
    }));

    return this.createBulkNotifications(notifications);
  }
}

module.exports = NotificationService;
