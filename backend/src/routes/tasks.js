const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const AIAssignmentService = require('../services/aiAssignmentService');

const router = express.Router();
const prisma = new PrismaClient();

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

// Worker: Mark task as collected
router.put('/:id/collect', authenticateToken, authorizeRoles('Worker'), async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { userId: req.user.id },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: { worker: true },
    });

    if (!task || task.workerId !== worker.id) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    if (task.status === 'COLLECTED') {
      return res.status(400).json({ error: 'Task already collected' });
    }

    await AIAssignmentService.completeTask(task.id);

    res.json({ message: 'Task marked as collected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;