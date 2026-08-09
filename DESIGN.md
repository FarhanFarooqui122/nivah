---
name: Nivah
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#4a4455'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#7b7487'
  outline-variant: '#ccc3d8'
  surface-tint: '#732ee4'
  primary: '#630ed4'
  on-primary: '#ffffff'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#d2bbff'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#7d3d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a15100'
  on-tertiary-container: '#ffe0cd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb784'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#713700'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  chat-bubble:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1280px
  sidebar-width: 280px
---

## Brand & Style
The design system for this AI study assistant focuses on a **Modern Academic** aesthetic that balances the rigor of education with the approachability of a supportive companion. The personality is intelligent, encouraging, and focused, aimed at students and researchers who require a high-concentration environment that doesn't feel clinical.

The visual style employs **Soft Minimalism** with **Tactile accents**. It leverages generous whitespace, high-quality typography, and subtle organic shapes (inspired by the blob mascot) to break the rigidity of traditional educational software. The interface should feel like a premium physical notebook translated into a digital, AI-enhanced space.

## Colors
This design system utilizes a dual-mode strategy. 
- **Light Mode:** Uses a "Paper" foundation (#FFFFFF) with subtle cool-gray surfaces (#F8FAFC) to define study areas. 
- **Dark Mode:** Transitions to a "Deep Space" palette using Navy and Slate (#0F172A), reducing eye strain during late-night study sessions.

The **Primary Gradient** (Violet-to-Indigo) is reserved for high-impact AI moments: the mascot, primary action buttons, and active state indicators. Semantic colors (Success, Warning, Error) should be muted to maintain the calm, academic atmosphere.

## Typography
The system relies exclusively on **Inter** to ensure maximum legibility across dense academic texts. 
- **Headlines:** Use tighter letter-spacing and semi-bold weights to create a strong visual anchor.
- **Body Text:** Optimized for long-form reading with a slightly increased line-height (1.5x) to prevent cognitive fatigue.
- **AI Feedback:** Specifically styled "Chat" typography uses a distinct 15px size to differentiate AI-generated insights from user-generated notes.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model.
- **Sidebar:** A collapsible 280px navigation drawer on the left for library management.
- **Main Content:** A centered container (max 1280px) for focus-heavy tasks like reading or writing.
- **Chat Interface:** A persistent or toggleable right-hand panel for AI interaction.

Spacing follows an 8px rhythmic grid. Use "lg" (40px) spacing between major sections to maintain an airy, "friendly" feel. On mobile, margins compress to 16px, and sidebars transition to full-screen overlays.

## Elevation & Depth
Depth is signaled through **Soft Ambient Shadows** rather than harsh borders.
- **Level 0 (Background):** The base canvas (#F8FAFC / #0F172A).
- **Level 1 (Cards/Sidebar):** White or deep-navy surfaces with a 1px subtle border (#E2E8F0 / #1E293B).
- **Level 2 (Floating/Active):** Elements like active chat bubbles or focused inputs use a soft, diffused shadow (Blur: 20px, Opacity: 8%, Color: Indigo).
- **AI Components:** Utilize a very subtle inner glow or a 2px gradient border to signify "AI-active" zones.

## Shapes
The shape language is defined by **High Roundedness**. 
- Standard components (Inputs, Buttons) use a **12px** (0.75rem) radius.
- Large containers (Cards, Chat Panels) use **16px** (1rem).
- Small decorative elements or tags use a **Pill** shape to echo the blob mascot.
Avoid sharp corners entirely to maintain the "Friendly" brand promise.

## Components
- **Buttons:** Primary buttons use the Violet-to-Indigo gradient with white text. Secondary buttons are ghost-style with a subtle gray border.
- **Cards:** White background with 16px padding. No heavy borders; use Level 1 elevation. Cards should "lift" slightly (move -4px Y-axis) on hover.
- **Chat Interface:** User messages are simple gray bubbles; AI messages feature a subtle gradient border and the "petite blob" icon as an avatar.
- **Collapsible Sidebar:** Uses a semi-transparent blur (Glassmorphism) when overlaid on mobile, but solid Slate/White when docked on desktop.
- **Input Fields:** Large (48px height) with 12px rounding. On focus, the border transitions to a 2px Solid Indigo stroke.
- **Study Chips:** Used for tagging subjects (e.g., "Biology", "Calculus"). These should be pill-shaped with light pastel backgrounds.