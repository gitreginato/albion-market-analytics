graph TD
    subgraph CLIENT["Next.js App (Client)"]
        DASH["/components/dashboard.tsx"]
        SIDEBAR["/components/dashboard/sidebar.tsx"]
        FILTERBAR["/components/dashboard/filter-bar.tsx"]
        PROJPANEL["/components/dashboard/projections-panel.tsx"]
        PORTPANEL["/components/dashboard/portfolio-panel.tsx"]
        OPP_CARDS["/components/opp-cards.tsx"]
        MODAL["/components/item-detail-modal.tsx"]
    end

    subgraph API["Next.js API Routes"]
        SCAN_API["/api/scan<br/>GET ?mode=start/status"]
        PRICES_API["/api/prices<br/>GET itemId + city"]
        HISTORY_API["/api/history<br/>GET history + chart"]
        GOLD_API["/api/gold<br/>GET gold prices"]
        OPP_API["/api/opportunities<br/>GET scan opportunities"]
        PROJ_API["/api/projections<br/>GET BM projections"]
        PORT_API["/api/portfolio<br/>GET portfolio simulation"]
        ITEMS_API["/api/items/search<br/>GET item catalog"]
        ITEM_DETAILS_API["/api/item-details<br/>GET item metadata"]
    end

    subgraph CORE["Core Domain (lib)"]
        SCANNER["/lib/albion/scanner.ts"]
        CLIENT["/lib/albion/client.ts"]
        OPP_ENGINE["/lib/albion/opportunities.ts"]
        PROJ_ENGINE["/lib/albion/projections.ts"]
        REFINING["/lib/albion/refining.ts"]
        PORTFOLIO["/lib/albion/portfolio.ts"]
        CATALOG["/lib/albion/catalog.ts"]
        MOUNTS["/lib/albion/mounts.ts"]
        CITY_CONFIG["/lib/albion/city-config.ts"]
        PRICE_VALIDATION["/lib/albion/price-validation.ts"]
        CONSTANTS["/lib/albion/constants.ts"]
        FORMAT["/lib/utils/format.ts"]
        PARAMS["/lib/api/params.ts"]
    end

    subgraph DB["SQLite Persistence"]
        REPO["/lib/db/repository.ts"]
        DB_FILE[(data/albion.db)]
        TABLE_PRICES[prices table]
        TABLE_SCAN_LOG[scan_log table]
    end

    subgraph EXTERNAL["External APIs"]
        ALBION_API[Albion Data Project API]
    end

    DASH --> SIDEBAR
    DASH --> FILTERBAR
    DASH --> PROJPANEL
    DASH --> PORTPANEL
    DASH --> OPP_CARDS
    DASH --> MODAL

    DASH -->|poll| SCAN_API
    DASH -->|fetch| PRICES_API
    DASH -->|fetch| HISTORY_API
    DASH -->|fetch| GOLD_API
    DASH -->|fetch| OPP_API
    DASH -->|fetch| PROJ_API
    DASH -->|fetch| PORT_API
    DASH -->|fetch| ITEMS_API
    DASH -->|fetch| ITEM_DETAILS_API

    SCAN_API -->|fire-and-forget| SCANNER
    OPP_API -->|uses| OPP_ENGINE
    PROJ_API -->|uses| PROJ_ENGINE
    PORT_API -->|uses| PORTFOLIO
    PRICES_API -->|uses| REPO
    HISTORY_API -->|uses| CLIENT

    SCANNER -->|fetch| CLIENT
    CLIENT -->|REST| ALBION_API

    OPP_ENGINE -->|reads| REPO
    PROJ_ENGINE -->|reads| REPO
    PROJ_ENGINE -->|fetch| CLIENT
    REFINING -->|reads| REPO
    PORTFOLIO -->|reads| REPO

    REPO -->|better-sqlite3| DB_FILE
    REPO --> TABLE_PRICES
    REPO --> TABLE_SCAN_LOG

    CATALOG -.->|item metadata| OPP_ENGINE
    CATALOG -.->|item metadata| PROJ_ENGINE
    MOUNTS -.->|weight/capacity| PORTFOLIO
    MOUNTS -.->|weight/capacity| PROJ_ENGINE
    CITY_CONFIG -.->|tax/transport| OPP_ENGINE
    CITY_CONFIG -.->|tax/transport| PROJ_ENGINE
    PRICE_VALIDATION -.->|freshness| OPP_ENGINE
    PRICE_VALIDATION -.->|freshness| PROJ_ENGINE
    CONSTANTS -.->|quality labels| FORMAT
    FORMAT -.->|formatters| DASH
    PARAMS -.->|input validation| API
