#!/usr/bin/env python3
"""
Full Scraping Pipeline
======================
Runs the complete scraping and processing pipeline in one command.
"""

import subprocess
import sys
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

console = Console()


def run_step(name: str, script: str) -> bool:
    """Run a pipeline step."""
    console.print(f"\n[bold blue]Step: {name}[/bold blue]")
    console.print("=" * 50)

    result = subprocess.run(
        [sys.executable, script],
        cwd=Path(__file__).parent
    )

    if result.returncode != 0:
        console.print(f"[red][X] {name} failed[/red]")
        return False

    console.print(f"[green]OK {name} complete[/green]")
    return True


def main():
    console.print(Panel.fit(
        "[bold magenta]SCORE.org --> Ira Training Pipeline[/bold magenta]\n\n"
        "This will:\n"
        "1. Scrape SCORE.org content (30-60 min)\n"
        "2. Process into Q&A training pairs\n"
        "3. Copy to training folder",
        border_style="magenta"
    ))

    input("\nPress Enter to start (Ctrl+C to cancel)...")

    # Step 1: Scrape
    if not run_step("Scraping SCORE.org", "scraper.py"):
        return

    # Step 2: Process for training
    if not run_step("Processing for Training", "process_for_training.py"):
        return

    # Step 3: Copy to training folder
    console.print("\n[bold blue]Step: Copy to Training Folder[/bold blue]")
    console.print("=" * 50)

    import shutil
    training_data_dir = Path(__file__).parent.parent / "training" / "data"
    training_data_dir.mkdir(parents=True, exist_ok=True)

    for filename in ["train.jsonl", "eval.jsonl"]:
        src = Path("output/training") / filename
        dst = training_data_dir / filename
        if src.exists():
            shutil.copy(src, dst)
            console.print(f"  [green]OK[/green] Copied {filename}")

    console.print(Panel.fit(
        "[bold green]Pipeline Complete![/bold green]\n\n"
        "Training data is ready in: training/data/\n\n"
        "Next steps:\n"
        "  cd ../training\n"
        "  python prepare_data.py\n"
        "  python train.py --push",
        border_style="green"
    ))


if __name__ == "__main__":
    main()
