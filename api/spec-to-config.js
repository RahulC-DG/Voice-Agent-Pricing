import { readFileSync } from 'fs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { spec = '', requirements = {}, apiKey } = req.body || {};

  // Load registry (JSON preferred, fallback to text)
  let registryText = '';
  let registryJson = null;
  try {
    registryJson = JSON.parse(readFileSync(process.cwd() + '/registry.json', 'utf8'));
  } catch (e) {
    try {
      registryText = readFileSync(process.cwd() + '/registry.txt', 'utf8');
    } catch (_) {}
  }

  // If no API key, do a lightweight heuristic fallback
  if (!apiKey) {
    const result = heuristic(spec, requirements, registryJson);
    return res.status(200).json({ source: 'heuristic', ...result });
  }

  try {
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey });

    const system = `You are a solutions architect for real-time voice agents.
You will choose STT, LLM, and TTS providers for a cascaded voice agent stack using ONLY the options present in the provided registry (both text and JSON). Treat the JSON (registry_json) as ground truth for capabilities.

VOICE AGENT WIZARD CONTEXT (for better decisions):
- avg_call_minutes, concurrency, hours_per_day, days_per_month, talk_ratio, tokens_per_minute reflect business usage. Use them to derive costs/latency tradeoffs.
- Explicit provider requests must be honored when feasible. If infeasible (e.g., "ElevenLabs realtime STT"), explain clearly and propose a compliant alternative (e.g., Deepgram Nova-3 for realtime STT).
- CRITICAL: If user explicitly requests "ElevenLabs STT" or "ElevenLabs TTS", ALWAYS select ElevenLabs models regardless of other requirements (realtime, self-hosted). Explain limitations clearly:
  * ElevenLabs STT: batch-only (no realtime), no self-hosting
  * ElevenLabs TTS: realtime capable but no self-hosting
  * Always suggest appropriate alternatives (Deepgram Nova-3 for realtime STT, Deepgram Aura 2 for self-hosted TTS)
- COST PRIORITY: If user indicates cost priority (e.g., "value cheapness over latency", "budget priority"), prioritize cheapest options even if performance requirements exist:
  * Explain trade-offs clearly (e.g., "prioritizing cost over ultra-low latency as requested")

CRITICAL INSTRUCTIONS:
1. If user specifically requests a provider (e.g., "use Cartesia"), honor that request IF the provider offers that service type in the registry
2. Provider capabilities from registry_json:
   - Cartesia: STT (Ink-Whisper) + TTS (Sonic models) - NO LLM
   - Deepgram: STT (Nova-3) + TTS (Aura-2) - NO LLM  
   - ElevenLabs: STT (batch only, no realtime) + TTS (Multilingual/Flash) - NO LLM
   - OpenAI: LLM ONLY (GPT-4o, GPT-4o-mini)
   - Google: LLM ONLY (Gemini models)
3. If user asks for a provider that doesn't offer a service (e.g., "Cartesia as LLM"), make a safe substitution and explicitly state why
4. Respect hard requirements like realtime and self-hosted
5. Use exact provider names, model names, and pricing from the registry
6. Provide concise but detailed rationales referencing registry facts (latency, streaming, self_hosted)

Return STRICT JSON according to the schema below. Use only fields and providers that exist in the registry text.

Schema:
{
  "usage": {
    "avg_call_minutes": number,
    "concurrency": number,
    "hours_per_day": number,
    "days_per_month": number,
    "talk_ratio": number,
    "tokens_per_minute": number
  },
  "components": {
    "stt": {"provider": string, "model": string, "unit": string, "price": number, "realtime": boolean, "self_hosted": boolean, "badges": string[], "rationale": string},
    "llm": {"provider": string, "model": string, "unit": string, "price": number, "realtime": boolean, "self_hosted": boolean, "rationale": string},
    "tts": {"provider": string, "model": string, "unit": string, "price": number, "realtime": boolean, "self_hosted": boolean, "badges": string[], "rationale": string}
  },
  "alternatives": [
    {"stt?": object, "llm?": object, "tts?": object, "tradeoff": string}
  ]
}`;

    const user = {
      spec,
      requirements,
      registry: registryText,
      defaults: {
        avg_call_minutes: 10,
        concurrency: 5,
        hours_per_day: 8,
        days_per_month: 22,
        talk_ratio: 0.5,
        tokens_per_minute: 600
      }
    };

          const model = process.env.OPENAI_MODEL || 'gpt-4o'; // Fallback to gpt-4o if gpt-5 not available
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: JSON.stringify({ ...user, registry_json: registryJson }) }
        ],
        temperature: 0.2,
        max_tokens: 800
      });

    let data;
    try {
      data = JSON.parse(response.choices?.[0]?.message?.content || '{}');
    } catch {
      const result = heuristic(spec, requirements, registryJson);
      return res.status(200).json({ source: 'heuristic', ...result });
    }

    return res.status(200).json({ source: 'gpt', ...data });
  } catch (err) {
    console.error(err);
    const result = heuristic(spec, requirements, registryJson);
    return res.status(200).json({ source: 'heuristic', ...result, error: 'gpt_error' });
  }
}

function heuristic(spec, requirements, registryJson) {
  const s = (spec || '').toLowerCase();
  const needRealtime = requirements?.realtime ?? /real[- ]?time|stream|low[- ]?latency/.test(s);
  const needSelfHost = requirements?.self_hosted ?? /self[- ]?host|on[- ]?prem/.test(s);
  
  // Detect cost priority preferences
  const prioritizeCost = /value.*cheap|cheap.*over.*latency|cost.*over.*performance|budget.*priority|cheapest.*possible|value.*cost|prefer.*cheap|cheap.*important/i.test(s);
  
  // Track explicit provider requests to avoid overriding them
  const explicitElevenLabsSTT = /elevenlabs.*stt|elevenlabs.*speech[- ]?to[- ]?text|use elevenlabs.*stt|with elevenlabs stt|elevenlabs stt/i.test(s);
  const explicitCartesiaSTT = /cartesia.*stt|cartesia.*speech[- ]?to[- ]?text|use cartesia.*stt/i.test(s);

  // Defaults (cost-optimized if prioritizeCost is true)
  let stt, tts, llm;
  
  if (prioritizeCost) {
    stt = { provider: 'ElevenLabs', model: 'Speech-to-Text API', unit: 'per_min', price: 0, realtime: false, self_hosted: false, badges: ['No Real-Time Streaming'], rationale: 'Cheapest STT option (included in plans)' };
    tts = { provider: 'Deepgram', model: 'Aura 2', unit: 'per_1k_chars', price: 0.03, realtime: true, self_hosted: true, badges: [], rationale: 'Cost-effective TTS option (prioritizing budget over ultra-low latency)' };
    llm = { provider: 'OpenAI', model: 'GPT-4o-mini', unit: 'per_1k_tokens', price: 0.0006, realtime: true, self_hosted: false, rationale: 'Cheapest LLM option' };
  } else {
    stt = { provider: 'Deepgram', model: 'Nova-3', unit: 'per_min', price: 0.0043, realtime: true, self_hosted: true, badges: [], rationale: 'Reliable realtime STT' };
    tts = { provider: 'Deepgram', model: 'Aura 2', unit: 'per_1k_chars', price: 0.03, realtime: true, self_hosted: true, badges: [], rationale: 'Enterprise-grade, realtime' };
    llm = { provider: 'OpenAI', model: 'GPT-4o-mini', unit: 'per_1k_tokens', price: 0.0006, realtime: true, self_hosted: false, rationale: 'Low cost, realtime-friendly' };
  }

  // Handle specific provider requests
  if (/cartesia.*tts|cartesia.*text[- ]?to[- ]?speech|use cartesia.*tts/i.test(s)) {
    tts = { provider: 'Cartesia', model: 'Sonic Turbo', unit: 'per_hour', price: 1.79, realtime: true, self_hosted: true, badges: [], rationale: 'Cartesia TTS requested - ultra-low latency' };
  }
  if (/cartesia.*stt|cartesia.*speech[- ]?to[- ]?text|use cartesia.*stt/i.test(s)) {
    stt = { provider: 'Cartesia', model: 'Ink-Whisper', unit: 'per_min', price: 0.003, realtime: true, self_hosted: false, badges: [], rationale: 'Cartesia STT requested - optimized for voice agents' };
  }
  if (/cartesia.*llm|cartesia.*language|use cartesia.*llm/i.test(s)) {
    llm = { provider: 'OpenAI', model: 'GPT-4o-mini', unit: 'per_1k_tokens', price: 0.0006, realtime: true, self_hosted: false, rationale: 'Cartesia does not offer LLM services - using OpenAI GPT-4o-mini instead' };
  }
  
  // Handle ElevenLabs TTS requests (more flexible patterns)
  if (/elevenlabs.*tts|elevenlabs.*text[- ]?to[- ]?speech|use elevenlabs.*tts/i.test(s)) {
    if (needSelfHost) {
      tts = { provider: 'ElevenLabs', model: 'Flash v2.5', unit: 'per_min', price: 0.10, realtime: true, self_hosted: false, badges: ['Option not available'], rationale: 'ElevenLabs TTS requested but does not support self-hosted deployment. Consider Deepgram Aura 2 for self-hosted needs.' };
    } else {
      tts = { provider: 'ElevenLabs', model: 'Flash v2.5', unit: 'per_min', price: 0.10, realtime: true, self_hosted: false, badges: ['Option not available'], rationale: 'ElevenLabs TTS requested - high quality voice synthesis' };
    }
  }
  if (explicitElevenLabsSTT) {
    if (needRealtime) {
      stt = { provider: 'ElevenLabs', model: 'Speech-to-Text API', unit: 'per_min', price: 0, realtime: false, self_hosted: false, badges: ['No Real-Time Streaming'], rationale: 'ElevenLabs STT requested - batch processing only, not suitable for real-time voice agents. Consider Deepgram Nova-3 for real-time needs.' };
    } else {
      stt = { provider: 'ElevenLabs', model: 'Speech-to-Text API', unit: 'per_min', price: 0, realtime: false, self_hosted: false, badges: ['No Real-Time Streaming'], rationale: 'ElevenLabs STT requested - batch processing only' };
    }
  }
  
  if (/google|gemini/i.test(s) && /llm|language/i.test(s)) {
    llm = { provider: 'Google', model: 'Gemini 2.5 Flash', unit: 'per_1k_tokens', price: 0.0008, realtime: true, self_hosted: false, rationale: 'Google Gemini requested - fast and cost-effective' };
  }

  // General requirement overrides (but respect explicit provider requests and cost priorities)
  if (needRealtime && !prioritizeCost && !(/cartesia.*tts/i.test(s))) {
    tts = { provider: 'Cartesia', model: 'Sonic Turbo', unit: 'per_hour', price: 1.79, realtime: true, self_hosted: true, badges: [], rationale: 'Ultra-low latency required - Cartesia Sonic Turbo' };
  } else if (prioritizeCost && needRealtime) {
    // When cost is prioritized over latency, choose cheaper options even for realtime requests
    tts = { provider: 'Deepgram', model: 'Aura 2', unit: 'per_1k_chars', price: 0.03, realtime: true, self_hosted: true, badges: [], rationale: 'Cost-effective TTS option prioritized over ultra-low latency as requested' };
  }
  if (needSelfHost) {
    // Handle self-hosting requirements, but respect explicit provider requests
    if (explicitElevenLabsSTT) {
      // ElevenLabs STT doesn't support self-hosting, explain this
      stt = { provider: 'ElevenLabs', model: 'Speech-to-Text API', unit: 'per_min', price: 0, realtime: false, self_hosted: false, badges: ['No Real-Time Streaming', 'Option not available'], rationale: 'ElevenLabs STT requested but does not support self-hosted deployment. Consider Deepgram Nova-3 for self-hosted needs.' };
    } else if (!explicitCartesiaSTT && !(/cartesia/i.test(s))) {
      stt = { provider: 'Deepgram', model: 'Nova-3', unit: 'per_min', price: 0.0043, realtime: true, self_hosted: true, badges: [], rationale: 'Self-hosted deployment required' };
      tts = { provider: 'Deepgram', model: 'Aura 2', unit: 'per_1k_chars', price: 0.03, realtime: true, self_hosted: true, badges: [], rationale: 'Self-hosted deployment required' };
    }
  }

  // Generate alternatives based on selection
  const alternatives = [];
  
  // If ElevenLabs STT was selected, suggest Deepgram for realtime/self-hosting
  if (stt.provider === 'ElevenLabs') {
    const needs = [];
    if (needRealtime) needs.push('real-time');
    if (needSelfHost) needs.push('self-hosted');
    
    const tradeoffText = needs.length > 0 ? 
      `Required for ${needs.join(' and ')} voice agents` : 
      'Enables real-time and self-hosted deployment if needed';
      
    alternatives.push({
      stt: { provider: 'Deepgram', model: 'Nova-3', unit: 'per_min', price: 0.0043, realtime: true, self_hosted: true, badges: [], rationale: 'Real-time capable STT with self-hosting support' },
      tradeoff: tradeoffText
    });
  }
  
  // If ElevenLabs TTS was selected with self-hosting needs, suggest Deepgram
  if (tts.provider === 'ElevenLabs' && needSelfHost) {
    alternatives.push({
      tts: { provider: 'Deepgram', model: 'Aura 2', unit: 'per_1k_chars', price: 0.03, realtime: true, self_hosted: true, badges: [], rationale: 'Self-hosted TTS option' },
      tradeoff: 'Required for self-hosted deployment'
    });
  }
  
  // Always suggest cost alternatives for TTS
  if (tts.provider !== 'Deepgram') {
    alternatives.push({
             tts: { provider: 'Deepgram', model: 'Aura 2', unit: 'per_1k_chars', price: 0.03, realtime: true, self_hosted: true, badges: [], rationale: 'More cost-effective TTS option' },
      tradeoff: 'Cheapest TTS option'
    });
  }
  
  return {
    usage: {
      avg_call_minutes: 10,
      concurrency: 5,
      hours_per_day: 8,
      days_per_month: 22,
      talk_ratio: 0.5,
      tokens_per_minute: 600
    },
    components: { stt, llm, tts },
    alternatives
  };
} 