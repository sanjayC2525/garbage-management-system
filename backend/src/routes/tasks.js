const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
// const AIAssignmentService = require('../services/aiAssignmentService');

const router = express.Router();
const prisma = new PrismaClient();

// Status transition validation for tasks
const VALID_TASK_TRANSITIONS = {
  'ASSIGNED': ['ACCEPTED', 'UNABLE'],
  'ACCEPTED': ['IN_PROGRESS', 'UNABLE'],
  'IN_PROGRESS': ['COMPLETED', 'UNABLE'],
  'COMPLETED': [],
  'UNABLE': []
};

// Helper function to add status history entry
const addStatusHistory = (currentHistory, newStatus, note = '') => {
  const history = currentHistory ? JSON.parse(currentHistory) : [];
  history.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status changed to ${newStatus}`
  });
  return JSON.stringify(history);
};

// Worker: Get assigned tasks
router.get('/', authenticateToken, authorizeRoles('Worker'), async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { userId: req.user.id },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { workerId: worker.id },
      include: {
        garbageReport: {
          include: {
            citizen: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Worker: Mark task as collected or update status
router.put('/:id/collect', authenticateToken, authorizeRoles('Worker'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, unableReason } = req.body; // 'accept', 'start', 'complete', 'unable'

    if (!['accept', 'start', 'complete', 'unable'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const worker = await prisma.worker.findUnique({
      where: { userId: req.user.id },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { 
        worker: true,
        garbageReport: true
      },
    });

    if (!task || task.workerId !== worker.id) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    let newStatus;
    let note;
    let updateData = {};

    switch (action) {
      case 'accept':
        newStatus = 'ACCEPTED';
        note = 'Task accepted by worker';
        updateData.status = newStatus;
        updateData.statusHistory = addStatusHistory(task.statusHistory, newStatus, note);
        updateData.acceptedAt = new Date();
        break;
      
      case 'start':
        newStatus = 'IN_PROGRESS';
        note = 'Collection started by worker';
        updateData.status = newStatus;
        updateData.statusHistory = addStatusHistory(task.statusHistory, newStatus, note);
        break;
      
      case 'complete':
        newStatus = 'COMPLETED';
        note = 'Collection completed by worker';
        updateData.status = newStatus;
        updateData.statusHistory = addStatusHistory(task.statusHistory, newStatus, note);
        updateData.completedAt = new Date();
        
        // Also update the garbage report status
        if (task.garbageReport) {
          await prisma.garbageReport.update({
            where: { id: task.garbageReport.id },
            data: {
              status: 'COMPLETED',
              statusHistory: addStatusHistory(
                task.garbageReport.statusHistory,
                'COMPLETED',
                `Collection completed by ${req.user.name}`
              )
            }
          });
        }
        break;

      case 'unable':
        newStatus = 'UNABLE';
        note = unableReason || 'Worker unable to complete task';
        updateData.status = newStatus;
        updateData.statusHistory = addStatusHistory(task.statusHistory, newStatus, note);
        updateData.unableReason = unableReason;
        
        // Update garbage report back to ASSIGNED for reassignment
        if (task.garbageReport) {
          await prisma.garbageReport.update({
            where: { id: task.garbageReport.id },
            data: {
              status: 'ASSIGNED',
              assignedWorkerId: null, // Remove worker assignment
              statusHistory: addStatusHistory(
                task.garbageReport.statusHistory,
                'ASSIGNED',
                `Task marked as unable by ${req.user.name}: ${unableReason}`
              )
            }
          });
        }
        break;
    }

    // Validate status transition
    const validTransitions = VALID_TASK_TRANSITIONS[task.status] || [];
    if (!validTransitions.includes(newStatus)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${task.status} to ${newStatus}` 
      });
    }

    await prisma.task.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({ message: `Task ${action}d successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;