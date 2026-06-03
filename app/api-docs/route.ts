// Swagger UI served as a standalone HTML page (no React peer-dep coupling).
// Assets load from the swagger-ui-dist CDN; CSP is relaxed for /api-docs only
// (see next.config.ts). The spec is fetched from /api/openapi.json.
const HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>FEMS API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; background: #fafafa; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '/api/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
        });
      };
    </script>
  </body>
</html>`

export function GET() {
  return new Response(HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
