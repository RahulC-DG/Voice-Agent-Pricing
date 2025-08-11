// Model pricing configurations
const modelConfigs = {
    stt: {
        'deepgram-nova3': {
            name: 'Deepgram Nova-3',
            description: 'High-accuracy speech recognition',
            price: 0.0043,
            unit: 'per minute',
            priceLabel: 'Price per minute: $'
        }
    },
    llm: {
        'openai-gpt4': {
            name: 'OpenAI GPT-4',
            description: 'Advanced language understanding',
            price: 0.03,
            unit: 'per 1K tokens',
            priceLabel: 'Price per 1K tokens: $'
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
    llm: 'openai-gpt4',
    tts: 'deepgram'
};

// DOM elements
const elements = {
    ttsSelector: document.getElementById('tts-selector'),
    ttsName: document.getElementById('tts-name'),
    ttsDescription: document.getElementById('tts-description'),
    ttsPrice: document.getElementById('tts-price'),
    ttsUnit: document.getElementById('tts-unit'),
    ttsPriceLabel: document.getElementById('tts-price-label'),
    ttsPriceInput: document.getElementById('tts-price-input'),
    
    sttPrice: document.getElementById('stt-price'),
    sttPriceInput: document.getElementById('stt-price-input'),
    llmPrice: document.getElementById('llm-price'),
    llmPriceInput: document.getElementById('llm-price-input'),
    
    audioMinutes: document.getElementById('audio-minutes'),
    responseTokens: document.getElementById('response-tokens'),
    responseChars: document.getElementById('response-chars'),
    
    sttCost: document.getElementById('stt-cost'),
    llmCost: document.getElementById('llm-cost'),
    ttsCost: document.getElementById('tts-cost'),
    totalCost: document.getElementById('total-cost'),
    
    sttCost1000h: document.getElementById('stt-cost-1000h'),
    llmCost1000h: document.getElementById('llm-cost-1000h'),
    ttsCost1000h: document.getElementById('tts-cost-1000h'),
    totalCost1000h: document.getElementById('total-cost-1000h'),
    
    comparisonRows: document.querySelectorAll('.comparison-row[data-provider]')
};

// Initialize the application
function init() {
    setupEventListeners();
    // Set the TTS selector to match the default selection
    elements.ttsSelector.value = currentModels.tts;
    updateTTSModel();
    calculateCosts();
    updateComparison();
}

// Set up event listeners
function setupEventListeners() {
    elements.ttsSelector.addEventListener('change', handleTTSChange);
    
    // Price input listeners
    elements.sttPriceInput.addEventListener('input', handlePriceChange);
    elements.llmPriceInput.addEventListener('input', handlePriceChange);
    elements.ttsPriceInput.addEventListener('input', handlePriceChange);
    
    // Usage parameter listeners
    elements.audioMinutes.addEventListener('input', calculateCosts);
    elements.responseTokens.addEventListener('input', calculateCosts);
    elements.responseChars.addEventListener('input', calculateCosts);
}

// Handle TTS model change
function handleTTSChange() {
    currentModels.tts = elements.ttsSelector.value;
    updateTTSModel();
    calculateCosts();
    updateComparison();
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
    updateComparison();
}

// Calculate all costs
function calculateCosts() {
    const audioMinutes = parseFloat(elements.audioMinutes.value) || 0;
    const responseTokens = parseFloat(elements.responseTokens.value) || 0;
    const responseChars = parseFloat(elements.responseChars.value) || 0;
    
    // STT cost
    const sttPrice = modelConfigs.stt['deepgram-nova3'].price;
    const sttCost = sttPrice * audioMinutes;
    
    // LLM cost (per 1K tokens)
    const llmPrice = modelConfigs.llm['openai-gpt4'].price;
    const llmCost = llmPrice * (responseTokens / 1000);
    
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
    
    // Update display
    elements.sttCost.textContent = sttCost.toFixed(4);
    elements.llmCost.textContent = llmCost.toFixed(4);
    elements.ttsCost.textContent = ttsCost.toFixed(4);
    elements.totalCost.textContent = totalCost.toFixed(4);
    
    // Update 1000-hour display
    elements.sttCost1000h.textContent = formatLargeCurrency(sttCost1000h);
    elements.llmCost1000h.textContent = formatLargeCurrency(llmCost1000h);
    elements.ttsCost1000h.textContent = formatLargeCurrency(ttsCost1000h);
    elements.totalCost1000h.textContent = formatLargeCurrency(totalCost1000h);
}

// Update comparison table
function updateComparison() {
    const responseChars = parseFloat(elements.responseChars.value) || 0;
    const currentTTSCost = parseFloat(elements.ttsCost.textContent) || 0;
    
    elements.comparisonRows.forEach(row => {
        const provider = row.dataset.provider;
        const config = modelConfigs.tts[provider];
        let cost;
        
        if (provider === 'deepgram') {
            // Deepgram TTS is priced per minute
            const estimatedMinutes = responseChars / (150 * 5);
            cost = config.price * estimatedMinutes;
        } else {
            // Character-based pricing
            cost = config.price * responseChars;
        }
        
        const totalElement = row.querySelector('.comp-total');
        const savingsElement = row.querySelector('.savings');
        
        totalElement.textContent = cost.toFixed(4);
        
        // Calculate savings/difference
        if (provider === currentModels.tts) {
            savingsElement.textContent = 'Current';
            savingsElement.style.color = '#667eea';
        } else {
            const difference = ((cost - currentTTSCost) / currentTTSCost) * 100;
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

// Add click handlers to comparison rows for easy switching
function setupComparisonClickHandlers() {
    elements.comparisonRows.forEach(row => {
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

// Enhanced cost calculation with animations
function calculateCostsAnimated() {
    const audioMinutes = parseFloat(elements.audioMinutes.value) || 0;
    const responseTokens = parseFloat(elements.responseTokens.value) || 0;
    const responseChars = parseFloat(elements.responseChars.value) || 0;
    
    // STT cost
    const sttPrice = modelConfigs.stt['deepgram-nova3'].price;
    const sttCost = sttPrice * audioMinutes;
    
    // LLM cost
    const llmPrice = modelConfigs.llm['openai-gpt4'].price;
    const llmCost = llmPrice * (responseTokens / 1000);
    
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
    
    // Replace calculateCosts with animated version for user interactions
    elements.audioMinutes.removeEventListener('input', calculateCosts);
    elements.responseTokens.removeEventListener('input', calculateCosts);
    elements.responseChars.removeEventListener('input', calculateCosts);
    
    elements.audioMinutes.addEventListener('input', calculateCostsAnimated);
    elements.responseTokens.addEventListener('input', calculateCostsAnimated);
    elements.responseChars.addEventListener('input', calculateCostsAnimated);
}); 