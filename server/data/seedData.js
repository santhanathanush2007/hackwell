/**
 * Realistic Fraud Datasets for Hackwell 2.0
 * Team Graph Guardians - Agentic AI Fraud Ring Detection
 */

const seedData = {
  // 1. Initial Entities
  entities: [
    // === SCENARIO 1: Mule Account Layering Ring (Circular Fund Flow) ===
    { id: "ACC-101", type: "ACCOUNT", label: "Vijay M. (Primary Mule)", balance: 45000, risk: "CRITICAL", ringId: "RING-MULE-01" },
    { id: "ACC-102", type: "ACCOUNT", label: "Sanjay K. (Layering 1)", balance: 4200, risk: "CRITICAL", ringId: "RING-MULE-01" },
    { id: "ACC-103", type: "ACCOUNT", label: "Ramesh P. (Layering 2)", balance: 3100, risk: "CRITICAL", ringId: "RING-MULE-01" },
    { id: "ACC-104", type: "ACCOUNT", label: "Anand R. (Layering 3)", balance: 5200, risk: "CRITICAL", ringId: "RING-MULE-01" },
    { id: "ACC-105", type: "ACCOUNT", label: "Dinesh S. (Cashout Mule)", balance: 89000, risk: "CRITICAL", ringId: "RING-MULE-01" },

    // Devices & IPs linked to Ring 1
    { id: "DEV-901", type: "DEVICE", label: "OnePlus 11 (Shared Mule Phone)", fingerprint: "fp_88a91c7f", ringId: "RING-MULE-01" },
    { id: "IP-44.201.12", type: "IP", label: "44.201.12.90 (Tor Exit Node)", vpn: true, geo: "Frankfurt, DE", ringId: "RING-MULE-01" },
    { id: "KYC-ID-781", type: "IDENTITY", label: "Aadhaar/PAN Ending ...7812", ringId: "RING-MULE-01" },

    // === SCENARIO 2: Device Farming & Bonus Abuse Ring ===
    { id: "ACC-201", type: "ACCOUNT", label: "Bot User Alpha", balance: 500, risk: "HIGH", ringId: "RING-FARM-02" },
    { id: "ACC-202", type: "ACCOUNT", label: "Bot User Beta", balance: 500, risk: "HIGH", ringId: "RING-FARM-02" },
    { id: "ACC-203", type: "ACCOUNT", label: "Bot User Gamma", balance: 500, risk: "HIGH", ringId: "RING-FARM-02" },
    { id: "ACC-204", type: "ACCOUNT", label: "Bot User Delta", balance: 500, risk: "HIGH", ringId: "RING-FARM-02" },
    { id: "ACC-205", type: "ACCOUNT", label: "Bot User Epsilon", balance: 500, risk: "HIGH", ringId: "RING-FARM-02" },
    { id: "ACC-206", type: "ACCOUNT", label: "Syndicate Collector", balance: 34500, risk: "HIGH", ringId: "RING-FARM-02" },

    // Shared emulator device and proxy
    { id: "DEV-FARM-X", type: "DEVICE", label: "NoxPlayer Emulator (Cloned HW)", fingerprint: "fp_emulator_nox_01", ringId: "RING-FARM-02" },
    { id: "IP-185.220.101", type: "IP", label: "185.220.101.5 (Commercial Proxy)", vpn: true, geo: "Bucharest, RO", ringId: "RING-FARM-02" },
    { id: "KYC-PH-9921", type: "PHONE", label: "+91 98401-XXXXX (VoIP Temp Num)", ringId: "RING-FARM-02" },

    // === SCENARIO 3: Synthetic Identity Theft Ring ===
    { id: "ACC-301", type: "ACCOUNT", label: "Karthik Real Identity", balance: 12000, risk: "HIGH", ringId: "RING-SYNTH-03" },
    { id: "ACC-302", type: "ACCOUNT", label: "Karthik B. (Fabricated SSN)", balance: 25000, risk: "HIGH", ringId: "RING-SYNTH-03" },
    { id: "ACC-303", type: "ACCOUNT", label: "K. Balan (Fabricated Address)", balance: 18000, risk: "HIGH", ringId: "RING-SYNTH-03" },
    { id: "KYC-SSN-COLLIDE", type: "IDENTITY", label: "Overlapping PAN/SSN [9021-X]", ringId: "RING-SYNTH-03" },
    { id: "DEV-IPHONE-33", type: "DEVICE", label: "iPhone 14 Pro (Shared Hardware)", fingerprint: "fp_apple_983df", ringId: "RING-SYNTH-03" },

    // === LEGITIMATE ACCOUNTS (Demonstrate precision & low false positive rate) ===
    { id: "ACC-901", type: "ACCOUNT", label: "Priya Sundaram (Verified)", balance: 65000, risk: "LOW", ringId: null },
    { id: "ACC-902", type: "ACCOUNT", label: "Madhavan Tech Pvt Ltd", balance: 340000, risk: "LOW", ringId: null },
    { id: "ACC-903", type: "ACCOUNT", label: "Chennai Super Mart", balance: 88000, risk: "LOW", ringId: null },
    { id: "DEV-MAC-SAFE", type: "DEVICE", label: "MacBook Pro M2 (Trusted)", fingerprint: "fp_mac_legit_22", ringId: null },
    { id: "IP-157.49.20", type: "IP", label: "157.49.20.14 (Residential Airtel)", vpn: false, geo: "Tiruchirappalli, IN", ringId: null }
  ],

  // 2. Transaction Flow (Edges with amounts, velocity, timestamps)
  transactions: [
    // Mule Layering Rapid Cycle (ACC-101 -> ACC-102 -> ACC-103 -> ACC-104 -> ACC-105 -> ACC-101)
    { id: "TXN-1001", from: "ACC-101", to: "ACC-102", amount: 250000, timestamp: "2026-09-19T02:14:00Z", flag: "Rapid Hop" },
    { id: "TXN-1002", from: "ACC-102", to: "ACC-103", amount: 245000, timestamp: "2026-09-19T02:17:30Z", flag: "Smurfing / Layering" },
    { id: "TXN-1003", from: "ACC-103", to: "ACC-104", amount: 241000, timestamp: "2026-09-19T02:21:00Z", flag: "Layering Hop" },
    { id: "TXN-1004", from: "ACC-104", to: "ACC-105", amount: 235000, timestamp: "2026-09-19T02:26:00Z", flag: "Final Consolidation" },
    { id: "TXN-1005", from: "ACC-105", to: "ACC-101", amount: 150000, timestamp: "2026-09-19T02:35:00Z", flag: "Circular Loop Detected" },

    // Device Farm Promo Drain to Syndicate Collector
    { id: "TXN-2001", from: "ACC-201", to: "ACC-206", amount: 2500, timestamp: "2026-09-19T03:00:10Z", flag: "Bonus Drain" },
    { id: "TXN-2002", from: "ACC-202", to: "ACC-206", amount: 2500, timestamp: "2026-09-19T03:01:20Z", flag: "Bonus Drain" },
    { id: "TXN-2003", from: "ACC-203", to: "ACC-206", amount: 2500, timestamp: "2026-09-19T03:02:45Z", flag: "Bonus Drain" },
    { id: "TXN-2004", from: "ACC-204", to: "ACC-206", amount: 2500, timestamp: "2026-09-19T03:04:10Z", flag: "Bonus Drain" },
    { id: "TXN-2005", from: "ACC-205", to: "ACC-206", amount: 2500, timestamp: "2026-09-19T03:05:30Z", flag: "Bonus Drain" },

    // Synthetic Identity Credit Drawdown
    { id: "TXN-3001", from: "ACC-301", to: "ACC-302", amount: 15000, timestamp: "2026-09-19T04:10:00Z", flag: "Synthetic Flow" },
    { id: "TXN-3002", from: "ACC-302", to: "ACC-303", amount: 14000, timestamp: "2026-09-19T04:22:00Z", flag: "Synthetic Flow" },

    // Normal Transactions (Clean)
    { id: "TXN-9001", from: "ACC-901", to: "ACC-903", amount: 1250, timestamp: "2026-09-19T10:15:00Z", flag: "Normal Retail Purchase" },
    { id: "TXN-9002", from: "ACC-902", to: "ACC-901", amount: 45000, timestamp: "2026-09-19T11:00:00Z", flag: "Salary Payroll" }
  ],

  // 3. Entity Graph Connections (Non-financial attribute linkages)
  attributeLinks: [
    // Mule ring shared hardware and proxy
    { source: "ACC-101", target: "DEV-901", relationship: "LOGGED_IN_FROM" },
    { source: "ACC-102", target: "DEV-901", relationship: "LOGGED_IN_FROM" },
    { source: "ACC-103", target: "DEV-901", relationship: "LOGGED_IN_FROM" },
    { source: "ACC-101", target: "IP-44.201.12", relationship: "ROUTED_THROUGH" },
    { source: "ACC-105", target: "IP-44.201.12", relationship: "ROUTED_THROUGH" },
    { source: "ACC-101", target: "KYC-ID-781", relationship: "DECLARED_IDENTIFIER" },
    { source: "ACC-104", target: "KYC-ID-781", relationship: "REUSED_IDENTIFIER" },

    // Farm ring shared device and VoIP
    { source: "ACC-201", target: "DEV-FARM-X", relationship: "HARDWARE_FINGERPRINT_MATCH" },
    { source: "ACC-202", target: "DEV-FARM-X", relationship: "HARDWARE_FINGERPRINT_MATCH" },
    { source: "ACC-203", target: "DEV-FARM-X", relationship: "HARDWARE_FINGERPRINT_MATCH" },
    { source: "ACC-204", target: "DEV-FARM-X", relationship: "HARDWARE_FINGERPRINT_MATCH" },
    { source: "ACC-205", target: "DEV-FARM-X", relationship: "HARDWARE_FINGERPRINT_MATCH" },
    { source: "ACC-206", target: "DEV-FARM-X", relationship: "CONTROLLER_DEVICE" },
    { source: "ACC-201", target: "IP-185.220.101", relationship: "SHARED_PROXY" },
    { source: "ACC-202", target: "IP-185.220.101", relationship: "SHARED_PROXY" },
    { source: "ACC-203", target: "IP-185.220.101", relationship: "SHARED_PROXY" },
    { source: "ACC-204", target: "KYC-PH-9921", relationship: "LINKED_VOIP_PHONE" },
    { source: "ACC-205", target: "KYC-PH-9921", relationship: "LINKED_VOIP_PHONE" },

    // Synthetic identity collision
    { source: "ACC-301", target: "KYC-SSN-COLLIDE", relationship: "KYC_FRAGMENT_COLLISION" },
    { source: "ACC-302", target: "KYC-SSN-COLLIDE", relationship: "KYC_FRAGMENT_COLLISION" },
    { source: "ACC-303", target: "KYC-SSN-COLLIDE", relationship: "KYC_FRAGMENT_COLLISION" },
    { source: "ACC-302", target: "DEV-IPHONE-33", relationship: "DEVICE_BINDING" },
    { source: "ACC-303", target: "DEV-IPHONE-33", relationship: "DEVICE_BINDING" },

    // Clean account relationships
    { source: "ACC-901", target: "DEV-MAC-SAFE", relationship: "REGISTERED_DEVICE" },
    { source: "ACC-901", target: "IP-157.49.20", relationship: "HOME_ISP" }
  ]
};

module.exports = seedData;
