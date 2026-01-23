const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AIAssignmentService {
  // Karnataka bounds
  static KARNATAKA_BOUNDS = {
    minLat: 11.5,
    maxLat: 18.5,
    minLng: 74.0,
    maxLng: 78.5,
  };

  static async assignTask(garbageReportId, latitude, longitude) {
    try {
      // Find available workers (workload < maxTasks)
      const availableWorkers = await prisma.worker.findMany({
        where: {
          currentWorkload: {
            lt: prisma.worker.fields.maxTasks,
          },
        },
        include: {
          user: true,
        },
      });

      if (availableWorkers.length === 0) {
        await this.logDecision('NO_WORKERS_AVAILABLE', 'No workers available with capacity for new tasks');
        throw new Error('No available workers');
      }

      // Find worker with least workload
      const minWorkload = Math.min(...availableWorkers.map(w => w.currentWorkload));
      const leastLoadedWorkers = availableWorkers.filter(w => w.currentWorkload === minWorkload);

      // If multiple, pick random
      const selectedWorker = leastLoadedWorkers[Math.floor(Math.random() * leastLoadedWorkers.length)];

      // Randomize time: next 7 days, random hour
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const randomTime = new Date(now.getTime() + Math.random() * (sevenDaysLater.getTime() - now.getTime()));

      // Randomize location within Karnataka bounds
      const randomLat = Math.random() * (this.KARNATAKA_BOUNDS.maxLat - this.KARNATAKA_BOUNDS.minLat) + this.KARNATAKA_BOUNDS.minLat;
      const randomLng = Math.random() * (this.KARNATAKA_BOUNDS.maxLng - this.KARNATAKA_BOUNDS.minLng) + this.KARNATAKA_BOUNDS.minLng;

      // Create task
      const task = await prisma.task.create({
        data: {
          garbageReportId,
          latitude: randomLat,
          longitude: randomLng,
          scheduledTime: randomTime,
          workerId: selectedWorker.id,
        },
      });

      // Update worker workload
      await prisma.worker.update({
        where: { id: selectedWorker.id },
        data: {
          currentWorkload: {
            increment: 1,
          },
        },
      });

      // Log decision
      await this.logDecision(
        'TASK_ASSIGNED',
        `Assigned task ${task.id} to worker ${selectedWorker.user.name} (workload: ${selectedWorker.currentWorkload + 1}). Scheduled: ${randomTime.toISOString()}, Location: (${randomLat}, ${randomLng})`
      );

      return task;
    } catch (error) {
      await this.logDecision('ASSIGNMENT_FAILED', `Failed to assign task: ${error.message}`);
      throw error;
    }
  }

  static async logDecision(decision, reason) {
    await prisma.aILog.create({
      data: {
        decision,
        reason,
      },
    });
  }

  // Method to mark task as collected and decrement workload
  static async completeTask(taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { worker: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'COLLECTED' },
    });

    await prisma.worker.update({
      where: { id: task.workerId },
      data: {
        currentWorkload: {
          decrement: 1,
        },
      },
    });

    await this.logDecision('TASK_COMPLETED', `Task ${taskId} marked as collected by worker ${task.worker.user.name}`);
  }
}

module.exports = AIAssignmentService;