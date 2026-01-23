$ErrorActionPreference = "Stop"

$env:PATH = "C:\Users\cruzr\scoop\apps\gcc\current\bin;" + $env:PATH

& ".\build-dgd.ps1"
