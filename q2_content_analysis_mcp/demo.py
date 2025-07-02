#!/usr/bin/env python3
"""
Demo script for the Meeting & Calendar Management MCP Server
Shows how to use all the AI-powered features
"""

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

def demo_create_meeting():
    """Demo: Create a new meeting with AI assistance"""
    print("\n=== Creating a New Meeting ===")
    
    meeting_data = {
        "title": "AI-Powered Product Review",
        "participants": ["alice@example.com", "bob@example.com", "carol@example.com"],
        "duration": 45,
        "start_time": (datetime.now() + timedelta(hours=2)).isoformat(),
        "timezone": "UTC",
        "agenda": "Review AI features and plan next sprint",
        "meeting_type": "product_review"
    }
    
    response = requests.post(f"{BASE_URL}/create_meeting", json=meeting_data)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Meeting created: {data['meeting']['title']}")
        if data['conflicts_detected']:
            print(f"⚠ Conflicts detected: {len(data['conflicts_detected'])}")
        else:
            print("✓ No conflicts detected")
    else:
        print(f"✗ Error: {response.status_code}")

def demo_find_optimal_slots():
    """Demo: Find optimal time slots"""
    print("\n=== Finding Optimal Time Slots ===")
    
    slot_data = {
        "participants": ["alice@example.com", "bob@example.com", "david@example.com"],
        "duration": 60,
        "date_range": [
            (datetime.now() + timedelta(days=1)).isoformat(),
            (datetime.now() + timedelta(days=3)).isoformat()
        ]
    }
    
    response = requests.post(f"{BASE_URL}/find_optimal_slots", json=slot_data)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Found {len(data['optimal_slots'])} optimal slots")
        for i, slot in enumerate(data['optimal_slots'][:3], 1):
            start_time = datetime.fromisoformat(slot['start_time'].replace('Z', '+00:00'))
            print(f"  {i}. {start_time.strftime('%Y-%m-%d %H:%M')} (Score: {slot['ai_score']})")
    else:
        print(f"✗ Error: {response.status_code}")

def demo_analyze_patterns():
    """Demo: Analyze meeting patterns"""
    print("\n=== Analyzing Meeting Patterns ===")
    
    pattern_data = {
        "user_id": "alice@example.com",
        "period": "last_month"
    }
    
    response = requests.post(f"{BASE_URL}/analyze_meeting_patterns", json=pattern_data)
    if response.status_code == 200:
        data = response.json()
        patterns = data['patterns']
        print(f"✓ Total meetings: {patterns['total_meetings']}")
        print(f"✓ Average duration: {patterns['average_duration_minutes']:.1f} minutes")
        print(f"✓ Average effectiveness: {patterns['average_effectiveness_score']:.1f}/10")
        print(f"✓ Meeting types: {list(patterns['meeting_type_distribution'].keys())}")
    else:
        print(f"✗ Error: {response.status_code}")

def demo_generate_agenda():
    """Demo: Generate smart agenda"""
    print("\n=== Generating Smart Agenda ===")
    
    agenda_data = {
        "meeting_topic": "Sprint Planning",
        "participants": ["alice@example.com", "bob@example.com", "carol@example.com"]
    }
    
    response = requests.post(f"{BASE_URL}/generate_agenda_suggestions", json=agenda_data)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Generated {len(data['agenda_suggestions'])} agenda items")
        for i, item in enumerate(data['agenda_suggestions'][:5], 1):
            print(f"  {i}. {item}")
    else:
        print(f"✗ Error: {response.status_code}")

def demo_workload_balance():
    """Demo: Calculate workload balance"""
    print("\n=== Calculating Workload Balance ===")
    
    workload_data = {
        "team_members": ["alice@example.com", "bob@example.com", "carol@example.com", "david@example.com"]
    }
    
    response = requests.post(f"{BASE_URL}/calculate_workload_balance", json=workload_data)
    if response.status_code == 200:
        data = response.json()
        balance = data['balance_analysis']
        print(f"✓ Average workload: {balance['average_workload']:.1f}")
        print(f"✓ Balance score: {balance['balance_score']:.2f}")
        if balance['overloaded_members']:
            print(f"⚠ Overloaded: {', '.join(balance['overloaded_members'])}")
        if balance['underutilized_members']:
            print(f"⚠ Underutilized: {', '.join(balance['underutilized_members'])}")
    else:
        print(f"✗ Error: {response.status_code}")

def demo_effectiveness_scoring():
    """Demo: Score meeting effectiveness"""
    print("\n=== Scoring Meeting Effectiveness ===")
    
    effectiveness_data = {
        "meeting_id": "m1"
    }
    
    response = requests.post(f"{BASE_URL}/score_meeting_effectiveness", json=effectiveness_data)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Meeting: {data['meeting_title']}")
        print(f"✓ Effectiveness score: {data['effectiveness_score']}/10")
        print(f"✓ AI analysis: {len(data['improvement_suggestions'])} suggestions")
        for suggestion in data['improvement_suggestions'][:2]:
            print(f"  • {suggestion}")
    else:
        print(f"✗ Error: {response.status_code}")

def demo_schedule_optimization():
    """Demo: Optimize meeting schedule"""
    print("\n=== Optimizing Meeting Schedule ===")
    
    optimization_data = {
        "user_id": "alice@example.com"
    }
    
    response = requests.post(f"{BASE_URL}/optimize_meeting_schedule", json=optimization_data)
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Current meetings: {data['current_meeting_count']}")
        print(f"✓ Optimization score: {data['optimization_score']}/100")
        print(f"✓ AI insights: {data['ai_insights']['schedule_efficiency']}")
        if data['recommendations']:
            print(f"✓ Recommendations: {len(data['recommendations'])}")
            for rec in data['recommendations'][:2]:
                print(f"  • {rec['suggestion']}")
    else:
        print(f"✗ Error: {response.status_code}")

def main():
    """Run all demos"""
    print("🤖 Meeting & Calendar Management MCP Server Demo")
    print("=" * 50)
    print("Make sure the server is running on http://127.0.0.1:8000")
    print("Starting demos...")
    
    try:
        # Test server connection
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code != 200:
            print("❌ Server not running! Please start the server first:")
            print("   python src/server.py")
            return
        
        # Run all demos
        demo_create_meeting()
        demo_find_optimal_slots()
        demo_analyze_patterns()
        demo_generate_agenda()
        demo_workload_balance()
        demo_effectiveness_scoring()
        demo_schedule_optimization()
        
        print("\n" + "=" * 50)
        print("🎉 All demos completed successfully!")
        print("📖 Check out the API docs at: http://127.0.0.1:8000/docs")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server! Please start the server first:")
        print("   python src/server.py")
    except Exception as e:
        print(f"❌ Error during demo: {e}")

if __name__ == "__main__":
    main() 