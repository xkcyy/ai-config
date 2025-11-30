#!/usr/bin/env pwsh
$scriptPath = Join-Path $PSScriptRoot "dist" "cli.js"
& node $scriptPath $args