---
inclusion: always
---

# Code Standards and Architecture Guidelines

## Core Principles

When implementing features or making changes, always follow these principles:

### 1. Modular Architecture
- Break down functionality into small, focused modules
- Each file should have a single, clear responsibility
- Keep files under 200 lines when possible
- Split large components into smaller, composable pieces

### 2. Don't Repeat Yourself (DRY)
- If code appears twice, extract it into a reusable function or component
- Create shared utilities for common operations
- Build reusable components instead of duplicating UI patterns
- Use composition over duplication

### 3. Clean Code Practices
- Use descriptive, meaningful names for variables, functions, and components
- Keep functions small and focused on one task
- Avoid deep nesting - extract complex logic into separate functions
- Remove unused imports, variables, and code
- Add comments only when the "why" isn't obvious from the code itself

### 4. File Organization
- Group related functionality in dedicated directories
- Use index files to expose public APIs from modules
- Keep business logic separate from UI components
- Store types/interfaces in dedicated type files when shared across modules

### 5. Component Reusability
- Design components to be generic and configurable via props
- Extract common UI patterns into shared components
- Use composition patterns (children, render props) for flexibility
- Avoid hardcoding values - make them configurable

## Implementation Approach

When asked to implement features:
1. Plan the module structure first
2. Identify reusable pieces before writing code
3. Create small, focused files
4. Build from the bottom up (utilities → components → features)
5. Keep it simple - don't over-engineer

## What to Avoid
- Long files with multiple responsibilities
- Copy-pasting code blocks
- Mixing concerns (UI + business logic + data fetching in one place)
- Over-complicating simple solutions
- Creating unnecessary abstractions
