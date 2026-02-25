const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get audit logs with filtering
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      userId,
      action,
      entity,
      entityId,
      startDate,
      endDate,
      search
    } = req.query;

    const where = {};
    
    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = parseInt(entityId);
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit statistics
router.get('/stats', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

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
      recentLogs,
      timelineData
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } }
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } }
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true } }
        },
        orderBy: { timestamp: 'desc' },
        take: 20
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as count
        FROM AuditLog 
        WHERE timestamp >= ${startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE(timestamp)
        ORDER BY date DESC
        LIMIT 30
      `
    ]);

    // Get user details for top users
    const userIds = logsByUser.map(item => item.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, role: true }
    });

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const processedLogsByUser = logsByUser.map(item => ({
      userId: item.userId,
      user: userMap[item.userId] || { name: 'Unknown', email: 'Unknown', role: 'Unknown' },
      count: item._count.userId
    }));

    res.json({
      total: totalLogs,
      byAction: logsByAction.reduce((acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      }, {}),
      byEntity: logsByEntity.reduce((acc, item) => {
        acc[item.entity] = item._count.entity;
        return acc;
      }, {}),
      byUser: processedLogsByUser,
      recent: recentLogs,
      timeline: timelineData
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Get detailed audit log entry
router.get('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { name: true, email: true, role: true } }
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Export audit logs
router.get('/export/csv', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
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
      take: 10000 // Limit to prevent huge exports
    });

    // Convert to CSV
    const csvHeader = 'Timestamp,Action,Entity,Entity ID,User Name,User Email,User Role,IP Address,User Agent,Old Values,New Values\n';
    const csvRows = logs.map(log => [
      log.timestamp.toISOString(),
      log.action,
      log.entity,
      log.entityId || '',
      log.user?.name || '',
      log.user?.email || '',
      log.user?.role || '',
      log.ipAddress || '',
      (log.userAgent || '').replace(/,/g, ';'), // Replace commas in user agent
      (log.oldValues || '').replace(/,/g, ';'), // Replace commas in JSON
      (log.newValues || '').replace(/,/g, ';')  // Replace commas in JSON
    ].join(','));

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Get available filters
router.get('/filters/options', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const [actions, entities, users] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' }
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        select: { entity: true },
        orderBy: { entity: 'asc' }
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' }
      })
    ]);

    res.json({
      actions: actions.map(item => item.action),
      entities: entities.map(item => item.entity),
      users
    });
  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

module.exports = router;
