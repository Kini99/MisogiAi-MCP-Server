# Meeting & Calendar Management MCP Server

An AI-powered MCP (Model Context Protocol) server for intelligent meeting and calendar management with advanced scheduling, conflict resolution, and productivity analysis features.

## Features

### Core Calendar Management
- **Intelligent Meeting Scheduling**: AI-powered conflict detection and resolution
- **Optimal Time Recommendations**: Smart suggestions based on participant availability and preferences
- **Multi-timezone Support**: Handle meetings across different time zones seamlessly

### AI-Powered Features
- **Meeting Pattern Analysis**: Analyze frequency, duration, and productivity trends
- **Automatic Agenda Generation**: Generate agendas from meeting history and context
- **Participant Workload Balancing**: Ensure fair distribution of meeting load
- **Meeting Effectiveness Scoring**: Assess and improve meeting productivity
- **Schedule Optimization**: AI-driven recommendations for better time management

## MCP Tools

### Meeting Management
- `create_meeting(title, participants, duration, preferences)` - Schedule new meetings with AI assistance
- `find_optimal_slots(participants, duration, date_range)` - Get AI-powered time recommendations
- `detect_scheduling_conflicts(user_id, time_range)` - Identify and resolve conflicts

### Analysis & Insights
- `analyze_meeting_patterns(user_id, period)` - Analyze meeting behavior and trends
- `generate_agenda_suggestions(meeting_topic, participants)` - Create smart agendas
- `calculate_workload_balance(team_members)` - Balance meeting load across team
- `score_meeting_effectiveness(meeting_id)` - Assess meeting productivity
- `optimize_meeting_schedule(user_id)` - Get optimization recommendations

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
python src/server.py
```

## Configuration

The server uses sample data from `data/sample_content.json` which includes:
- 60+ sample meetings across multiple users
- Different time zones and preferences
- Various meeting types and durations
- Historical meeting data for analysis

## Testing

Run the test suite:
```bash
python -m pytest tests/
```

## Data Structure

### Meeting Object
```json
{
  "id": "meeting_id",
  "title": "Meeting Title",
  "participants": ["user1@example.com", "user2@example.com"],
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "timezone": "UTC",
  "agenda": "Meeting agenda items...",
  "meeting_type": "team_sync",
  "effectiveness_score": 8.5
}
```

### User Preferences
```json
{
  "user_id": "user@example.com",
  "preferred_hours": {"start": "09:00", "end": "17:00"},
  "timezone": "America/New_York",
  "meeting_preferences": {
    "max_daily_meetings": 5,
    "preferred_duration": 30,
    "buffer_time": 15
  }
}
```

## AI Features Implementation

### Conflict Resolution
- Real-time conflict detection across multiple calendars
- Intelligent rescheduling suggestions
- Priority-based conflict resolution

### Optimal Time Suggestions
- Machine learning-based availability prediction
- Time zone optimization
- Preference learning from user behavior

### Meeting Insights
- Productivity trend analysis
- Meeting effectiveness scoring
- Automated improvement recommendations
 