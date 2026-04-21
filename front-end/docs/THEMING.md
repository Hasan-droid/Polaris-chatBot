## Polaris-inspired theme notes

This UI aims for a **simple, professional** feel inspired by `polaris-tek.com`:

- **Fonts**: Poppins (display) + Nunito Sans (body)
  - configured in `src/app/layout.tsx`
- **Accent blue**: based on the site’s Divi theme blue `#2ea3f2`
- **Accent green**: observed in menu styles `#93cb52`

### Where to change theme tokens

- **Tailwind tokens**: `tailwind.config.ts`
  - `colors.polaris`, `colors.mint`, `colors.ink`
  - `fontFamily.display`, `fontFamily.sans`
- **Global look**: `src/app/globals.css`
  - background, selection, subtle grid texture

### Icons

The UI uses `lucide-react` for clean, consistent icons.
If you want to swap to a different icon set later, the main usage is in:

- `src/components/chat/ChatShell.tsx`
- `src/components/chat/MessageBubble.tsx`

