const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Status transition validation
const VALID_TRANSITIONS = {
  'REPORTED': ['APPROVED', 'REJECTED', 'ASSIGNED'], // Allow direct assignment during approval
  'APPROVED': ['ASSIGNED'],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['COMPLETED'],
  'COMPLETED': [],
  'REJECTED': []
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
    const { latitude, longitude, preferredDate, address, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const initialStatusHistory = addStatusHistory(null, 'REPORTED', 'Request submitted');

    const garbageReport = await prisma.garbageReport.create({
      data: {
        imagePath: `/uploads/${req.file.filename}`,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        citizenId: req.user.id,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        address: address || null,
        notes: notes || null,
        statusHistory: initialStatusHistory
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
    const { action, workerId, adminNotes } = req.body; // 'approve', 'reject', 'assign', 'start', 'complete'

    console.log('Update request:', { id, action, hasWorkerId: !!workerId, hasAdminNotes: !!adminNotes });

    if (!['approve', 'reject', 'assign', 'start', 'complete'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get current report
    const currentReport = await prisma.garbageReport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentReport) {
      return res.status(404).json({ error: 'Report not found' });
    }

    let newStatus;
    let updateData = {};
    let note = '';

    // Handle different actions
    switch (action) {
      case 'approve':
        newStatus = 'APPROVED';
        note = 'Request approved by admin';
        updateData.status = newStatus;
        updateData.statusHistory = addStatusHistory(currentReport.statusHistory, newStatus, note);
        
        // If workerId is provided during approval, also assign the worker
        if (workerId) {
          const parsedWorkerId = parseInt(workerId);
          if (isNaN(parsedWorkerId)) {
            return res.status(400).json({ error: 'Invalid Worker ID' });
          }

          // Find the worker profile
          const workerUser = await prisma.user.findUnique({ where: { id: parsedWorkerId } });
          if (!workerUser || workerUser.role !== 'Worker') {
            return res.status(404).json({ error: 'Worker not found' });
          }

          // Get or create the Worker record
          let worker = await prisma.worker.findUnique({ where: { userId: workerUser.id } });
          if (!worker) {
            worker = await prisma.worker.create({
              data: { userId: workerUser.id }
            });
          }

          // Update to assigned status and create task
          newStatus = 'ASSIGNED';
          note = `Approved and assigned to ${workerUser.name}`;
          updateData.status = newStatus;
          updateData.assignedWorkerId = parsedWorkerId;
          updateData.statusHistory = addStatusHistory(currentReport.statusHistory, newStatus, note);

          // Create task
          await prisma.task.create({
            data: {
              garbageReportId: currentReport.id,
              workerId: worker.id,
              latitude: currentReport.latitude,
              longitude: currentReport.longitude,
              scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for tomorrow
              status: 'ASSIGNED',
              statusHistory: addStatusHistory(null, 'ASSIGNED', `Task created for ${workerUser.name}`)
            },
          });
        }
        break;

      case 'reject':
        newStatus = 'REJECTED';
        note = adminNotes || 'Request rejected by admin';
        updateData.status = newStatus;
        updateData.adminNotes = adminNotes || null;
        updateData.statusHistory = addStatusHistory(currentReport.statusHistory, newStatus, note);
        break;

      case 'assign':
        if (!workerId) {
          return res.status(400).json({ error: 'Worker ID is required for assignment' });
        }
        
        const parsedWorkerId = parseInt(workerId);
        if (isNaN(parsedWorkerId)) {
          return res.status(400).json({ error: 'Invalid Worker ID' });
        }

        // Find the worker profile
        const workerUser = await prisma.user.findUnique({ where: { id: parsedWorkerId } });
        if (!workerUser || workerUser.role !== 'Worker') {
          return res.status(404).json({ error: 'Worker not found' });
        }

        // Get or create the Worker record
        let worker = await prisma.worker.findUnique({ where: { userId: workerUser.id } });
        if (!worker) {
          worker = await prisma.worker.create({
            data: { userId: workerUser.id }
          });
        }

        newStatus = 'ASSIGNED';
        note = `Assigned to ${workerUser.name}`;
        updateData.status = newStatus;
        updateData.assignedWorkerId = parsedWorkerId;
        updateData.statusHistory = addStatusHistory(currentReport.statusHistory, newStatus, note);

        // Create task
        await prisma.task.create({
          data: {
            garbageReportId: currentReport.id,
            workerId: worker.id,
            latitude: currentReport.latitude,
            longitude: currentReport.longitude,
            scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for tomorrow
            status: 'ASSIGNED',
            statusHistory: addStatusHistory(null, 'ASSIGNED', `Task created for ${workerUser.name}`)
          },
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Validate status transition
    const validTransitions = VALID_TRANSITIONS[currentReport.status] || [];
    if (validTransitions.length > 0 && !validTransitions.includes(newStatus)) {
      console.log('Status transition validation failed:', {
        from: currentReport.status,
        to: newStatus,
        validTransitions
      });
      return res.status(400).json({ 
        error: `Invalid status transition from ${currentReport.status} to ${newStatus}` 
      });
    }

    // Update the report
    const updatedReport = await prisma.garbageReport.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        citizen: { select: { name: true, email: true } },
        assignedWorker: { select: { name: true, email: true } },
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
    });

    res.json(updatedReport);
    console.log('Report updated successfully:', updatedReport.id, 'Status:', updatedReport.status);
  } catch (error) {
    console.error('Error updating report:', error);
    console.error('Full error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({ error: 'Failed to update report', details: error.message });
  }
});

module.exports = router;