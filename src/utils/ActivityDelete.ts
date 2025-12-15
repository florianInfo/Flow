import { Activity } from '../models/Activity'

/**
 * Utility class for handling activity deletion and cleanup
 */
export class ActivityDelete {
  /**
   * Removes all references to a deleted activity from recurringActivities
   * of all other activities in the list.
   * 
   * @param activities - List of all activities
   * @param deletedActivityId - The ID of the activity being deleted
   * @returns A new array of activities with cleaned up recurringActivities
   */
  static removeFromRecurringActivities(
    activities: Activity[],
    deletedActivityId: number
  ): Activity[] {
    return activities.map(activity => {
      // Skip the activity being deleted itself
      if (activity.id === deletedActivityId) {
        return activity
      }

      // Filter out any recurringActivities that reference the deleted activity
      const cleanedRecurringActivities = (activity.recurringActivities || []).filter(
        recurring => recurring.targetedActivityId !== deletedActivityId
      )

      // Only return a new object if there were changes
      if (cleanedRecurringActivities.length !== (activity.recurringActivities || []).length) {
        return {
          ...activity,
          recurringActivities: cleanedRecurringActivities,
        }
      }

      return activity
    })
  }

  /**
   * Deletes an activity and cleans up all references to it in recurringActivities
   * 
   * @param activities - List of all activities
   * @param deletedActivityId - The ID of the activity to delete
   * @returns A new array of activities with the deleted activity removed and cleaned up references
   */
  static deleteActivity(
    activities: Activity[],
    deletedActivityId: number
  ): Activity[] {
    // First, remove the activity from the list
    const activitiesWithoutDeleted = activities.filter(
      activity => activity.id !== deletedActivityId
    )

    // Then, clean up all references in recurringActivities
    return this.removeFromRecurringActivities(activitiesWithoutDeleted, deletedActivityId)
  }
}
