const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuditService {
  static async logAction(action, entity, entityId, userId, oldValues = null, newValues = null, req = null) {
    try {
      const auditData = {
        action,
        entity,
        entityId,
        userId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        userAgent: req?.get('User-Agent'),
        ipAddress: req?.ip || req?.connection?.remoteAddress,
      };

      const auditLog = await prisma.auditLog.create({
        data: auditData,
        include: {
          user: { select: { name: true, email: true, role: true } }
        }
      });

      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
  }

  static async getAuditLogs(options = {}) {
    const { 
      limit = 100, 
      offset = 0, 
      userId, 
      action, 
      entity, 
      entityId,
      startDate,
      endDate 
    } = options;

    try {
      const where = {};
      if (userId) where.userId = userId;
      if (action) where.action = action;
      if (entity) where.entity = entity;
      if (entityId) where.entityId = entityId;
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      });

      return logs;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  static async getAuditStats(options = {}) {
    const { startDate, endDate } = options;

    try {
      const where = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const [
        totalLogs,
        logsByAction,
        logsByEntity,
        logsByUser,
        recentLogs
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true },
        }),
        prisma.auditLog.groupBy({
          by: ['entity'],
          where,
          _count: { entity: true },
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where,
          _count: { userId: true },
          include: {
            user: { select: { name: true, email: true } }
          }
        }),
        prisma.auditLog.findMany({
          where,
          include: {
            user: { select: { name: true, email: true, role: true } }
          },
          orderBy: { timestamp: 'desc' },
          take: 10,
        })
      ]);

      return {
        total: totalLogs,
        byAction: logsByAction.reduce((acc, item) => {
          acc[item.action] = item._count.action;
          return acc;
        }, {}),
        byEntity: logsByEntity.reduce((acc, item) => {
          acc[item.entity] = item._count.entity;
          return acc;
        }, {}),
        byUser: logsByUser.map(item => ({
          userId: item.userId,
          name: item.user?.name || 'Unknown',
          email: item.user?.email || 'Unknown',
          count: item._count.userId
        })),
        recent: recentLogs
      };
    } catch (error) {
      console.error('Failed to fetch audit stats:', error);
      return {
        total: 0,
        byAction: {},
        byEntity: {},
        byUser: [],
        recent: []
      };
    }
  }

  // Specific audit logging methods
  static async logUserAction(action, userId, targetUserId = null, oldValues = null, newValues = null, req = null) {
    return this.logAction(action, 'USER', targetUserId, userId, oldValues, newValues, req);
  }

  static async logReportAction(action, reportId, userId, oldValues = null, newValues = null, req = null) {
    return this.logAction(action, 'REPORT', reportId, userId, oldValues, newValues, req);
  }

  static async logTaskAction(action, taskId, userId, oldValues = null, newValues = null, req = null) {
    return this.logAction(action, 'TASK', taskId, userId, oldValues, newValues, req);
  }

  static async logFeedbackAction(action, feedbackId, userId, oldValues = null, newValues = null, req = null) {
    return this.logAction(action, 'FEEDBACK', feedbackId, userId, oldValues, newValues, req);
  }

  static async logIssueAction(action, issueId, userId, oldValues = null, newValues = null, req = null) {
    return this.logAction(action, 'ISSUE', issueId, userId, oldValues, newValues, req);
  }

  static async logAuthAction(action, userId, req = null) {
    return this.logAction(action, 'AUTH', null, userId, null, null, req);
  }

  static async logSystemAction(action, userId, details = null, req = null) {
    return this.logAction(action, 'SYSTEM', null, userId, null, details, req);
  }

  // Middleware for automatic logging
  static auditMiddleware(entity) {
    return async (req, res, next) => {
      if (!req.user) {
        return next();
      }

      // Store original methods
      const originalSend = res.send;
      const originalJson = res.json;

      let responseData = null;

      res.send = function(data) {
        responseData = data;
        return originalSend.call(this, data);
      };

      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      res.on('finish', async () => {
        try {
          const method = req.method.toLowerCase();
          const entityId = req.params.id || (responseData?.id || null);
          
          let action;
          switch (method) {
            case 'post':
              action = 'CREATE';
              break;
            case 'put':
            case 'patch':
              action = 'UPDATE';
              break;
            case 'delete':
              action = 'DELETE';
              break;
            default:
              return;
          }

          if (action && entityId) {
            await AuditService.logAction(action, entity, entityId, req.user.id, null, responseData, req);
          }
        } catch (error) {
          console.error('Audit middleware error:', error);
        }
      });

      next();
    };
  }
}

module.exports = AuditService;
