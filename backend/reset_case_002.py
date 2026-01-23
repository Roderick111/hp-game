#!/usr/bin/env python3
"""Quick script to reset case_002 so you can test verdict submission."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))


def reset_case():
    """Reset case_002 for player 'default'."""
    from src.state.persistence import delete_state

    case_id = "case_002"
    player_id = "default"

    print(f"🔄 Resetting {case_id} for player {player_id}...")

    try:
        result = delete_state(case_id, player_id)
        if result:
            print(f"✅ Case reset successfully!")
            print(f"   You now have fresh attempts to submit verdict.")
        else:
            print(f"⚠️  No saved state found (case may already be reset)")
    except Exception as e:
        print(f"❌ Error resetting case: {e}")

    print(f"\n📋 Next steps:")
    print(f"   1. Reload the game in your browser")
    print(f"   2. Start case_002 fresh")
    print(f"   3. Submit verdict - should work now!")


if __name__ == "__main__":
    reset_case()
