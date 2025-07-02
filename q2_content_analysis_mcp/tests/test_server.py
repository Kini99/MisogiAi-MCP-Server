import pytest
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def test_create_meeting():
    """Test creating a new meeting"""
    meeting_data = {
        "title": "Test Team Sync",
        "participants": ["alice@example.com", "bob@example.com"],
        "duration": 60,
        "start_time": (datetime.now() + timedelta(hours=1)).isoformat(),
        "timezone": "UTC",
        "agenda": "Test meeting agenda",
        "meeting_type": "team_sync"
    }
    
    response = requests.post(f"{BASE_URL}/create_meeting", json=meeting_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "meeting" in data
    assert data["meeting"]["title"] == "Test Team Sync"

def test_find_optimal_slots():
    """Test finding optimal time slots"""
    slot_data = {
        "participants": ["alice@example.com", "bob@example.com"],
        "duration": 60,
        "date_range": [
            (datetime.now() + timedelta(days=1)).isoformat(),
            (datetime.now() + timedelta(days=2)).isoformat()
        ]
    }
    
    response = requests.post(f"{BASE_URL}/find_optimal_slots", json=slot_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "optimal_slots" in data

def test_detect_conflicts():
    """Test conflict detection"""
    conflict_data = {
        "user_id": "alice@example.com",
        "time_range": [
            (datetime.now() - timedelta(days=1)).isoformat(),
            (datetime.now() + timedelta(days=1)).isoformat()
        ]
    }
    
    response = requests.post(f"{BASE_URL}/detect_scheduling_conflicts", json=conflict_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "conflicts" in data

def test_analyze_patterns():
    """Test meeting pattern analysis"""
    pattern_data = {
        "user_id": "alice@example.com",
        "period": "last_month"
    }
    
    response = requests.post(f"{BASE_URL}/analyze_meeting_patterns", json=pattern_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "patterns" in data

def test_generate_agenda():
    """Test agenda generation"""
    agenda_data = {
        "meeting_topic": "Product Planning",
        "participants": ["alice@example.com", "carol@example.com"]
    }
    
    response = requests.post(f"{BASE_URL}/generate_agenda_suggestions", json=agenda_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "agenda_suggestions" in data

def test_workload_balance():
    """Test workload balance calculation"""
    workload_data = {
        "team_members": ["alice@example.com", "bob@example.com", "carol@example.com"]
    }
    
    response = requests.post(f"{BASE_URL}/calculate_workload_balance", json=workload_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "workload_distribution" in data

def test_effectiveness_scoring():
    """Test meeting effectiveness scoring"""
    effectiveness_data = {
        "meeting_id": "m1"
    }
    
    response = requests.post(f"{BASE_URL}/score_meeting_effectiveness", json=effectiveness_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "effectiveness_score" in data

def test_schedule_optimization():
    """Test schedule optimization"""
    optimization_data = {
        "user_id": "alice@example.com"
    }
    
    response = requests.post(f"{BASE_URL}/optimize_meeting_schedule", json=optimization_data)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "recommendations" in data

if __name__ == "__main__":
    print("Running MCP Server Tests...")
    print("Make sure the server is running on http://127.0.0.1:8000")
    
    # Run tests
    test_functions = [
        test_create_meeting,
        test_find_optimal_slots,
        test_detect_conflicts,
        test_analyze_patterns,
        test_generate_agenda,
        test_workload_balance,
        test_effectiveness_scoring,
        test_schedule_optimization
    ]
    
    for test_func in test_functions:
        try:
            test_func()
            print(f"✓ {test_func.__name__} passed")
        except Exception as e:
            print(f"✗ {test_func.__name__} failed: {e}")
    
    print("\nAll tests completed!") 