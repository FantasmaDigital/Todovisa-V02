# Read file as raw Latin1 bytes to preserve byte sequences
$path = Resolve-Path "src\app\profile\page.tsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::Latin1.GetString($bytes)

# Map of corrupted Latin1 sequences -> HTML entities
$replacements = @{
    # 🖥️ desktop computer
    "ðŸ–¥ï¸"   = "&#x1F5A5;&#xFE0F;"
    "ðŸ–¥"      = "&#x1F5A5;"
    # 🎨 artist palette
    "ðŸŽ¨"      = "&#x1F3A8;"
    # 👥 people silhouette
    "ðŸ'¥"      = "&#x1F465;"
    # 🏅 sports medal
    "ðŸ…"       = "&#x1F3C5;"
    # 💰 money bag
    "ðŸ'°"      = "&#x1F4B0;"
    # ⚙️ gear
    "âš™ï¸"     = "&#x2699;&#xFE0F;"
    "âš™"        = "&#x2699;"
    # ⚠️ warning
    "âš ï¸"     = "&#x26A0;&#xFE0F;"
    "âš "        = "&#x26A0;"
    # ℹ️ info
    "â„¹ï¸"     = "&#x2139;&#xFE0F;"
    "â„¹"        = "&#x2139;"
    # 📸 camera
    "ðŸ"¸"      = "&#x1F4F8;"
    # 🔍 magnifier
    "ðŸ""       = "&#x1F50D;"
    # 💳 credit card
    "ðŸ'³"      = "&#x1F4B3;"
    # 📱 phone
    "ðŸ"±"      = "&#x1F4F1;"
    # 🌍 globe
    "ðŸŒ"       = "&#x1F30D;"
    # 🧾 receipt
    "ðŸ§¾"      = "&#x1F9FE;"
    # 🔧 wrench
    "ðŸ"§"      = "&#x1F527;"
    # 👈 pointing left
    "ðŸ'ˆ"      = "&#x1F448;"
    # 📨 envelope
    "ðŸ"¨"      = "&#x1F4E8;"
    # 📋 clipboard
    "ðŸ"‹"      = "&#x1F4CB;"
    # 🎯 bullseye
    "ðŸŽ¯"      = "&#x1F3AF;"
    # 🏆 trophy
    "ðŸ†"       = "&#x1F3C6;"
    # 🚀 rocket
    "ðŸš€"      = "&#x1F680;"
    # 🤝 handshake
    "ðŸ¤"       = "&#x1F91D;"
    # 🎓 graduation cap
    "ðŸŽ""      = "&#x1F393;"
    # 🔒 lock
    "ðŸ"'"      = "&#x1F512;"
    # 📅 calendar
    "ðŸ"…"      = "&#x1F4C5;"
    # 🗂 card index dividers
    "ðŸ—‚"      = "&#x1F5C2;"
    # 🛄 baggage claim
    "ðŸ›„"      = "&#x1F6C4;"
    # 🛑 stop sign
    "ðŸ›'"      = "&#x1F6D1;"
    # 📣 loudspeaker
    "ðŸ"£"      = "&#x1F4E3;"
    # 🌟 star
    "ðŸŒŸ"      = "&#x1F31F;"
    # ✓ check
    "âœ""       = "&#x2713;"
    # — em dash
    "â€""       = "&#x2014;"
    # " left quote
    "â€œ"       = "&quot;"
    # " right quote  
    "â€"        = "&quot;"
    # é
    "Ã©"        = "é"
    # í
    "Ã­"        = "í"
    # ó
    "Ã³"        = "ó"
    # ú
    "Ãº"        = "ú"
    # á
    "Ã¡"        = "á"
    # ñ
    "Ã±"        = "ñ"
    # ü
    "Ã¼"        = "ü"
    # ó (uppercase)
    "Ã"         = "Ó"
    # É
    "Ã‰"        = "É"
    # Aquí
    "aquÃ­"    = "aquí"
    # aquí
    "aquÃ"     = "aquí"
    # éxito
    "Ã©xito"   = "éxito"
    # ¡
    "Â¡"        = "¡"
    # ó
    "Ã³"        = "ó"
    # Ó
    "Ã"         = "Ó"
}

foreach ($key in $replacements.Keys) {
    $text = $text.Replace($key, $replacements[$key])
}

$outBytes = [System.Text.Encoding]::UTF8.GetBytes($text)
[System.IO.File]::WriteAllBytes($path, $outBytes)
Write-Host "Done - replaced all corrupted sequences"
