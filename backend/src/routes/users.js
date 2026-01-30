const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for profile image uploads
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profile-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') && ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, and PNG images are allowed'));
    }
  },
});

// Get all workers (Admin only)
router.get('/workers', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'Worker' },
      select: { id: true, name: true, email: true },
    });
    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, role },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// Upload/Update profile image (All authenticated users)
router.post('/profile-image', authenticateToken, profileImageUpload.single('profileImage'), async (req, res) => {
  try {
    console.log('📸 Profile image upload request:', {
      userId: req.user.id,
      file: req.file ? req.file.filename : 'No file',
      mimetype: req.file?.mimetype,
      size: req.file?.size
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old profile image if exists
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { profileImage: true },
    });

    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/profile-images', path.basename(user.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted old profile image:', user.profileImage);
      }
    }

    // Update user with new profile image path
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profileImage: `/uploads/profile-images/${req.file.filename}` },
      select: { id: true, name: true, email: true, role: true, profileImage: true },
    });

    console.log('✅ Profile image updated successfully:', {
      userId: updatedUser.id,
      profileImage: updatedUser.profileImage
    });

    res.json({
      message: 'Profile image updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('❌ Profile image upload error:', error);
    res.status(500).json({ message: 'Failed to upload profile image' });
  }
});

// Get current user profile (All authenticated users)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, profileImage: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has assigned tasks or reports
    const workerProfile = await prisma.worker.findUnique({
      where: { userId: parseInt(id) },
      include: {
        tasks: {
          where: {
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS']
            }
          }
        }
      }
    });

    if (workerProfile && workerProfile.tasks.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete worker with active assignments' 
      });
    }

    // Delete the user (this will cascade delete related records)
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;