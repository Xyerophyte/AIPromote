# Scheduling and Calendar Management System

A comprehensive scheduling system with visual calendar interface, drag-and-drop functionality, optimal posting time suggestions, bulk scheduling, recurring posts, timezone handling, conflict detection, and calendar export capabilities.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Services](#services)
6. [Frontend Integration](#frontend-integration)
7. [Usage Examples](#usage-examples)
8. [Configuration](#configuration)

## Features

### ✅ Visual Calendar Interface with Drag-and-Drop
- Interactive calendar view with drag-and-drop post scheduling
- Real-time conflict detection when moving events
- Multiple view modes (month, week, day)
- Color-coded events by platform and type
- Timezone-aware display

### ✅ Optimal Posting Time Suggestions
- AI-powered analysis of historical performance data
- Platform-specific optimal time recommendations
- Audience activity pattern analysis
- Statistical confidence scoring
- Automatic learning from new data

### ✅ Bulk Scheduling Features
- Schedule multiple posts across different platforms simultaneously
- Smart time slot distribution (even, weighted, optimal)
- Conflict avoidance and spacing management
- Batch operations with progress tracking
- Template-based scheduling

### ✅ Recurring Post Functionality
- Daily, weekly, and monthly recurring schedules
- Flexible interval settings and day-of-week selection
- End date configuration or indefinite scheduling
- Content rotation and variation
- Template management for recurring patterns

### ✅ Timezone Handling
- Full timezone support using IANA timezone identifiers
- Automatic UTC conversion for storage
- Timezone-aware display in user's local time
- Multi-timezone organization support
- DST (Daylight Saving Time) handling

### ✅ Scheduling Conflict Detection
- Time overlap detection (multiple posts same hour)
- Platform daily limit enforcement
- Similar content proximity warnings
- Audience fatigue analysis
- Rate limiting compliance
- Automated conflict resolution suggestions

### ✅ Calendar Export Functionality
- iCal (.ics) export for external calendars
- CSV export for spreadsheet analysis
- JSON export for system integration
- PDF reports for presentations
- Batch export with filtering options
- Scheduled export cleanup

## Architecture

```
┌─────────────────────────────────────┐
│           Frontend UI               │
├─────────────────────────────────────┤
│     Scheduling Routes API           │
├─────────────────────────────────────┤
│   ┌─────────────────────────────┐   │
│   │   SchedulingService         │   │
│   │   - Optimal Time Analysis   │   │
│   │   - Bulk Scheduling         │   │
│   │   - Conflict Detection      │   │
│   │   - Calendar Management     │   │
│   └─────────────────────────────┘   │
│   ┌─────────────────────────────┐   │
│   │  CalendarExportService      │   │
│   │   - iCal Generation         │   │
│   │   - CSV/JSON/PDF Export     │   │
│   │   - File Management         │   │
│   └─────────────────────────────┘   │
├─────────────────────────────────────┤
│          Database Layer             │
│   - Calendar Events                │
│   - Schedule Templates             │
│   - Optimal Posting Times          │
│   - Scheduling Conflicts           │
│   - Calendar Exports               │
└─────────────────────────────────────┘
```

## API Endpoints

### Optimal Posting Times

```http
POST /api/v1/scheduling/optimal-times/analyze
GET  /api/v1/scheduling/optimal-times/:organizationId/:platform
```

### Bulk Scheduling

```http
POST /api/v1/scheduling/bulk-schedule
```

### Recurring Scheduling

```http
POST /api/v1/scheduling/recurring-schedule
```

### Calendar Management

```http
POST   /api/v1/scheduling/calendar/events
GET    /api/v1/scheduling/calendar/events
PUT    /api/v1/scheduling/calendar/events/drag-drop
DELETE /api/v1/scheduling/calendar/events/:eventId
GET    /api/v1/scheduling/calendar/overview/:organizationId
```

### Conflict Detection

```http
POST /api/v1/scheduling/conflicts/detect
GET  /api/v1/scheduling/conflicts/:organizationId
PUT  /api/v1/scheduling/conflicts/:conflictId/resolve
```

### Schedule Templates

```http
GET    /api/v1/scheduling/templates/:organizationId
PUT    /api/v1/scheduling/templates/:templateId
DELETE /api/v1/scheduling/templates/:templateId
```

### Calendar Export

```http
POST   /api/v1/scheduling/export
GET    /api/v1/scheduling/export/:exportId
GET    /api/v1/scheduling/export/history/:organizationId
DELETE /api/v1/scheduling/export/:exportId
```

### Analytics

```http
GET /api/v1/scheduling/analytics/:organizationId
```

## Database Schema

### Core Models

#### CalendarEvent
```sql
- id: String (Primary Key)
- organizationId: String (Foreign Key)
- title: String
- description: String?
- eventType: EventType (enum)
- status: EventStatus (enum)
- startTime: DateTime
- endTime: DateTime?
- timeZone: String
- isAllDay: Boolean
- isRecurring: Boolean
- recurrenceRule: String? (RFC5545 RRULE)
- scheduledPostId: String? (Foreign Key)
- contentPieceId: String? (Foreign Key)
- metadata: JSON?
- tags: String[]
- color: String?
- hasConflicts: Boolean
- conflictsWith: String[]
```

#### ScheduleTemplate
```sql
- id: String (Primary Key)
- organizationId: String (Foreign Key)
- name: String
- scheduleType: ScheduleType (enum)
- platforms: Platform[]
- timeZone: String
- recurringConfig: JSON?
- optimalTimeConfig: JSON?
- bulkConfig: JSON?
- isActive: Boolean
```

#### OptimalPostingTime
```sql
- id: String (Primary Key)
- organizationId: String (Foreign Key)
- platform: Platform (enum)
- dayOfWeek: Integer (0-6)
- hour: Integer (0-23)
- timeZone: String
- score: Float (0-1)
- avgEngagement: Float
- avgReach: Float
- avgClicks: Float
- sampleSize: Integer
- confidence: Float
- lastAnalyzed: DateTime
```

#### SchedulingConflict
```sql
- id: String (Primary Key)
- organizationId: String (Foreign Key)
- conflictType: ConflictType (enum)
- severity: ConflictSeverity (enum)
- status: ConflictStatus (enum)
- description: String
- affectedTime: DateTime
- timeZone: String
- relatedEvents: String[]
- relatedPosts: String[]
- resolution: String?
- resolvedBy: String?
- resolvedAt: DateTime?
```

#### CalendarExport
```sql
- id: String (Primary Key)
- organizationId: String (Foreign Key)
- exportType: ExportType (enum)
- format: ExportFormat (enum)
- status: ExportStatus (enum)
- startDate: DateTime
- endDate: DateTime
- timeZone: String
- includeEvents: EventType[]
- platforms: Platform[]
- fileName: String?
- fileSize: Integer?
- downloadUrl: String?
- expiresAt: DateTime?
- errorMessage: String?
```

### Enums

```typescript
enum ScheduleType {
  RECURRING, BULK, OPTIMAL_TIME, MANUAL
}

enum EventType {
  POST_SCHEDULED, POST_PUBLISHED, CONTENT_DEADLINE, 
  CAMPAIGN_START, CAMPAIGN_END, REVIEW_DUE, 
  MEETING, CUSTOM
}

enum EventStatus {
  ACTIVE, CANCELLED, COMPLETED, POSTPONED
}

enum ConflictType {
  TIME_OVERLAP, PLATFORM_LIMIT, CONTENT_SIMILAR, 
  AUDIENCE_FATIGUE, RATE_LIMIT, RESOURCE_CONFLICT
}

enum ConflictSeverity {
  LOW, MEDIUM, HIGH, CRITICAL
}

enum ExportFormat {
  ICAL, CSV, JSON, PDF
}
```

## Services

### SchedulingService

Main service handling all scheduling operations:

```typescript
class SchedulingService {
  // Optimal posting time analysis
  analyzeOptimalPostingTimes(options: OptimalTimeAnalysis): Promise<OptimalTimeResult[]>
  getOptimalPostingTimes(organizationId: string, platform: Platform, timeZone: string): Promise<OptimalTimeResult[]>
  
  // Bulk scheduling
  createBulkSchedule(request: BulkScheduleRequest): Promise<string[]>
  
  // Recurring scheduling
  createRecurringSchedule(request: RecurringScheduleRequest): Promise<string[]>
  
  // Calendar management
  createCalendarEvent(organizationId: string, event: CalendarEvent): Promise<string>
  updateCalendarEventDragDrop(update: DragDropUpdate): Promise<void>
  getCalendarEvents(organizationId: string, startDate: Date, endDate: Date, timeZone: string): Promise<any[]>
  
  // Conflict detection
  detectSchedulingConflicts(options: ConflictDetectionOptions): Promise<void>
}
```

### CalendarExportService

Service for exporting calendar data:

```typescript
class CalendarExportService {
  // Export creation and management
  createExport(request: ExportRequest): Promise<string>
  getExport(exportId: string): Promise<ExportData>
  deleteExport(exportId: string): Promise<void>
  
  // Format-specific generators
  generateICalExport(data: CalendarExportData): string
  generateCSVExport(data: CalendarExportData): string
  generateJSONExport(data: CalendarExportData): string
  generatePDFExport(data: CalendarExportData): Promise<Buffer>
  
  // Maintenance
  cleanupExpiredExports(): Promise<void>
  getExportHistory(organizationId: string): Promise<ExportRecord[]>
}
```

## Frontend Integration

### Calendar Component Example

```jsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const CalendarView = ({ organizationId, timeZone }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month');

  const handleEventDrop = async (eventId, newStartTime) => {
    await fetch('/api/v1/scheduling/calendar/events/drag-drop', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        newStartTime: newStartTime.toISOString(),
        timeZone
      })
    });
    
    // Refresh events
    loadEvents();
  };

  const loadEvents = async () => {
    const response = await fetch(
      `/api/v1/scheduling/calendar/events?organizationId=${organizationId}&timeZone=${timeZone}`
    );
    const data = await response.json();
    setEvents(data.events);
  };

  return (
    <DragDropContext onDragEnd={handleEventDrop}>
      <CalendarGrid events={events} view={view} />
    </DragDropContext>
  );
};
```

### Bulk Scheduling Example

```jsx
const BulkScheduler = () => {
  const [contentPieces, setContentPieces] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const handleBulkSchedule = async () => {
    const response = await fetch('/api/v1/scheduling/bulk-schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId,
        contentPieceIds: contentPieces.map(c => c.id),
        platforms,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timeSlots,
        distribution: 'optimal',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    });

    const result = await response.json();
    console.log(`Scheduled ${result.data.count} posts`);
  };

  return (
    <BulkScheduleForm 
      onSubmit={handleBulkSchedule}
      contentPieces={contentPieces}
      platforms={platforms}
    />
  );
};
```

## Usage Examples

### 1. Analyze Optimal Posting Times

```bash
curl -X POST '/api/v1/scheduling/optimal-times/analyze' \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId": "org_123",
    "platform": "TWITTER",
    "timeZone": "America/New_York",
    "analysisWindow": 30
  }'
```

### 2. Create Bulk Schedule

```bash
curl -X POST '/api/v1/scheduling/bulk-schedule' \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId": "org_123",
    "contentPieceIds": ["content_1", "content_2", "content_3"],
    "platforms": ["TWITTER", "LINKEDIN"],
    "startDate": "2024-01-15T00:00:00Z",
    "endDate": "2024-01-20T00:00:00Z",
    "timeSlots": [
      {"hour": 9, "minute": 0},
      {"hour": 14, "minute": 30},
      {"hour": 18, "minute": 0}
    ],
    "distribution": "optimal",
    "spacing": 30,
    "timeZone": "America/New_York"
  }'
```

### 3. Create Recurring Schedule

```bash
curl -X POST '/api/v1/scheduling/recurring-schedule' \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId": "org_123",
    "contentPieceIds": ["content_1", "content_2"],
    "frequency": "weekly",
    "interval": 1,
    "daysOfWeek": [1, 3, 5],
    "timeslots": [{"hour": 10, "minute": 0}],
    "startDate": "2024-01-15T00:00:00Z",
    "endDate": "2024-03-15T00:00:00Z",
    "timeZone": "America/New_York"
  }'
```

### 4. Export Calendar

```bash
curl -X POST '/api/v1/scheduling/export' \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId": "org_123",
    "exportType": "CALENDAR",
    "format": "ICAL",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T00:00:00Z",
    "timeZone": "America/New_York",
    "includeEvents": ["POST_SCHEDULED", "POST_PUBLISHED"],
    "platforms": ["TWITTER", "LINKEDIN"]
  }'
```

### 5. Detect Conflicts

```bash
curl -X POST '/api/v1/scheduling/conflicts/detect' \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationId": "org_123",
    "startDate": "2024-01-15T00:00:00Z",
    "endDate": "2024-01-20T00:00:00Z",
    "platforms": ["TWITTER", "LINKEDIN"],
    "checkTypes": ["TIME_OVERLAP", "PLATFORM_LIMIT", "CONTENT_SIMILAR"]
  }'
```

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/aipromoter

# Timezone Settings
DEFAULT_TIMEZONE=UTC
SUPPORTED_TIMEZONES=America/New_York,Europe/London,Asia/Tokyo

# Export Settings
EXPORT_STORAGE_BUCKET=calendar-exports
EXPORT_EXPIRY_DAYS=7
MAX_EXPORT_SIZE_MB=50

# Conflict Detection
CONFLICT_CHECK_WINDOW_HOURS=168  # 1 week
MAX_POSTS_PER_HOUR=3
MAX_DAILY_POSTS_TWITTER=50
MAX_DAILY_POSTS_LINKEDIN=20

# Analytics
OPTIMAL_TIME_MIN_SAMPLE_SIZE=3
OPTIMAL_TIME_CONFIDENCE_THRESHOLD=0.7
ANALYSIS_WINDOW_DAYS=30
```

### Platform Limits

```typescript
const PLATFORM_LIMITS = {
  TWITTER: { daily: 50, hourly: 5 },
  LINKEDIN: { daily: 20, hourly: 2 },
  INSTAGRAM: { daily: 25, hourly: 3 },
  FACEBOOK: { daily: 25, hourly: 3 },
  TIKTOK: { daily: 10, hourly: 2 },
  YOUTUBE_SHORTS: { daily: 5, hourly: 1 },
  REDDIT: { daily: 10, hourly: 2 },
  THREADS: { daily: 30, hourly: 4 }
};
```

## Best Practices

1. **Timezone Handling**: Always store dates in UTC and convert to user timezone for display
2. **Conflict Prevention**: Run conflict detection before bulk operations
3. **Performance**: Use database indexes for time-based queries
4. **Export Cleanup**: Regularly clean up expired exports to save storage
5. **Analytics**: Update optimal posting times weekly for best results
6. **Error Handling**: Implement proper error handling for external API failures
7. **Rate Limiting**: Respect platform rate limits when scheduling posts
8. **User Experience**: Provide real-time feedback for drag-and-drop operations

This scheduling system provides a comprehensive solution for managing social media content calendars with advanced features like AI-powered optimal timing, conflict detection, and flexible export options.
