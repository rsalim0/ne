import { openApiDocument } from '@/lib/openapi/spec'

/** Serves the OpenAPI 3.1 document consumed by /api-docs (Swagger UI). */
export function GET() {
  return Response.json(openApiDocument)
}
