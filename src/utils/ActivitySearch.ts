import { Activity } from '../models/Activity'

/**
 * Search rules configuration for activity search
 * Each rule is a function that takes an activity and a search term and returns true if the activity matches
 */
type SearchRule = (activity: Activity, searchTerm: string) => boolean

/**
 * Utility class for searching activities
 */
export class ActivitySearch {
  /**
   * Default search rules that check if the search term is contained in title or description
   * This can be easily modified or extended
   */
  private static defaultSearchRules: SearchRule[] = [
    (activity: Activity, searchTerm: string) => {
      return activity.title.toLowerCase().includes(searchTerm.toLowerCase())
    },
    (activity: Activity, searchTerm: string) => {
      return activity.description.toLowerCase().includes(searchTerm.toLowerCase())
    },
  ]

  /**
   * Search activities based on the provided search term
   * Uses the default search rules (title and/or description contains the term)
   * 
   * @param activities - List of activities to search in
   * @param searchTerm - The search term to look for
   * @param searchRules - Optional custom search rules. If not provided, uses default rules
   * @returns A filtered subset of activities that match the search criteria
   */
  static search(
    activities: Activity[],
    searchTerm: string,
    searchRules?: SearchRule[]
  ): Activity[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return activities
    }

    const normalizedSearchTerm = searchTerm.trim()
    const rules = searchRules || this.defaultSearchRules

    return activities.filter((activity) => {
      // An activity matches if at least one rule returns true
      return rules.some((rule) => rule(activity, normalizedSearchTerm))
    })
  }

  /**
   * Get the default search rules
   * Useful for extending or modifying the default behavior
   * 
   * @returns A copy of the default search rules array
   */
  static getDefaultSearchRules(): SearchRule[] {
    return [...this.defaultSearchRules]
  }

  /**
   * Create a custom search rule that checks if a field contains the search term
   * 
   * @param fieldGetter - Function that extracts the field value from an activity
   * @param caseSensitive - Whether the search should be case sensitive (default: false)
   * @returns A search rule function
   */
  static createContainsRule(
    fieldGetter: (activity: Activity) => string,
    caseSensitive: boolean = false
  ): SearchRule {
    return (activity: Activity, searchTerm: string) => {
      const fieldValue = fieldGetter(activity)
      const normalizedField = caseSensitive ? fieldValue : fieldValue.toLowerCase()
      const normalizedTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase()
      return normalizedField.includes(normalizedTerm)
    }
  }
}
