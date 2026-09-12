# GoStudio API Documentation

Public documentation for the GoStudio Watermark Remover API, published with [Mintlify](https://mintlify.com).

**Live at [docs.gostudio.ai](https://docs.gostudio.ai).**

## How it deploys

There is no build step. Mintlify's GitHub App watches this repository and rebuilds the
hosted site on every push to `main` — typically in under a minute. **Pushing is deploying.**
A failed build leaves the previously deployed version live.

## Where to edit what

| Change | File |
|---|---|
| Prose, guides, concepts | `*.mdx` at the repo root, `guides/*.mdx` |
| Endpoint reference (6 watermark operations) | `openapi.yaml` |
| Navigation, colors, fonts, logo, footer, redirects | `docs.json` |
| Type scale, weights, spacing, component styling | `style.css` |

Adding a page needs **both** the `.mdx` file and its path registered in `docs.json`
navigation — a file that is not listed there does not appear on the site.

**Page files live at the repo root, not in a `docs/` folder.** Mintlify builds each URL
from the file path, so `docs/quickstart.mdx` would publish as `docs.gostudio.ai/docs/quickstart`.
Keep new pages flat (or under `guides/`) so the domain does not say "docs" twice.

Colors and typography are ported from `lib/design-system.ts` in the `web` repository —
brand violet `#5B16FE`, **Plus Jakarta Sans headings, Poppins body** (that order; it
shipped backwards once), `#18181B` headings on `#71717A` body copy, and the two-weight
rule: 400 for all text, 500 for buttons only. `docs.json` sets what Mintlify exposes and
`style.css` does the rest. Read DEPLOYMENT.md §2.4 before changing any of it.

## Local preview

```bash
npm i -g mint      # once
mint dev           # from the repo root, alongside docs.json
mint broken-links  # check internal links resolve
```

## Before you commit

Everything here is UTF-8 **without a BOM** and **LF-only**. `.gitattributes` and
`.editorconfig` enforce that, and `.github/workflows/docs-check.yml` fails the build on a
BOM, a CR byte, a stray control character, an unbalanced code fence, an invalid `docs.json`,
a navigation entry with no matching file, or an invalid OpenAPI spec.

Do not generate content files through PowerShell string handling — its backtick is an escape
character and has silently corrupted `.mdx` files in this project before (`` `f `` became a
form feed, eating the "f" of "false").

## Keeping the spec honest

`openapi.yaml` is derived from the real route handlers in the `web` repository under
`app/api/v2`. Re-derive it from the executable code path — the request parsers, response
builders and service layer — not from the comment blocks above the handlers. Those comments
have been wrong before, including one documenting a `202` response whose builder had no callers.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full architecture and history.
