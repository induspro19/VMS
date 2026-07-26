# Deployment Guide
## Enterprise Visitor Management System v3.1

This guide covers the necessary steps to deploy the application to a production environment.

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- A static hosting provider (e.g. Vercel, Netlify, AWS S3, Nginx)

### Build Process
The application uses Vite for optimized bundling. 
To build the application, run:
```bash
npm run build
```
This command checks for TypeScript errors (`tsc -b`) and generates production-ready assets in the `/dist` directory.

### Production Hardening Steps
- **Lazy Loading**: The application splits chunks by route to reduce initial load time.
- **Routing**: Ensure your static web server redirects all 404s to `index.html` (Client-Side Routing).
- **Environment Variables**: Add necessary secrets to your CI/CD pipeline. No `.env` files should be committed.

### Serving with Nginx (Example)
```nginx
server {
    listen 80;
    server_name vms.acmecorp.com;
    root /var/www/vms/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
