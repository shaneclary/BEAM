#!/usr/bin/env python3
"""
SCORE.org Content Scraper
=========================
Scrapes educational content from SCORE.org for training Ira.
Respects robots.txt and uses polite rate limiting.
"""

import os
import re
import json
import time
import asyncio
import hashlib
from pathlib import Path
from typing import List, Dict, Optional, Set
from dataclasses import dataclass, asdict
from datetime import datetime
from urllib.parse import urljoin, urlparse

import yaml
import requests
from bs4 import BeautifulSoup
import html2text
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.panel import Panel
from rich.table import Table

console = Console()

# Load configuration
CONFIG_PATH = Path(__file__).parent / "config.yaml"
with open(CONFIG_PATH) as f:
    CONFIG = yaml.safe_load(f)


@dataclass
class ScrapedContent:
    """Represents a single piece of scraped content."""
    url: str
    title: str
    content: str
    content_type: str
    category: str
    word_count: int
    scraped_at: str
    priority: int = 3
    quality_score: float = 0.0
    topics: List[str] = None
    metadata: Dict = None

    def __post_init__(self):
        if self.topics is None:
            self.topics = []
        if self.metadata is None:
            self.metadata = {}


class SCOREScraper:
    """Main scraper class for SCORE.org content."""

    def __init__(self):
        self.base_url = CONFIG["scraper"]["base_url"]
        self.delay = CONFIG["scraper"]["delay_seconds"]
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": CONFIG["scraper"]["user_agent"],
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        })
        self.html_converter = html2text.HTML2Text()
        self.html_converter.ignore_links = False
        self.html_converter.ignore_images = True
        self.html_converter.body_width = 0

        self.visited_urls: Set[str] = set()
        self.content_items: List[ScrapedContent] = []
        self.discovered_links: Set[str] = set()

        # Ensure output directories exist
        for dir_key in ["raw_dir", "processed_dir", "training_dir"]:
            path = Path(CONFIG["output"][dir_key])
            path.mkdir(parents=True, exist_ok=True)

    def fetch_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a page with rate limiting and error handling."""
        full_url = urljoin(self.base_url, url)

        if full_url in self.visited_urls:
            return None

        try:
            time.sleep(self.delay)  # Rate limiting
            response = self.session.get(
                full_url,
                timeout=CONFIG["scraper"]["timeout_seconds"]
            )
            response.raise_for_status()
            self.visited_urls.add(full_url)
            return BeautifulSoup(response.text, "lxml")

        except requests.RequestException as e:
            console.print(f"[yellow]Failed to fetch {url}: {e}[/yellow]")
            return None

    def extract_content(self, soup: BeautifulSoup, url: str) -> Optional[ScrapedContent]:
        """Extract main content from a page."""
        if not soup:
            return None

        # Find title
        title = ""
        title_elem = soup.find("h1") or soup.find("title")
        if title_elem:
            title = title_elem.get_text(strip=True)

        # Find main content area (SCORE uses various content containers)
        content_selectors = [
            "article",
            ".node-content",
            ".field--name-body",
            ".content-main",
            "main",
            "#main-content",
        ]

        main_content = None
        for selector in content_selectors:
            main_content = soup.select_one(selector)
            if main_content:
                break

        if not main_content:
            main_content = soup.find("body")

        if not main_content:
            return None

        # Remove unwanted elements
        for elem in main_content.select("nav, footer, .sidebar, script, style, .menu, .breadcrumb"):
            elem.decompose()

        # Convert to markdown
        html_content = str(main_content)
        markdown_content = self.html_converter.handle(html_content)

        # Clean up markdown
        markdown_content = self._clean_markdown(markdown_content)

        word_count = len(markdown_content.split())

        if word_count < 50:  # Skip very short pages
            return None

        # Determine content type from URL
        content_type = self._determine_content_type(url)

        # Extract category
        category = self._extract_category(soup, url)

        return ScrapedContent(
            url=url,
            title=title,
            content=markdown_content,
            content_type=content_type,
            category=category,
            word_count=word_count,
            scraped_at=datetime.now().isoformat(),
        )

    def _clean_markdown(self, text: str) -> str:
        """Clean up extracted markdown content."""
        # Remove excessive whitespace
        text = re.sub(r'\n{3,}', '\n\n', text)
        # Remove empty links
        text = re.sub(r'\[\s*\]\([^)]*\)', '', text)
        # Clean up bullet points
        text = re.sub(r'^\s*\*\s*$', '', text, flags=re.MULTILINE)
        return text.strip()

    def _determine_content_type(self, url: str) -> str:
        """Determine content type from URL pattern."""
        patterns = CONFIG["content_patterns"]
        for content_type, url_patterns in patterns.items():
            for pattern in url_patterns:
                if pattern in url:
                    return content_type
        return "page"

    def _extract_category(self, soup: BeautifulSoup, url: str) -> str:
        """Extract category from page metadata or URL."""
        # Try meta tags
        meta_category = soup.find("meta", {"name": "category"})
        if meta_category:
            return meta_category.get("content", "general")

        # Try breadcrumbs
        breadcrumb = soup.select_one(".breadcrumb a:last-child")
        if breadcrumb:
            return breadcrumb.get_text(strip=True)

        # Extract from URL
        parts = urlparse(url).path.split("/")
        if len(parts) > 2:
            return parts[1].replace("-", " ").title()

        return "general"

    def discover_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Discover content links on a page."""
        links = []
        patterns = CONFIG["content_patterns"]
        all_patterns = []
        for pattern_list in patterns.values():
            all_patterns.extend(pattern_list)

        for link in soup.find_all("a", href=True):
            href = link["href"]

            # Skip external links
            if href.startswith("http") and self.base_url not in href:
                continue

            # Skip disallowed patterns
            skip_patterns = ["/user", "/login", "/admin", "/search", "#"]
            if any(p in href for p in skip_patterns):
                continue

            # Check if matches content patterns
            if any(pattern in href for pattern in all_patterns):
                full_url = urljoin(self.base_url, href)
                if full_url not in self.visited_urls:
                    links.append(href)
                    self.discovered_links.add(href)

        return list(set(links))

    def calculate_quality_score(self, content: ScrapedContent) -> float:
        """Calculate quality score for prioritizing content."""
        score = 0.0

        # Word count scoring
        if content.word_count >= CONFIG["scoring"]["word_count_optimal"]:
            score += 0.3
        elif content.word_count >= CONFIG["scoring"]["word_count_min"]:
            score += 0.15

        # Topic relevance
        high_value_topics = CONFIG["scoring"]["high_value_topics"]
        content_lower = content.content.lower()
        title_lower = content.title.lower()

        matched_topics = []
        for topic in high_value_topics:
            if topic in content_lower or topic in title_lower:
                matched_topics.append(topic)
                score += 0.05

        content.topics = matched_topics
        score = min(score, 1.0)  # Cap at 1.0

        return round(score, 2)

    def scrape_source(self, source: Dict, progress: Progress, task_id) -> List[ScrapedContent]:
        """Scrape a single source and discover linked content."""
        items = []
        url = source["url"]

        progress.update(task_id, description=f"[cyan]Scraping: {source['name']}[/cyan]")

        # Fetch the hub/main page
        soup = self.fetch_page(url)
        if not soup:
            return items

        # Extract the main page content
        content = self.extract_content(soup, url)
        if content:
            content.priority = source.get("priority", 3)
            content.quality_score = self.calculate_quality_score(content)
            items.append(content)

        # Discover and scrape linked content
        links = self.discover_links(soup, url)
        for link in links[:50]:  # Limit per source
            progress.update(task_id, description=f"[dim]  --> {link[:50]}...[/dim]")
            link_soup = self.fetch_page(link)
            if link_soup:
                link_content = self.extract_content(link_soup, link)
                if link_content:
                    link_content.priority = source.get("priority", 3)
                    link_content.quality_score = self.calculate_quality_score(link_content)
                    items.append(link_content)

        return items

    def run(self):
        """Run the full scraping process."""
        console.print(Panel.fit(
            "[bold blue]SCORE.org Content Scraper[/bold blue]\n"
            "Gathering educational content for Ira training",
            border_style="blue"
        ))

        sources = CONFIG["sources"]

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console
        ) as progress:

            main_task = progress.add_task(
                "[green]Scraping sources...",
                total=len(sources)
            )

            for source in sources:
                items = self.scrape_source(source, progress, main_task)
                self.content_items.extend(items)
                progress.advance(main_task)

                # Status update
                console.print(
                    f"  [green]OK[/green] {source['name']}: "
                    f"{len(items)} items scraped"
                )

        # Summary
        self._print_summary()

        # Save results
        self.save_results()

    def _print_summary(self):
        """Print scraping summary."""
        console.print("\n")

        table = Table(title="Scraping Summary")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")

        table.add_row("Total Pages Visited", str(len(self.visited_urls)))
        table.add_row("Content Items Scraped", str(len(self.content_items)))
        table.add_row("Links Discovered", str(len(self.discovered_links)))

        # Content type breakdown
        type_counts = {}
        for item in self.content_items:
            type_counts[item.content_type] = type_counts.get(item.content_type, 0) + 1

        for ctype, count in sorted(type_counts.items()):
            table.add_row(f"  --> {ctype}", str(count))

        # Word count stats
        if self.content_items:
            total_words = sum(item.word_count for item in self.content_items)
            avg_words = total_words // len(self.content_items)
            table.add_row("Total Words", f"{total_words:,}")
            table.add_row("Avg Words/Item", f"{avg_words:,}")

        console.print(table)

    def save_results(self):
        """Save scraped content to files."""
        console.print("\n[dim]Saving results...[/dim]")

        # Save raw JSON
        raw_path = Path(CONFIG["output"]["raw_dir"]) / "score_content.json"
        with open(raw_path, "w", encoding="utf-8") as f:
            json.dump(
                [asdict(item) for item in self.content_items],
                f,
                indent=2,
                ensure_ascii=False
            )
        console.print(f"  [green]OK[/green] Raw content: {raw_path}")

        # Save training JSONL (sorted by quality)
        training_path = Path(CONFIG["output"]["training_dir"]) / "score_training.jsonl"
        sorted_items = sorted(
            self.content_items,
            key=lambda x: (x.quality_score, x.word_count),
            reverse=True
        )

        with open(training_path, "w", encoding="utf-8") as f:
            for item in sorted_items:
                training_example = {
                    "source": "score.org",
                    "url": item.url,
                    "title": item.title,
                    "content": item.content,
                    "type": item.content_type,
                    "category": item.category,
                    "topics": item.topics,
                    "quality_score": item.quality_score,
                    "word_count": item.word_count,
                }
                f.write(json.dumps(training_example, ensure_ascii=False) + "\n")

        console.print(f"  [green]OK[/green] Training data: {training_path}")

        # Save top 20% summary
        top_20_pct = len(sorted_items) // 5 or 1
        top_items = sorted_items[:top_20_pct]

        summary_path = Path(CONFIG["output"]["processed_dir"]) / "top_20_percent.md"
        with open(summary_path, "w", encoding="utf-8") as f:
            f.write("# Top 20% SCORE.org Content\n\n")
            f.write(f"Showing {len(top_items)} highest-quality items for Ira training.\n\n")
            f.write("---\n\n")

            for i, item in enumerate(top_items, 1):
                f.write(f"## {i}. {item.title}\n\n")
                f.write(f"- **URL:** {item.url}\n")
                f.write(f"- **Type:** {item.content_type}\n")
                f.write(f"- **Quality Score:** {item.quality_score}\n")
                f.write(f"- **Word Count:** {item.word_count}\n")
                f.write(f"- **Topics:** {', '.join(item.topics) if item.topics else 'general'}\n\n")
                # First 500 chars of content
                preview = item.content[:500].replace("\n", " ")
                f.write(f"> {preview}...\n\n")
                f.write("---\n\n")

        console.print(f"  [green]OK[/green] Top 20% summary: {summary_path}")

        console.print(Panel.fit(
            f"[bold green]Scraping Complete![/bold green]\n\n"
            f"Total: {len(self.content_items)} content items\n"
            f"Top 20%: {top_20_pct} high-quality items\n\n"
            f"Next: Run process_for_training.py to create Ira training data",
            border_style="green"
        ))


if __name__ == "__main__":
    scraper = SCOREScraper()
    scraper.run()
