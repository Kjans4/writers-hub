---
title: World-Building
description: Create entities, link them with wikilinks, and explore your story's connections on the map.
order: 3
---

Writer's Hub treats your world as a living document alongside your prose. Characters, locations, lore entries, and objects aren't just notes in a separate file — they're linked directly to the chapters that reference them, and the connections between them are visualized on a live story map.

## Entity types

There are four types of world-building entities:

**Characters** — anyone who appears in your story. Protagonists, antagonists, minor players, historical figures. Each character has a notes area (rich text), quick facts, and a timeline of states.

**Locations** — anywhere your story takes place. Cities, buildings, specific rooms, imaginary geography.

**Lore** — abstract world knowledge. Magic systems, historical events, religions, organizations, cultural traditions.

**Objects** — specific things that matter to the plot. Artifacts, weapons, heirlooms, MacGuffins.

## Creating entities

In the left panel, each entity type has its own section below Chapters. Hover over any section header to reveal a **+** button. Click it to create a new entity — type the name and press Enter.

You can also create entities on the fly while writing. In the editor, type `[[` to open the entity search dropdown. If the entity you want doesn't exist yet, type its name and click **Create** — it's added to your world automatically and a wikilink is inserted at your cursor.

## Entity pages

Click any entity in the left panel to open its page. Every entity page has:

**Notes** — a small rich-text editor for anything you want to record about this entity. Backstory, physical description, motivations, things only you need to know.

**Quick Facts** — a key-value list that appears in hover cards when you mouse over wikilinks in the editor. Add facts like "Age: 34" or "Affiliation: The Order" by clicking the + button. These are the first things a reader sees when they hover over a character's name in the text.

**States** — a timeline of labeled changes. If a character dies in Chapter 7, you add a "Dead" state starting from Chapter 7. States appear as colored dots above the character's name wherever it appears as a wikilink in chapters that come after the event.

**Appears In** — automatically populated from your wikilinks. Every chapter that mentions this entity is listed here.

**Connected To** — entities that this entity links to, based on wikilinks in its own notes.

## Wikilinks in the editor

The `[[` syntax turns any entity mention into an active link inside your chapter text. Type `[[` anywhere in the editor and the search dropdown opens immediately. You can:

- Search by typing part of the entity's name
- Select with arrow keys and press Enter
- Click any result with your mouse

The wikilink renders as an underlined amber-tinted name in your prose. It's subtle enough not to break reading flow.

## Inline autocomplete

While writing, if you type three or more characters that match the start of an entity name, a ghost suggestion appears at your cursor — the rest of the entity's name shown in light grey. Press **Tab** to accept it and insert a wikilink automatically.

If there are multiple matches, a small dropdown appears below your cursor instead. Use arrow keys to navigate, Tab or Enter to accept.

## Hover cards

Mouse over any wikilink in the editor and wait 400 milliseconds. A hover card appears above the wikilink showing:

- The entity's type (Character, Location, etc.)
- Its Quick Facts (up to 4 shown)
- A link to open the full entity page

The card stays open while your mouse is over it, and disappears when you move away. It never blocks the line you're currently writing.

## Entity states

States let you track changes to characters and other entities across your story's timeline. On an entity's page, find the **States** section and click **+** to add one.

Choose a **label** (create your own in "Manage labels" — color-coded, named whatever fits your world), select which **chapter** the state begins from, and optionally add a short note describing what happened.

When you're writing in a chapter that comes after a state was applied, colored dots appear above the entity's wikilink in the editor. A dead character shows a red dot. A captured character shows a blue dot. Hover the dots to read the state note.

## The story map

Click the **Story Map** link at the bottom of the left panel to open a full-screen force-directed graph. The same map is available in compact form in the right panel.

Each node is a document:
- **Dark circles** — chapters (larger)
- **Purple** — characters
- **Green** — locations
- **Amber** — lore
- **Blue** — objects

Edges connect chapters to the entities they mention via wikilinks. The more connections an entity has, the more central it appears in the graph as the physics simulation settles.

Click any node to navigate directly to that chapter or entity page.

Use the **refresh button** in the top right of the map to reload after making changes. The compact version in the right panel updates automatically when you switch branches.

## Labels

Labels are project-wide colored tags you apply to states. Open any entity page, go to States, and click **Manage labels** to create your vocabulary. Common examples: "Dead", "Injured", "Imprisoned", "Transformed", "Exiled".

Each label has a name and a color. You can change the color anytime — it updates across every state and wikilink dot in the project. Deleting a label removes it from all entity states that used it.