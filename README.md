# Cascaded Voice Models Pricing Comparison

A web-based tool to compare pricing across different Text-to-Speech providers in a cascaded voice AI architecture.

## Purpose

This tool helps developers and businesses evaluate the cost implications of different TTS providers while keeping Speech-to-Text (Deepgram Nova-3) and LLM (OpenAI GPT-4) components constant. Perfect for making informed decisions about voice AI stack pricing.

## Architecture

- **Speech-to-Text**: Deepgram Nova-3 (fixed)
- **LLM**: OpenAI GPT-4 (fixed) 
- **Text-to-Speech**: Switchable between:
  - Cartesia
  - ElevenLabs  
  - Deepgram Aura

## Features

- 🔄 **Real-time cost calculations** for current usage and 1000-hour scaling
- 📊 **Interactive comparison table** with percentage differences
- ⚙️ **Adjustable pricing parameters** for custom scenarios
- 📱 **Responsive design** works on all devices
- ✨ **Smooth animations** and modern UI

## Quick Start

### Option 1: Direct Browser (Fastest)
```bash
# Simply open the HTML file
open index.html
```

### Option 2: Development Server
```bash
# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

## File Structure

```
pricing/
├── index.html      # Main application
├── styles.css      # Styling
├── script.js       # Interactive functionality
├── package.json    # Dependencies (optional)
└── README.md       # This file
```

## Usage

1. **Adjust usage parameters** (audio duration, tokens, characters)
2. **Switch TTS providers** using the dropdown
3. **Modify pricing** using the input fields
4. **Compare costs** in the breakdown and comparison sections
5. **View scaling** from current usage to 1000-hour enterprise costs

## Technologies

- Pure HTML/CSS/JavaScript (no frameworks)
- Modern ES6+ features
- CSS Grid & Flexbox for responsive layout
- Live-server for development (optional)

Built for simplicity and immediate usability. 