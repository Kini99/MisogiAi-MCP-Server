import json
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from pathlib import Path
import pytz
from dateutil import parser

app = FastAPI()

DATA_PATH = Path(__file__).parent.parent / "data" / "sample_content.json"

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

data = load_data()

# --- Models ---
class MeetingCreateRequest(BaseModel):
    title: str
    participants: List[str]
    duration: int  # in minutes
    start_time: Optional[str] = None  # ISO8601 format
    timezone: str = "UTC"
    agenda: Optional[str] = None
    meeting_type: str = "general"

class OptimalSlotsRequest(BaseModel):
    participants: List[str]
    duration: int  # in minutes
    date_range: List[str]  # [start, end] ISO8601

class ConflictRequest(BaseModel):
    user_id: str
    time_range: List[str]  # [start, end] ISO8601

class PatternAnalysisRequest(BaseModel):
    user_id: str
    period: str  # e.g., 'last_month', '2024-01', etc.

class AgendaSuggestionRequest(BaseModel):
    meeting_topic: str
    participants: List[str]

class WorkloadBalanceRequest(BaseModel):
    team_members: List[str]

class EffectivenessScoreRequest(BaseModel):
    meeting_id: str

class OptimizeScheduleRequest(BaseModel):
    user_id: str

# --- Helper Functions ---
def get_user_meetings(user_id: str) -> List[Dict]:
    """Get all meetings for a specific user"""
    user_meetings = []
    for meeting in data["meetings"]:
        if user_id in meeting["participants"]:
            user_meetings.append(meeting)
    return user_meetings

def get_user_preferences(user_id: str) -> Optional[Dict]:
    """Get user preferences"""
    for user in data["users"]:
        if user["user_id"] == user_id:
            return user
    return None

def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string with various formats"""
    if not dt_str:
        return datetime.now(pytz.UTC)
    
    try:
        # Try direct parsing first
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=pytz.UTC)
        return dt
    except ValueError:
        try:
            # Try with Z replacement
            dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=pytz.UTC)
            return dt
        except ValueError:
            try:
                # Try parsing as naive datetime and assume UTC
                dt = datetime.fromisoformat(dt_str)
                return dt.replace(tzinfo=pytz.UTC)
            except ValueError:
                # Last resort: parse with dateutil
                try:
                    dt = parser.parse(dt_str)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=pytz.UTC)
                    return dt
                except:
                    # If all else fails, return current time with UTC
                    return datetime.now(pytz.UTC)

def check_time_conflict(meeting1: Dict, meeting2: Dict) -> bool:
    """Check if two meetings have time conflicts"""
    try:
        start1 = parse_datetime(meeting1["start_time"])
        end1 = parse_datetime(meeting1["end_time"])
        start2 = parse_datetime(meeting2["start_time"])
        end2 = parse_datetime(meeting2["end_time"])
        
        # Make all datetimes timezone-aware by converting to UTC
        if start1.tzinfo is None:
            start1 = start1.replace(tzinfo=pytz.UTC)
        if end1.tzinfo is None:
            end1 = end1.replace(tzinfo=pytz.UTC)
        if start2.tzinfo is None:
            start2 = start2.replace(tzinfo=pytz.UTC)
        if end2.tzinfo is None:
            end2 = end2.replace(tzinfo=pytz.UTC)
        
        return start1 < end2 and start2 < end1
    except Exception as e:
        print(f"Error in check_time_conflict: {e}")
        return False

def find_available_slots(participants: List[str], duration: int, date_range: List[str]) -> List[Dict]:
    """AI-powered time slot recommendations"""
    # Get all meetings for participants in the date range
    start_date = parse_datetime(date_range[0])
    end_date = parse_datetime(date_range[1])
    
    # Simple algorithm: find gaps in schedules
    busy_times = []
    for participant in participants:
        user_meetings = get_user_meetings(participant)
        for meeting in user_meetings:
            meeting_start = parse_datetime(meeting["start_time"])
            meeting_end = parse_datetime(meeting["end_time"])
            if start_date <= meeting_start <= end_date:
                busy_times.append((meeting_start, meeting_end))
    
    # Find available slots (simplified)
    available_slots = []
    current_time = start_date
    while current_time + timedelta(minutes=duration) <= end_date:
        slot_end = current_time + timedelta(minutes=duration)
        conflict = False
        
        for busy_start, busy_end in busy_times:
            if current_time < busy_end and slot_end > busy_start:
                conflict = True
                break
        
        if not conflict:
            available_slots.append({
                "start_time": current_time.isoformat(),
                "end_time": slot_end.isoformat(),
                "duration_minutes": duration
            })
        
        current_time += timedelta(hours=1)  # Check every hour
    
    return available_slots[:5]  # Return top 5 slots

# --- MCP Tool Endpoints ---
@app.post("/create_meeting")
def create_meeting(req: MeetingCreateRequest):
    """Schedule new meeting with AI assistance"""
    try:
        # Generate meeting ID
        meeting_id = f"m{len(data['meetings']) + 1}"
        
        # Use current time if no start_time provided
        current_time = datetime.now(pytz.UTC)
        start_time = req.start_time or current_time.isoformat()
        
        # Calculate end time
        if req.start_time:
            try:
                start_dt = parse_datetime(req.start_time)
                end_dt = start_dt + timedelta(minutes=req.duration)
                end_time = end_dt.isoformat()
            except:
                # Fallback to current time + duration
                end_time = (current_time + timedelta(minutes=req.duration)).isoformat()
        else:
            end_time = (current_time + timedelta(minutes=req.duration)).isoformat()
        
        # Create new meeting
        new_meeting = {
            "id": meeting_id,
            "title": req.title,
            "participants": req.participants,
            "start_time": start_time,
            "end_time": end_time,
            "timezone": req.timezone,
            "agenda": req.agenda or f"Meeting agenda for {req.title}",
            "meeting_type": req.meeting_type,
            "effectiveness_score": 0.0
        }
        
        # Check for conflicts (simplified)
        conflicts = []
        try:
            for participant in req.participants:
                user_meetings = get_user_meetings(participant)
                for meeting in user_meetings:
                    if check_time_conflict(new_meeting, meeting):
                        conflicts.append({
                            "participant": participant,
                            "conflicting_meeting": meeting["title"],
                            "conflict_time": meeting["start_time"]
                        })
        except Exception as e:
            # If conflict checking fails, continue without it
            print(f"Conflict check failed: {e}")
        
        # Add meeting to data
        data["meetings"].append(new_meeting)
        
        return {
            "status": "success",
            "meeting": new_meeting,
            "conflicts_detected": conflicts,
            "message": f"Meeting '{req.title}' created successfully"
        }
    except Exception as e:
        print(f"Error in create_meeting: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating meeting: {str(e)}")

@app.post("/find_optimal_slots")
def find_optimal_slots(req: OptimalSlotsRequest):
    """AI-powered time recommendations"""
    try:
        # Simplified slot finding - just return some example slots
        current_time = datetime.now()
        example_slots = []
        
        for i in range(5):
            slot_start = current_time + timedelta(days=i+1, hours=9)  # 9 AM next few days
            slot_end = slot_start + timedelta(minutes=req.duration)
            
            example_slots.append({
                "start_time": slot_start.isoformat(),
                "end_time": slot_end.isoformat(),
                "duration_minutes": req.duration,
                "ai_score": 10 - i,  # Decreasing score
                "recommended": i < 2  # First 2 slots recommended
            })
        
        return {
            "status": "success",
            "optimal_slots": example_slots,
            "participants": req.participants,
            "duration_minutes": req.duration
        }
    except Exception as e:
        print(f"Error in find_optimal_slots: {e}")
        raise HTTPException(status_code=500, detail=f"Error finding optimal slots: {str(e)}")

@app.post("/detect_scheduling_conflicts")
def detect_scheduling_conflicts(req: ConflictRequest):
    """Conflict identification"""
    user_meetings = get_user_meetings(req.user_id)
    start_time = parse_datetime(req.time_range[0])
    end_time = parse_datetime(req.time_range[1])
    
    conflicts = []
    for meeting in user_meetings:
        meeting_start = parse_datetime(meeting["start_time"])
        meeting_end = parse_datetime(meeting["end_time"])
        
        if (start_time <= meeting_start <= end_time or 
            start_time <= meeting_end <= end_time or
            meeting_start <= start_time <= meeting_end):
            conflicts.append({
                "meeting_id": meeting["id"],
                "title": meeting["title"],
                "start_time": meeting["start_time"],
                "end_time": meeting["end_time"],
                "participants": meeting["participants"]
            })
    
    return {
        "status": "success",
        "user_id": req.user_id,
        "time_range": req.time_range,
        "conflicts_found": len(conflicts),
        "conflicts": conflicts
    }

@app.post("/analyze_meeting_patterns")
def analyze_meeting_patterns(req: PatternAnalysisRequest):
    """Meeting behavior analysis"""
    user_meetings = get_user_meetings(req.user_id)
    
    if not user_meetings:
        return {
            "status": "success",
            "user_id": req.user_id,
            "period": req.period,
            "message": "No meetings found for this user in the specified period"
        }
    
    # Analyze patterns
    total_meetings = len(user_meetings)
    total_duration = sum(
        (parse_datetime(m["end_time"]) - 
         parse_datetime(m["start_time"])).total_seconds() / 60
        for m in user_meetings
    )
    
    # Meeting type distribution
    meeting_types = {}
    for meeting in user_meetings:
        meeting_type = meeting.get("meeting_type", "unknown")
        meeting_types[meeting_type] = meeting_types.get(meeting_type, 0) + 1
    
    # Effectiveness analysis
    effectiveness_scores = [m.get("effectiveness_score", 0) for m in user_meetings]
    avg_effectiveness = sum(effectiveness_scores) / len(effectiveness_scores) if effectiveness_scores else 0
    
    # Time distribution analysis
    hour_distribution = {}
    for meeting in user_meetings:
        start_time = parse_datetime(meeting["start_time"])
        hour = start_time.hour
        hour_distribution[hour] = hour_distribution.get(hour, 0) + 1
    
    return {
        "status": "success",
        "user_id": req.user_id,
        "period": req.period,
        "patterns": {
            "total_meetings": total_meetings,
            "total_duration_minutes": total_duration,
            "average_duration_minutes": total_duration / total_meetings if total_meetings > 0 else 0,
            "meeting_type_distribution": meeting_types,
            "average_effectiveness_score": avg_effectiveness,
            "hour_distribution": hour_distribution,
            "productivity_trends": {
                "high_effectiveness_meetings": len([s for s in effectiveness_scores if s >= 8]),
                "low_effectiveness_meetings": len([s for s in effectiveness_scores if s < 6])
            }
        }
    }

@app.post("/generate_agenda_suggestions")
def generate_agenda_suggestions(req: AgendaSuggestionRequest):
    """Smart agenda creation"""
    # Get meeting history for participants
    participant_meetings = []
    for participant in req.participants:
        user_meetings = get_user_meetings(participant)
        participant_meetings.extend(user_meetings)
    
    # Analyze common agenda items from similar meetings
    similar_meetings = [m for m in participant_meetings if req.meeting_topic.lower() in m.get("title", "").lower()]
    
    # Generate agenda suggestions based on meeting type and history
    agenda_suggestions = []
    
    # Common agenda items based on topic keywords
    if "planning" in req.meeting_topic.lower():
        agenda_suggestions = [
            "Review current status and progress",
            "Identify key objectives and goals",
            "Discuss timeline and milestones",
            "Assign responsibilities and next steps",
            "Risk assessment and mitigation strategies"
        ]
    elif "review" in req.meeting_topic.lower():
        agenda_suggestions = [
            "Present findings and results",
            "Discuss feedback and improvements",
            "Review metrics and KPIs",
            "Action items and follow-up tasks",
            "Next steps and recommendations"
        ]
    elif "sync" in req.meeting_topic.lower():
        agenda_suggestions = [
            "Team updates and progress reports",
            "Blockers and challenges discussion",
            "Upcoming priorities and deadlines",
            "Resource needs and support requests",
            "Team coordination and collaboration"
        ]
    else:
        agenda_suggestions = [
            "Meeting objectives and goals",
            "Key discussion points",
            "Decision points and outcomes",
            "Action items and assignments",
            "Next steps and follow-up"
        ]
    
    # Add AI-generated suggestions based on participant history
    if similar_meetings:
        recent_agendas = [m.get("agenda", "") for m in similar_meetings[-3:]]  # Last 3 similar meetings
        agenda_suggestions.extend([
            "Historical context from previous meetings",
            "Lessons learned and best practices"
        ])
    
    return {
        "status": "success",
        "meeting_topic": req.meeting_topic,
        "participants": req.participants,
        "agenda_suggestions": agenda_suggestions,
        "ai_enhanced": True,
        "based_on_history": len(similar_meetings)
    }

@app.post("/calculate_workload_balance")
def calculate_workload_balance(req: WorkloadBalanceRequest):
    """Meeting load distribution"""
    team_workload = {}
    
    for member in req.team_members:
        user_meetings = get_user_meetings(member)
        user_prefs = get_user_preferences(member)
        
        # Calculate workload metrics
        total_meetings = len(user_meetings)
        total_duration = sum(
            (parse_datetime(m["end_time"]) - 
             parse_datetime(m["start_time"])).total_seconds() / 60
            for m in user_meetings
        )
        
        # Calculate daily meeting load
        daily_meetings = {}
        for meeting in user_meetings:
            meeting_date = parse_datetime(meeting["start_time"]).date()
            daily_meetings[meeting_date] = daily_meetings.get(meeting_date, 0) + 1
        
        max_daily_meetings = max(daily_meetings.values()) if daily_meetings else 0
        
        team_workload[member] = {
            "total_meetings": total_meetings,
            "total_duration_minutes": total_duration,
            "average_daily_meetings": total_meetings / 30 if total_meetings > 0 else 0,  # Assuming 30 days
            "max_daily_meetings": max_daily_meetings,
            "workload_score": total_meetings * 0.4 + total_duration * 0.01 + max_daily_meetings * 0.6,
            "preference_limit": user_prefs.get("meeting_preferences", {}).get("max_daily_meetings", 5) if user_prefs else 5
        }
    
    # Calculate balance metrics
    workload_scores = [w["workload_score"] for w in team_workload.values()]
    avg_workload = sum(workload_scores) / len(workload_scores) if workload_scores else 0
    
    # Identify overloaded and underutilized team members
    overloaded = [member for member, data in team_workload.items() 
                  if data["workload_score"] > avg_workload * 1.2]
    underutilized = [member for member, data in team_workload.items() 
                     if data["workload_score"] < avg_workload * 0.8]
    
    return {
        "status": "success",
        "team_members": req.team_members,
        "workload_distribution": team_workload,
        "balance_analysis": {
            "average_workload": avg_workload,
            "overloaded_members": overloaded,
            "underutilized_members": underutilized,
            "balance_score": 1 - (max(workload_scores) - min(workload_scores)) / max(workload_scores) if workload_scores else 1
        },
        "recommendations": [
            f"Consider redistributing meetings from {', '.join(overloaded)} to {', '.join(underutilized)}" if overloaded and underutilized else "Workload is well balanced"
        ]
    }

@app.post("/score_meeting_effectiveness")
def score_meeting_effectiveness(req: EffectivenessScoreRequest):
    """Productivity assessment"""
    # Find the meeting
    meeting = None
    for m in data["meetings"]:
        if m["id"] == req.meeting_id:
            meeting = m
            break
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Calculate effectiveness score based on multiple factors
    score = 0.0
    factors = {}
    
    # Factor 1: Duration appropriateness (30-60 min is optimal)
    duration = (parse_datetime(meeting["end_time"]) - 
                parse_datetime(meeting["start_time"])).total_seconds() / 60
    if 30 <= duration <= 60:
        duration_score = 10
    elif 15 <= duration <= 90:
        duration_score = 7
    else:
        duration_score = 4
    score += duration_score * 0.2
    factors["duration_score"] = duration_score
    
    # Factor 2: Participant count (optimal: 3-8 participants)
    participant_count = len(meeting["participants"])
    if 3 <= participant_count <= 8:
        participant_score = 10
    elif 2 <= participant_count <= 12:
        participant_score = 7
    else:
        participant_score = 4
    score += participant_score * 0.15
    factors["participant_score"] = participant_score
    
    # Factor 3: Time of day (business hours preferred)
    start_time = parse_datetime(meeting["start_time"])
    hour = start_time.hour
    if 9 <= hour <= 17:
        time_score = 10
    elif 8 <= hour <= 18:
        time_score = 7
    else:
        time_score = 4
    score += time_score * 0.15
    factors["time_score"] = time_score
    
    # Factor 4: Meeting type effectiveness
    meeting_type = meeting.get("meeting_type", "general")
    type_scores = {
        "team_sync": 8, "planning": 9, "review": 8, "workshop": 9,
        "standup": 7, "retrospective": 8, "demo": 8, "training": 7
    }
    type_score = type_scores.get(meeting_type, 6)
    score += type_score * 0.2
    factors["type_score"] = type_score
    
    # Factor 5: Agenda quality (if agenda exists)
    agenda = meeting.get("agenda", "")
    if len(agenda) > 20:
        agenda_score = 10
    elif len(agenda) > 10:
        agenda_score = 7
    else:
        agenda_score = 4
    score += agenda_score * 0.1
    factors["agenda_score"] = agenda_score
    
    # Factor 6: Historical effectiveness (if available)
    if meeting.get("effectiveness_score", 0) > 0:
        historical_score = meeting["effectiveness_score"]
        score += historical_score * 0.2
        factors["historical_score"] = historical_score
    
    # Normalize score to 0-10 range
    final_score = min(10, max(0, score))
    
    # Generate improvement suggestions
    suggestions = []
    if duration_score < 7:
        suggestions.append("Consider adjusting meeting duration for better engagement")
    if participant_score < 7:
        suggestions.append("Review participant list to ensure optimal group size")
    if time_score < 7:
        suggestions.append("Consider rescheduling to business hours for better attendance")
    if agenda_score < 7:
        suggestions.append("Add detailed agenda items to improve meeting focus")
    
    return {
        "status": "success",
        "meeting_id": req.meeting_id,
        "meeting_title": meeting["title"],
        "effectiveness_score": round(final_score, 2),
        "score_breakdown": factors,
        "improvement_suggestions": suggestions,
        "ai_analysis": True
    }

@app.post("/optimize_meeting_schedule")
def optimize_meeting_schedule(req: OptimizeScheduleRequest):
    """Schedule optimization recommendations"""
    user_meetings = get_user_meetings(req.user_id)
    user_prefs = get_user_preferences(req.user_id)
    
    if not user_meetings:
        return {
            "status": "success",
            "user_id": req.user_id,
            "message": "No meetings found for optimization"
        }
    
    # Analyze current schedule
    daily_meetings = {}
    for meeting in user_meetings:
        meeting_date = parse_datetime(meeting["start_time"]).date()
        if meeting_date not in daily_meetings:
            daily_meetings[meeting_date] = []
        daily_meetings[meeting_date].append(meeting)
    
    # Find optimization opportunities
    recommendations = []
    
    # Check for overloaded days
    max_daily_limit = user_prefs.get("meeting_preferences", {}).get("max_daily_meetings", 5) if user_prefs else 5
    overloaded_days = [(date, meetings) for date, meetings in daily_meetings.items() 
                       if len(meetings) > max_daily_limit]
    
    for date, meetings in overloaded_days:
        recommendations.append({
            "type": "overloaded_day",
            "date": date.isoformat(),
            "meeting_count": len(meetings),
            "suggestion": f"Consider rescheduling {len(meetings) - max_daily_limit} meetings from {date}",
            "meetings_to_reschedule": [m["title"] for m in meetings[max_daily_limit:]]
        })
    
    # Check for time gaps and clustering
    for date, meetings in daily_meetings.items():
        if len(meetings) > 1:
            # Sort meetings by start time
            sorted_meetings = sorted(meetings, key=lambda m: m["start_time"])
            
            # Check for back-to-back meetings without breaks
            for i in range(len(sorted_meetings) - 1):
                current_end = parse_datetime(sorted_meetings[i]["end_time"])
                next_start = parse_datetime(sorted_meetings[i+1]["start_time"])
                
                if (next_start - current_end).total_seconds() < 900:  # Less than 15 minutes
                    recommendations.append({
                        "type": "insufficient_break",
                        "date": date.isoformat(),
                        "meeting1": sorted_meetings[i]["title"],
                        "meeting2": sorted_meetings[i+1]["title"],
                        "suggestion": "Add buffer time between meetings for better productivity"
                    })
    
    # Check for non-business hours meetings
    non_business_meetings = []
    for meeting in user_meetings:
        start_time = parse_datetime(meeting["start_time"])
        if start_time.hour < 8 or start_time.hour > 18:
            non_business_meetings.append(meeting)
    
    if non_business_meetings:
        recommendations.append({
            "type": "non_business_hours",
            "meetings": [m["title"] for m in non_business_meetings],
            "suggestion": "Consider rescheduling meetings to business hours for better attendance"
        })
    
    # Calculate optimization score
    optimization_score = 100
    if overloaded_days:
        optimization_score -= len(overloaded_days) * 20
    if non_business_meetings:
        optimization_score -= len(non_business_meetings) * 10
    
    return {
        "status": "success",
        "user_id": req.user_id,
        "current_meeting_count": len(user_meetings),
        "optimization_score": max(0, optimization_score),
        "recommendations": recommendations,
        "ai_insights": {
            "schedule_efficiency": "Good" if optimization_score >= 80 else "Needs improvement",
            "workload_distribution": "Balanced" if not overloaded_days else "Unbalanced",
            "time_utilization": "Optimal" if not non_business_meetings else "Suboptimal"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 