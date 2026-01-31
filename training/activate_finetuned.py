#!/usr/bin/env python3
"""
Activate Fine-Tuned Ira
=======================
Run this after training completes to switch to the fine-tuned model.
"""

import re
from pathlib import Path

def main():
    env_path = Path(__file__).parent.parent / "site" / ".env.local"

    if not env_path.exists():
        print("ERROR: .env.local not found")
        return

    content = env_path.read_text()

    # Check current state
    if "USE_FINETUNED_IRA=true" in content:
        print("Fine-tuned Ira is already ACTIVE")
        return

    # Update the flag
    new_content = content.replace(
        "USE_FINETUNED_IRA=false",
        "USE_FINETUNED_IRA=true"
    )

    env_path.write_text(new_content)

    print("=" * 50)
    print("FINE-TUNED IRA ACTIVATED!")
    print("=" * 50)
    print()
    print("Ira will now use: buildlikeshane/ira-beam-assistant")
    print()
    print("Next steps:")
    print("  1. Restart your dev server: npm run dev")
    print("  2. Test Ira in the chat widget")
    print("  3. Check health: curl http://localhost:3000/api/ira/health")
    print()


if __name__ == "__main__":
    main()
