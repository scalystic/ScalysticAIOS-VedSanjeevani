# Product Requirements Document (PRD)

# Project Name

CreativeIQ (Working Name)

AI-Powered Marketing Operations Platform

---

# Vision

Build a centralized Marketing Operations Platform that provides complete visibility into content creation, agency execution, campaign performance, and advertising spend.

The platform should become the source of truth for marketing operations and eventually evolve into a full Company Operating System covering CRM, WhatsApp, SOPs, Tasks, Knowledge Base, Inventory, Finance, and AI Agents.

Phase 1 focuses exclusively on Marketing Operations.

---

# Problem Statement

Marketing teams create and distribute a large number of videos and images to multiple agencies.

Today the workflow relies on:

- Google Drive
- Google Sheets
- Agency communication
- Manual campaign verification

This creates several operational challenges:

- No visibility into whether assigned content is actually launched.
- No accountability across agencies.
- No centralized tracking of content performance.
- Manual verification of campaign execution.
- Difficult identification of top-performing content.
- Fragmented reporting across advertising platforms.

The company requires a centralized system that tracks content from creation through platform deployment and performance while independently verifying agency execution.

---

# Phase 1 Scope

Marketing Operations

Supported Providers:

- Meta Ads
- Google Ads

Out of Scope:

- CRM
- WhatsApp
- Inventory
- Finance
- SOPs
- Tasks
- AI Agents

---

# Core Objectives

The system must answer:

### Content Intelligence

- Which content is assigned?
- Which content is running?
- Which campaigns use the content?
- Which content generates the highest ROAS?
- Which creator performs best?

### Agency Accountability

- Which agencies received content?
- Which agencies submitted deployments?
- Which agencies launched content?
- Which agencies are underutilizing assigned content?

### Campaign Intelligence

- Which campaigns are active?
- Which content is attached?
- How much spend and revenue is generated?

---

# User Roles

## Admin

Full platform access.

---

## CEO

View all marketing data.

Read only.

---

## CMO

View all marketing data.

Manage campaigns, content, agencies and reports.

---

## Marketing Manager

Operational access.

Manage content assignments.

Manage agencies.

Monitor performance.

---

## Agency User

View assigned content only.

Submit deployment information.

View assigned campaign performance.

---

# Core Workflow

## Step 1

Content Creator uploads video or image to Google Drive.

---

## Step 2

Marketing Team creates Content record.

Fields:

- Content Name
- Content Type
- Creator
- Product
- Drive URL

---

## Step 3

Content assigned to Agency.

Creates:

Content Assignment

Status:

- Assigned

---

## Step 4

Agency uploads content to advertising platform.

Examples:

Meta Video

Google Asset

---

## Step 5

Agency submits deployment information.

Examples:

Meta Video ID

Google Asset ID

Creates:

Assignment Submission

Status:

- Submitted

---

## Step 6

Background Sync verifies deployment.

Status:

- Verified

---

## Step 7

Platform data imported.

- Campaigns
- Ad Groups
- Ads
- Platform Creatives
- Metrics

---

## Step 8

Content performance becomes available in dashboards.

---

# Status Lifecycle

Content Assignment

Assigned

↓

Accepted

↓

Submitted

↓

Verified

↓

Running

↓

Completed

---

# Data Model

## Organization

Top-level tenant.

---

## Brand

Business unit.

---

## Product

Associated product.

---

## Creator

Content creator.

---

## Content

Internal source-of-truth.

Represents:

- Video
- Image
- Carousel

Contains:

- Drive URL
- Metadata
- Creator
- Product

---

## Content Asset

Stores file metadata.

Examples:

- SHA256
- Thumbnail
- MIME Type

---

## Agency

Agency partner.

---

## Content Assignment

Content assigned to agency.

---

## Assignment Submission

Agency deployment submission.

Examples:

- Meta Video ID
- Google Asset ID

---

## Platform

Meta

Google

---

## Platform Account

Advertising account.

Examples:

- Meta Ad Account
- Google Ads Account

---

## Platform Campaign

Provider campaign.

---

## Platform Ad Group

Provider ad group.

Meta Ad Set.

Google Ad Group.

---

## Platform Ad

Provider ad.

Lowest attribution level.

---

## Platform Creative

Provider-side creative object.

Examples:

- Meta Video
- Google Asset

---

## Content Platform Mapping

Links:

Content

↓

Platform Creative

---

## Performance Fact Daily

Daily metrics fact table.

Source of truth for analytics.

---

# Dashboard Structure

## Home Dashboard

Executive overview.

Metrics:

- Total Spend
- Total Revenue
- Overall ROAS
- Active Campaigns
- Active Content

Widgets:

- Top Content
- Top Agencies
- Alerts

---

## Marketing Module

### Overview

Marketing summary.

---

### Content

Content Library.

Columns:

- Content Name
- Creator
- Agency Count
- Running Status
- Campaign Count
- Spend
- Revenue
- ROAS

---

### Agencies

Agency accountability.

Columns:

- Agency Name
- Assigned Content
- Verified Content
- Running Content
- Spend
- Revenue
- ROAS

---

### Campaigns

Campaign performance.

Columns:

- Campaign Name
- Platform
- Spend
- Revenue
- ROAS
- Content Count

---

### Analytics

Advanced reporting.

Date range filters.

Provider filters.

Agency filters.

Creator filters.

---

# Background Jobs

BullMQ

Jobs:

- Meta Campaign Sync
- Meta Creative Sync
- Meta Metrics Sync
- Google Campaign Sync
- Google Creative Sync
- Google Metrics Sync
- Assignment Verification

---

# Technology Stack

Frontend

- React
- Vite
- TypeScript
- Tailwind
- shadcn/ui
- TanStack Query
- TanStack Table
- React Hook Form
- Zod
- Zustand

Backend

- Node.js
- TypeScript
- Fastify
- Prisma

Infrastructure

- PostgreSQL
- Redis
- BullMQ

Authentication

- Clerk

AI

- OpenAI (Future)

---

# Success Metrics

Agency Accountability

- 100% assigned content tracked.
- 100% deployment submissions verified.

Operational Efficiency

- Eliminate manual campaign verification.

Reporting

- Single source of truth for content performance.

Management Visibility

- Executive dashboard available in real-time.

---

# Future Roadmap

Phase 2

- AI Marketing Analyst
- AI Agency Auditor
- AI Content Analyst

Phase 3

- CRM
- WhatsApp Operations
- Tasks
- SOP Management

Phase 4

- Inventory
- Finance
- Executive OS

Final Vision

Unified AI Operating System for the company.
