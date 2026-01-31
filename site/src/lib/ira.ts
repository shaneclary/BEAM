/**
 * IRA - BEAM AI Assistant
 * Hugging Face Integration Module
 */

import iraConfig from '../../../.claude/ira.config.json';

// HuggingFace Router API (new endpoint as of 2024)
const HF_ROUTER_URL = 'https://router.huggingface.co/v1';
const HF_EMBEDDING_URL = 'https://router.huggingface.co/hf-inference/models';

// Export permissions for use in other modules
export const permissions = iraConfig.permissions;
export const capabilities = iraConfig.capabilities;
export const boundaries = iraConfig.boundaries;
export const safety = iraConfig.safety;
export const disclaimers = iraConfig.disclaimers;

interface IraConfig {
  apiKey: string;
  model: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface IraResponse {
  message: string;
  sources?: string[];
  confidence?: number;
}

// Model selection: use fine-tuned if enabled, otherwise base model
const useFinetuned = process.env.USE_FINETUNED_IRA === 'true';
const finetunedModel = process.env.HF_FINETUNED_MODEL || 'buildlikeshane/ira-beam-assistant';
const baseModel = process.env.HF_BASE_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';
const enableFallback = process.env.IRA_ENABLE_FALLBACK !== 'false';

// Default configuration
const config: IraConfig = {
  apiKey: process.env.HUGGINGFACE_API_KEY || '',
  model: useFinetuned ? finetunedModel : baseModel,
  embeddingModel: process.env.HF_EMBEDDING_MODEL || 'BAAI/bge-small-en-v1.5',
  maxTokens: parseInt(process.env.IRA_MAX_TOKENS || '1024'),
  temperature: parseFloat(process.env.IRA_TEMPERATURE || '0.7'),
};

// Log which model is active (server-side only)
if (typeof window === 'undefined') {
  console.log(`[Ira] Using ${useFinetuned ? 'fine-tuned' : 'base'} model: ${config.model}`);
}

// System prompt that defines Ira's personality
const IRA_SYSTEM_PROMPT = `You are Ira, the wise and grounded AI mentor for BEAM (Business Entrepreneurship Access & Mentorship).

## Your Essence

You embody three powerful archetypes:

**The Sage Investor (Warren Buffett's Wisdom)**
- Think in decades, not days. Help entrepreneurs build lasting value, not quick wins
- Simplify the complex. If you can't explain it simply, don't say it
- Focus on fundamentals: cash flow, customer value, sustainable competitive advantages
- "Price is what you pay, value is what you get" - help them see true value
- Patience and discipline over hype and shortcuts

**The Empowering Coach (Tony Robbins' Energy)**
- Massive action creates massive results - inspire them to move NOW
- Their potential is unlimited; limiting beliefs are the only barrier
- Ask powerful questions that shift perspective and unlock breakthroughs
- Celebrate their wins, fuel their fire, raise their standards
- "The only impossible journey is the one you never begin"

**The Grounded Sage (Michael Singer's Presence)**
- Business success flows from inner clarity, not frantic doing
- Help them distinguish between the voice in their head and their deeper wisdom
- Challenges are teachers; resistance is the path to growth
- Surrender the need to control outcomes while giving full effort
- True success is building something meaningful while staying at peace within

## How You Speak

- Lead with warmth, end with clarity
- Balance inspiration with practical next steps
- Use simple, powerful language - no jargon or fluff
- Ask questions that make them think deeper
- Acknowledge their journey and current challenges with compassion
- Speak truth with kindness, even when it's uncomfortable

## Your Role

- Guide entrepreneurs through business decisions with wisdom and heart
- Connect them with BEAM resources, mentors, and community
- Help them see their blind spots without judgment
- Remind them that building a business is also building themselves

## Boundaries

- For specific legal, tax, or investment advice: recommend qualified professionals
- You inspire and guide; they choose and act
- If unsure, say so honestly - wisdom includes knowing your limits
- Suggest connecting with a BEAM mentor for personalized, in-depth guidance

Remember: Every entrepreneur who comes to you is already brave for starting. Honor that courage.`;

/**
 * Generate embeddings for text using Hugging Face
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${HF_EMBEDDING_URL}/${config.embeddingModel}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding generation failed: ${response.statusText}`);
  }

  const embeddings = await response.json();
  return embeddings[0] || embeddings;
}

/**
 * Make a chat request to a specific model
 */
async function chatWithModel(
  model: string,
  messages: { role: string; content: string }[],
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const response = await fetch(`${HF_ROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: '', error };
    }

    const result = await response.json();
    const generatedText = result.choices?.[0]?.message?.content || '';

    return { success: true, message: generatedText.trim() };
  } catch (err) {
    return { success: false, message: '', error: String(err) };
  }
}

/**
 * Chat with Ira using HuggingFace Router (OpenAI-compatible)
 * Includes automatic fallback to base model if fine-tuned model fails
 */
export async function chat(
  messages: ChatMessage[],
  context?: string
): Promise<IraResponse> {
  // Build the system message with optional context
  const systemMessage = context
    ? `${IRA_SYSTEM_PROMPT}\n\nRelevant context:\n${context}`
    : IRA_SYSTEM_PROMPT;

  // Prepare messages array with system prompt
  const allMessages = [
    { role: 'system' as const, content: systemMessage },
    ...messages,
  ];

  // Try primary model
  let result = await chatWithModel(config.model, allMessages);

  // Fallback to base model if fine-tuned fails and fallback is enabled
  if (!result.success && enableFallback && useFinetuned) {
    console.warn(`[Ira] Fine-tuned model failed, falling back to base model: ${result.error}`);
    result = await chatWithModel(baseModel, allMessages);
  }

  if (!result.success) {
    throw new Error(`Ira chat failed: ${result.error}`);
  }

  return {
    message: result.message,
  };
}

/**
 * Simple wrapper for single-turn questions
 */
export async function ask(question: string): Promise<string> {
  const response = await chat([{ role: 'user', content: question }]);
  return response.message;
}

/**
 * Check if Ira is properly configured
 */
export function isConfigured(): boolean {
  return !!config.apiKey && config.apiKey !== 'hf_your-api-key';
}

/**
 * Check if a topic is allowed based on boundaries
 */
export function isTopicAllowed(topic: string): 'allowed' | 'restricted' | 'forbidden' {
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '_');

  if (boundaries.topics.forbidden.some(t => normalizedTopic.includes(t))) {
    return 'forbidden';
  }
  if (boundaries.topics.restricted.some(t => normalizedTopic.includes(t))) {
    return 'restricted';
  }
  return 'allowed';
}

/**
 * Get appropriate disclaimer for a topic
 */
export function getDisclaimer(topic: string): string | null {
  const normalizedTopic = topic.toLowerCase();

  if (normalizedTopic.includes('legal')) return disclaimers.legal;
  if (normalizedTopic.includes('tax')) return disclaimers.tax;
  if (normalizedTopic.includes('financial') || normalizedTopic.includes('investment')) {
    return disclaimers.financial;
  }
  return null;
}

/**
 * Check if mentor handoff should be triggered
 */
export function shouldHandoffToMentor(context: {
  confidence?: number;
  userRequested?: boolean;
  isComplex?: boolean;
  topic?: string;
}): boolean {
  if (!iraConfig.handoff.mentorReferral.enabled) return false;

  if (context.userRequested) return true;
  if (context.confidence && context.confidence < 0.6) return true;
  if (context.isComplex) return true;

  return false;
}

/**
 * Get all Ira capabilities
 */
export function getCapabilities() {
  return {
    ...capabilities,
    permissions: permissions.allow,
    boundaries: boundaries.topics.allowed,
  };
}

/**
 * Get current model configuration info
 */
export function getModelInfo() {
  return {
    activeModel: config.model,
    isFineTuned: useFinetuned,
    finetunedModel,
    baseModel,
    fallbackEnabled: enableFallback,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  };
}

/**
 * Health check - verify Ira can respond
 */
export async function healthCheck(): Promise<{
  status: 'ok' | 'degraded' | 'error';
  model: string;
  latencyMs: number;
  message?: string;
}> {
  const start = Date.now();

  try {
    const response = await ask('Hello');
    const latencyMs = Date.now() - start;

    return {
      status: response.length > 0 ? 'ok' : 'degraded',
      model: config.model,
      latencyMs,
    };
  } catch (err) {
    return {
      status: 'error',
      model: config.model,
      latencyMs: Date.now() - start,
      message: String(err),
    };
  }
}

export default {
  chat,
  ask,
  generateEmbedding,
  isConfigured,
  isTopicAllowed,
  getDisclaimer,
  shouldHandoffToMentor,
  getCapabilities,
  getModelInfo,
  healthCheck,
  permissions,
  capabilities,
  boundaries,
  safety,
  disclaimers,
};
