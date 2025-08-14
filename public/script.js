// Model pricing configurations
const modelConfigs = {
    stt: {
        'deepgram-nova3': {
            name: 'Deepgram Nova-3',
            description: 'High-accuracy speech recognition',
            price: 0.0043,
            unit: 'per minute',
            priceLabel: 'Price per minute: $'
        },
        'cartesia-ink': {
            name: 'Cartesia Ink-Whisper',
            description: 'Streaming STT for conversational AI',
            price: 0.0022,
            unit: 'per minute',
            priceLabel: 'Price per minute: $'
        },
        'elevenlabs-stt': {
            name: 'ElevenLabs STT',
            description: 'Batch STT (no realtime streaming)',
            price: 0.0000,
            unit: 'per minute',
            priceLabel: 'Price per minute: $'
        }
    },
    llm: {
        'openai-gpt4o-mini': {
            name: 'OpenAI GPT-4o-mini',
            description: 'Cost-effective real-time friendly',
            price: 0.0006,
            unit: 'per 1K tokens (avg)',
            priceLabel: 'Price per 1K tokens (avg): $'
        },
        'google-gemini-flash': {
            name: 'Google Gemini 2.5 Flash',
            description: 'Low-latency, streaming friendly',
            price: 0.0008,
            unit: 'per 1K tokens (avg)',
            priceLabel: 'Price per 1K tokens (avg): $'
        },
        'google-gemini-pro': {
            name: 'Google Gemini 2.5 Pro',
            description: 'Higher capability, higher cost',
            price: 0.005,
            unit: 'per 1K tokens (avg)',
            priceLabel: 'Price per 1K tokens (avg): $'
        }
    },
    tts: {
        'cartesia': {
            name: 'Cartesia',
            description: 'Real-time voice synthesis',
            price: 0.000025,
            unit: 'per character',
            priceLabel: 'Price per character: $',
            unitCost: '$0.000025/char'
        },
        'elevenlabs': {
            name: 'ElevenLabs',
            description: 'Premium AI voice generation',
            price: 0.00003,
            unit: 'per character',
            priceLabel: 'Price per character: $',
            unitCost: '$0.00003/char'
        },
        'deepgram': {
            name: 'Deepgram Aura 2',
            description: 'Fast neural text-to-speech',
            price: 0.0015,
            unit: 'per minute',
            priceLabel: 'Price per minute: $',
            unitCost: '$0.0015/min'
        }
    }
};

// Current selections
let currentModels = {
    stt: 'deepgram-nova3',
    llm: 'openai-gpt4o-mini',
    tts: 'deepgram'
};

// DOM elements
const elements = {
    // TTS
    ttsSelector: document.getElementById('tts-selector'),
    ttsName: document.getElementById('tts-name'),
    ttsDescription: document.getElementById('tts-description'),
    ttsPrice: document.getElementById('tts-price'),
    ttsUnit: document.getElementById('tts-unit'),
    ttsPriceLabel: document.getElementById('tts-price-label'),
    ttsPriceInput: document.getElementById('tts-price-input'),
    ttsBadge: document.getElementById('tts-badge'),
    ttsSelfhostBadge: document.getElementById('tts-selfhost-badge'),

    // STT
    sttSelector: document.getElementById('stt-selector'),
    sttName: document.getElementById('stt-name'),
    sttDescription: document.getElementById('stt-description'),
    sttPrice: document.getElementById('stt-price'),
    sttUnit: document.getElementById('stt-unit'),
    sttPriceLabel: document.getElementById('stt-price-label'),
    sttPriceInput: document.getElementById('stt-price-input'),
    sttBadge: document.getElementById('stt-badge'),
    sttSelfhostBadge: document.getElementById('stt-selfhost-badge'),

    // LLM
    llmSelector: document.getElementById('llm-selector'),
    llmName: document.getElementById('llm-name'),
    llmDescription: document.getElementById('llm-description'),
    llmPrice: document.getElementById('llm-price'),
    llmPriceInput: document.getElementById('llm-price-input'),
    
    // Usage


    // Costs
    sttCost: document.getElementById('stt-cost'),
    llmCost: document.getElementById('llm-cost'),
    ttsCost: document.getElementById('tts-cost'),
    totalCost: document.getElementById('total-cost'),
    twoMonthBill: document.getElementById('two-month-bill'),
    
    sttCost1000h: document.getElementById('stt-cost-1000h'),
    llmCost1000h: document.getElementById('llm-cost-1000h'),
    ttsCost1000h: document.getElementById('tts-cost-1000h'),
    totalCost1000h: document.getElementById('total-cost-1000h'),
    
    ttsComparisonRows: document.querySelectorAll('.comparison-row[data-provider]:not([data-type])'),
    sttComparisonRows: document.querySelectorAll('.comparison-row[data-type="stt"]'),

    // NL spec input
    nlSpecInput: document.getElementById('nl-spec-input'),
    nlGenerate: document.getElementById('nl-generate'),
    nlResponse: document.getElementById('nl-response'),
    nlResponseText: document.getElementById('nl-response-text'),
    
    // API key management
    openaiApiKey: document.getElementById('openai-api-key'),
    saveApiKey: document.getElementById('save-api-key'),
    apiKeyStatus: document.getElementById('api-key-status'),
    twoMonthMath: document.getElementById('two-month-math') // Added for mathematical breakdown
};

// Initialize the application
function init() {
    setupEventListeners();
    loadApiKey(); // Load saved API key from localStorage
    
    // Set the selectors to match the default selection
    elements.ttsSelector.value = currentModels.tts;
    elements.sttSelector && (elements.sttSelector.value = currentModels.stt);
    elements.llmSelector && (elements.llmSelector.value = currentModels.llm);

    updateSTTModel();
    updateLLMModel();
    updateTTSModel();
    calculateCosts();
    updateComparisons();
}

// API Key Management
function loadApiKey() {
    const savedKey = localStorage.getItem('openai-api-key');
    if (savedKey) {
        elements.openaiApiKey.value = savedKey;
        showApiKeyStatus('✓ API key loaded from local storage', 'success');
    }
}

function saveApiKey() {
    const apiKey = elements.openaiApiKey.value.trim();
    
    if (!apiKey) {
        showApiKeyStatus('Please enter an API key', 'error');
        return;
    }
    
    if (!apiKey.startsWith('sk-')) {
        showApiKeyStatus('Invalid API key format. Should start with "sk-"', 'error');
        return;
    }
    
    localStorage.setItem('openai-api-key', apiKey);
    showApiKeyStatus('✓ API key saved securely in your browser', 'success');
}

function showApiKeyStatus(message, type) {
    elements.apiKeyStatus.textContent = message;
    elements.apiKeyStatus.className = `api-key-status ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            elements.apiKeyStatus.style.display = 'none';
        }, 3000);
    }
}

function getApiKey() {
    return localStorage.getItem('openai-api-key') || elements.openaiApiKey.value.trim();
}

// Set up event listeners
function setupEventListeners() {
    elements.ttsSelector.addEventListener('change', handleTTSChange);
    elements.sttSelector.addEventListener('change', handleSTTChange);
    elements.llmSelector.addEventListener('change', handleLLMChange);
    
    // Price input listeners
    elements.sttPriceInput.addEventListener('input', handlePriceChange);
    elements.llmPriceInput.addEventListener('input', handlePriceChange);
    elements.ttsPriceInput.addEventListener('input', handlePriceChange);
    
    // Usage parameters are now fixed defaults (no UI controls)


    // NL generate
    elements.nlGenerate.addEventListener('click', generateFromSpec);
    
    // API key management
    elements.saveApiKey.addEventListener('click', saveApiKey);
    elements.openaiApiKey.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
}


// Handle STT/LLM/TTS model change
function handleSTTChange() {
    currentModels.stt = elements.sttSelector.value;
    updateSTTModel();
    calculateCosts();
    updateComparisons();
}
function handleLLMChange() {
    currentModels.llm = elements.llmSelector.value;
    updateLLMModel();
    calculateCosts();
    updateComparisons();
}
function handleTTSChange() {
    currentModels.tts = elements.ttsSelector.value;
    updateTTSModel();
    calculateCosts();
    updateComparisons();
}

// Update STT model display
function updateSTTModel() {
    const config = modelConfigs.stt[currentModels.stt];
    elements.sttName.textContent = config.name;
    elements.sttDescription.textContent = config.description;
    elements.sttPrice.textContent = config.price.toFixed(4);
    elements.sttUnit.textContent = config.unit;
    elements.sttPriceLabel.textContent = config.priceLabel;
    elements.sttPriceInput.value = config.price;

    // badges
    if (currentModels.stt === 'elevenlabs-stt') {
        elements.sttBadge.style.display = '';
        elements.sttBadge.textContent = 'No RealTime Streaming';
    } else {
        elements.sttBadge.style.display = 'none';
    }
    // self-host badges
    if (currentModels.stt === 'deepgram-nova3') {
        elements.sttSelfhostBadge.style.display = '';
        elements.sttSelfhostBadge.textContent = 'Self-hosted available';
    } else {
        elements.sttSelfhostBadge.style.display = 'none';
    }
}

// Update LLM model display
function updateLLMModel() {
    const config = modelConfigs.llm[currentModels.llm];
    elements.llmName.textContent = config.name;
    elements.llmDescription.textContent = config.description;
    elements.llmPrice.textContent = config.price.toFixed(4);
    elements.llmPriceInput.value = config.price;
}

// Update TTS model display
function updateTTSModel() {
    const config = modelConfigs.tts[currentModels.tts];
    
    elements.ttsName.textContent = config.name;
    elements.ttsDescription.textContent = config.description;
    elements.ttsPrice.textContent = config.price.toFixed(6);
    elements.ttsUnit.textContent = config.unit;
    elements.ttsPriceLabel.textContent = config.priceLabel;
    elements.ttsPriceInput.value = config.price;
    
    // Update step size based on price magnitude
    if (config.price < 0.001) {
        elements.ttsPriceInput.step = '0.000001';
    } else if (config.price < 0.01) {
        elements.ttsPriceInput.step = '0.0001';
    } else {
        elements.ttsPriceInput.step = '0.001';
    }
}

// Handle price input changes
function handlePriceChange(event) {
    const value = parseFloat(event.target.value) || 0;
    
    if (event.target === elements.sttPriceInput) {
        elements.sttPrice.textContent = value.toFixed(4);
        modelConfigs.stt['deepgram-nova3'].price = value;
    } else if (event.target === elements.llmPriceInput) {
        elements.llmPrice.textContent = value.toFixed(3);
        modelConfigs.llm['openai-gpt4'].price = value;
    } else if (event.target === elements.ttsPriceInput) {
        const decimals = value < 0.001 ? 6 : value < 0.01 ? 4 : 3;
        elements.ttsPrice.textContent = value.toFixed(decimals);
        modelConfigs.tts[currentModels.tts].price = value;
    }
    
    calculateCosts();
    updateComparisons();
}

// Calculate all costs (using default usage parameters)
function calculateCosts() {
    // Fixed usage parameters (based on typical voice agent usage)
    const audioMinutes = 10; // Default: 10 minutes of audio per session
    const responseChars = 400; // Default: 400 characters in responses
    
    // STT cost (selected)
    const sttPrice = modelConfigs.stt[currentModels.stt].price;
    const sttCost = sttPrice * audioMinutes;
    
    // LLM cost (per 1K tokens) — use tokens/min default
    const llmPrice = modelConfigs.llm[currentModels.llm].price;
    const tokensPerMin = 600; // Default: 600 tokens per minute for LLM
    const llmTokens = (audioMinutes * tokensPerMin);
    const llmCost = llmPrice * (llmTokens / 1000);
    
    // TTS cost
    const ttsConfig = modelConfigs.tts[currentModels.tts];
    let ttsCost;
    
    if (currentModels.tts === 'deepgram') {
        // Deepgram TTS is priced per minute (estimate 150 WPM, 5 chars per word)
        const estimatedMinutes = responseChars / (150 * 5);
        ttsCost = ttsConfig.price * estimatedMinutes;
    } else {
        // Cartesia and ElevenLabs are priced per character
        ttsCost = ttsConfig.price * responseChars;
    }
    
    const totalCost = sttCost + llmCost + ttsCost;
    
    // Calculate per 1000 hours costs
    const hours1000 = 1000;
    const minutesPer1000Hours = hours1000 * 60; // 60,000 minutes
    const tokensPer1000Hours = (llmTokens / audioMinutes) * minutesPer1000Hours; // Scale tokens proportionally
    const charsPer1000Hours = (responseChars / audioMinutes) * minutesPer1000Hours; // Scale chars proportionally
    
    const sttCost1000h = sttPrice * minutesPer1000Hours;
    const llmCost1000h = llmPrice * (tokensPer1000Hours / 1000);
    
    let ttsCost1000h;
    if (currentModels.tts === 'deepgram') {
        const estimatedMinutes1000h = charsPer1000Hours / (150 * 5);
        ttsCost1000h = ttsConfig.price * estimatedMinutes1000h;
    } else {
        ttsCost1000h = ttsConfig.price * charsPer1000Hours;
    }
    
    const totalCost1000h = sttCost1000h + llmCost1000h + ttsCost1000h;
    
    // Update display
    elements.sttCost.textContent = sttCost.toFixed(4);
    elements.llmCost.textContent = llmCost.toFixed(4);
    elements.ttsCost.textContent = ttsCost.toFixed(4);
    elements.totalCost.textContent = totalCost.toFixed(4);

    // Two-month bill calculation (realistic monthly usage)
    // Assumptions: 5 concurrent calls, 8 hours/day, 22 business days/month, 6 calls/hour (10-min each)
    const concurrentCalls = 5;
    const hoursPerDay = 8;
    const businessDaysPerMonth = 22;
    const callsPerHour = 6; // 10-minute calls = 6 calls per hour
    
    const totalCallsPerMonth = concurrentCalls * hoursPerDay * businessDaysPerMonth * callsPerHour;
    const monthlyCost = totalCost * totalCallsPerMonth;
    const twoMonthBill = monthlyCost * 2;
    
    elements.twoMonthBill.textContent = formatLargeCurrency(twoMonthBill);
    
    // Update the mathematical breakdown display
    const mathBreakdown = `${concurrentCalls} concurrent × ${hoursPerDay}h/day × ${businessDaysPerMonth} days × ${callsPerHour} calls/h × $${totalCost.toFixed(4)}/call × 2 months = ${totalCallsPerMonth.toLocaleString()} calls/month`;
    if (elements.twoMonthMath) {
        elements.twoMonthMath.textContent = mathBreakdown;
    }
    
    // Update 1000-hour display
    elements.sttCost1000h.textContent = formatLargeCurrency(sttCost1000h);
    elements.llmCost1000h.textContent = formatLargeCurrency(llmCost1000h);
    elements.ttsCost1000h.textContent = formatLargeCurrency(ttsCost1000h);
    elements.totalCost1000h.textContent = formatLargeCurrency(totalCost1000h);
}

// Update TTS comparison table
function updateTTSComparison() {
    const audioMinutes = 10; // Default: 10 minutes of audio per session
    const responseChars = 400; // Default: 400 characters in responses
    const tokensPerMin = 600; // Default: 600 tokens per minute for LLM
    
    // Calculate current STT and LLM costs (fixed for all comparisons)
    const sttPrice = modelConfigs.stt[currentModels.stt].price;
    const sttCost = sttPrice * audioMinutes;
    
    const llmPrice = modelConfigs.llm[currentModels.llm].price;
    const llmTokens = (audioMinutes * tokensPerMin);
    const llmCost = llmPrice * (llmTokens / 1000);
    
    const currentTotalCost = parseFloat(elements.totalCost.textContent) || 0;
    
    elements.ttsComparisonRows.forEach(row => {
        const provider = row.dataset.provider;
        const config = modelConfigs.tts[provider];
        let ttsCost;
        
        if (provider === 'deepgram') {
            // Deepgram TTS is priced per minute
            const estimatedMinutes = responseChars / (150 * 5);
            ttsCost = config.price * estimatedMinutes;
        } else {
            // Character-based pricing
            ttsCost = config.price * responseChars;
        }
        
        // Calculate total voice agent cost (STT + LLM + TTS)
        const totalVoiceAgentCost = sttCost + llmCost + ttsCost;
        
        const totalElement = row.querySelector('.comp-total');
        const savingsElement = row.querySelector('.savings');
        
        totalElement.textContent = totalVoiceAgentCost.toFixed(4);
        
        // Calculate savings/difference based on total voice agent cost
        if (provider === currentModels.tts) {
            savingsElement.textContent = 'Current';
            savingsElement.style.color = '#667eea';
        } else {
            const difference = ((totalVoiceAgentCost - currentTotalCost) / currentTotalCost) * 100;
            if (Math.abs(difference) < 0.1) {
                savingsElement.textContent = '~0%';
                savingsElement.style.color = '#4a5568';
            } else if (difference > 0) {
                savingsElement.textContent = `+${Math.round(difference)}%`;
                savingsElement.style.color = '#e53e3e';
            } else {
                savingsElement.textContent = `${Math.round(difference)}%`;
                savingsElement.style.color = '#38a169';
            }
        }
        
        // Highlight current selection
        if (provider === currentModels.tts) {
            row.style.backgroundColor = '#f0f8ff';
            row.style.border = '2px solid #667eea';
            row.style.borderRadius = '8px';
        } else {
            row.style.backgroundColor = '';
            row.style.border = '';
            row.style.borderRadius = '';
        }
    });
}

// Update STT comparison table
function updateSTTComparison() {
    const audioMinutes = 10; // Default: 10 minutes of audio per session
    const responseChars = 400; // Default: 400 characters in responses
    const tokensPerMin = 600; // Default: 600 tokens per minute for LLM
    
    // Calculate current LLM and TTS costs (fixed for all comparisons)
    const llmPrice = modelConfigs.llm[currentModels.llm].price;
    const llmTokens = (audioMinutes * tokensPerMin);
    const llmCost = llmPrice * (llmTokens / 1000);
    
    const ttsConfig = modelConfigs.tts[currentModels.tts];
    let ttsCost;
    if (currentModels.tts === 'deepgram') {
        const estimatedMinutes = responseChars / (150 * 5);
        ttsCost = ttsConfig.price * estimatedMinutes;
    } else {
        ttsCost = ttsConfig.price * responseChars;
    }
    
    const currentTotalCost = parseFloat(elements.totalCost.textContent) || 0;
    
    elements.sttComparisonRows.forEach(row => {
        const provider = row.dataset.provider;
        const config = modelConfigs.stt[provider];
        
        // Calculate STT cost for this provider
        const sttCost = config.price * audioMinutes;
        
        // Calculate total voice agent cost (STT + LLM + TTS)
        const totalVoiceAgentCost = sttCost + llmCost + ttsCost;
        
        const totalElement = row.querySelector('.comp-total');
        const savingsElement = row.querySelector('.savings');
        
        totalElement.textContent = totalVoiceAgentCost.toFixed(4);
        
        // Calculate savings/difference based on total voice agent cost
        if (provider === currentModels.stt) {
            savingsElement.textContent = 'Current';
            savingsElement.style.color = '#667eea';
        } else {
            const difference = ((totalVoiceAgentCost - currentTotalCost) / currentTotalCost) * 100;
            if (Math.abs(difference) < 0.1) {
                savingsElement.textContent = '~0%';
                savingsElement.style.color = '#4a5568';
            } else if (difference > 0) {
                savingsElement.textContent = `+${Math.round(difference)}%`;
                savingsElement.style.color = '#e53e3e';
            } else {
                savingsElement.textContent = `${Math.round(difference)}%`;
                savingsElement.style.color = '#38a169';
            }
        }
        
        // Highlight current selection
        if (provider === currentModels.stt) {
            row.style.backgroundColor = '#f0f8ff';
            row.style.border = '2px solid #667eea';
            row.style.borderRadius = '8px';
        } else {
            row.style.backgroundColor = '';
            row.style.border = '';
            row.style.borderRadius = '';
        }
    });
}

// Add click handlers to comparison rows for easy switching
function setupComparisonClickHandlers() {
    // TTS comparison rows
    elements.ttsComparisonRows.forEach(row => {
        row.addEventListener('click', () => {
            const provider = row.dataset.provider;
            if (provider !== currentModels.tts) {
                elements.ttsSelector.value = provider;
                handleTTSChange();
            }
        });
        
        // Add cursor pointer style
        row.style.cursor = 'pointer';
        row.title = 'Click to select this TTS provider';
    });
    
    // STT comparison rows
    elements.sttComparisonRows.forEach(row => {
        row.addEventListener('click', () => {
            const provider = row.dataset.provider;
            if (provider !== currentModels.stt) {
                elements.sttSelector.value = provider;
                handleSTTChange();
            }
        });
        
        // Add cursor pointer style
        row.style.cursor = 'pointer';
        row.title = 'Click to select this STT provider';
    });
}

// Update both comparison tables
function updateComparisons() {
    updateTTSComparison();
    updateSTTComparison();
}

// Utility function to format currency
function formatCurrency(amount, decimals = 4) {
    return `$${amount.toFixed(decimals)}`;
}

// Utility function to format large currency amounts
function formatLargeCurrency(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(1) + 'K';
    } else {
        return amount.toFixed(0);
    }
}

// Utility function to animate value changes
function animateValueChange(element, newValue, decimals = 4) {
    element.style.transition = 'color 0.3s ease';
    element.style.color = '#667eea';
    element.textContent = newValue.toFixed(decimals);
    
    setTimeout(() => {
        element.style.color = '';
    }, 300);
}

// Utility function to animate text changes
function animateValueChangeText(element, newText) {
    element.style.transition = 'color 0.3s ease';
    element.style.color = '#667eea';
    element.textContent = newText;
    
    setTimeout(() => {
        element.style.color = '';
    }, 300);
}

// Apply Wizard values to usage inputs

// Very lightweight spec-to-config (heuristic over registry): no external calls in demo
async function generateFromSpec() {
    const spec = (elements.nlSpecInput.value || '').toLowerCase();
    
    if (!spec.trim()) {
        elements.nlResponse.style.display = 'none';
        return;
    }

    // Show loading state
    elements.nlResponse.style.display = 'block';
    elements.nlResponseText.innerHTML = '<p>🤔 Analyzing your requirements...</p>';

    // Try server first (only if user has provided API key)
    const userApiKey = getApiKey();
    
    if (userApiKey) {
        try {
            const resp = await fetch('/api/spec-to-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    spec, 
                    requirements: {},
                    apiKey: userApiKey
                })
            });
        if (resp.ok) {
            const data = await resp.json();
            if (data?.components) {
                const { stt, tts, llm } = data.components;
                const sttKey = /deepgram/i.test(stt?.provider) ? 'deepgram-nova3' : /cartesia/i.test(stt?.provider) ? 'cartesia-ink' : /eleven/i.test(stt?.provider) ? 'elevenlabs-stt' : currentModels.stt;
                const ttsKey = /deepgram/i.test(tts?.provider) ? 'deepgram' : /cartesia/i.test(tts?.provider) ? 'cartesia' : /eleven/i.test(tts?.provider) ? 'elevenlabs' : currentModels.tts;
                const llmKey = /openai/i.test(llm?.provider) ? 'openai-gpt4o-mini' : /gemini|google/i.test(llm?.provider) ? 'google-gemini-flash' : currentModels.llm;

                // Show GPT response
                displayResponse(data, sttKey, ttsKey, llmKey, true);
                
                // Update models after showing response
                setTimeout(() => {
                    applyModelSelection(sttKey, ttsKey, llmKey, stt, tts, llm);
                }, 1000);
                return;
            }
        }
        } catch (_) {}
    }

    // Fallback heuristic
    let stt = 'deepgram-nova3';
    let tts = 'deepgram';
    let llm = 'openai-gpt4o-mini';
    let reasoning = [];
    
    // Detect cost priority preferences
    const prioritizeCost = /value.*cheap|cheap.*over.*latency|cost.*over.*performance|budget.*priority|cheapest.*possible|value.*cost|prefer.*cheap|cheap.*important/i.test(spec);

    // Check for explicit ElevenLabs STT request
    if (/elevenlabs.*stt|elevenlabs.*speech[- ]?to[- ]?text|use elevenlabs.*stt|with elevenlabs stt|elevenlabs stt/i.test(spec)) {
        stt = 'elevenlabs-stt';
        const hasLatencyReq = spec.includes('ultra') || spec.includes('low latency') || spec.includes('fast');
        const hasSelfHostReq = spec.includes('on-prem') || spec.includes('on prem') || spec.includes('self-host');
        
        let rationale = 'Selected <strong>ElevenLabs STT</strong> as requested';
        const limitations = [];
        
        if (!hasLatencyReq && !hasSelfHostReq) {
            rationale += ' - batch processing only';
        } else {
            if (hasLatencyReq) {
                limitations.push('not suitable for real-time/low-latency voice agents');
            }
            if (hasSelfHostReq) {
                limitations.push('does not support self-hosted deployment');
            }
            rationale += ' - batch processing only, ' + limitations.join(' and ');
            rationale += '. Consider Deepgram Nova-3 for these requirements.';
        }
        
        reasoning.push(rationale);
    }

    // Check for explicit ElevenLabs TTS request
    if (/elevenlabs.*tts|elevenlabs.*text[- ]?to[- ]?speech|use elevenlabs.*tts|with elevenlabs tts|elevenlabs tts/i.test(spec)) {
        tts = 'elevenlabs';
        const hasSelfHostReq = spec.includes('on-prem') || spec.includes('on prem') || spec.includes('self-host');
        
        if (hasSelfHostReq) {
            reasoning.push('Selected <strong>ElevenLabs TTS</strong> as requested - does not support self-hosted deployment. Consider Deepgram Aura 2 for self-hosted needs.');
        } else {
            reasoning.push('Selected <strong>ElevenLabs TTS</strong> as requested - high quality voice synthesis');
        }
         } else if (spec.includes('ultra') || spec.includes('low latency') || spec.includes('fast')) { 
        if (prioritizeCost) {
            // When cost is prioritized, choose cheaper option even for latency requirements
            tts = 'deepgram';
            reasoning.push('Selected <strong>Deepgram Aura 2</strong> for TTS - cheapest option prioritized over ultra-low latency as requested');
        } else {
            tts = 'cartesia'; 
            reasoning.push('Selected <strong>Cartesia</strong> for TTS due to ultra-low latency requirements');
        }
    }
    if ((spec.includes('on-prem') || spec.includes('on prem') || spec.includes('self-host')) && stt !== 'elevenlabs-stt' && tts !== 'elevenlabs') { 
        stt = 'deepgram-nova3'; 
        tts = 'deepgram'; 
        reasoning.push('Selected <strong>Deepgram</strong> models for self-hosted deployment capability');
    }
    if (spec.includes('google') || spec.includes('gemini')) { 
        llm = 'google-gemini-flash'; 
        reasoning.push('Selected <strong>Google Gemini Flash</strong> as requested');
    }
    
    // Apply cost optimization if prioritized and no explicit provider conflicts
    if (prioritizeCost) {
        // Use cheapest LLM if no explicit LLM request
        if (!spec.includes('google') && !spec.includes('gemini') && !spec.includes('openai')) {
            llm = 'openai-gpt4o-mini'; // Already the cheapest at $0.0006/1K tokens
        }
        
        // Use cheapest TTS if no explicit TTS request
        if (!(/elevenlabs.*tts/i.test(spec)) && tts === 'cartesia') {
            // Override Cartesia selection if cost is prioritized
            tts = 'deepgram'; // Deepgram Aura 1 is cheaper than Cartesia
            // Update reasoning to replace Cartesia reasoning
            reasoning = reasoning.filter(r => !r.includes('Cartesia'));
            reasoning.push('Selected <strong>Deepgram Aura 2</strong> for TTS - prioritizing cost over ultra-low latency as requested');
        }
        
        // Don't override explicit ElevenLabs STT request, it's already selected above if requested
    }

    // Show heuristic response
    displayHeuristicResponse(spec, stt, tts, llm, reasoning);
    
    // Update models after showing response
    setTimeout(() => {
        applyModelSelection(stt, tts, llm);
    }, 1000);
}

function displayResponse(data, sttKey, ttsKey, llmKey, isGPT = false) {
    const sttName = modelConfigs.stt[sttKey].name;
    const ttsName = modelConfigs.tts[ttsKey].name;
    const llmName = modelConfigs.llm[llmKey].name;
    
    let responseHTML = `<p><strong>Based on your requirements, I recommend:</strong></p>`;
    
    if (isGPT && data.components) {
        // Use GPT rationale if available
        responseHTML += `
            <div class="model-choice">
                <strong>STT:</strong> ${sttName}<br>
                <em>${data.components.stt?.rationale || 'Selected for speech-to-text processing'}</em>
            </div>
            <div class="model-choice">
                <strong>LLM:</strong> ${llmName}<br>
                <em>${data.components.llm?.rationale || 'Selected for language processing'}</em>
            </div>
            <div class="model-choice">
                <strong>TTS:</strong> ${ttsName}<br>
                <em>${data.components.tts?.rationale || 'Selected for text-to-speech synthesis'}</em>
            </div>
        `;
    } else {
        responseHTML += `
            <div class="model-choice">
                <strong>STT:</strong> ${sttName}<br>
                <strong>LLM:</strong> ${llmName}<br>
                <strong>TTS:</strong> ${ttsName}
            </div>
        `;
    }
    
    responseHTML += `<p>⏳ <em>Updating model selection and pricing...</em></p>`;
    elements.nlResponseText.innerHTML = responseHTML;
}

function displayHeuristicResponse(spec, stt, tts, llm, reasoning) {
    const sttName = modelConfigs.stt[stt].name;
    const ttsName = modelConfigs.tts[tts].name;
    const llmName = modelConfigs.llm[llm].name;
    
    let responseHTML = `<p><strong>Based on your requirements "${spec}", I recommend:</strong></p>`;
    
    responseHTML += `
        <div class="model-choice">
            <strong>STT:</strong> ${sttName}<br>
            <strong>LLM:</strong> ${llmName}<br>
            <strong>TTS:</strong> ${ttsName}
        </div>
    `;
    
    if (reasoning.length > 0) {
        responseHTML += '<p><strong>Reasoning:</strong></p><ul>';
        reasoning.forEach(reason => {
            responseHTML += `<li>${reason}</li>`;
        });
        responseHTML += '</ul>';
    } else {
        responseHTML += '<p><em>Using default high-quality models for general voice agent use.</em></p>';
    }
    
    responseHTML += `<p>⏳ <em>Updating model selection and pricing...</em></p>`;
    elements.nlResponseText.innerHTML = responseHTML;
}

function applyModelSelection(stt, tts, llm, sttData = null, ttsData = null, llmData = null) {
    currentModels.stt = stt;
    currentModels.tts = tts;
    currentModels.llm = llm;

    elements.sttSelector.value = stt;
    elements.ttsSelector.value = tts;
    elements.llmSelector.value = llm;

    // Update pricing if provided
    if (sttData && typeof sttData.price === 'number') { modelConfigs.stt[stt].price = sttData.price; }
    if (ttsData && typeof ttsData.price === 'number') { modelConfigs.tts[tts].price = ttsData.price; }
    if (llmData && typeof llmData.price === 'number') { modelConfigs.llm[llm].price = llmData.price; }

    updateSTTModel();
    updateTTSModel();
    updateLLMModel();
    calculateCosts();
    updateComparisons();
    
    // Update response to show completion
    setTimeout(() => {
        const currentHTML = elements.nlResponseText.innerHTML;
        elements.nlResponseText.innerHTML = currentHTML.replace('⏳ <em>Updating model selection and pricing...</em>', '✅ <em>Models updated successfully!</em>');
    }, 500);
}

// Enhanced cost calculation with animations
function calculateCostsAnimated() {
    // Fixed usage parameters
    const audioMinutes = 10; // Default: 10 minutes of audio per session
    const responseChars = 400; // Default: 400 characters in responses
    
    // STT cost
    const sttPrice = modelConfigs.stt['deepgram-nova3'].price;
    const sttCost = sttPrice * audioMinutes;
    
    // LLM cost
    const llmPrice = modelConfigs.llm[currentModels.llm].price;
    const tokensPerMin = 600; // Default: 600 tokens per minute
    const llmTokens = audioMinutes * tokensPerMin;
    const llmCost = llmPrice * (llmTokens / 1000);
    
    // TTS cost
    const ttsConfig = modelConfigs.tts[currentModels.tts];
    let ttsCost;
    
    if (currentModels.tts === 'deepgram') {
        const estimatedMinutes = responseChars / (150 * 5);
        ttsCost = ttsConfig.price * estimatedMinutes;
    } else {
        ttsCost = ttsConfig.price * responseChars;
    }
    
    const totalCost = sttCost + llmCost + ttsCost;
    
    // Calculate per 1000 hours costs
    const hours1000 = 1000;
    const minutesPer1000Hours = hours1000 * 60; // 60,000 minutes
    const tokensPer1000Hours = (responseTokens / audioMinutes) * minutesPer1000Hours; // Scale tokens proportionally
    const charsPer1000Hours = (responseChars / audioMinutes) * minutesPer1000Hours; // Scale chars proportionally
    
    const sttCost1000h = sttPrice * minutesPer1000Hours;
    const llmCost1000h = llmPrice * (tokensPer1000Hours / 1000);
    
    let ttsCost1000h;
    if (currentModels.tts === 'deepgram') {
        const estimatedMinutes1000h = charsPer1000Hours / (150 * 5);
        ttsCost1000h = ttsConfig.price * estimatedMinutes1000h;
    } else {
        ttsCost1000h = ttsConfig.price * charsPer1000Hours;
    }
    
    const totalCost1000h = sttCost1000h + llmCost1000h + ttsCost1000h;
    
    // Animate updates
    animateValueChange(elements.sttCost, sttCost);
    animateValueChange(elements.llmCost, llmCost);
    animateValueChange(elements.ttsCost, ttsCost);
    animateValueChange(elements.totalCost, totalCost);
    
    // Update 1000-hour display with animation
    animateValueChangeText(elements.sttCost1000h, formatLargeCurrency(sttCost1000h));
    animateValueChangeText(elements.llmCost1000h, formatLargeCurrency(llmCost1000h));
    animateValueChangeText(elements.ttsCost1000h, formatLargeCurrency(ttsCost1000h));
    animateValueChangeText(elements.totalCost1000h, formatLargeCurrency(totalCost1000h));
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the TTS selector shows the correct default selection
    elements.ttsSelector.value = currentModels.tts;
    
    init();
    setupComparisonClickHandlers();
    
    // Usage parameters are now fixed defaults (no user inputs to animate)
}); 