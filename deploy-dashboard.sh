#!/bin/bash

set -euo pipefail

echo "📊 Deploying Collection Dashboard..."

# Create directories
mkdir -p assets/{css,js}

# 1. Deploy dashboard HTML
cat > dashboard.html << 'DASHBOARD_HTML'
$(sed 's/[$`]/\&/g' /workspace/lighter-sales-landing-page/dashboard.html)
DASHBOARD_HTML

# 2. Deploy dashboard CSS
cat > assets/css/dashboard.css << 'DASHBOARD_CSS'
$(sed 's/[$`]/\&/g' /workspace/lighter-sales-landing-page/assets/css/dashboard.css)
DASHBOARD_CSS

# 3. Deploy dashboard JavaScript
cat > assets/js/dashboard.js << 'DASHBOARD_JS'
$(sed 's/[$`]/\&/g' /workspace/lighter-sales-landing-page/assets/js/dashboard.js)
DASHBOARD_JS

# 4. Deploy watermark CSS
cat > assets/css/watermark.css << 'WATERMARK_CSS'
$(sed 's/[$`]/\&/g' /workspace/lighter-sales-landing-page/assets/css/watermark.css)
WATERMARK_CSS

# 5. Deploy identity helper
cat > assets/js/identity.js << 'IDENTITY_JS'
$(sed 's/[$`]/\&/g' /workspace/lighter-sales-landing-page/assets/js/identity.js)
IDENTITY_JS

echo "✅ Dashboard deployed!"
echo ""
echo "📋 Dashboard features:"
echo "  • Real-time collection analytics (sample data scaffolding)"
echo "  • Provenance gap analysis"
echo "  • Conservation status tracking"
echo "  • Interactive charts and visualizations"
echo "  • Export functionality (CSV)"
echo "  • Mobile-responsive design"
echo ""
echo "🌐 Access at: dashboard.html"
echo ""
echo "🔧 To customize with your actual data:"
echo "  1. Replace sample data in assets/js/dashboard.js with API calls"
echo "  2. Update institutional metrics in the constructor"
echo "  3. Add authentication before production"
