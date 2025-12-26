import { Task } from '../models/Activity'
import { logApiRequest } from '../utils/ApiLogger'

/**
 * Service pour gérer les appels API des tâches
 */
export class TaskApiService {
  /**
   * Créer une nouvelle tâche
   */
  static createTask(
    userId: number,
    activityId: number,
    task: Task
  ): void {
    logApiRequest({
      method: 'POST',
      path: '/api/users/:userId/activities/:activityId/tasks',
      pathParams: { userId, activityId },
      body: {
        title: task.title,
        description: task.description,
        isChecked: task.isChecked || false,
        isDeleted: task.isDeleted || false,
        subtasks: task.subtasks || [],
      },
    })
  }

  /**
   * Mettre à jour une tâche existante
   */
  static updateTask(
    userId: number,
    activityId: number,
    taskId: number,
    task: Task
  ): void {
    logApiRequest({
      method: 'PATCH',
      path: '/api/users/:userId/activities/:activityId/tasks/:taskId',
      pathParams: { userId, activityId, taskId },
      body: {
        title: task.title,
        description: task.description,
        isChecked: task.isChecked,
        isDeleted: task.isDeleted,
        subtasks: task.subtasks || [],
      },
    })
  }

  /**
   * Supprimer une tâche
   */
  static deleteTask(
    userId: number,
    activityId: number,
    taskId: number
  ): void {
    logApiRequest({
      method: 'DELETE',
      path: '/api/users/:userId/activities/:activityId/tasks/:taskId',
      pathParams: { userId, activityId, taskId },
    })
  }

  /**
   * Réorganiser les tâches (changer l'ordre)
   */
  static reorderTasks(
    userId: number,
    activityId: number,
    taskIds: number[]
  ): void {
    logApiRequest({
      method: 'PATCH',
      path: '/api/users/:userId/activities/:activityId/tasks/reorder',
      pathParams: { userId, activityId },
      body: {
        taskIds,
      },
    })
  }

  /**
   * Mettre à jour toutes les tâches d'une activité (batch update)
   */
  static updateAllTasks(
    userId: number,
    activityId: number,
    tasks: Task[]
  ): void {
    logApiRequest({
      method: 'PATCH',
      path: '/api/users/:userId/activities/:activityId/tasks',
      pathParams: { userId, activityId },
      body: {
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          isChecked: task.isChecked,
          isDeleted: task.isDeleted,
          subtasks: task.subtasks || [],
        })),
      },
    })
  }

  /**
   * Récupérer toutes les tâches d'une activité
   */
  static getTasks(
    userId: number,
    activityId: number
  ): void {
    logApiRequest({
      method: 'GET',
      path: '/api/users/:userId/activities/:activityId/tasks',
      pathParams: { userId, activityId },
    })
  }
}

