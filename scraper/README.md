# SCORE.org Content Scraper for Ira Training

Scrapes educational content from SCORE.org and converts it to training data for Ira with the Buffett/Robbins/Singer personality blend.

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the scraper (takes 30-60 minutes)
python scraper.py

# 3. Process into training format
python process_for_training.py

# 4. Copy to training folder
cp output/training/train.jsonl ../training/data/
cp output/training/eval.jsonl ../training/data/
```

## What Gets Scraped

| Source | Priority | Content |
|--------|----------|---------|
| Startup Roadmap | 1 | 12-module business course |
| Templates Gallery | 1 | 26+ downloadable templates |
| Plan + Start Hub | 2 | Starting a business content |
| Manage + Grow Hub | 2 | Growth strategies |
| Industry Guides | 2 | Food, Retail, Manufacturing |
| Women Entrepreneurs | 2 | Women-focused resources |
| Veteran Entrepreneurs | 2 | Veteran resources |
| Business Education | 2 | Courses & webinars |
| Success Stories | 3 | Real entrepreneur stories |

## Output Files

```
scraper/
├── data/
│   ├── raw/
│   │   └── score_content.json      # All scraped content
│   └── processed/
│       └── top_20_percent.md       # Best content summary
└── output/
    └── training/
        ├── score_training.jsonl    # Ranked by quality
        ├── ira_training_data.jsonl # With Ira personality
        ├── train.jsonl             # 90% for training
        └── eval.jsonl              # 10% for validation
```

## Quality Scoring

Content is scored and ranked by:
- **Word count**: Longer, comprehensive articles score higher
- **Topic relevance**: Matches to high-value topics (funding, marketing, etc.)
- **Content type**: Templates and courses prioritized

The top 20% highest-scoring content is summarized in `top_20_percent.md`.

## Ethical Scraping

This scraper:
- ✅ Respects robots.txt
- ✅ Uses 2-second delays between requests
- ✅ Identifies itself with a proper User-Agent
- ✅ Only accesses public content
- ✅ Attributes all content to SCORE.org

## Configuration

Edit `config.yaml` to:
- Add/remove content sources
- Adjust rate limiting
- Modify quality scoring weights
- Change output formats

## Training Ira

After scraping:

```bash
cd ../training
python prepare_data.py   # Combines with wisdom examples
python train.py          # Fine-tune on HuggingFace
```
