const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for proof uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/proof/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Worker: Upload proof of work (before/after photos)
router.post('/:taskId/proof', authenticateToken, authorizeRoles('Worker'), upload.single('proofImage'), async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Proof image is required' });
    }

    const worker = await prisma.worker.findUnique({
      where: { userId: req.user.id },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: { worker: true },
    });

    if (!task || task.workerId !== worker.id) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Proof can only be uploaded for tasks in progress' });
    }

    // Update task with proof image
    const updatedTask = await prisma.task.update({
      where: { id: parseInt(taskId) },
      data: {
        proofImage: `/uploads/proof/${req.file.filename}`,
        statusHistory: JSON.stringify([
          ...(JSON.parse(task.statusHistory || '[]')),
          {
            status: 'PROOF_UPLOADED',
            timestamp: new Date().toISOString(),
            note: 'Proof of work uploaded by worker'
          }
        ])
      },
      include: {
        garbageReport: true,
        worker: { include: { user: { select: { name: true, email: true } } } }
      }
    });

    res.json({
      message: 'Proof uploaded successfully',
      task: updatedTask,
      proofImageUrl: updatedTask.proofImage
    });
  } catch (error) {
    console.error('Proof upload error:', error);
    res.status(500).json({ error: 'Failed to upload proof' });
  }
});

// Worker: Get proof image for a task
router.get('/:taskId/proof', authenticateToken, authorizeRoles('Worker'), async (req, res) => {
  try {
    const { taskId } = req.params;

    const worker = await prisma.worker.findUnique({
      where: { userId: req.user.id },
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker profile not found' });
    }

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      select: { proofImage: true, workerId: true }
    });

    if (!task || task.workerId !== worker.id) {
      return res.status(404).json({ error: 'Task not found or not assigned to you' });
    }

    if (!task.proofImage) {
      return res.status(404).json({ error: 'No proof image found for this task' });
    }

    res.json({ proofImageUrl: task.proofImage });
  } catch (error) {
    console.error('Get proof error:', error);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
});

// Admin: Get all proof images for completed tasks
router.get('/admin/all-proofs', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        proofImage: { not: null },
        status: 'COMPLETED'
      },
      include: {
        garbageReport: {
          include: {
            citizen: { select: { name: true, email: true } }
          }
        },
        worker: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get all proofs error:', error);
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
});

// Admin: Get proof statistics
router.get('/admin/proof-stats', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const [
      totalCompletedTasks,
      tasksWithProof,
      tasksWithoutProof,
      recentProofs
    ] = await Promise.all([
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ 
        where: { 
          status: 'COMPLETED',
          proofImage: { not: null }
        } 
      }),
      prisma.task.count({ 
        where: { 
          status: 'COMPLETED',
          proofImage: null
        } 
      }),
      prisma.task.findMany({
        where: {
          proofImage: { not: null },
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          worker: { include: { user: { select: { name: true } } } },
          garbageReport: { select: { id: true } }
        },
        orderBy: { completedAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      totalCompleted: totalCompletedTasks,
      withProof: tasksWithProof,
      withoutProof: tasksWithoutProof,
      proofComplianceRate: totalCompletedTasks > 0 ? (tasksWithProof / totalCompletedTasks * 100).toFixed(1) : 0,
      recentProofs
    });
  } catch (error) {
    console.error('Get proof stats error:', error);
    res.status(500).json({ error: 'Failed to fetch proof statistics' });
  }
});

module.exports = router;
