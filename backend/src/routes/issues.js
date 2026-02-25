const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Unified: Create issues or feedback
router.post('/issues-feedback', authenticateToken, authorizeRoles('Citizen'), async (req, res) => {
  try {
    // Validate user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { type, title, description, category, priority, workerId } = req.body;
    console.log('Issues-Feedback submission:', { 
      userId: req.user.id, 
      type, 
      titleLength: title?.length || 0,
      descriptionLength: description?.length || 0,
      category, 
      priority, 
      hasWorkerId: !!workerId 
    });

    // Validate required fields
    if (!type || !title || !description || !category) {
      return res.status(400).json({ error: 'Type, title, description, and category are required' });
    }

    // Validate title and description are not empty strings
    if (title.trim().length === 0 || description.trim().length === 0) {
      return res.status(400).json({ error: 'Title and description cannot be empty' });
    }

    if (type === 'ISSUE') {
      // Create issue
      const validTypes = ['DISPUTE', 'SERVICE_ISSUE', 'TECHNICAL', 'ISSUE'];
      const validCategories = ['GENERAL', 'REPORT_REJECTED', 'WORKER_CONDUCT', 'SYSTEM_ERROR', 'OTHER', 'COLLECTION'];

      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid issue type' });
      }

      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      // Validate workerId if provided
      if (workerId) {
        const worker = await prisma.user.findUnique({
          where: { id: parseInt(workerId) },
        });
        if (!worker || worker.role !== 'Worker') {
          return res.status(400).json({ error: 'Invalid worker ID' });
        }
      }

      const issue = await prisma.issue.create({
        data: {
          type,
          title,
          description,
          category,
          priority: priority || 'MEDIUM',
          citizenId: req.user.id,
          workerId: workerId ? parseInt(workerId) : null,
        },
        include: {
          citizen: { select: { name: true, email: true } },
          worker: { select: { name: true, email: true } },
        },
      });
      console.log('Issue created:', issue);
      return res.status(201).json(issue);
    } else {
      // Create feedback
      const validTypes = ['COMPLAINT', 'SUGGESTION', 'ISSUE', 'COMPLIMENT', 'FEEDBACK'];
      const validCategories = ['GENERAL', 'SERVICE', 'WORKER', 'SYSTEM', 'OTHER', 'COLLECTION'];

      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid feedback type' });
      }

      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
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
      return res.status(201).json(feedback);
    }
  } catch (error) {
    console.error('Create issues-feedback error:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Citizen: Create issue/dispute
router.post('/', authenticateToken, authorizeRoles('Citizen'), async (req, res) => {
  try {
    const { type, title, description, category, priority, workerId } = req.body;
    console.log('Issue submission request:', { type, title, description, category, priority, workerId });

    if (!type || !title || !description || !category) {
      return res.status(400).json({ error: 'Type, title, description, and category are required' });
    }

    const validTypes = ['DISPUTE', 'SERVICE_ISSUE', 'TECHNICAL', 'ISSUE'];
    const validCategories = ['GENERAL', 'REPORT_REJECTED', 'WORKER_CONDUCT', 'SYSTEM_ERROR', 'OTHER', 'COLLECTION'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid issue type' });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }

    // Validate workerId if provided
    if (workerId) {
      const worker = await prisma.user.findUnique({
        where: { id: parseInt(workerId) },
      });
      if (!worker || worker.role !== 'Worker') {
        return res.status(400).json({ error: 'Invalid worker ID' });
      }
    }

    const issue = await prisma.issue.create({
      data: {
        type,
        title,
        description,
        category,
        priority: priority || 'MEDIUM',
        citizenId: req.user.id,
        workerId: workerId ? parseInt(workerId) : null,
      },
      include: {
        citizen: { select: { name: true, email: true } },
        worker: { select: { name: true, email: true } },
      },
    });
    console.log('Issue created:', issue);

    res.status(201).json(issue);
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Citizen: Get my issues
router.get('/my', authenticateToken, authorizeRoles('Citizen'), async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { citizenId: req.user.id },
      include: {
        garbageReport: { select: { id: true, status: true, createdAt: true } },
        worker: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(issues);
  } catch (error) {
    console.error('Get my issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Admin: Get all issues
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, category, priority, type } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    if (type) where.type = type;

    const issues = await prisma.issue.findMany({
      where,
      include: {
        citizen: { select: { name: true, email: true } },
        worker: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(issues);
  } catch (error) {
    console.error('Get all issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Admin: Get all issues and feedback unified
router.get('/issues-feedback/admin', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { status, type, category, priority, limit = 50, offset = 0 } = req.query;
    console.log('Admin fetching issues-feedback:', { status, type, category, priority, limit, offset });

    // Fetch both feedback and issues
    const [feedbackResponse, issuesResponse] = await Promise.all([
      prisma.feedback.findMany({
        where: {
          ...(status && { status }),
          ...(type && { type }),
          ...(category && { category }),
          ...(priority && { priority })
        },
        include: {
          citizen: { select: { name: true, email: true } },
          admin: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      }),
      prisma.issue.findMany({
        where: {
          ...(status && { status }),
          ...(type && { type }),
          ...(category && { category }),
          ...(priority && { priority })
        },
        include: {
          citizen: { select: { name: true, email: true } },
          worker: { select: { name: true, email: true } },
          admin: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      })
    ]);

    // Combine and add source tracking with replied field
    const combined = [
      ...feedbackResponse.map(item => ({ 
        ...item, 
        source: 'feedback',
        replied: item.adminReply ? true : false // Add replied field based on adminReply presence
      })),
      ...issuesResponse.map(item => ({ 
        ...item, 
        source: 'issue',
        replied: item.resolution ? true : false // Add replied field based on resolution presence
      }))
    ];

    // Sort by date (newest first)
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const total = combined.length;
    const paginatedResults = combined.slice(offset, offset + parseInt(limit));

    console.log(`Returning ${paginatedResults.length} issues-feedback items (total: ${total})`);

    res.json({
      items: paginatedResults,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get admin issues-feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch issues and feedback' });
  }
});

// Admin: Get unified stats for feedback and issues
router.get('/issues-feedback/stats', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    console.log('Fetching unified issues-feedback stats');

    // Get counts for both feedback and issues
    const [
      feedbackStats,
      issuesStats,
    ] = await Promise.all([
      // Feedback stats
      Promise.all([
        prisma.feedback.count(),
        prisma.feedback.count({ where: { status: 'OPEN' } }),
        prisma.feedback.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.feedback.count({ where: { status: 'RESOLVED' } }),
        prisma.feedback.count({ where: { status: 'REJECTED' } }),
      ]),
      // Issues stats (map PENDING to OPEN for consistency)
      Promise.all([
        prisma.issue.count(),
        prisma.issue.count({ where: { status: 'PENDING' } }), // Map PENDING to OPEN
        prisma.issue.count({ where: { status: 'IN_REVIEW' } }), // Map IN_REVIEW to IN_PROGRESS
        prisma.issue.count({ where: { status: 'RESOLVED' } }),
        prisma.issue.count({ where: { status: 'REJECTED' } }),
      ])
    ]);

    const [
      feedbackTotal, feedbackOpen, feedbackInProgress, feedbackResolved, feedbackRejected
    ] = feedbackStats;

    const [
      issuesTotal, issuesPending, issuesInReview, issuesResolved, issuesRejected
    ] = issuesStats;

    // Combine stats (map issue statuses to match feedback statuses)
    const total = feedbackTotal + issuesTotal;
    const open = feedbackOpen + issuesPending; // PENDING issues = OPEN
    const inProgress = feedbackInProgress + issuesInReview; // IN_REVIEW issues = IN_PROGRESS
    const resolved = feedbackResolved + issuesResolved;
    const rejected = feedbackRejected + issuesRejected;

    const stats = {
      total,
      byStatus: {
        open: open,
        inProgress: inProgress,
        resolved: resolved,
        rejected: rejected,
      }
    };

    console.log('Unified stats result:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Get unified issues-feedback stats error:', error);
    res.status(500).json({ error: 'Failed to fetch unified statistics' });
  }
});

// Admin: Update issue status and add resolution
router.put('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, workerId } = req.body;

    console.log('PUT /:id - Update issue request:', {
      paramsId: id,
      parsedId: parseInt(id),
      status,
      hasResolution: !!resolution,
      hasWorkerId: !!workerId,
      userId: req.user?.id
    });

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if issue already has a reply
    const existingIssue = await prisma.issue.findUnique({
      where: { id: parseInt(id) },
      select: { replied: true, resolution: true, workerId: true, status: true }
    });

    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Prevent multiple replies
    if (existingIssue.replied && resolution && existingIssue.resolution) {
      return res.status(400).json({ error: 'This issue has already been replied to' });
    }

    console.log('About to update issue with ID:', parseInt(id));

    const oldWorkerId = existingIssue.workerId;
    const newWorkerId = workerId ? parseInt(workerId) : null;
    const statusChanged = existingIssue.status !== status;

    const issue = await prisma.issue.update({
      where: { id: parseInt(id) },
      data: {
        status,
        resolution,
        workerId: newWorkerId,
        adminId: req.user.id,
        replied: resolution ? true : existingIssue.replied, // Set replied=true when adding resolution
      },
      include: {
        citizen: { select: { name: true, email: true } },
        worker: { select: { name: true, email: true } },
        admin: { select: { name: true, email: true } },
      },
    });

    // Update worker workloads if assignment changed
    if (oldWorkerId !== newWorkerId) {
      console.log('Worker assignment changed:', { oldWorkerId, newWorkerId });

      // Decrement old worker's workload (if they were assigned and issue is still active)
      if (oldWorkerId && !['RESOLVED', 'REJECTED'].includes(status)) {
        await prisma.worker.update({
          where: { userId: oldWorkerId },
          data: { currentWorkload: { decrement: 1 } }
        });
        console.log('Decremented workload for worker:', oldWorkerId);
      }

      // Increment new worker's workload (if assigned and issue is active)
      if (newWorkerId && !['RESOLVED', 'REJECTED'].includes(status)) {
        await prisma.worker.update({
          where: { userId: newWorkerId },
          data: { currentWorkload: { increment: 1 } }
        });
        console.log('Incremented workload for worker:', newWorkerId);
      }
    }

    // Handle status changes that affect workload
    if (statusChanged && oldWorkerId === newWorkerId && newWorkerId) {
      const oldStatusActive = !['RESOLVED', 'REJECTED'].includes(existingIssue.status || '');
      const newStatusActive = !['RESOLVED', 'REJECTED'].includes(status);

      if (oldStatusActive && !newStatusActive) {
        // Issue was active, now resolved/rejected - decrement workload
        await prisma.worker.update({
          where: { userId: newWorkerId },
          data: { currentWorkload: { decrement: 1 } }
        });
        console.log('Decremented workload due to status change for worker:', newWorkerId);
      } else if (!oldStatusActive && newStatusActive) {
        // Issue was resolved/rejected, now active - increment workload
        await prisma.worker.update({
          where: { userId: newWorkerId },
          data: { currentWorkload: { increment: 1 } }
        });
        console.log('Incremented workload due to status change for worker:', newWorkerId);
      }
    }

    console.log('Issue update successful:', {
      id: issue.id,
      status: issue.status,
      hasResolution: !!issue.resolution,
      workerId: issue.workerId,
      replied: issue.replied
    });

    res.json(issue);
  } catch (error) {
    console.error('Update issue error:', {
      error: error.message,
      code: error.code,
      paramsId: req.params.id,
      userId: req.user?.id
    });
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Admin: Get issue statistics
router.get('/stats', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const [
      totalIssues,
      pendingIssues,
      inReviewIssues,
      resolvedIssues,
      rejectedIssues,
      issuesByType,
      issuesByCategory,
      issuesByPriority,
    ] = await Promise.all([
      prisma.issue.count(),
      prisma.issue.count({ where: { status: 'PENDING' } }),
      prisma.issue.count({ where: { status: 'IN_REVIEW' } }),
      prisma.issue.count({ where: { status: 'RESOLVED' } }),
      prisma.issue.count({ where: { status: 'REJECTED' } }),
      prisma.issue.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.issue.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      prisma.issue.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
    ]);

    res.json({
      total: totalIssues,
      byStatus: {
        pending: pendingIssues,
        inReview: inReviewIssues,
        resolved: resolvedIssues,
        rejected: rejectedIssues,
      },
      byType: issuesByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      byCategory: issuesByCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category;
        return acc;
      }, {}),
      byPriority: issuesByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get issue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch issue statistics' });
  }
});

module.exports = router;
