$env:PATH += ";C:\Program Files\nodejs"
Set-Location "C:\Users\juanp\Desktop\StockSystem\stockapp"
npm run build 2>&1 | Out-File -FilePath "C:\Users\juanp\Desktop\StockSystem\build_out.txt" -Encoding utf8
Get-Content "C:\Users\juanp\Desktop\StockSystem\build_out.txt"
