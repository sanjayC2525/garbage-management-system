const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Admin: Get workers with workload statistics
router.get('/stats', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'Worker' },
      include: {
        worker: {
          include: {
            tasks: {
              where: {
                status: {
                  in: ['ASSIGNED', 'IN_PROGRESS']
                }
              }
            }
          }
        },
        assignedReports: {
          where: {
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS']
            }
          }
        },
        // Include assigned issues
        issuesAsWorker: {
          where: {
            status: {
              in: ['PENDING', 'IN_REVIEW'] // Active issue statuses
            }
          }
        }
      }
    });

    const workersWithStats = await Promise.all(workers.map(async (worker) => {
      const completedTasks = worker.worker ? await prisma.task.count({
        where: {
          workerId: worker.worker.id,
          status: 'COMPLETED'
        }
      }) : 0;

      const efficiency = worker.worker ? await calculateWorkerEfficiency(worker.worker.id) : 0;

      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        profileImage: worker.profileImage,
        activeAssignments: (worker.worker?.tasks?.length || 0) + (worker.assignedReports?.length || 0) + (worker.issuesAsWorker?.length || 0),
        completedAssignments: completedTasks,
        maxTasks: worker.worker?.maxTasks || 10,
        currentWorkload: worker.worker?.currentWorkload || 0,
        efficiency
      };
    }));

    // Sort by workload (ascending) for smart assignment
    workersWithStats.sort((a, b) => a.activeAssignments - b.activeAssignments);

    res.json(workersWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch worker statistics' });
  }
});

// Helper function to calculate worker efficiency
async function calculateWorkerEfficiency(workerId) {
  try {
    const totalTasks = await prisma.task.count({
      where: { workerId }
    });
    
    const completedTasks = await prisma.task.count({
      where: { 
        workerId,
        status: 'COMPLETED'
      }
    });

    if (totalTasks === 0) return 100; // New worker gets 100% efficiency
    
    return Math.round((completedTasks / totalTasks) * 100);
  } catch (error) {
    console.error('Error calculating efficiency:', error);
    return 0;
  }
}

// Admin: Get best available worker for assignment
router.get('/best-available', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'Worker' },
      include: {
        worker: {
          include: {
            tasks: {
              where: {
                status: {
                  in: ['ASSIGNED', 'IN_PROGRESS']
                }
              }
            }
          }
        }
      }
    });

    const workersWithLoad = await Promise.all(workers.map(async (worker) => {
      const efficiency = worker.worker ? await calculateWorkerEfficiency(worker.worker.id) : 100;
      return {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        currentLoad: worker.worker?.tasks?.length || 0,
        maxTasks: worker.worker?.maxTasks || 10,
        efficiency
      };
    }));

    // Filter workers who are not at max capacity
    const availableWorkers = workersWithLoad.filter(w => w.currentLoad < w.maxTasks);

    if (availableWorkers.length === 0) {
      return res.status(404).json({ error: 'No available workers found' });
    }

    // Sort by current load, then by efficiency
    availableWorkers.sort((a, b) => {
      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad;
      }
      return b.efficiency - a.efficiency;
    });

    res.json(availableWorkers[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to find best available worker' });
  }
});

module.exports = router;
