# Business Funding Lead Routing Flow

```mermaid
flowchart TD
    A([Lead Submitted<br/>Step 2 Complete]) --> B{Is Business Location Canada?}
    B -- Yes --> C[Send Lead to AFN]
    C --> D([End])

    B -- No --> E{Is Industry High-Risk?<br/>Adult, Cannabis, Firearms, Gambling}
    E -- Yes --> F[Send Lead to ROK]
    F --> G([End])

  E -- No --> H{Startup + No Gross Sales + 650+ FICO?}
  H -- Yes --> I[Send Lead to ROK]
  I --> J([End])

  H -- No --> K{Is Loan Amount Greater Than or Equal to $75,000?}
  K -- Yes --> L[Send Lead to ROK]
  L --> M([End])

  K -- No --> N{Is Loan Amount Less Than $75,000?}
  N -- Yes --> O[Send Lead to AFN]
  O --> P([End])

  N -- No --> Q[Send Lead to ROK]
  Q --> R([End])

  S[For overlapping qualified cases, default to ROK.<br/>Consider 50/50 A/B testing for optimization after sufficient volume.]
  R -.-> S
```

## Implemented Rules

- Canada business location routes to AFN.
- High-risk industries route to ROK:
  - Adult
  - Cannabis
  - Firearms / Ammunition
  - Casino / Gambling / Sports Clubs
- Startup businesses with no gross sales and 650+ FICO route to ROK.
- Other industries route by amount:
  - Loan amount `< $75,000` routes to AFN
  - Loan amount `>= $75,000` routes to ROK
- For overlapping qualified cases, default to ROK.

## API Endpoint for Decision

- `POST /api/leads/route-decision`
- Body:
  - `business_location` (optional)
  - `industry` (optional)
  - `loan_amount` (optional number/string)
  - `credit_score` (optional)
  - `sub_id_1` (optional)
  - `sub_id_2` (optional)
- Returns:
  - `partner`: `AFN` or `ROK`
  - `reason`: rule reason
  - `targetUrl`: routed destination URL with tracking params
