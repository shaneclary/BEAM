#!/usr/bin/env python3
"""
Ira Local Training - Optimized for GTX 1060 (6GB VRAM)
======================================================
Uses QLoRA with aggressive memory optimization.

Requirements:
- Python 3.10, 3.11, or 3.12
- CUDA-enabled PyTorch
- 6GB+ VRAM GPU

Install:
    pip install torch --index-url https://download.pytorch.org/whl/cu121
    pip install transformers datasets accelerate peft trl bitsandbytes
"""

import os
import torch
from pathlib import Path

# Check CUDA first
if not torch.cuda.is_available():
    print("ERROR: CUDA not available!")
    print("Make sure you have:")
    print("  1. Python 3.10-3.12 (not 3.14)")
    print("  2. CUDA PyTorch: pip install torch --index-url https://download.pytorch.org/whl/cu121")
    exit(1)

print(f"GPU: {torch.cuda.get_device_name(0)}")
print(f"VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
print(f"PyTorch: {torch.__version__}")
print(f"CUDA: {torch.version.cuda}")

# Import after CUDA check
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    BitsAndBytesConfig,
)
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from trl import SFTTrainer

# Configuration for GTX 1060 (6GB)
CONFIG = {
    # Model - using smaller model for 6GB VRAM
    "base_model": "microsoft/Phi-3-mini-4k-instruct",  # 3.8B params, fits in 6GB
    # Alternative: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"  # Even smaller

    "output_dir": "./ira-gtx1060-output",
    "hub_repo": "buildlikeshane/ira-beam-assistant",

    # Memory optimization for 6GB VRAM
    "load_in_4bit": True,
    "bnb_4bit_quant_type": "nf4",
    "bnb_4bit_compute_dtype": "float16",

    # Training settings (conservative for 6GB)
    "batch_size": 1,              # Minimum
    "gradient_accumulation": 16,  # Effective batch = 16
    "max_seq_length": 512,        # Shorter sequences
    "learning_rate": 2e-4,
    "epochs": 3,
    "warmup_ratio": 0.03,

    # LoRA settings
    "lora_r": 8,           # Smaller rank for memory
    "lora_alpha": 16,
    "lora_dropout": 0.05,

    # Memory savers
    "gradient_checkpointing": True,
    "fp16": True,
    "optim": "adamw_8bit",
}


def main():
    print("\n" + "="*50)
    print("IRA LOCAL TRAINING - GTX 1060 Optimized")
    print("="*50 + "\n")

    # Clear CUDA cache
    torch.cuda.empty_cache()

    # Load training data
    print("Loading training data...")
    data_dir = Path(__file__).parent / "data"

    if not (data_dir / "train.jsonl").exists():
        print(f"ERROR: Training data not found at {data_dir}")
        print("Run prepare_data.py first!")
        exit(1)

    dataset = load_dataset("json", data_files={
        "train": str(data_dir / "train.jsonl"),
        "eval": str(data_dir / "eval.jsonl"),
    })
    print(f"  Train: {len(dataset['train'])} examples")
    print(f"  Eval: {len(dataset['eval'])} examples")

    # Quantization config
    print("\nLoading model with 4-bit quantization...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=CONFIG["load_in_4bit"],
        bnb_4bit_quant_type=CONFIG["bnb_4bit_quant_type"],
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(CONFIG["base_model"])
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        CONFIG["base_model"],
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16,
    )

    # Check VRAM usage
    allocated = torch.cuda.memory_allocated() / 1e9
    print(f"  Model loaded: {allocated:.1f} GB VRAM used")

    # Prepare for training
    model = prepare_model_for_kbit_training(model)

    # LoRA config
    lora_config = LoraConfig(
        r=CONFIG["lora_r"],
        lora_alpha=CONFIG["lora_alpha"],
        lora_dropout=CONFIG["lora_dropout"],
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )

    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # Format dataset
    def format_chat(example):
        messages = example.get("messages", [])
        text = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                text += f"<|system|>\n{content}<|end|>\n"
            elif role == "user":
                text += f"<|user|>\n{content}<|end|>\n"
            elif role == "assistant":
                text += f"<|assistant|>\n{content}<|end|>\n"
        return {"text": text}

    formatted_dataset = dataset.map(format_chat)

    # Training arguments
    training_args = TrainingArguments(
        output_dir=CONFIG["output_dir"],
        num_train_epochs=CONFIG["epochs"],
        per_device_train_batch_size=CONFIG["batch_size"],
        gradient_accumulation_steps=CONFIG["gradient_accumulation"],
        learning_rate=CONFIG["learning_rate"],
        warmup_ratio=CONFIG["warmup_ratio"],
        logging_steps=5,
        save_steps=50,
        eval_steps=50,
        evaluation_strategy="steps",
        fp16=CONFIG["fp16"],
        gradient_checkpointing=CONFIG["gradient_checkpointing"],
        optim=CONFIG["optim"],
        lr_scheduler_type="cosine",
        save_total_limit=2,
        load_best_model_at_end=True,
        report_to="none",  # Disable wandb for local
    )

    # Trainer
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=formatted_dataset["train"],
        eval_dataset=formatted_dataset["eval"],
        tokenizer=tokenizer,
        dataset_text_field="text",
        max_seq_length=CONFIG["max_seq_length"],
        packing=False,
    )

    # Check memory before training
    allocated = torch.cuda.memory_allocated() / 1e9
    reserved = torch.cuda.memory_reserved() / 1e9
    print(f"\nVRAM before training: {allocated:.1f} GB allocated, {reserved:.1f} GB reserved")

    # Train!
    print("\n" + "="*50)
    print("STARTING TRAINING")
    print("="*50)
    print(f"This will take approximately 2-4 hours on GTX 1060")
    print("Press Ctrl+C to stop early (progress will be saved)\n")

    try:
        trainer.train()

        # Save final model
        print("\nSaving model...")
        trainer.save_model(CONFIG["output_dir"] + "/final")

        print("\n" + "="*50)
        print("TRAINING COMPLETE!")
        print("="*50)
        print(f"Model saved to: {CONFIG['output_dir']}/final")

        # Optional: Push to hub
        push = input("\nPush to HuggingFace Hub? (y/n): ")
        if push.lower() == "y":
            from huggingface_hub import login
            login()
            trainer.push_to_hub(CONFIG["hub_repo"])
            print(f"Pushed to: huggingface.co/{CONFIG['hub_repo']}")

    except KeyboardInterrupt:
        print("\n\nTraining interrupted! Saving checkpoint...")
        trainer.save_model(CONFIG["output_dir"] + "/interrupted")
        print(f"Checkpoint saved to: {CONFIG['output_dir']}/interrupted")

    except torch.cuda.OutOfMemoryError:
        print("\n\nOUT OF MEMORY!")
        print("Try reducing max_seq_length or using a smaller model.")
        print("Edit CONFIG in this script and try again.")


if __name__ == "__main__":
    main()
