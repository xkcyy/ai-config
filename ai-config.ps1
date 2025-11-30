#!/usr/bin/env pwsh
$scriptPath = Join-Path $PSScriptRoot "node_modules" "ai-config" "dist" "cli.js"
& node $scriptPath $args