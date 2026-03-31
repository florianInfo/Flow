# Functional Decisions

This document contains functional decisions and business rules for the Flow application.

## Activity Search

### Search Rules

The activity search functionality allows users to filter activities based on a search term.

**Current Implementation:**
- An activity matches the search if the search term is found in:
  - The activity **title** (case-insensitive), OR
  - The activity **description** (case-insensitive)

**Technical Details:**
- The search is implemented in `src/utils/ActivitySearch.ts`
- Uses a rule-based system that can be easily extended
- Default rules check for substring matches in title and description fields
- Search is case-insensitive by default

**Future Extensibility:**
The search rules can be easily modified or extended to include:
- Color-based search
- Recurring activities search
- Date-based filtering
- Tag-based search
- Custom field matching
