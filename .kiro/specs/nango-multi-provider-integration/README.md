# Nango Multi-Provider Integration Spec

## Overview

This spec outlines the integration of **Nango** into InvoCall to support multiple invoicing platforms (QuickBooks, Xero, FreshBooks, Zoho Books, etc.) through a unified integration infrastructure.

## What is Nango?

Nango is a developer-first platform for building product integrations with 700+ APIs. Unlike pre-built integration platforms, Nango provides:
- **Code-first approach**: Write custom integration logic as TypeScript functions
- **Managed OAuth**: Handle authentication for 700+ APIs out of the box
- **Custom functions**: Full control over data fetching, transformation, and syncing
- **Observability**: Detailed logs with OpenTelemetry export
- **Scalable infrastructure**: Auto-scaling, rate limiting, retries built-in

## Why Nango for InvoCall?

- **Flexibility**: Write custom normalization logic for each provider
- **Control**: Full visibility into integration code (open-source templates)
- **Scalability**: Built to handle high-volume API operations
- **Developer experience**: Local development with CLI, git-tracked functions
- **Future-proof**: Supports actions, syncs, webhooks, and unified APIs

## Key Documents

- **[design.md](./design.md)** - High-level architecture and technical design
- **[requirements.md](./requirements.md)** - Business and functional requirements
- **[tasks.md](./tasks.md)** - Implementation tasks organized by phase

## Quick Start

1. Read the [design document](./design.md) to understand the architecture
2. Review the [requirements](./requirements.md) to understand what we're building
3. Follow the [tasks](./tasks.md) to implement the integration

## Implementation Phases

1. **Phase 1**: Foundation & QuickBooks (1-2 weeks)
2. **Phase 2**: Add Xero & FreshBooks (1 week)
3. **Phase 3**: Migrate Zoho Books to Nango (1-2 weeks)
4. **Phase 4**: Scale to 10+ providers (1-2 weeks)
5. **Phase 5**: Optional Google Sheets migration (1 week)
6. **Phase 6**: Monitoring & optimization (ongoing)

## Getting Started

To begin implementation:

1. Open `tasks.md`
2. Start with Task 1: "Setup Nango Infrastructure"
3. Each numbered task is a complete unit that includes all sub-tasks

## Architecture Highlights

- **Hybrid approach**: Maintains existing `InvoiceProvider` interface
- **Custom functions**: Integration logic lives in `nango-integrations/` folder
- **Actions pattern**: Each provider has actions for fetching invoices and customers
- **Normalization layer**: Provider-specific data mapped to InvoCall's unified format
- **Zero disruption**: Existing integrations continue working during migration

## Success Metrics

- Time to add new provider: < 2 hours (vs 2-3 days custom)
- Support 10-15 invoicing platforms within 6 weeks
- Zero downtime during Zoho migration
- Maintain existing sync performance

## Questions?

Refer to the detailed [design document](./design.md) for architecture details and the [tasks document](./tasks.md) for step-by-step implementation guidance.
