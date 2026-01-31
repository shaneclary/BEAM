#!/usr/bin/env python3
"""
Ira Fine-Tuning Script
======================
Fine-tunes Llama 3.1 on BEAM content with LoRA for efficiency.
"""

import os
import yaml
import argparse
from pathlib import Path
from rich.console import Console
from rich.panel import Panel

console = Console()

def train(push_to_hub: bool = False):
    """Run fine-tuning with configuration from config.yaml."""

    console.print(Panel.fit(
        "[bold blue]🧠 Ira Fine-Tuning[/bold blue]\n"
        "Training on BEAM content with Buffett, Robbins & Singer wisdom",
        border_style="blue"
    ))

    # Load config
    with open("config.yaml") as f:
        config = yaml.safe_load(f)

    # Check for HuggingFace token
    hf_token = os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HF_TOKEN")
    if not hf_token:
        console.print("[red]❌ HUGGINGFACE_API_KEY not found in environment[/red]")
        console.print("   Set it with: export HUGGINGFACE_API_KEY=hf_...")
        return

    console.print(f"[green]✅ HuggingFace token found[/green]")

    # Check training data
    train_file = Path(config["data"]["train_file"])
    if not train_file.exists():
        console.print(f"[red]❌ Training data not found: {train_file}[/red]")
        console.print("   Run prepare_data.py first")
        return

    # Count examples
    with open(train_file) as f:
        train_count = sum(1 for _ in f)
    console.print(f"[green]✅ Training data: {train_count} examples[/green]")

    # Import ML libraries (delayed to show errors clearly)
    console.print("\n[dim]Loading ML libraries...[/dim]")

    try:
        import torch
        from datasets import load_dataset
        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
            TrainingArguments,
            BitsAndBytesConfig,
        )
        from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
        from trl import SFTTrainer
    except ImportError as e:
        console.print(f"[red]❌ Missing dependency: {e}[/red]")
        console.print("   Run: pip install -r requirements.txt")
        return

    # Device setup
    device = "cuda" if torch.cuda.is_available() else "cpu"
    console.print(f"[green]✅ Device: {device}[/green]")

    if device == "cpu":
        console.print("[yellow]⚠️  Training on CPU will be very slow. GPU recommended.[/yellow]")

    # Load tokenizer
    console.print(f"\n[dim]Loading model: {config['model']['base']}[/dim]")
    tokenizer = AutoTokenizer.from_pretrained(
        config["model"]["base"],
        token=hf_token,
        trust_remote_code=True
    )
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    # Quantization config for efficient training
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    # Load model
    model = AutoModelForCausalLM.from_pretrained(
        config["model"]["base"],
        quantization_config=bnb_config if device == "cuda" else None,
        device_map="auto" if device == "cuda" else None,
        token=hf_token,
        trust_remote_code=True,
    )

    # Prepare for training
    if device == "cuda":
        model = prepare_model_for_kbit_training(model)

    # LoRA config
    lora_config = LoraConfig(
        r=config["training"]["lora_r"],
        lora_alpha=config["training"]["lora_alpha"],
        lora_dropout=config["training"]["lora_dropout"],
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )

    model = get_peft_model(model, lora_config)

    console.print(f"[green]✅ Model loaded with LoRA adapters[/green]")
    model.print_trainable_parameters()

    # Load dataset
    dataset = load_dataset("json", data_files={
        "train": config["data"]["train_file"],
        "eval": config["data"]["eval_file"],
    })

    def format_chat(example):
        """Format messages into training string."""
        messages = example.get("messages", [])
        text = ""
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            if role == "system":
                text += f"<|system|>\n{content}\n"
            elif role == "user":
                text += f"<|user|>\n{content}\n"
            elif role == "assistant":
                text += f"<|assistant|>\n{content}\n"
        return {"text": text}

    dataset = dataset.map(format_chat)

    # Training arguments
    training_args = TrainingArguments(
        output_dir="./outputs",
        num_train_epochs=config["training"]["epochs"],
        per_device_train_batch_size=config["training"]["batch_size"],
        gradient_accumulation_steps=config["training"]["gradient_accumulation_steps"],
        learning_rate=config["training"]["learning_rate"],
        warmup_ratio=config["training"]["warmup_ratio"],
        weight_decay=config["training"]["weight_decay"],
        logging_steps=config["logging"]["log_steps"],
        save_steps=config["logging"]["save_steps"],
        eval_steps=config["logging"]["eval_steps"],
        evaluation_strategy="steps",
        fp16=config["training"]["fp16"] and device == "cuda",
        gradient_checkpointing=config["training"]["gradient_checkpointing"],
        optim=config["training"]["optimizer"] if device == "cuda" else "adamw_torch",
        lr_scheduler_type=config["training"]["lr_scheduler"],
        report_to="wandb" if os.environ.get("WANDB_API_KEY") else "none",
        run_name="ira-beam-training",
        push_to_hub=push_to_hub,
        hub_model_id=config["model"]["output_repo"] if push_to_hub else None,
        hub_token=hf_token if push_to_hub else None,
    )

    # Create trainer
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["eval"],
        tokenizer=tokenizer,
        dataset_text_field="text",
        max_seq_length=config["training"]["max_seq_length"],
        packing=False,
    )

    # Train!
    console.print("\n[bold green]🚀 Starting training...[/bold green]\n")
    trainer.train()

    # Save
    console.print("\n[dim]Saving model...[/dim]")
    trainer.save_model("./outputs/final")

    if push_to_hub:
        console.print(f"\n[dim]Pushing to {config['model']['output_repo']}...[/dim]")
        trainer.push_to_hub()
        console.print(f"[green]✅ Model pushed to huggingface.co/{config['model']['output_repo']}[/green]")

    console.print(Panel.fit(
        "[bold green]✅ Training Complete![/bold green]\n\n"
        f"Model saved to: ./outputs/final\n"
        f"{'Pushed to: ' + config['model']['output_repo'] if push_to_hub else 'Run with --push to upload to HuggingFace'}",
        border_style="green"
    ))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune Ira")
    parser.add_argument("--push", action="store_true", help="Push to HuggingFace Hub")
    args = parser.parse_args()

    train(push_to_hub=args.push)
