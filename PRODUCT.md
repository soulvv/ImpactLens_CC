# ImpactLens AI — Product Truth & Design Standard

## 1. Product Identity & Purpose

**ImpactLens AI** is an AI-powered sustainability and environmental impact media intelligence platform tailored for NGOs, environmental litigators, research institutions, and governmental monitoring agencies.

The platform provides a credible, verifiable evidentiary pipeline for field photos, drone footage, and project video evidence to verify environmental outcomes (such as reforestation, wetland restoration, renewable energy testbeds, and regenerative agriculture).

### Target Audience
- Environmental Non-Governmental Organizations (NGOs)
- Governmental environmental protection bodies & auditors
- Carbon credit verification registries & ecological auditors
- Ecological litigators and independent scientific observers

### Operating Context
- Field operators ingest multi-gigabyte surveys in rugged environments.
- Auditors inspect evidentiary dossiers on high-resolution desktop and laptop displays.
- Non-repudiation, chain-of-custody, and auditability are paramount.

---

## 2. Phase 1 Scope & Non-Negotiables

### Included in Phase 1
- **Next.js 15+ Frontend**: Full application architecture with `/dashboard`, `/media`, `/media/[id]`, `/projects`, `/projects/[id]`, and `/upload`.
- **FastAPI Backend**: Modular service architecture (`core`, `db`, `schemas`, `services`, `routes`).
- **PostgreSQL 17 Database**: Relational schema for `projects`, `media`, and `activities` with UUIDs, indexes, and resilient local fallback.
- **Cloudinary Integration**: Server-side media ingestion with metadata extraction (dimensions, format, bytes, secure URLs) and local sandbox fallback for offline execution.
- **Documentary Design Language ("Field Evidence Dossier")**: Restrained, academic, high-credibility editorial styling.

### Explicitly Excluded from Phase 1 (Scheduled for Phase 2)
- Gemini multimodal AI model execution
- Dense vector embeddings & pgvector queries
- Semantic natural language AI search
- Computer vision before/after delta calculation
- Automated PDF audit report generation

---

## 3. Design System: Field Evidence Dossier

### Design Anti-Patterns (Forbidden)
- **NO generic AI startup tropes**: No purple-to-blue neon gradients, glowing text, or cartoonish graphics.
- **NO excessive glassmorphism**: Interfaces must feel tactile, permanent, and paper-like.
- **NO nested card syndrome**: Grouping is handled via background shifts and 1px hairline rules.
- **NO overused green**: Green is restrained to botanical sage accents (`#224836`).
- **NO playful emoji empty states**: Empty states use formal, institutional documentation phrasing.

### Color Tokens
- **Canvas Base**: Warm Limestone Stone `#F8F7F4`
- **Surface Paper**: Pure Document White `#FFFFFF`
- **Subtle Surface**: Neutral Sand `#F1EFEA`
- **Structural Hairline Rules**: `#E2DFD8`
- **Primary Ink**: Deep Archival Slate `#111827`
- **Secondary Ink**: Slate Charcoal `#4B5563`
- **Muted Telemetry**: Cool Gray `#6B7280`
- **Botanical Sage Accent**: Forest Sage `#224836` (wash `#EAF2EC`, border `#B8D4C0`)
- **Telemetry Amber**: Muted Amber `#B45309` (wash `#FEF3C7`)

### Typography
- **Headings & Badges**: Crisp monospace and grotesque sans-serif with uppercase tracking (`letter-spacing: 0.05em`).
- **Tabular Numerics**: `tabular-nums` applied to all GPS coordinates, byte counts, and timestamps.
