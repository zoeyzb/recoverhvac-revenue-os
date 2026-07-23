# Spec: Interactive conversion upgrade

## Objective

Improve the existing Recover marketing site without changing its cream, black, and
acid-lime brand system. A service-business owner should understand what Recover
does, see a believable recovery workflow, compare pricing, trust the evidence
model, and reach intake without hunting through a long static page.

## Assumptions

- The current positioning, routes, customer authentication, and backend remain intact.
- Published customer quotes must be explicitly verified; unverified or invented
  testimonials never render.
- Existing prices are restored as starting prices and provider/setup costs remain
  disclosed separately.
- Interactions use React and native HTML controls; no new UI dependency is added.

## Tech stack and commands

- Next.js 16, React 19, TypeScript, CSS
- Test: `npm test`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Production build: `npm run build`
- Local preview: `npm run dev`

## Project structure

- `src/app/page.tsx`: server-rendered homepage composition
- `src/components/landing-experience.tsx`: client-side walkthrough and plan interaction
- `src/lib/landing-content.ts`: typed marketing content and safe testimonial filtering
- `src/app/landing.css`: landing-page design system and responsive behavior
- `src/lib/landing-content.test.ts`: content safety and selection regression tests

## Code style

```tsx
<button
  type="button"
  aria-pressed={activeId === item.id}
  onClick={() => setActiveId(item.id)}
>
  {item.label}
</button>
```

Use semantic HTML, native controls, explicit accessible names, project spacing
tokens, and focused components. Avoid animation that hides initial content.

## Testing strategy

- Unit-test content selection, plan data, and verified-testimonial filtering.
- Run the existing full test suite, TypeScript, ESLint, and production build.
- Inspect the rendered homepage at desktop and mobile widths.
- Verify keyboard-focus styles, reduced-motion behavior, headings, links, and
  disclosure controls.

## Boundaries

- Always: preserve working routes, show honest connection/result states, use
  accessible controls, and keep mobile content readable.
- Ask first: change prices, add a dependency, alter authentication, or publish a
  customer quote without its source and permission.
- Never: fabricate customers, outcomes, integration status, or performance data.

## Acceptance criteria

- The palette and brand remain recognizably Recover.
- The hero is more compact and the product preview has useful interaction.
- Three recovery journeys can be switched without navigation or page reload.
- Pricing shows `$297 one time`, `from $997/mo`, and `from $1,997/mo`.
- Plans are denser, disclose what is and is not included, and link to intake.
- Verified testimonials render when present; otherwise an evidence-first proof
  fallback renders with no fake quote or customer.
- FAQ uses keyboard-accessible native disclosure controls.
- All existing routes and tests continue to work.
- The page reflows at 320, 768, 1024, and 1440 CSS-pixel widths.

