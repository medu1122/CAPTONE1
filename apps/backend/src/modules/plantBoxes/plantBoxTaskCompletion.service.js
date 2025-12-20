import crypto from 'crypto';
import PlantBox from './plantBox.model.js';
import TaskCompletionToken from './taskCompletionToken.model.js';
import { httpError } from '../../common/utils/http.js';
import { broadcastNotification } from '../notifications/notification.stream.controller.js';
import { createNotification } from '../notifications/notification.service.js';

/**
 * Complete task via token (public endpoint, no auth required)
 * @param {string} token - Completion token
 * @returns {Promise<object>} Completion result
 */
export const completeTaskViaToken = async (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw httpError(400, 'Token is required');
    }

    // Hash token to find in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find token in database
    const tokenRecord = await TaskCompletionToken.findOne({
      tokenHash,
      used: false,
    }).populate('plantBoxId', 'user name plantName');

    if (!tokenRecord) {
      throw httpError(404, 'Token not found or already used');
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      throw httpError(400, 'Token has expired');
    }

    // Get plant box
    const plantBox = await PlantBox.findById(tokenRecord.plantBoxId);
    if (!plantBox) {
      throw httpError(404, 'Plant box not found');
    }

    // Check if care strategy exists
    if (!plantBox.careStrategy || !plantBox.careStrategy.next7Days || !plantBox.careStrategy.next7Days[tokenRecord.dayIndex]) {
      throw httpError(404, 'Day not found in care strategy');
    }

    const day = plantBox.careStrategy.next7Days[tokenRecord.dayIndex];
    const action = day.actions.find(a => a._id === tokenRecord.actionId);

    if (!action) {
      throw httpError(404, 'Action not found');
    }

    // Check if already completed
    if (action.completed) {
      // Mark token as used anyway
      tokenRecord.used = true;
      await tokenRecord.save();
      
      return {
        success: true,
        message: 'Task already completed',
        alreadyCompleted: true,
        plantBox: {
          _id: plantBox._id,
          name: plantBox.name,
        },
      };
    }

    // Mark action as completed
    action.completed = true;
    await plantBox.save();

    // Mark token as used
    tokenRecord.used = true;
    await tokenRecord.save();

    // Send realtime notification to user
    try {
      const notification = await createNotification({
        userId: plantBox.user.toString(),
        type: 'task_completed',
        actorId: plantBox.user.toString(), // Self-action
        content: `✅ Đã hoàn thành: ${action.description}`,
        metadata: {
          plantBoxId: plantBox._id.toString(),
          plantBoxName: plantBox.name,
          plantName: plantBox.plantName,
          dayIndex: tokenRecord.dayIndex,
          actionId: tokenRecord.actionId,
          actionDescription: action.description,
          actionTime: action.time,
        },
      });

      // Broadcast via SSE
      await broadcastNotification(plantBox.user.toString(), notification);
      console.log(`✅ [TaskCompletion] Realtime notification sent to user ${plantBox.user}`);
    } catch (notifError) {
      console.error('❌ [TaskCompletion] Error sending notification:', notifError);
      // Don't fail the completion if notification fails
    }

    return {
      success: true,
      message: 'Task completed successfully',
      plantBox: {
        _id: plantBox._id,
        name: plantBox.name,
        plantName: plantBox.plantName,
      },
      action: {
        _id: action._id,
        description: action.description,
        time: action.time,
      },
    };
  } catch (error) {
    if (error.statusCode) throw error;
    throw httpError(500, `Failed to complete task: ${error.message}`);
  }
};

