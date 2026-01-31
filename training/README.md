# Ira Training Pipeline

Fine-tune Ira on BEAM content with the wisdom of Buffett, energy of Robbins, and presence of Singer.

## Training Data Format

Place your training data in `data/` folder as JSONL files:

```jsonl
{"messages": [{"role": "user", "content": "How do I know if my business idea is viable?"}, {"role": "assistant", "content": "Let me share something Warren Buffett once said..."}]}
```

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Prepare training data from your documents
python prepare_data.py

# 3. Run fine-tuning on HuggingFace
python train.py

# 4. Push to HuggingFace Hub
python train.py --push
```

## Training Sources

- `/data/beam_guides/` - BEAM teaching materials
- `/data/score_content/` - SCORE.org resources
- `/data/wisdom/` - Curated wisdom (Buffett, Robbins, Singer)
- `/data/conversations/` - Example mentor conversations
