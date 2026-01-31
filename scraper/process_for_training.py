#!/usr/bin/env python3
"""
SCORE Content --> Ira Training Data Processor
============================================
Converts scraped SCORE.org content into Q&A pairs for fine-tuning Ira.
Infuses responses with Buffett wisdom, Robbins energy, and Singer presence.
"""

import json
import random
from pathlib import Path
from typing import List, Dict
from dataclasses import dataclass

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.panel import Panel

console = Console()

# Ira's system prompt for training
IRA_SYSTEM_PROMPT = """You are Ira, the wise and grounded AI mentor for BEAM. You embody:
- Warren Buffett's patient wisdom and focus on fundamentals
- Tony Robbins' empowering energy and action orientation
- Michael Singer's grounded presence and inner peace

Guide entrepreneurs with warmth, clarity, and practical wisdom."""

# Response style templates to infuse personality
STYLE_OPENINGS = {
    "buffett": [
        "Let me share something that the best investors understand: ",
        "Here's a principle that's guided successful businesses for decades: ",
        "The fundamentals matter most here. ",
        "Think long-term on this one. ",
        "Simplicity is key here. ",
    ],
    "robbins": [
        "Here's what I want you to understand: ",
        "Let me ask you something powerful: ",
        "This is your moment. ",
        "The answer is already within you. ",
        "Let's break through this together. ",
    ],
    "singer": [
        "Take a breath with me first. ",
        "Before we dive in, let's get centered. ",
        "There's wisdom in this challenge. ",
        "Let's look at this from a place of clarity. ",
        "Remember, you are more than this situation. ",
    ],
}

STYLE_CLOSINGS = {
    "buffett": [
        "\n\nFocus on value, not vanity metrics.",
        "\n\nPatience and discipline will serve you well here.",
        "\n\nDo this well, and the results will compound over time.",
    ],
    "robbins": [
        "\n\nWhat's one action you can take TODAY to move forward?",
        "\n\nYour potential here is unlimited. Now go make it happen.",
        "\n\nYou've got this. Take massive action.",
    ],
    "singer": [
        "\n\nTrust the process. You're exactly where you need to be.",
        "\n\nLet go of the need to control every outcome.",
        "\n\nBuild from a place of presence, not anxiety.",
    ],
}


@dataclass
class QAPair:
    """A question-answer pair for training."""
    question: str
    answer: str
    source_url: str
    category: str
    topics: List[str]


def generate_questions_from_content(content: Dict) -> List[str]:
    """Generate natural questions that the content answers."""
    title = content.get("title", "")
    text = content.get("content", "")
    topics = content.get("topics", [])
    content_type = content.get("type", "article")

    questions = []

    # Title-based questions
    if title:
        title_lower = title.lower()

        # "How to" content
        if any(phrase in title_lower for phrase in ["how to", "guide to", "steps to"]):
            questions.append(f"How do I {title_lower.replace('how to ', '').replace('guide to ', '')}?")

        # Template content
        if "template" in title_lower:
            topic = title_lower.replace("template", "").strip()
            questions.extend([
                f"Do you have a {topic} template I can use?",
                f"How do I create a {topic}?",
                f"What should be in a {topic}?",
            ])

        # "What is" content
        if any(phrase in title_lower for phrase in ["understanding", "basics", "introduction", "what is"]):
            topic = title_lower.replace("understanding", "").replace("basics of", "").replace("introduction to", "").strip()
            questions.extend([
                f"What is {topic}?",
                f"Can you explain {topic}?",
                f"Help me understand {topic}",
            ])

    # Topic-based questions
    topic_questions = {
        "business plan": [
            "How do I write a business plan?",
            "What should be in my business plan?",
            "Do I need a business plan?",
        ],
        "funding": [
            "How do I fund my business?",
            "What funding options are available?",
            "Should I take on investors?",
            "How do I get a small business loan?",
        ],
        "marketing": [
            "How do I market my business?",
            "What marketing strategies work for small businesses?",
            "How do I get my first customers?",
        ],
        "cash flow": [
            "How do I manage cash flow?",
            "Why is cash flow important?",
            "How do I create a cash flow statement?",
        ],
        "pricing": [
            "How do I price my product?",
            "What pricing strategy should I use?",
            "How do I know if my prices are right?",
        ],
        "hiring": [
            "When should I hire my first employee?",
            "How do I hire the right people?",
            "What should I pay my first employee?",
        ],
        "legal structure": [
            "What business structure should I choose?",
            "LLC vs corporation - which is better?",
            "Do I need to incorporate?",
        ],
        "startup": [
            "How do I start a business?",
            "What do I need to start a business?",
            "I have a business idea - what next?",
        ],
        "growth": [
            "How do I grow my business?",
            "When should I scale?",
            "How do I take my business to the next level?",
        ],
        "sales": [
            "How do I increase sales?",
            "What sales techniques work?",
            "How do I close more deals?",
        ],
        "financial": [
            "How do I manage my business finances?",
            "What financial reports do I need?",
            "How do I read financial statements?",
        ],
        "customer": [
            "How do I find customers?",
            "How do I keep customers happy?",
            "How do I handle difficult customers?",
        ],
    }

    for topic in topics:
        if topic.lower() in topic_questions:
            questions.extend(topic_questions[topic.lower()])

    # Generic questions based on content type
    if content_type == "templates":
        questions.append("What templates do you have for small businesses?")
    elif content_type == "courses":
        questions.append("What courses or training do you recommend?")
    elif content_type == "stories":
        questions.append("Can you share a success story?")

    return list(set(questions))[:5]  # Max 5 questions per content


def infuse_personality(content: str, content_type: str) -> str:
    """Add Ira's personality to content-based response."""
    # Choose a style blend
    styles = ["buffett", "robbins", "singer"]
    weights = [0.4, 0.35, 0.25]  # Slight preference for Buffett wisdom

    primary_style = random.choices(styles, weights=weights)[0]

    # Add opening
    opening = random.choice(STYLE_OPENINGS[primary_style])

    # Add closing
    closing = random.choice(STYLE_CLOSINGS[primary_style])

    # Clean and structure the content
    paragraphs = content.split("\n\n")
    if len(paragraphs) > 3:
        # Summarize if too long
        content = "\n\n".join(paragraphs[:3])
        content += "\n\nThere's more depth to this topic. Would you like me to go deeper on any specific aspect?"

    return opening + content + closing


def create_qa_pair(question: str, content: Dict) -> QAPair:
    """Create a Q&A training pair."""
    # Extract and clean the relevant content
    full_content = content.get("content", "")
    title = content.get("title", "")

    # Create a focused answer
    paragraphs = [p.strip() for p in full_content.split("\n\n") if p.strip()]

    # Take first few paragraphs for concise answer
    answer_content = "\n\n".join(paragraphs[:4])

    # Keep it reasonable length
    if len(answer_content) > 2000:
        answer_content = answer_content[:2000] + "..."

    # Infuse with Ira's personality
    styled_answer = infuse_personality(answer_content, content.get("type", "article"))

    return QAPair(
        question=question,
        answer=styled_answer,
        source_url=content.get("url", ""),
        category=content.get("category", "general"),
        topics=content.get("topics", []),
    )


def process_scraped_content():
    """Main processing function."""
    console.print(Panel.fit(
        "[bold blue]SCORE --> Ira Training Processor[/bold blue]\n"
        "Converting content to Q&A pairs with personality",
        border_style="blue"
    ))

    # Load scraped content
    input_path = Path("output/training/score_training.jsonl")
    if not input_path.exists():
        console.print("[red][X] No scraped content found. Run scraper.py first.[/red]")
        return

    content_items = []
    with open(input_path, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                content_items.append(json.loads(line))

    console.print(f"[green]OK[/green] Loaded {len(content_items)} content items")

    # Generate Q&A pairs
    qa_pairs = []

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:

        task = progress.add_task("Generating Q&A pairs...", total=len(content_items))

        for content in content_items:
            questions = generate_questions_from_content(content)

            for question in questions:
                qa_pair = create_qa_pair(question, content)
                qa_pairs.append(qa_pair)

            progress.advance(task)

    console.print(f"[green]OK[/green] Generated {len(qa_pairs)} Q&A pairs")

    # Sort by topic relevance (more topics = more relevant)
    qa_pairs.sort(key=lambda x: len(x.topics), reverse=True)

    # Save training data
    output_path = Path("output/training/ira_training_data.jsonl")

    with open(output_path, "w", encoding="utf-8") as f:
        for qa in qa_pairs:
            training_example = {
                "messages": [
                    {"role": "system", "content": IRA_SYSTEM_PROMPT},
                    {"role": "user", "content": qa.question},
                    {"role": "assistant", "content": qa.answer},
                ]
            }
            f.write(json.dumps(training_example, ensure_ascii=False) + "\n")

    console.print(f"[green]OK[/green] Saved training data: {output_path}")

    # Create validation split
    random.shuffle(qa_pairs)
    split_idx = int(len(qa_pairs) * 0.9)
    train_pairs = qa_pairs[:split_idx]
    eval_pairs = qa_pairs[split_idx:]

    # Save splits
    train_path = Path("output/training/train.jsonl")
    eval_path = Path("output/training/eval.jsonl")

    for pairs, path in [(train_pairs, train_path), (eval_pairs, eval_path)]:
        with open(path, "w", encoding="utf-8") as f:
            for qa in pairs:
                example = {
                    "messages": [
                        {"role": "system", "content": IRA_SYSTEM_PROMPT},
                        {"role": "user", "content": qa.question},
                        {"role": "assistant", "content": qa.answer},
                    ]
                }
                f.write(json.dumps(example, ensure_ascii=False) + "\n")

    console.print(f"[green]OK[/green] Train set: {len(train_pairs)} examples --> {train_path}")
    console.print(f"[green]OK[/green] Eval set: {len(eval_pairs)} examples --> {eval_path}")

    # Summary stats
    console.print(Panel.fit(
        f"[bold green]Processing Complete![/bold green]\n\n"
        f"Content Items: {len(content_items)}\n"
        f"Q&A Pairs: {len(qa_pairs)}\n"
        f"Train: {len(train_pairs)} | Eval: {len(eval_pairs)}\n\n"
        f"Ready for training! Copy to training/data/ folder:\n"
        f"  cp output/training/train.jsonl ../training/data/\n"
        f"  cp output/training/eval.jsonl ../training/data/",
        border_style="green"
    ))


if __name__ == "__main__":
    process_scraped_content()
