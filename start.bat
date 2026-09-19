@echo off
title Agentic AI Fraud Ring Detection - Hackwell 2.0
echo ==============================================================
echo 🛡️  HACKWELL 2.0 - SARANATHAN COLLEGE OF ENGINEERING
echo 👥  TEAM: GRAPH GUARDIANS
echo 🚀  STARTING AGENTIC AI FRAUD RING DETECTION PROTOTYPE
echo ==============================================================
echo.

if not exist node_modules (
    echo [1/3] Installing dependencies (express, cors)...
    call npm install
) else (
    echo [1/3] Dependencies already verified.
)

echo.
echo [2/3] Starting Express Server and 5-Agent Detection Pipeline...
start http://localhost:5000
node server/index.js
pause
