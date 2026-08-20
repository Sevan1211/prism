$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$markdownFiles = Get-ChildItem -LiteralPath $projectRoot -Recurse -File -Filter '*.md' |
    Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.venv)[\\/]' }
$brokenLinks = [System.Collections.Generic.List[string]]::new()
$unbalancedFences = [System.Collections.Generic.List[string]]::new()

foreach ($file in $markdownFiles) {
    $lines = Get-Content -LiteralPath $file.FullName
    $fenceCount = @($lines | Where-Object { $_ -match '^\s*\x60{3}' }).Count
    if (($fenceCount % 2) -ne 0) {
        $unbalancedFences.Add($file.FullName)
    }

    for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
        $matches = [regex]::Matches($lines[$lineIndex], '\[[^\]]+\]\((?<target>[^)]+)\)')
        foreach ($match in $matches) {
            $target = $match.Groups['target'].Value.Trim().Trim('<', '>')
            if ($target -match '^(https?://|mailto:|#)') {
                continue
            }
            $pathPart = [System.Uri]::UnescapeDataString(($target -split '#', 2)[0])
            if ([string]::IsNullOrWhiteSpace($pathPart)) {
                continue
            }
            if ([System.IO.Path]::IsPathRooted($pathPart)) {
                $candidate = $pathPart
            } else {
                $candidate = Join-Path -Path $file.DirectoryName -ChildPath $pathPart
            }
            if (-not (Test-Path -LiteralPath $candidate)) {
                $relativeFile = [System.IO.Path]::GetRelativePath($projectRoot, $file.FullName)
                $brokenLinks.Add(('{0}:{1} -> {2}' -f $relativeFile, ($lineIndex + 1), $target))
            }
        }
    }
}

$conflictMarkers = @(rg -n '^(<<<<<<<|=======|>>>>>>>)' README.md AGENTS.md docs 2>$null)
if ($brokenLinks.Count -gt 0 -or $unbalancedFences.Count -gt 0 -or $conflictMarkers.Count -gt 0) {
    $brokenLinks
    $unbalancedFences
    $conflictMarkers
    throw 'Documentation validation failed.'
}

Write-Output (
    'Documentation OK: {0} Markdown files, no broken local links, unbalanced fences, or conflict markers.' -f $markdownFiles.Count
)
