const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get comprehensive analytics data
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // Default to last 30 days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

    const [
      totalReports,
      reportsByStatus,
      reportsByTime,
      totalTasks,
      tasksByStatus,
      tasksByTime,
      totalFeedback,
      feedbackByStatus,
      feedbackByTime,
      totalIssues,
      issuesByStatus,
      issuesByTime,
      workerStats,
      proofStats,
      recentActivity,
      systemHealth
    ] = await Promise.all([
      // Reports analytics
      prisma.garbageReport.count({
        where: { createdAt: { gte: daysAgo } }
      }),
      prisma.garbageReport.groupBy({
        by: ['status'],
        where: { createdAt: { gte: daysAgo } },
        _count: { status: true }
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM GarbageReport 
        WHERE createdAt >= ${daysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,

      // Tasks analytics
      prisma.task.count({
        where: { createdAt: { gte: daysAgo } }
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { createdAt: { gte: daysAgo } },
        _count: { status: true }
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM Task 
        WHERE createdAt >= ${daysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,

      // Feedback analytics
      prisma.feedback.count({
        where: { createdAt: { gte: daysAgo } }
      }),
      prisma.feedback.groupBy({
        by: ['status'],
        where: { createdAt: { gte: daysAgo } },
        _count: { status: true }
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM Feedback 
        WHERE createdAt >= ${daysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,

      // Issues analytics
      prisma.issue.count({
        where: { createdAt: { gte: daysAgo } }
      }),
      prisma.issue.groupBy({
        by: ['status'],
        where: { createdAt: { gte: daysAgo } },
        _count: { status: true }
      }),
      prisma.$queryRaw`
        SELECT 
          DATE(createdAt) as date,
          COUNT(*) as count
        FROM Issue 
        WHERE createdAt >= ${daysAgo}
        GROUP BY DATE(createdAt)
        ORDER BY date DESC
        LIMIT 30
      `,

      // Worker performance
      prisma.worker.findMany({
        include: {
          user: { select: { name: true, email: true } },
          tasks: {
            where: { createdAt: { gte: daysAgo } },
            select: { status: true, completedAt: true, unableReason: true }
          }
        }
      }),

      // Proof compliance
      Promise.all([
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({ 
          where: { 
            status: 'COMPLETED',
            proofImage: { not: null }
          } 
        })
      ]),

      // Recent activity
      prisma.$queryRaw`
        SELECT 
          'Report' as type,
          id,
          status,
          createdAt,
          NULL as workerName
        FROM GarbageReport 
        WHERE createdAt >= ${daysAgo.toISOString()}
        UNION ALL
        SELECT 
          'Task' as type,
          id,
          status,
          createdAt,
          (SELECT name FROM User WHERE id = Task.workerId) as workerName
        FROM Task 
        WHERE createdAt >= ${daysAgo.toISOString()}
        UNION ALL
        SELECT 
          'Feedback' as type,
          id,
          status,
          createdAt,
          NULL as workerName
        FROM Feedback 
        WHERE createdAt >= ${daysAgo.toISOString()}
        ORDER BY createdAt DESC
        LIMIT 10
      `,

      // System health metrics
      Promise.all([
        prisma.user.count({ where: { role: 'Citizen' } }),
        prisma.user.count({ where: { role: 'Worker' } }),
        prisma.user.count({ where: { role: 'Admin' } }),
        prisma.task.count({ where: { status: 'ASSIGNED' } }),
        prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
      ])
    ]);

    // Process worker stats
    const processedWorkerStats = workerStats.map(worker => {
      const workerTasks = worker.tasks;
      const completed = workerTasks.filter(t => t.status === 'COMPLETED').length;
      const unable = workerTasks.filter(t => t.status === 'UNABLE').length;
      const inProgress = workerTasks.filter(t => t.status === 'IN_PROGRESS').length;
      const assigned = workerTasks.filter(t => t.status === 'ASSIGNED').length;
      const accepted = workerTasks.filter(t => t.status === 'ACCEPTED').length;

      const efficiency = workerTasks.length > 0 ? (completed / workerTasks.length * 100) : 0;
      const avgCompletionTime = completed > 0 
        ? workerTasks
            .filter(t => t.completedAt)
            .reduce((acc, t) => {
              const time = new Date(t.completedAt) - new Date(t.createdAt);
              return acc + time;
            }, 0) / completed / (1000 * 60 * 60) // Convert to hours
        : 0;

      return {
        id: worker.id,
        name: worker.user.name,
        email: worker.user.email,
        totalTasks: workerTasks.length,
        completed,
        unable,
        inProgress,
        assigned,
        accepted,
        efficiency: efficiency.toFixed(1),
        avgCompletionTime: avgCompletionTime.toFixed(1)
      };
    });

    // Process proof stats
    const [totalCompleted, withProof] = proofStats;
    const proofComplianceRate = totalCompleted > 0 ? (withProof / totalCompleted * 100) : 0;

    // Process system health
    const [citizens, workers, admins, assignedTasks, inProgressTasks] = systemHealth;

    res.json({
      timeframe: parseInt(timeframe),
      reports: {
        total: totalReports,
        byStatus: reportsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        byTime: reportsByTime
      },
      tasks: {
        total: totalTasks,
        byStatus: tasksByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        byTime: tasksByTime
      },
      feedback: {
        total: totalFeedback,
        byStatus: feedbackByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        byTime: feedbackByTime
      },
      issues: {
        total: totalIssues,
        byStatus: issuesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        byTime: issuesByTime
      },
      workers: processedWorkerStats.sort((a, b) => b.completed - a.completed),
      proof: {
        totalCompleted,
        withProof,
        complianceRate: proofComplianceRate.toFixed(1)
      },
      recentActivity,
      systemHealth: {
        totalUsers: citizens + workers + admins,
        citizens,
        workers,
        admins,
        assignedTasks,
        inProgressTasks
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get KPI summary
router.get('/kpi', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayReports,
      weekReports,
      monthReports,
      todayTasks,
      weekTasks,
      monthTasks,
      pendingFeedback,
      pendingIssues,
      activeWorkers,
      avgResponseTime
    ] = await Promise.all([
      // Reports counts
      prisma.garbageReport.count({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      }),
      prisma.garbageReport.count({
        where: { createdAt: { gte: thisWeekStart } }
      }),
      prisma.garbageReport.count({
        where: { createdAt: { gte: thisMonthStart } }
      }),

      // Tasks counts
      prisma.task.count({
        where: {
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
          }
        }
      }),
      prisma.task.count({
        where: { createdAt: { gte: thisWeekStart } }
      }),
      prisma.task.count({
        where: { createdAt: { gte: thisMonthStart } }
      }),

      // Pending items
      prisma.feedback.count({ where: { status: 'OPEN' } }),
      prisma.issue.count({ where: { status: 'PENDING' } }),

      // Active workers
      prisma.worker.count({
        where: {
          tasks: {
            some: {
              status: { in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'] }
            }
          }
        }
      }),

      // Average response time (time from report to task assignment)
      prisma.$queryRaw`
        SELECT AVG(
          (julianday(Task.createdAt) - julianday(GarbageReport.createdAt)) * 24 * 60
        ) as avgMinutes
        FROM Task 
        JOIN GarbageReport ON Task.garbageReportId = GarbageReport.id
        WHERE Task.createdAt >= ${thisMonthStart.toISOString()}
      `
    ]);

    res.json({
      reports: {
        today: todayReports,
        thisWeek: weekReports,
        thisMonth: monthReports
      },
      tasks: {
        today: todayTasks,
        thisWeek: weekTasks,
        thisMonth: monthTasks
      },
      pending: {
        feedback: pendingFeedback,
        issues: pendingIssues
      },
      workers: {
        active: activeWorkers
      },
      responseTime: {
        avgMinutes: avgResponseTime[0]?.avgMinutes ? parseFloat(avgResponseTime[0].avgMinutes).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Get KPI error:', error);
    res.status(500).json({ error: 'Failed to fetch KPI data' });
  }
});

module.exports = router;
