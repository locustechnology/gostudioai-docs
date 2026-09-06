# How This Documentation Site Is Built and Deployed

A reference for the GoStudio API documentation site (`neerajgmf/gostudioai-docs`).
No commands to run — this explains what exists, why, and how it reaches the web.

---

## 1. The deployment model in one paragraph

Mintlify is a **hosted documentation platform driven entirely by a Git repository**.
There is no build script, no server we run, and no deploy command. We keep plain content
files in GitHub; Mintlify watches the repository, and every push to the default branch
triggers a rebuild of the live site automatically.

So "deployment" is really two things:

| Half | Where it lives | Who set it up |
|---|---|---|
| The **content** — config, pages, API spec | This Git repo | Us, in commits |
| The **connection** — repo → hosted site | Mintlify dashboard | One-time, in the browser |

Once the connection exists, `git push` *is* the deploy.

---

## 2. What is actually in the repo

```text
gostudioai-docs/
├── docs.json                          ← the control file (required)
├── openapi.yaml                       ← the whole API Reference tab
├── README.md
├── DEPLOYMENT.md                      ← this file
├── favicon.svg
├── logo/
│   ├── light.png                      ← shown in light mode (dark wordmark)
│   └── dark.png                       ← shown in dark mode (white wordmark)
├── .editorconfig                      ← UTF-8, LF, final newline
├── .gitattributes                     ← forces LF in the repo and working tree
├── .gitignore
├── .github/workflows/docs-check.yml   ← the pre-publish gate
└── docs/
    ├── introduction.mdx
    ├── quickstart.mdx
    ├── authentication.mdx
    ├── response-format.mdx
    ├── errors.mdx
    ├── pagination.mdx
    └── guides/
        └── watermark-remover.mdx
```

There is deliberately **no** `package.json`, `node_modules/`, build output, or framework
code. Mintlify supplies the entire website — theme, navigation, search, syntax
highlighting, the interactive API playground. We supply only content.

### 2.1 `docs.json` — the one required file

The single entry point. If Mintlify cannot parse it, nothing deploys. It carries:

| Block | What it controls |
|---|---|
| `$schema` | Points at Mintlify's published JSON Schema so editors and CI validate the file |
| `name`, `theme`, `colors` | Site title, visual theme (`mint`), brand purple `#7C3AED` |
| `logo`, `favicon` | Brand marks; `logo.light` / `logo.dark` are the light- and dark-mode variants |
| `navigation.tabs` | The two top tabs and the sidebar structure inside them |
| `navbar`, `footer` | The "Open GoStudio" button, support link, and footer socials |
| `contextual` | The per-page menu: copy, download spec, open in ChatGPT / Claude / Cursor |
| `api.playground`, `api.examples` | Interactive playground; curl / JavaScript / Python samples |

The navigation is where the two halves of the site are wired together:

```json
"tabs": [
  {
    "tab": "Documentation",
    "groups": [
      { "group": "Get Started",   "pages": ["docs/introduction", "docs/quickstart", "docs/authentication"] },
      { "group": "Core Concepts", "pages": ["docs/response-format", "docs/errors", "docs/pagination"] },
      { "group": "Guides",        "pages": ["docs/guides/watermark-remover"] }
    ]
  },
  {
    "tab": "API Reference",
    "openapi": "openapi.yaml"
  }
]
```

That single `"openapi"` line generates all 6 endpoint reference pages.

Two things worth knowing:

- **Page paths carry no `.mdx` extension.** `"docs/quickstart"` maps to `docs/quickstart.mdx`.
  A path that does not resolve is a build error — CI checks this.
- **A page not listed here does not appear on the site.** Creating the file is not enough.

There is no `api.baseUrl` or `api.auth` key. Those are not in Mintlify's schema (`api`
sets `additionalProperties: false`) and a file containing them fails validation. The
playground gets its server and its Bearer field from `servers:` and
`components.securitySchemes.bearerAuth` inside `openapi.yaml` instead.

### 2.2 The seven `.mdx` pages — hand-written guides

MDX is Markdown plus components. Each file opens with YAML frontmatter supplying the page
title and the SEO description. The body is ordinary Markdown, using Mintlify's built-in
components where plain Markdown is not enough:

| Component | Purpose |
|---|---|
| `<CodeGroup>` | Tabbed code samples — curl / Node.js / Python side by side |
| `<Warning>` | Red callout for things that will break an integration |
| `<Note>` | Neutral callout for clarifications |
| `<Accordion>` | Collapsed detail, e.g. the manual token-grab procedure |
| `<Card>`, `<CardGroup>` | Linked tiles, used on the introduction page |

We do not import or install these. Mintlify provides them at build time.

### 2.3 `openapi.yaml` — the machine-readable half

OpenAPI 3.0.3 describing the **6 Watermark Remover endpoints**, which become the entire
"API Reference" tab: one page per endpoint with parameters, request and response schemas,
example payloads, and a working "Try it" console.

| Section | Contents |
|---|---|
| `info`, `servers` | Title, version, production base URL |
| `security` | Bearer auth applied globally, overridden per-endpoint where public |
| `tags` | The two sidebar groups |
| `paths` | The 6 endpoints |
| `components.schemas` | 10 reusable object definitions |
| `components.responses` | 10 reusable error responses (401, 402, 422, 502, 503, 504, …) |

Reuse matters: the `401 unauthorized` response is defined **once** and referenced many times
via `$ref`. Fixing the wording fixes it everywhere. There are 57 `$ref`s over 20 distinct
targets, and all of them resolve.

The 6 endpoints, by tag:

| Tag | Count | Endpoints |
|---|---|---|
| Watermark Remover | 5 | orchestrate, info, job lookup, generate, record |
| Webhooks | 1 | provider callback |

Only the production server is listed. A `http://localhost:3000` entry was removed — a public
spec should not offer a dev host in the playground's server dropdown.

**Scope note.** This site documents the **Watermark Remover tool only**. The v2 API has 33
route files under `app/api/v2`; the account, generations, users, media and billing-webhook
endpoints are all real and working, but are deliberately not published here. The intended
public surface is the `watermark-remover` group of the Bruno collection at
`web/app/docs/watermark-remover-api`, plus `/generate` and the provider `/webhook`.

If the scope widens later, the endpoints come back from that same collection — and every
claim about them must be re-derived from the route handlers before publishing, for the
reason in §5.3.

---

## 3. The deploy pipeline

```text
  You edit a .mdx / .yaml / docs.json file
                  │
                  ▼
          git commit  +  git push
                  │
                  ├─────────► GitHub Actions: docs-check.yml
                  │              encoding, fences, docs.json schema,
                  │              navigation paths, OpenAPI validity
                  ▼
   GitHub  (neerajgmf/gostudioai-docs, branch: main)
                  │
                  │  webhook from the Mintlify GitHub App
                  ▼
        Mintlify build service
          ├─ parse docs.json          → fails here = nothing ships
          ├─ render each .mdx page
          ├─ expand openapi.yaml      → 6 reference pages
          ├─ build the search index
          └─ check internal links
                  │
                  ▼
            Live site (CDN)
```

Build status and logs are visible in the Mintlify dashboard, and a failed build leaves the
previously deployed version live — a broken push does not take the site down.

---

## 4. The part that is *not* in the repo

One piece of setup happens in a browser and cannot be represented as a file. It is done
once and then never touched again:

1. Sign in at `dashboard.mintlify.com`.
2. Install the **Mintlify GitHub App** and grant it access to the
   `neerajgmf/gostudioai-docs` repository.
3. Set the deployment branch (`main`) and the docs directory (repository root).
4. Optionally attach a custom domain and configure DNS.

This is what turns a folder of Markdown into a hosted site. If documentation ever stops
updating despite successful pushes, this connection — not the repo — is the first thing to check.

---

## 5. Three failure modes worth remembering

### 5.1 A byte-order mark breaks `docs.json`

Mintlify reports a JSON parse error on a file that is visibly valid JSON. The cause is a
**UTF-8 byte-order mark** — three invisible bytes (`EF BB BF`) that Windows PowerShell
prepends by default. A strict JSON parser sees them before the opening `{` and rejects the
document.

When this happened before, the first fix attempt guessed wrong and deleted the `$schema` and
`favicon` fields; the real fix was rewriting the file BOM-free. Both fields are now restored,
and `$schema` is what lets an editor catch a bad key before it ships.

### 5.2 PowerShell escapes silently eat characters

PowerShell's backtick is an escape character. Passing Markdown through it mangles code
fences and inline backticks: `` `f `` becomes a form feed (0x0C) and `` `n `` becomes a real
newline. `docs/pagination.mdx` shipped for months reading "When has_more is ␌alse, or ⏎ext_cursor
is ⏎ull" — the leading letters of `false`, `next_cursor` and `null` had been consumed.

A commit claiming to have fixed it did not. **Do not generate content files through
PowerShell string handling.** CI now fails on any control character.

### 5.3 Route comments lie about behaviour

The `POST /apps/watermark-remover` handler carries a header comment listing a `202 Accepted`
async response. Reading the service layer showed that response builder has **zero callers**.
The endpoint is synchronous in all cases — it blocks for up to four minutes and is cut off at
five, and a poll timeout raises `504 generation_timeout`.

That matters because most HTTP clients time out long before then (httpx defaults to 5
seconds, undici to 30), which is why all three code samples in the guide set an explicit
300-second timeout.

The same class of drift produced several other published falsehoods that have since been
corrected against the source: the watermark tiers cost 4 credits, not 1; user-scoped
endpoints reject an `internal` service token rather than serving it; and the client webhook
is fire-and-forget, with no delivery contract and no retry.

**Lesson: verify behaviour against the implementation, not against the comments above it.**
Comments drift; code does not.

---

## 6. How changes are checked before they go live

Because pushing *is* deploying, correctness is established beforehand.

**CI** (`.github/workflows/docs-check.yml`) runs on every push and pull request and fails on:
a UTF-8 BOM, a CR byte, a stray control character, a missing final newline, an unbalanced
code fence, `docs.json` that does not match Mintlify's published schema, a navigation entry
with no matching `.mdx`, or an invalid OpenAPI spec. `mint broken-links` runs advisory.

**Local preview.** Mintlify's CLI renders the site exactly as the hosted build will:

```bash
npm i -g mint     # once
mint dev          # from the repo root, alongside docs.json
```

**A YAML trap worth knowing.** In flow mapping syntax an unquoted comma ends the value:

```yaml
schema: { type: string, example: images,samples }   # ✗ parses as two entries
schema: { type: string, example: "images,samples" } # ✓
```

---

## 7. Current state

- **Repository:** `github.com/neerajgmf/gostudioai-docs`, branch `main`
- **Content:** 16 files
- **Documentation tab:** 7 hand-written pages in 3 groups
- **API Reference tab:** 6 endpoints, generated from `openapi.yaml`
- **Spec:** valid OpenAPI 3.0.3 — 6 paths, 6 unique operationIds, 10 schemas,
  10 shared responses, 57 resolving `$ref`s, no BOM, LF-only
- **Config:** `docs.json` validates against Mintlify's published schema
- **Coverage:** 22 of 33 v2 routes; 11 internal routes intentionally excluded

---

## 8. The short version

> The site is a GitHub repository of Markdown files plus one OpenAPI YAML file.
> `docs.json` tells Mintlify what to display and in what order. Mintlify's GitHub
> App watches the `main` branch and rebuilds the hosted site on every push, so
> committing a change is what publishes it. We host nothing and build nothing
> ourselves — we only write content, validate it, and push.
