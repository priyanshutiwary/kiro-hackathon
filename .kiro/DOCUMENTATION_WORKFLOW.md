# Documentation Workflow Guide

## Keeping Documentation Updated

### Daily Workflow

**At the end of each coding session:**
```bash
@daily-log
```
This will add today's work to DEVLOG.md with what you built, decisions made, and challenges solved.

### Weekly Check

**Once a week (or after major changes):**
```bash
@check-docs
```
This reviews all documentation and tells you what needs updating.

### When Making Significant Changes

**After adding features, changing architecture, or updating structure:**
```bash
@update-docs
```
This will update steering documents and DEVLOG based on recent changes.

---

## What to Update When

### Update `product.md` when:
- Adding new features
- Changing user flows
- Updating business objectives
- Modifying success criteria

### Update `tech.md` when:
- Adding/removing dependencies
- Changing architecture
- Updating security practices
- Modifying deployment process

### Update `structure.md` when:
- Adding new directories
- Changing file organization
- Updating naming conventions
- Modifying import patterns

### Update `DEVLOG.md`:
- Daily or after each significant work session
- Include time spent, what was built, and learnings

---

## Security: .env Files

The `.kiroignore` file is configured to **never read .env files**. This includes:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env.test`
- `.env.*`

**Always use `.env.example`** for documentation - never commit or share actual .env files.

---

## Automation

A post-write hook will remind you to update docs after making file changes. You'll see:
```
💡 Reminder: Consider updating steering docs if you made significant changes
```

---

## Quick Commands

| Command | Purpose |
|---------|---------|
| `@daily-log` | Add today's work to DEVLOG |
| `@update-docs` | Update all documentation |
| `@check-docs` | Check what needs updating |

---

## Best Practices

1. **Update as you go** - Don't let documentation fall behind
2. **Be concise** - Focus on significant changes only
3. **Use examples** - Show code snippets when helpful
4. **Track decisions** - Document why, not just what
5. **Keep it real** - DEVLOG should reflect actual work and time
