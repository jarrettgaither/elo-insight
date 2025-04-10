# 90s-Themed Design System

This document outlines the design system for the Elo Insight frontend, featuring a professional 90s-inspired aesthetic.

## Design Philosophy

The 90s were characterized by bold colors, playful typography, geometric patterns, and a sense of technological optimism. Our design system embraces these elements while maintaining modern usability standards and responsive design principles.

## Visual Identity

### Color Palette

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Primary Colors                                             │
│  ──────────────                                             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │          │  │          │  │          │  │          │    │
│  │ #FF5177  │  │ #33CCFF  │  │ #FFDE59  │  │ #7D4CDB  │    │
│  │ Hot Pink │  │ Neon Blue│  │ Cyber    │  │ Electric │    │
│  │          │  │          │  │ Yellow   │  │ Purple   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│  Secondary Colors                                           │
│  ────────────────                                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │          │  │          │  │          │  │          │    │
│  │ #00CC99  │  │ #FF9900  │  │ #6633CC  │  │ #FF3366  │    │
│  │ Teal     │  │ Orange   │  │ Purple   │  │ Magenta  │    │
│  │          │  │          │  │          │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│  Neutral Colors                                             │
│  ───────────────                                            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │          │  │          │  │          │  │          │    │
│  │ #121212  │  │ #2D2D2D  │  │ #CCCCCC  │  │ #FFFFFF  │    │
│  │ Black    │  │ Dark Gray│  │ Light    │  │ White    │    │
│  │          │  │          │  │ Gray     │  │          │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Typography

#### Headings: VT323
A monospace font reminiscent of early computer displays.

```css
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

h1, h2, h3, h4, h5, h6 {
  font-family: 'VT323', monospace;
}
```

#### Body: Space Mono
A modern monospace font with a technical feel.

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

body {
  font-family: 'Space Mono', monospace;
}
```

#### Accent: Permanent Marker
For special elements and emphasis.

```css
@import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap');

.accent-text {
  font-family: 'Permanent Marker', cursive;
}
```

### Patterns & Textures

1. **Grid Pattern**: Reminiscent of early 3D environments
   ```css
   .grid-background {
     background-image: linear-gradient(rgba(40, 40, 40, 0.8) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(40, 40, 40, 0.8) 1px, transparent 1px);
     background-size: 20px 20px;
     background-color: #121212;
   }
   ```

2. **Memphis Style**: Geometric shapes and patterns
   ```css
   .memphis-pattern {
     background-image: url('/assets/patterns/memphis.svg');
     background-repeat: repeat;
   }
   ```

3. **Noise Texture**: CRT-like noise effect
   ```css
   .noise-overlay {
     position: absolute;
     top: 0;
     left: 0;
     width: 100%;
     height: 100%;
     background-image: url('/assets/textures/noise.png');
     opacity: 0.05;
     pointer-events: none;
   }
   ```

## Component Library

### Buttons

```jsx
// Primary Button
<button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-vt323 text-xl uppercase tracking-wider border-2 border-cyan-400 shadow-neon hover:shadow-neon-intense transition-all duration-300">
  Start Game
</button>

// Secondary Button
<button className="px-4 py-2 bg-gray-800 text-cyan-400 font-vt323 text-lg uppercase border border-cyan-400 hover:bg-cyan-400 hover:text-gray-900 transition-all duration-300">
  Options
</button>

// Icon Button
<button className="w-12 h-12 flex items-center justify-center bg-gray-800 text-yellow-300 border border-yellow-300 rounded-full hover:bg-yellow-300 hover:text-gray-900 transition-all duration-300">
  <svg>...</svg>
</button>
```

### Cards

```jsx
// Stat Card
<div className="relative overflow-hidden bg-gray-900 border-2 border-cyan-400 p-6">
  <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500 transform rotate-45 translate-x-8 -translate-y-8"></div>
  <h3 className="font-vt323 text-2xl text-cyan-400 mb-2">HEADSHOTS</h3>
  <p className="font-space-mono text-4xl text-white">247</p>
  <div className="mt-4 h-2 bg-gray-700 w-full">
    <div className="h-full bg-gradient-to-r from-pink-500 to-purple-600" style={{width: '65%'}}></div>
  </div>
</div>
```

### Inputs

```jsx
// Text Input
<div className="mb-4">
  <label className="block font-vt323 text-xl text-cyan-400 mb-2">USERNAME</label>
  <input 
    type="text" 
    className="w-full px-4 py-2 bg-gray-800 border-2 border-cyan-400 text-white font-space-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
  />
</div>

// Checkbox
<div className="flex items-center">
  <input 
    type="checkbox" 
    className="w-5 h-5 border-2 border-cyan-400 bg-gray-800 checked:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
  />
  <label className="ml-2 font-space-mono text-white">Remember me</label>
</div>
```

### Navigation

```jsx
// Main Navigation
<nav className="bg-gray-900 border-b-2 border-cyan-400 p-4">
  <div className="flex justify-between items-center">
    <div className="font-permanent-marker text-3xl text-gradient bg-gradient-to-r from-pink-500 to-purple-600">
      ELO INSIGHT
    </div>
    <div className="flex space-x-6">
      <a className="font-vt323 text-xl text-white hover:text-pink-500 transition-colors">HOME</a>
      <a className="font-vt323 text-xl text-white hover:text-pink-500 transition-colors">STATS</a>
      <a className="font-vt323 text-xl text-white hover:text-pink-500 transition-colors">PROFILE</a>
    </div>
  </div>
</nav>
```

## Animation & Effects

### Glitch Effect

```css
.glitch {
  position: relative;
  animation: glitch 1s linear infinite;
}

@keyframes glitch {
  2%, 64% {
    transform: translate(2px, 0) skew(0deg);
  }
  4%, 60% {
    transform: translate(-2px, 0) skew(0deg);
  }
  62% {
    transform: translate(0, 0) skew(5deg);
  }
}

.glitch:before,
.glitch:after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.glitch:before {
  left: 2px;
  text-shadow: -2px 0 #ff00c1;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim 5s infinite linear alternate-reverse;
}

.glitch:after {
  left: -2px;
  text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
  clip: rect(44px, 450px, 56px, 0);
  animation: glitch-anim2 5s infinite linear alternate-reverse;
}
```

### Neon Glow

```css
.neon-text {
  color: #fff;
  text-shadow: 
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #ff00de,
    0 0 30px #ff00de,
    0 0 40px #ff00de,
    0 0 55px #ff00de,
    0 0 75px #ff00de;
}

.neon-box {
  box-shadow:
    0 0 5px #fff,
    0 0 10px #fff,
    0 0 20px #00ccff,
    0 0 30px #00ccff,
    0 0 40px #00ccff;
}
```

### CRT Screen Effect

```css
.crt::before {
  content: " ";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
}

.crt::after {
  content: " ";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: rgba(18, 16, 16, 0.1);
  opacity: 0;
  z-index: 2;
  pointer-events: none;
  animation: flicker 0.15s infinite;
}

@keyframes flicker {
  0% { opacity: 0.27861; }
  5% { opacity: 0.34769; }
  10% { opacity: 0.23604; }
  15% { opacity: 0.90626; }
  20% { opacity: 0.18128; }
  25% { opacity: 0.83891; }
  30% { opacity: 0.65583; }
  35% { opacity: 0.67807; }
  40% { opacity: 0.26559; }
  45% { opacity: 0.84693; }
  50% { opacity: 0.96019; }
  55% { opacity: 0.08594; }
  60% { opacity: 0.20313; }
  65% { opacity: 0.71988; }
  70% { opacity: 0.53455; }
  75% { opacity: 0.37288; }
  80% { opacity: 0.71428; }
  85% { opacity: 0.70419; }
  90% { opacity: 0.7003; }
  95% { opacity: 0.36108; }
  100% { opacity: 0.24387; }
}
```

## Page Layouts

### Dashboard Layout

```jsx
<div className="min-h-screen bg-gray-900 crt">
  <div className="noise-overlay"></div>
  <nav>...</nav>
  
  <header className="px-8 py-12 grid-background">
    <h1 className="font-vt323 text-5xl neon-text mb-4">PLAYER DASHBOARD</h1>
    <p className="font-space-mono text-white max-w-2xl">Track your gaming performance across multiple platforms with our advanced statistics system.</p>
  </header>
  
  <main className="container mx-auto px-4 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Stat cards */}
      <div className="col-span-full lg:col-span-2">
        <div className="bg-gray-800 border-2 border-cyan-400 p-6">
          <h2 className="font-vt323 text-3xl text-cyan-400 mb-4">PERFORMANCE TRENDS</h2>
          {/* Chart component */}
        </div>
      </div>
      
      <div>
        <div className="bg-gray-800 border-2 border-pink-500 p-6">
          <h2 className="font-vt323 text-3xl text-pink-500 mb-4">RECENT MATCHES</h2>
          {/* Match list */}
        </div>
      </div>
    </div>
  </main>
  
  <footer className="bg-gray-900 border-t-2 border-cyan-400 p-6">
    <div className="font-vt323 text-center text-white">© 2025 ELO INSIGHT</div>
  </footer>
</div>
```

## Responsive Design

The design system will be fully responsive, adapting to different screen sizes while maintaining the 90s aesthetic:

- Mobile-first approach
- Breakpoints for tablet and desktop views
- Simplified animations on mobile devices
- Touch-friendly interface elements

## Implementation with Tailwind CSS

We'll extend Tailwind CSS with custom configuration to support our 90s design system:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        pink: {
          500: '#FF5177',
        },
        cyan: {
          400: '#33CCFF',
        },
        yellow: {
          300: '#FFDE59',
        },
        purple: {
          600: '#7D4CDB',
        },
        // Additional colors...
      },
      fontFamily: {
        'vt323': ['"VT323"', 'monospace'],
        'space-mono': ['"Space Mono"', 'monospace'],
        'permanent-marker': ['"Permanent Marker"', 'cursive'],
      },
      boxShadow: {
        'neon': '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00ccff, 0 0 30px #00ccff',
        'neon-intense': '0 0 5px #fff, 0 0 10px #fff, 0 0 20px #00ccff, 0 0 30px #00ccff, 0 0 40px #00ccff',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(40, 40, 40, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(40, 40, 40, 0.8) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'glitch': 'glitch 1s linear infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        glitch: {
          '2%, 64%': { transform: 'translate(2px, 0) skew(0deg)' },
          '4%, 60%': { transform: 'translate(-2px, 0) skew(0deg)' },
          '62%': { transform: 'translate(0, 0) skew(5deg)' },
        },
        flicker: {
          '0%': { opacity: '0.27861' },
          '5%': { opacity: '0.34769' },
          // Additional keyframes...
        },
      },
    },
  },
  plugins: [],
}
```

## Design Assets

The following assets will be created to support the design system:

1. SVG patterns for backgrounds
2. Custom icons in the 90s style
3. Noise and CRT textures
4. Logo variations
5. Loading animations

## Accessibility Considerations

While embracing the 90s aesthetic, we'll ensure the design remains accessible:

- Sufficient color contrast for text readability
- Focus states for keyboard navigation
- Alternative text for decorative elements
- Reduced motion option for animations
- ARIA attributes for custom components

## Implementation Plan

1. Set up the extended Tailwind configuration
2. Create base component library
3. Implement global styles and animations
4. Design key page layouts
5. Create and optimize design assets
6. Test responsiveness and accessibility
7. Document component usage
