---
name: claude-skills-sync-to-cursor
description: Synchronize Claude skills to Cursor rules registry. Use when the user wants to "update skills", "sync skills", or "refresh the skill list".
---

# Claude Skills Sync to Cursor

This skill synchronizes the skills defined in `.claude/skills` to the Cursor registry file (`.cursor/rules/skills.mdc`).
It ensures that any new skills added to the project are automatically discoverable by Cursor.

## Usage

Run the synchronization script to update the registry.

```bash
python .claude/skills/claude-skills-sync-to-cursor/scripts/sync_skills.py
```

## Workflow

1.  **Scan**: The script recursively scans `.claude/skills` for `SKILL.md` files.
2.  **Extract**: It parses the YAML frontmatter (`name`, `description`) from each skill.
3.  **Update**: It rewrites the `json:skills_inventory` block in `.cursor/rules/skills.mdc`.

## Verification

After running the script, you should confirm to the user:
"Synchronization complete. Found [N] skills. The registry at .cursor/rules/skills.mdc has been updated."
