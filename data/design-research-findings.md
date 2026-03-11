# Design Research: Grids, BI Dashboards & Admin Interfaces

Hands-on visual research conducted by browsing real production applications, component libraries, and design system galleries. Every observation below comes from looking at actual running software, not theory articles.

---

## 1. Dashboard Layout Architecture

### What actually works (observed across Tableau, Metabase, Power BI, Grafana, shadcn, Tremor)

**The universal dashboard skeleton is three zones stacked vertically:**

1. **KPI cards row** (top) - 3-5 cards spanning full width
2. **Primary visualization** (middle) - chart or chart pair taking 60-100% width
3. **Detail zone** (bottom) - table, secondary charts, or drill-down panels

This pattern appeared in every single BI tool I examined. Metabase, shadcn, Power BI, and Tremor all use it. The only variation is whether the detail zone is tabular or chart-based.

**Sidebar navigation is now standard, not optional.** Every production admin/BI tool uses a left sidebar: Grafana (collapsible with icons + text), Linear (compact with sections), Notion (tree-based with agents/apps), Tremor (avatar + icon nav + shortcuts), Power BI CFO template (dark sidebar with button-style nav). Top-only navigation is gone from serious data applications.

**The 3-column content layout** (sidebar | main content | metadata/detail panel) appeared in Linear's issue view and is becoming more common for detail views. It works because the center column stays focused while context lives in peripheral columns.

### Spacing and density observations

- Grafana uses the most dense layout - panels edge-to-edge with minimal gutters (8px gaps)
- Metabase uses generous whitespace - cards have clear breathing room, ~24px gaps
- shadcn sits in the middle - clean but not sparse
- Power BI dashboards vary wildly by author, but the best ones use consistent 12-16px gutters
- Tableau dashboards trend dense - they pack information tightly, relying on section headers to create visual separation rather than whitespace

**Key insight:** The density should match the audience. Executive dashboards need more whitespace (Metabase approach). Operational dashboards can be denser (Grafana approach). The worst dashboards try to be both.

---

## 2. KPI Card Patterns

### The anatomy of a good KPI card (synthesized from shadcn, Metabase, Power BI, Tremor)

Every well-designed KPI card has exactly these layers, in this order of visual weight:

1. **The number** - largest text, immediately scannable (shadcn: `$1,250.00`, Metabase: `$43,652`, Power BI: `56.57M`)
2. **The label** - smaller, muted text below or above the number ("Total Revenue", "Revenue", "Net Profit")
3. **The delta/trend** - color-coded change indicator (+12.5%, -0.6% vs 2023)
4. **The context line** - explanatory text ("Trending up this month", "was 43,770.5 last week")

**What separates good from mediocre:**
- shadcn adds a trend icon (up/down arrow) alongside the percentage - this is readable at a glance
- Power BI's CFO template adds a small category icon per card (chart icon, money icon) - adds personality without noise
- Metabase includes "was X last week" context - gives the number meaning without requiring a separate chart
- Tremor uses progress bars under KPI metrics (68.1% of allowed capacity with a bar) - instantly shows utilization

**Color coding conventions that are universal:**
- Green = positive/up/healthy (every single tool uses this)
- Red = negative/down/alert (universal)
- Gray/muted = neutral or no change
- Blue/purple = informational, non-directional

---

## 3. Data Grid / Table Design

### AG Grid - The industry standard (observed across 4 demos)

AG Grid's demos revealed several patterns worth noting:

**Finance demo (the strongest):**
- Sparkline charts inline within table cells - small bar charts showing price history right in the row
- P&L values color-coded green (positive) and red/magenta (negative)
- Currency formatting with up/down arrows (↑$80.26, ↓$1.96)
- Row count display at bottom ("Rows: 134, Total Rows: 134")
- Column header grouping ("Participant" spanning Name/Language/Country)
- Per-column filter inputs directly below headers
- Drag-to-set-row-groups zone above the table

**HR demo:**
- Avatar + name + title stacked in first column (thumbnail + two lines of text)
- Department badges with colored dot indicators
- Country flags inline as small icons
- Expandable/collapsible rows (chevron icons)
- Action icons in last column (LinkedIn, email) - not buttons, just icons

**Inventory demo:**
- Product thumbnail images in first column
- Genre/category as colored badges below the product name
- Status pills: green "Active", red "Out of Stock", amber "On Hold" - all with dot prefix
- Tab filters above the table: All | Active | On Hold | Out of Stock
- Action buttons inline: "Hold Selling" as a ghost button, trash icon for delete
- Pagination bar at bottom with page size selector

### shadcn Tasks table

- Faceted filter buttons above table: search input + Status button + Priority button
- View toggle and "Add Task" action buttons on the right
- Task ID in monospace as first column
- Category badge (e.g., "Documentation") as a colored label
- Status with icon prefix (circle icon variants for different states)
- Kebab menu (three dots) per row for actions

### shadcn Dashboard table

- Drag handles (grip dots) as first column
- Checkbox for bulk selection
- Status pills with dot color indicators (green "Done", gray "In Process")
- "Assign reviewer" dropdown rendered inline in cells where needed
- "Customize Columns" dropdown and "+ Add Section" buttons above table
- Tabbed views above (Outline | Past Performance 3 | Key Personnel 2 | Focus Documents)

### Key table design principles observed

1. **Never show raw IDs prominently** - AG Grid uses them as secondary info, shadcn shows task IDs in muted monospace
2. **First column should be the most identifiable** - name + avatar, product + thumbnail, or the primary text field
3. **Status is always a pill/badge, never plain text** - with dot indicator and background color
4. **Numeric data right-aligned** - every grid does this, confirmed across AG Grid, shadcn, Metabase, Power BI
5. **Actions live in the last column** - either as icon buttons, ghost buttons, or kebab menus
6. **Filters belong above the table, not in a sidebar** - tab filters or faceted filter buttons
7. **Column headers should be short** - truncation with ellipsis if needed (Retool truncates at ~12 chars)

---

## 4. Chart Design Patterns

### What charts appear most in production dashboards

From examining Tableau, Metabase, Grafana, and Power BI:

1. **Line charts / area charts** - for time series, always. Grafana uses them for everything. Metabase's primary chart is an area chart.
2. **Bar charts (vertical)** - for categorical comparison. Power BI's monthly revenue, Metabase's retention bars.
3. **Horizontal bar charts** - for ranked lists or category breakdowns (Tableau's age groups, education fields)
4. **Donut/pie charts** - surprisingly still common (Metabase revenue by tier, Tableau department distribution), but always with a center metric
5. **Stacked bar charts** - for composition over time (Metabase trial outcome breakdown)
6. **Sparklines** - inline within table cells (AG Grid finance demo) - small, no axes, just the shape

### Chart design details that matter

- **Tooltip design**: Metabase shows source + date + value in a dark card tooltip. Grafana uses a floating panel with multi-series values.
- **Legend placement**: Metabase puts legends above charts as colored dots + labels. Tableau puts them inline or to the right. Grafana puts them below.
- **Time range controls**: Grafana has dedicated time picker with presets (Last 3 hours) + relative/absolute toggle + refresh interval. shadcn uses simple tab buttons (Last 3 months | Last 30 days | Last 7 days). Both work - Grafana for power users, shadcn for everyone else.
- **Color palettes**: Metabase uses soft blues/greens. Grafana uses high-contrast colors for dark backgrounds. Tableau defaults are saturated but professional.

---

## 5. Admin Panel Patterns

### Navigation architecture (from Grafana, Retool, Notion, Tremor)

**Sidebar structure that works:**
- Logo/brand at top
- Primary nav items with icons (Home, Dashboard, Explore, etc.)
- Grouped sections with collapsible headers (Grafana: "Alerts & IRM", "AI & machine learning")
- Utility items at bottom (Settings, Help, Search)
- User avatar/account at very top or very bottom

**Grafana-specific admin patterns:**
- Breadcrumb navigation below the top bar (Dashboards > Examples > Alerting)
- Time range picker as a primary control in the toolbar
- Share and Edit buttons in top-right
- Panel-level controls (info icon, alert icon) inline with panel titles
- Annotation toggles as switches

**Retool admin patterns:**
- Tab-based navigation for related views (Real Estate CRM | Property Management | Tenant Management)
- Search-in-table as first interaction point
- Simple table with action buttons (Edit) per row
- Map component alongside table for location data

**Notion admin patterns:**
- Tree-based sidebar with expandable pages/databases
- Multiple view types for same data (Board | Table | Timeline | Calendar)
- Tab row below page title for view switching
- Status columns in board view with counts (To-do 10, In progress 5, Complete 34)

---

## 6. Design Trends 2025-2026 (Confirmed by Research)

### What's actually happening vs. what's just hype

**Real and growing:**
- **AI copilot integration** - Notion has agents in sidebar, Power BI has Copilot, every major tool is adding natural language querying
- **Dark mode as default** - AG Grid, Linear, Grafana, shadcn all showcase dark mode first. Light mode is the alternative now, not the default.
- **Component-level density controls** - shadcn's "Neutral" theme switcher, AG Grid's theme selector, Grafana's panel size controls
- **Inline editing in tables** - AG Grid supports it, shadcn's "Assign reviewer" dropdown is inline, Retool builds entire apps around it
- **Sparklines and micro-visualizations** - AG Grid's finance demo embeds charts in cells. This is the clearest signal that tables and charts are merging.

**Real but oversold:**
- **Mobile-first dashboards** - production BI tools are still desktop-first. Grafana's mobile experience is mediocre. Metabase handles it better. The truth is operational dashboards are mostly used on large screens.
- **Real-time everything** - Grafana does real-time well. Most business dashboards refresh on intervals (hourly, daily). Real-time matters for ops, not for executive reporting.

**What I noticed that articles don't mention:**
- **The death of the hamburger menu in admin tools** - every tool uses a persistent sidebar now, not a collapsible hamburger
- **Badge/pill inflation** - everything is a badge now. Status, category, priority, department, type. The risk is visual clutter.
- **Progressive disclosure through tabs** - instead of cramming everything on one page, modern dashboards use tabs extensively (shadcn: Outline | Past Performance | Key Personnel)
- **Monochromatic color schemes with one accent** - Linear (all gray + purple accents), Grafana (dark gray + orange), Tremor (white + blue). Single-accent color systems are replacing multicolor palettes.

---

## 7. Component Pattern Inventory

### Patterns worth adopting for a grid/BI application

| Pattern | Where observed | Notes |
|---------|---------------|-------|
| KPI cards with delta + trend icon | shadcn, Metabase, Power BI | Universal. Must-have. |
| Status pills with colored dot prefix | AG Grid, shadcn, Notion | Green/amber/red dots + label text |
| Faceted filters above table | shadcn Tasks | Filter buttons that show active filter count |
| Tab-based view switching | shadcn, Notion, Retool | Tabs with badge counts (e.g., "Key Personnel 2") |
| Inline sparklines in table cells | AG Grid Finance | Mini bar charts, no axes |
| Avatar + name + subtitle in cell | AG Grid HR | Humanizes data rows |
| Thumbnail + title + badge in cell | AG Grid Inventory | Product-style first column |
| Time range picker presets | Grafana, shadcn | Button group or dropdown with preset ranges |
| Column customization dropdown | shadcn Dashboard | "Customize Columns" with checkboxes |
| Expandable table rows | AG Grid HR | Chevron + nested content |
| Action icons in last column | AG Grid HR, shadcn | LinkedIn/email icons, not full buttons |
| Progress bars for utilization | Tremor | Label + value/max + colored bar |
| Dark sidebar with icon nav | Grafana, Linear, Power BI | Icon + label, collapsible to icon-only |
| Breadcrumb navigation | Grafana | For deep hierarchical navigation |
| "Quick Create" / "Add" button | shadcn, Notion | Top-right of content area, primary action |

---

## 8. What Doesn't Work (Anti-patterns observed)

1. **Too many chart types on one page** - some Tableau dashboards mix donuts, bars, lines, bubble charts, and tables. It's overwhelming. Best dashboards use 2-3 chart types max.
2. **3D charts** - appeared in zero modern tools. They're dead.
3. **Thick borders on everything** - Metabase uses subtle borders. AG Grid uses hairline borders. Heavy borders make grids look dated.
4. **Rainbow color palettes** - the worst Tableau dashboards use 8+ colors. The best use 2-3 with variations.
5. **Center-aligned text in tables** - no production grid does this. Left-align text, right-align numbers. Always.
6. **Tooltips as the only way to get detail** - Grafana's tooltip-heavy approach means you have to hover over everything. Better to show context inline (like Metabase's "was X last week" on KPI cards).
7. **Too many sidebar sections** - Grafana's sidebar has 9 top-level items + nested subsections. It's borderline overwhelming. Linear's 5-6 items is the sweet spot.

---

## Summary: The Design Stack That Wins in 2025-2026

If I were building a grid/BI application today based on what I've actually seen working:

**Layout:** Persistent dark sidebar (collapsible) + top toolbar with time/filter controls + KPI cards + chart zone + table zone

**Colors:** Monochromatic base (slate/gray), single accent color (blue or purple), semantic colors for status only (green/amber/red)

**Tables:** Fixed header, sortable columns, inline status pills, sparklines where useful, per-column filter option, row actions as icons

**Charts:** Area/line for time series, bars for comparison, donuts only if there's a center metric. No more than 3 chart types per page.

**Typography:** System font for UI, tabular/monospace numbers for data, clear size hierarchy (3 sizes max)

**Interaction:** Tab-based views, faceted filters, progressive disclosure, inline editing where appropriate

**Density:** Comfortable for executive views (~40px row height), compact for operational views (~32px row height), with a toggle if needed

---

## 9. Decision Architecture & Nudge Theory in Dashboards

### The shift from display to decision support

Traditional dashboards show data. The next generation nudges decisions. This borrows from behavioral economics (Thaler & Sunstein's choice architecture) and applies it to data interfaces.

**Core principles observed in production tools:**

1. **Default to the recommended action** - Datadog's incident response shows "NEXT STEPS" with three buttons (Acknowledge, Resolve, Declare Incident) immediately visible. The most common action (Acknowledge) is the first button in green. This is classic default bias in UI.

2. **Progressive disclosure as decision funneling** - Datadog Watchdog's feature tabs (Autodetection → Root Cause Analysis → Contextual Insights → Minimize Impact → Trusted AI) create a decision journey, not just feature categories. Each tab represents a step in the incident lifecycle.

3. **Severity as visual weight** - Datadog's KPI cards use color saturation to encode urgency: red background for "Failed Cart Value" (77.2$) and "Avg Checkout Time" (45.3s), white for neutral "Revenue Impact" (64k USD), amber for warning "% of Carts Abandoned" (0.33%). The eye is drawn to the problem, not the vanity metric.

4. **Faceted filters as decision narrowing** - Datadog Incident Response's left sidebar uses Urgency (HIGH: 127, LOW: 234), Team, and Service as progressive filters. Each filter reduces cognitive load by eliminating irrelevant information before the user even sees it.

**What this means for BI dashboards:**
- Don't just show "Revenue is $1.2M" - show "Revenue is $1.2M, 12% below target, driven by cart abandonment in mobile checkout"
- Present the recommended action alongside the data
- Use visual weight (color, size, position) to direct attention to what needs action, not just what's interesting
- Structure navigation as a decision funnel, not a flat list of views

---

## 10. Natural Language Alerting & Issue Documentation

### How modern tools talk about problems (observed in Datadog, Sentry, PagerDuty)

The most striking pattern across action-oriented platforms is that alerts read like sentences, not codes.

**Datadog's natural language approach:**

- Alert title: "Process CPU has been up for about 19 hours" (not "CPU_ALERT_HIGH #4523")
- Root cause: "The number of containers persistently in the CrashLoopBackOff state was up after an update to the email-api-py deployment" (not "Container restart count exceeded threshold")
- Watchdog narrative: "A new deployment of version vae18ck03ei-6f2503 introduced errors and latency" - tells you the WHAT, the WHEN (deployment), and the WHICH (specific version hash, linked)
- Alert notification: "Load is high on a host is critical on 3 hosts, is ok on 4 hosts" with tag pills (#automatic-restart:true, #host:alq-mbp13.local) and @mentions for routing

**Key design patterns for natural language alerts:**

| Pattern | Example | Why it works |
|---------|---------|-------------|
| Sentence-form titles | "User has experienced an error when applying the coupon 10OFF" | Immediately communicable to non-technical stakeholders |
| Impact quantification | "4 services incl. customer-data, 183 users, 3 views in Shop.ist" | Answers "how bad is it?" before anyone asks |
| Inline entity references | Service badges, version hashes as links, team pills | Everything is a click away from its source |
| Contextual descriptions | "To investigate what happened: 1. Check the corresponding [Front-End Session]" | Built-in runbook, not a separate document |
| Timeline with avatars | "3m 23s until automatic escalation to @ Daljeet Sandu" | Combines time pressure with ownership |

**Sentry's narrative approach (Seer AI):**
- Root cause analysis presented as a chain-of-events story
- Four product pillars (Errors, Replays, Logs, Traces) that together reconstruct the full user experience
- Each error includes a narrative "what happened" section, not just a stack trace

**PagerDuty's lifecycle framing:**
- Incident management structured as a story: Detect → Manage → Remediate → Learn
- Each phase has different information density and different actions available
- The "Learn" phase explicitly treats the incident as a story to be documented and shared

---

## 11. AI Integration Strategies in Dashboard/BI Tools

### A taxonomy of how tools integrate AI (observed across 8+ platforms)

Not all AI integrations are the same. After examining production implementations, there are five distinct strategies, each with different UI implications:

### Strategy 1: Autonomous Background Detection (Datadog Watchdog, Grafana Sift)

**How it works:** AI continuously monitors all data streams and surfaces anomalies without any user action. Zero configuration required.

**UI pattern:** Insight cards that appear contextually. Datadog shows "Watchdog Insights" as a horizontal row of ERROR OUTLIER cards above the data table, each with a mini bar chart and percentage. Grafana Sift runs automated checks across metrics, logs, and traces to find anomalies.

**Design implication:** The AI layer is ambient - it doesn't take over the interface but annotates it. Insights appear where you're already looking, not in a separate AI panel.

### Strategy 2: Conversational AI Assistant (Datadog Bits AI, Grafana Assistant, Power BI Copilot)

**How it works:** Chat-based interface where users ask questions in natural language and get AI-generated responses with embedded data.

**UI pattern:** Datadog Bits AI shows a chat panel alongside the data view. User asks "What can I do to remediate?" and gets a structured response with numbered actions, inline service badges, and "Run Action" / "Run Workflow" buttons. Power BI Copilot generates entire report pages from natural language descriptions.

**Design implication:** The chat panel coexists with the data view - it's a side panel, not a replacement. Responses include actionable buttons, not just text. The AI references specific entities (services, deployments) with links back to the data.

### Strategy 3: AI-Powered Investigation Graphs (Datadog Bits AI SRE, Sentry Seer)

**How it works:** AI conducts autonomous multi-step investigations and presents the results as a visual decision tree / investigation graph.

**UI pattern:** Datadog's investigation graph is the most advanced version observed. It shows:
- "Initial Investigation" node (25 Steps) at the top
- Branching "Hypothesis Investigation" layer with hypotheses in colored borders (green=Validated, gray=Inconclusive, red=Invalidated)
- Sub-investigation nodes: "Query engine slow down", "DB CPU Overload", "Faulty deployment"
- "INVESTIGATION CONCLUSION" card at the bottom with natural language summary

**Design implication:** This is the highest-fidelity storytelling pattern - it literally shows the AI's reasoning process as a navigable graph. Users can trace how the AI reached its conclusion, which builds trust. The color-coded hypothesis states (Validated/Inconclusive/Invalidated) turn the investigation into a visual narrative.

### Strategy 4: Natural Language Metrics & Pulse (Tableau Pulse, Tableau Agent)

**How it works:** AI generates natural language descriptions of metric changes and delivers them proactively. Users can then ask follow-up questions.

**UI pattern:** Tableau Pulse delivers metric alerts as natural language insights into your workflow. Enhanced Q&A highlights shared contributors, detects when trends move together or in opposite directions, flags outlier entities across multiple metrics, and identifies correlations - all in natural language responses.

**Design implication:** This inverts the traditional dashboard - instead of presenting data and expecting users to find insights, the AI tells you what changed and why. The dashboard becomes a conversation starting point, not the end product.

### Strategy 5: Agent Swarms (Grafana Assistant Investigations)

**How it works:** Multiple specialized AI agents work in parallel to investigate an issue, each analyzing different data sources (metrics, logs, traces, profiles).

**UI pattern:** Grafana's Assistant Investigations coordinates a swarm of agents that collect evidence in parallel, generating findings and hypotheses. Results from internal testing show it found root causes 3.5x faster than on-call engineers.

**Design implication:** The UI needs to show parallel investigation streams converging on conclusions. This is different from a single chat - it's more like a collaborative investigation board where multiple AI agents contribute findings.

### Strategy 6: Autonomous AI Agents (Notion AI Agents)

**How it works:** AI agents that run autonomously in the background, answering questions, prioritizing tasks, writing reports "while you sleep."

**UI pattern:** Notion positions AI as "your 24/7 AI team" with four pillars: Agents (autonomous workers), Enterprise Search (cross-system knowledge), AI Meeting Notes, Admin Controls. The Q&A Agent pattern shows a conversational UI within data tables - someone asks a question, an agent responds with context from the knowledge base.

**Design implication:** AI isn't a feature of the dashboard - it's a teammate that uses the dashboard. This requires presence indicators (who/what is online), agent activity feeds, and clear attribution of AI-generated vs human-generated content.

---

## 12. Data Storytelling & Narrative Dashboards

### Moving from "what happened" to "here's the whole story"

The most sophisticated data tools don't just display data - they tell stories. This was observed most clearly in Datadog, but the pattern extends across the industry.

**Datadog's storytelling stack (the gold standard observed):**

1. **Notebooks** - Collaborative documents mixing rich text with live Datadog graphs. Used for investigations, postmortems, runbooks. Multiple users can edit simultaneously with real-time cursors. Auto-generated postmortem templates populate with key data (impact, root cause, timeline, tasks) after incident resolution. Embedded logs, traces, and interactive graphs from Slack/Teams conversations are automatically included.

2. **Root Cause Analysis chain** - The ROOT CAUSE → CRITICAL FAILURE → IMPACT flow (observed in Watchdog) is a three-act narrative: what went wrong (deployment), what broke (errors + latency), who was affected (4 services, 183 users, 3 views). Each node has its own detail section with charts that tell that chapter of the story.

3. **Investigation as narrative** - Bits AI SRE's investigation graph IS the story. It starts with an alert, branches into hypotheses, validates or invalidates each one, and concludes with a natural language summary. The graph is navigable - you can click into any node to see the evidence that supported or refuted that hypothesis.

4. **Collaboration as shared narrative** - @mentions on charts, comments on time ranges, snapshots with annotations. The dashboard becomes a conversation about data, not just a display of data.

**The three-act structure in dashboard design:**

| Act | Purpose | Dashboard equivalent | Datadog example |
|-----|---------|---------------------|-----------------|
| Act 1: Setup | Present the situation and key metrics | KPI cards, status overview | Business Team KPIs: Failed Cart Value, Avg Checkout Time |
| Act 2: Confrontation | Reveal patterns, anomalies, root causes | Charts, investigation views, drill-downs | Watchdog root cause chain, Bits AI hypothesis graph |
| Act 3: Resolution | Provide actionable recommendations | Action buttons, remediation steps, postmortem | "Immediate actions: 1. Scale flight-query-engine", Run Action button |

**Storytelling patterns that work:**

- **Causal chains** (Datadog Watchdog): Visual arrows connecting ROOT CAUSE → CRITICAL FAILURE → IMPACT as linked cards. Each card is a chapter.
- **Investigation trees** (Datadog Bits AI): Branching graph with color-coded hypotheses. Shows the reasoning process, not just the conclusion.
- **Timeline narratives** (Datadog Incidents): Chronological events with avatars, comments, and escalation countdowns. The incident unfolds as a timeline.
- **Auto-generated postmortems** (Datadog Notebooks): AI assembles the story from incident data - impact, root cause, timeline, action items - into a collaborative document.
- **Correlated metrics** (Tableau Pulse): AI identifies when metrics move together and explains why in natural language, creating micro-narratives about data relationships.

---

## 13. Community Platforms & Knowledge Sharing

### How industrial/enterprise platforms build knowledge ecosystems (observed: Schneider Electric)

**Schneider Electric Community (community.se.com):**

The platform structure reveals how a large industrial company organizes community knowledge:

- **Scale indicators as social proof**: "52,353 Discussions | 24,570 Solved | 163,139 Members | 3,608 Online" displayed as a persistent stat bar. This is a trust signal.
- **Category grid**: EcoStruxure Building (2,015), Knowledge Center (11,156), EcoStruxure IT (6,617), Power Distribution IEC (1,383) - each as a card with icon, count, and Subscribe button
- **Six content types in navigation**: Community, Categories, Forums, Knowledge Center, Blogs, Ideas, Events & Webinars
- **"Ideas" as a first-class citizen**: Not buried - it's top-level navigation alongside Forums and Knowledge Center
- **Consolidated documentation**: Schneider moved from scattered PDFs/manuals to a unified Help Center within the community, reducing support costs and improving self-service (2M users, €28M in savings reported)

**Design implications for BI/dashboard platforms:**
- Knowledge isn't separate from the tool - it's embedded alongside the data
- Community features (forums, ideas, knowledge base) reduce support load and create institutional memory
- Ranking/gamification systems drive participation (Schneider recently updated their ranking system)
- Solved/unsolved ratios (24,570/52,353 ≈ 47% solved) serve as a quality indicator

---

## 14. Datadog Deep Dive: The Design System That Tells Stories

### Why Datadog is the benchmark for action-oriented dashboards

After extensive browsing, Datadog consistently demonstrates the most advanced integration of data display, AI, collaboration, and storytelling. Here's a synthesis of every notable pattern:

**Dashboard architecture:**
- Dark theme with dark sidebar (icon-only, collapsible) and purple accent
- "Saved Views" dropdown for personalized dashboard configurations
- Multi-dimension filter bar with dropdown pills (cluster, env, region, team, country, spname, group_by)
- Play/pause controls for live data streams
- "Anomalies" toggle and "Show Overlays" in the toolbar

**KPI card design:**
- Section headers as full-width colored banners ("Business Team KPIs" in dark blue)
- Severity-colored backgrounds: red for critical (Failed Cart Value: 77.2$), amber for warning (% Carts Abandoned: 0.33%), white for neutral
- Units displayed as subscript (77.2$ with $ smaller, 45.3s with s smaller)
- Monitor status summary: Alert (red: 62), Warn (yellow: 3), OK (green: 189), No Data (gray: 22) as a horizontal row

**Chart interaction patterns:**
- Quick Functions panel: Smooth, Trend Line, Basic Anomalies, Seasonal Anomalies, Linear Forecast, Seasonal Forecast, Outliers, Derivative, Cumulative Sum
- Compare to Previous: Hour, Day, Week, Month, Quarter, Year, Period
- Overview/Correlations tab pair on every chart
- Data table below charts: Tags, Metric, Avg, Min, Max, Sum, Value columns
- Y Scale toggle: Linear / Log
- "Save as New Graph" from any chart modal

**SLO widgets:**
- Uptime percentages (100.00%, 99.99%, 99.918%) for Past 7/30/90 Days
- Budget bars (green progress bars showing remaining error budget)
- Status labels with "[DEMO] PRODUCTION: DO NOT..." context

**Incident response design:**
- Left panel: Paginated incident list with faceted sidebar (Urgency, Team, Service)
- Severity badges: HIGH (red), LOW (green), with count per category
- Each incident: Natural language title, service pill (e.g., "shopist-web-ui"), ID number
- Tab navigation: Active (29), Triggered (6), Acknowledged (34) with counts
- Right panel: Full incident detail with metadata row, NEXT STEPS actions, narrative description, and Timeline with comment input

**Bits AI SRE (the most advanced AI integration):**
- Status: "Conclusive" pill with "Finished in 3 minutes"
- Split view: Chat panel (left) + Investigation graph (right)
- Chat includes inline service badges, numbered actions, and "Run Action" / "Run Workflow" buttons
- Investigation graph: Hypothesis tree with Validated (green), Inconclusive (gray), Invalidated (red) states
- INVESTIGATION CONCLUSION card with natural language summary at the bottom of the graph

---

## Updated Summary: The Complete Design Stack for 2025-2026

Building on the Phase 1 research, the complete picture now includes:

**Data Layer:** Everything from Phase 1 (grids, charts, KPI cards, tables) remains the foundation.

**Intelligence Layer (new):** AI isn't an add-on - it's woven into every interaction:
- Ambient anomaly detection (Watchdog-style cards that appear contextually)
- Conversational AI sidepanel for natural language queries
- Investigation graphs for complex root cause analysis
- Natural language alerts that read as sentences, not codes
- Auto-generated postmortems and narratives

**Storytelling Layer (new):** Data isn't just displayed - it's narrated:
- Causal chains connecting root cause → failure → impact
- Three-act dashboard structure (Setup → Confrontation → Resolution)
- Collaborative notebooks mixing live data with narrative text
- Timeline-based incident storytelling with avatars and escalation

**Community Layer (new):** Knowledge isn't siloed:
- Embedded knowledge bases alongside data tools
- Forums, ideas, and blogs as first-class content types
- Solved/unsolved ratios as quality indicators
- Community ranking systems for engagement

**Decision Architecture (new):** Dashboards don't just inform - they nudge:
- Default to recommended actions (green primary buttons for common paths)
- Severity as visual weight (color saturation encoding urgency)
- Faceted filters as progressive decision narrowing
- Navigation as decision funnels, not flat menus
