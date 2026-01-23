const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const AIAssignmentService = require('../services/aiAssignmentService');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Citizen: Submit garbage report
router.post('/', authenticateToken, authorizeRoles('Citizen'), upload.single('photo'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const garbageReport = await prisma.garbageReport.create({
      data: {
        imagePath: `/uploads/${req.file.filename}`,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        citizenId: req.user.id,
      },
    });

    res.status(201).json(garbageReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// Admin: Get all reports
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const reports = await prisma.garbageReport.findMany({
      include: {
        citizen: { select: { name: true, email: true } },
        tasks: {
          include: {
            worker: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Citizen: Get my reports
router.get('/my-reports', authenticateToken, authorizeRoles('Citizen'), async (req, res) => {
  try {
    const reports = await prisma.garbageReport.findMany({
      where: { citizenId: req.user.id },
      include: {
        tasks: {
          include: {
            worker: {
              include: {
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Admin: Approve or reject report
router.put('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

    const report = await prisma.garbageReport.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        citizen: { select: { name: true } },
      },
    });

    if (action === 'approve') {
      // Trigger AI assignment
      try {
        const task = await AIAssignmentService.assignTask(report.id, report.latitude, report.longitude);
        res.json({ report, task });
      } catch (aiError) {
        console.error('AI Assignment failed:', aiError);
        res.status(500).json({ error: 'Report approved but AI assignment failed', report });
      }
    } else {
      res.json({ report });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

module.exports = router;