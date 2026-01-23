#!/usr/bin/env python3
"""Check the actual state of case_002 to see attempts_remaining and case_solved."""

import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))


def check_state():
    """Check case_002 state."""
    from src.state.persistence import load_state

    case_id = "case_002"
    player_id = "default"

    print(f"\n📊 Checking state for {case_id} / {player_id}")
    print("=" * 70)

    state = load_state(case_id, player_id)

    if state is None:
        print("❌ No saved state found")
        return

    print(f"✅ State loaded")
    print(f"\nCase ID: {state.case_id}")
    print(f"Current Location: {state.current_location}")
    print(f"Evidence Discovered: {len(state.discovered_evidence)} items")

    if state.verdict_state:
        print(f"\n📝 VERDICT STATE:")
        print(f"   Attempts Made: {len(state.verdict_state.attempts)}")
        print(f"   Attempts Remaining: {state.verdict_state.attempts_remaining}")
        print(f"   Case Solved: {state.verdict_state.case_solved}")
        print(f"   Final Verdict: {state.verdict_state.final_verdict is not None}")

        if state.verdict_state.attempts:
            print(f"\n   Last Attempt:")
            last = state.verdict_state.attempts[-1]
            print(f"      Accused: {last.accused_suspect_id}")
            print(f"      Correct: {last.correct}")
            print(f"      Score: {last.score}")
            print(f"      Timestamp: {last.timestamp}")

        print(f"\n🔍 DIAGNOSIS:")
        if state.verdict_state.case_solved:
            print(f"   ⚠️  CASE ALREADY SOLVED!")
            print(f"   This is why you can't submit more verdicts.")
            print(f"   The error message is misleading - it should say:")
            print(f"   'Case already solved with correct verdict'")
        elif state.verdict_state.attempts_remaining <= 0:
            print(f"   ❌ OUT OF ATTEMPTS")
            print(f"   You used all {10 - state.verdict_state.attempts_remaining} attempts")
        else:
            print(f"   ✅ Can still submit verdicts")
            print(f"   {state.verdict_state.attempts_remaining} attempts left")
    else:
        print(f"\n📝 No verdict state yet")

    # Save full state to file for inspection
    state_file = Path(__file__).parent / "case_002_state_dump.json"
    with open(state_file, "w") as f:
        json.dump(state.model_dump(mode="json"), f, indent=2, default=str)
    print(f"\n💾 Full state saved to: {state_file}")


if __name__ == "__main__":
    check_state()
