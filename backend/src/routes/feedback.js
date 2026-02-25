const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Admin: Get all feedback with filters
router.get('/admin/all', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, type, category, priority, limit = 50, offset = 0 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          citizen: { select: { name: true, email: true } },
          admin: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.feedback.count({ where })
    ]);

    res.json({
      feedback,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get admin feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Admin: Update feedback status and add admin reply
router.patch('/admin/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminReply, adminNotes } = req.body;

    console.log('PATCH /admin/:id - Update feedback request:', {
      paramsId: id,
      parsedId: parseInt(id),
      status,
      hasAdminReply: !!adminReply,
      hasAdminNotes: !!adminNotes,
      userId: req.user?.id
    });

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if feedback already has a reply
    const existingFeedback = await prisma.feedback.findUnique({
      where: { id: parseInt(id) },
      select: { replied: true, adminReply: true }
    });

    if (!existingFeedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Prevent multiple replies
    if (existingFeedback.replied && adminReply && existingFeedback.adminReply) {
      return res.status(400).json({ error: 'This feedback has already been replied to' });
    }

    console.log('About to update feedback with ID:', parseInt(id));

    const feedback = await prisma.feedback.update({
      where: { id: parseInt(id) },
      data: {
        status,
        adminReply,
        adminNotes,
        adminId: req.user.id,
        replied: adminReply ? true : existingFeedback.replied, // Set replied=true when adding reply
        updatedAt: new Date(),
      },
      include: {
        citizen: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } }
      },
    });

    console.log('Feedback update successful:', {
      id: feedback.id,
      status: feedback.status,
      hasAdminReply: !!feedback.adminReply,
      hasAdminNotes: !!feedback.adminNotes,
      replied: feedback.replied
    });

    res.json(feedback);
  } catch (error) {
    console.error('Update feedback error:', {
      error: error.message,
      code: error.code,
      paramsId: req.params.id,
      userId: req.user?.id
    });
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Admin: Get feedback statistics
router.get('/admin/stats', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const [
      totalFeedback,
      feedbackByStatus,
      feedbackByType,
      feedbackByCategory,
      feedbackByPriority,
      recentFeedback
    ] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.feedback.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.feedback.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      prisma.feedback.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      prisma.feedback.findMany({
        include: {
          citizen: { select: { name: true } },
          admin: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      total: totalFeedback,
      byStatus: feedbackByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {}),
      byType: feedbackByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      byCategory: feedbackByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {}),
      byPriority: feedbackByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {}),
      recent: recentFeedback,
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback statistics' });
  }
});
router.post('/', authenticateToken, authorizeRoles('Citizen'), async (req, res) => {
  try {
    const { type, title, description, category, priority } = req.body;
    console.log('Feedback submission request:', { type, title, description, category, priority });

    if (!type || !title || !description || !category) {
      return res.status(400).json({ error: 'Type, title, description, and category are required' });
    }

    const validTypes = ['COMPLAINT', 'SUGGESTION', 'ISSUE', 'COMPLIMENT', 'FEEDBACK'];
    const validCategories = ['GENERAL', 'SERVICE', 'WORKER', 'SYSTEM', 'OTHER', 'COLLECTION'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid feedback type' });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        type,
        title,
        description,
        category,
        priority: priority || 'MEDIUM',
        citizenId: req.user.id,
      },
      include: {
        citizen: { select: { name: true, email: true } },
      },
    });
    console.log('Feedback created:', feedback);

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

// Citizen: Get my feedback
router.get('/my', authenticateToken, authorizeRoles('Citizen'), async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      where: { citizenId: req.user.id },
      include: {
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedback);
  } catch (error) {
    console.error('Get my feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Admin: Get all feedback
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const feedback = await prisma.feedback.findMany({
      where,
      include: {
        citizen: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(feedback);
  } catch (error) {
    console.error('Get all feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// Admin: Update feedback status and add notes
router.put('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const feedback = await prisma.feedback.update({
      where: { id: parseInt(id) },
      data: {
        status,
        adminNotes,
        adminId: req.user.id,
      },
      include: {
        citizen: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } }
      },
    });

    res.json(feedback);
  } catch (error) {
    console.error('Update feedback error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

module.exports = router;
