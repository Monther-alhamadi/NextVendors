import os
import mimetypes
import http.server
import socketserver

# Ensure .js files are served with application/javascript
mimetypes.add_type('application/javascript', '.js')

# Serve the built `dist` directory
ROOT = os.path.join(os.path.dirname(__file__), '..', 'dist')
os.chdir(ROOT)

PORT = int(os.environ.get('PORT', '3000'))
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f"Serving {ROOT} on http://0.0.0.0:{PORT}")
    httpd.serve_forever()
