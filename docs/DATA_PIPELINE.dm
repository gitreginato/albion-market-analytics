flowchart LR
    subgraph Source["Albion Data Project API"]
        API_PRICES["/api/v2/stats/prices"]
        API_HISTORY["/api/v2/stats/history"]
        API_GOLD["/api/v2/stats/gold"]
    end

    subgraph Ingestion["Ingestão de Dados"]
        SCANNER["Scanner Batch<br/>20 itens/lote"]
        CLIENT["HTTP Client<br/>cache TTL + retry"]
        RATE_LIMIT["Rate Limiter<br/>3 req/s"]
    end

    subgraph Storage["Persistência"]
        REPO["Repository<br/>better-sqlite3"]
        PRICES[(prices)]
        SCAN_LOG[(scan_log)]
        SCAN_JOBS[(scan_jobs<br/>NOVO)]
    end

    subgraph Processing["Processamento"]
        OPP_ENGINE["Opportunities Engine"]
        PROJ_ENGINE["BM Projections Engine"]
        REFINING["Refining Engine"]
        PORTFOLIO["Portfolio Engine"]
    end

    subgraph API["API Routes"]
        R_SCAN["/api/scan"]
        R_OPP["/api/opportunities"]
        R_PROJ["/api/projections"]
        R_PRICES["/api/prices"]
        R_HISTORY["/api/history"]
        R_GOLD["/api/gold"]
        R_PORTFOLIO["/api/portfolio"]
    end

    subgraph UI["Interface"]
        DASHBOARD["Dashboard"]
        SIDEBAR["Sidebar"]
        CARDS["KPI Cards"]
        CHARTS["Charts"]
    end

    API_PRICES --> CLIENT
    API_HISTORY --> CLIENT
    API_GOLD --> CLIENT

    CLIENT --> RATE_LIMIT
    RATE_LIMIT --> SCANNER
    SCANNER --> REPO
    REPO --> PRICES
    REPO --> SCAN_LOG
    REPO --> SCAN_JOBS

    PRICES --> OPP_ENGINE
    PRICES --> PROJ_ENGINE
    PRICES --> REFINING
    PRICES --> PORTFOLIO
    API_HISTORY -.-> PROJ_ENGINE

    OPP_ENGINE --> R_OPP
    PROJ_ENGINE --> R_PROJ
    REFINING --> R_OPP
    PORTFOLIO --> R_PORTFOLIO
    REPO --> R_PRICES
    CLIENT --> R_HISTORY
    CLIENT --> R_GOLD
    SCANNER --> R_SCAN

    R_SCAN --> DASHBOARD
    R_OPP --> DASHBOARD
    R_PROJ --> DASHBOARD
    R_PRICES --> DASHBOARD
    R_HISTORY --> DASHBOARD
    R_GOLD --> DASHBOARD
    R_PORTFOLIO --> DASHBOARD

    DASHBOARD --> SIDEBAR
    DASHBOARD --> CARDS
    DASHBOARD --> CHARTS
