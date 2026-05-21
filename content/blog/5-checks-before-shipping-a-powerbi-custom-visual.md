---
title: "5 Things I Check Before Shipping a Power BI Custom Visual"
date: "2026-05-21"
excerpt: "A pre-flight checklist I run on every Power BI custom visual — from data-view mapping to the formatting model, cross-filtering and performance at scale — before it goes anywhere near AppSource."
tags: ["power-bi", "custom-visuals", "dataviz"]
author: "Anuj Kumar"
---

A custom visual that looks right on your sample dataset and a custom visual that survives a real enterprise report are two very different things. Most of the bugs I've seen reach production weren't logic errors — they were *assumptions*: that data would always be present, that the field well would always be filled in the right order, that nobody would drop 50,000 rows into it.

Here is the checklist I run before I consider a visual done. It has saved me more failed AppSource submissions than any single feature I've built.

## 1. The data-view mapping survives messy data

The `dataView` your visual receives is rarely the tidy shape you tested with. Before anything else, I confirm the visual renders something sensible when:

- a measure is missing or returns `null`
- the user has bound categories but no values yet
- a category has zero rows after a slicer is applied

```ts
public update(options: VisualUpdateOptions) {
  const dataView = options.dataViews?.[0];
  const categorical = dataView?.categorical;
  if (!categorical?.categories?.length || !categorical.values?.length) {
    this.renderEmptyState();
    return;
  }
  // ...safe to read values from here
}
```

> An empty state is a feature, not an afterthought. A visual that renders a blank rectangle reads as broken; one that says "Add a measure to get started" reads as polished.

## 2. The formatting model says what users expect

The formatting pane is where report authors actually live. I check that every property has a sensible default, that toggling one doesn't silently break another, and that the property *names* match Power BI's own vocabulary — "Data labels", "Legend", "X axis" — not whatever I called them in code. If a Power BI user has to guess what a setting does, the visual feels foreign.

## 3. Selection and cross-filtering round-trip

This is the one reviewers test hardest. Click a data point and the rest of the report should filter. Click it again and the filter should clear. Use a bookmark and the selection should restore. I walk through the full loop with the `ISelectionManager` every time — select, multi-select with Ctrl, clear, and confirm the visual reflects selection state coming *back in* from other visuals, not just going out.

## 4. It stays fast when the data isn't small

Sample data hides performance problems. I always test with a dataset an order of magnitude larger than I expect — and I lean on the data-reduction algorithm in `capabilities.json` rather than trying to render everything:

| Symptom | Usual cause |
| --- | --- |
| Visual freezes on load | Rendering every row instead of windowing |
| Lag on resize | Re-computing layout on every `update` call |
| Slow cross-filter | Rebuilding the whole DOM instead of patching it |

If the layout maths is expensive, cache it and only recompute when the data — not the viewport — actually changes.

## 5. It behaves in the edge cases reviewers hit

The last pass is the unglamorous one:

- **Resize** — from a tiny tile to full-screen focus mode, with no clipping or overlap.
- **High-contrast mode** — colours come from the host palette, not hard-coded hex.
- **Tooltips** — they use the host tooltip service so they respect the report theme.
- **Context menu** — right-click is wired up where users expect it.

None of these sell the visual on their own. All of them get it rejected if they're missing.

## The takeaway

A custom visual isn't finished when the happy path works — it's finished when the *unhappy* paths fail gracefully. Build the empty state, test with too much data, and walk the selection loop end to end. Do that, and the AppSource review stops being a gamble.

*Working on a Power BI custom visual and want a second pair of eyes? [Get in touch](/#contact).*
