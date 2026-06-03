/**
 * OpenAPI 3.1 document for the FEMS API.
 *
 * Hand-authored (most reliable on Next 16 / React 19) and extended per service
 * phase. Served at GET /api/openapi.json and rendered by /api-docs.
 */

const bearer = [{ bearerAuth: [] }, { cookieAuth: [] }]

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
})

export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Fire Extinguisher Management System API',
    version: '1.0.0',
    description:
      'RESTful API for TZW Ltd fire-safety management. JWT auth (Bearer or httpOnly cookie), RBAC (admin/inspector/user), pagination on all list endpoints.',
  },
  servers: [{ url: '/', description: 'Current host' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, logout, password recovery' },
    { name: 'Users', description: 'Profile management and admin user administration' },
    { name: 'Extinguishers', description: 'Fire extinguisher registration and tracking' },
    { name: 'Inspections', description: 'Inspection scheduling and tracking' },
    { name: 'Maintenance', description: 'Maintenance logging and history' },
    { name: 'Reports', description: 'Analytics, compliance reports, PDF/CSV export' },
    { name: 'System', description: 'Health and infrastructure' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'access_token' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['admin', 'inspector', 'user'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    parameters: {
      Page: { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
      Limit: { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
      Sort: { name: 'sort', in: 'query', schema: { type: 'string' } },
      Order: { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
      Search: { name: 'q', in: 'query', schema: { type: 'string' } },
    },
    responses: {
      BadRequest: errorResponse('Validation error'),
      Unauthorized: errorResponse('Authentication required or invalid'),
      Forbidden: errorResponse('Insufficient role'),
      NotFound: errorResponse('Resource not found'),
      Conflict: errorResponse('Resource conflict (e.g. duplicate email)'),
    },
  },
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: { '200': { description: 'Service status' } },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string', example: 'Jane' },
                  lastName: { type: 'string', example: 'Doe' },
                  email: { type: 'string', format: 'email', example: 'jane@example.com' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and receive a JWT (also set as httpOnly cookie)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@fems.local' },
                  password: { type: 'string', example: 'Password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authenticated; returns { user, token, expiresAt }' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (revokes session + clears cookie)',
        security: bearer,
        responses: {
          '200': { description: 'Logged out' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        security: bearer,
        responses: {
          '200': { description: 'Current user' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Generic acknowledgement' } },
      },
    },
    '/api/v1/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using a token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', example: 'NewPassword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password reset' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/v1/users/me': {
      patch: {
        tags: ['Users'],
        summary: 'Update own profile',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated user' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/v1/users/me/change-password': {
      post: {
        tags: ['Users'],
        summary: 'Change own password',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', example: 'NewPassword123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'List users (admin)',
        security: bearer,
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Sort' },
          { $ref: '#/components/parameters/Order' },
          { $ref: '#/components/parameters/Search' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'inspector', 'user'] } },
        ],
        responses: {
          '200': { description: 'Paginated users' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user (admin)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password'],
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'inspector', 'user'], default: 'user' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created user' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/v1/users/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: {
        tags: ['Users'],
        summary: 'Get user by id (admin)',
        security: bearer,
        responses: {
          '200': { description: 'User' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user (admin)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['admin', 'inspector', 'user'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated user' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (admin)',
        security: bearer,
        responses: {
          '200': { description: 'Deleted' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    '/api/v1/extinguishers': {
      get: {
        tags: ['Extinguishers'],
        summary: 'List extinguishers (paginated)',
        security: bearer,
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { $ref: '#/components/parameters/Sort' },
          { $ref: '#/components/parameters/Order' },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search by serial number' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'under_maintenance', 'expired', 'decommissioned'] } },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['water', 'co2', 'foam', 'dry_chemical'] } },
        ],
        responses: { '200': { description: 'Paginated extinguishers' }, '401': { $ref: '#/components/responses/Unauthorized' } },
      },
      post: {
        tags: ['Extinguishers'],
        summary: 'Register extinguisher (admin/inspector)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate'],
                properties: {
                  serialNumber: { type: 'string', example: 'FE-1001' },
                  location: { type: 'string', example: 'Building A - Floor 1' },
                  type: { type: 'string', enum: ['water', 'co2', 'foam', 'dry_chemical'] },
                  size: { type: 'string', enum: ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'] },
                  installationDate: { type: 'string', format: 'date', example: '2024-01-15' },
                  expiryDate: { type: 'string', format: 'date', example: '2030-01-15' },
                  status: { type: 'string', enum: ['active', 'under_maintenance', 'expired', 'decommissioned'], default: 'active' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Created' },
          '400': { $ref: '#/components/responses/BadRequest' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/api/v1/extinguishers/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Extinguishers'], summary: 'Get extinguisher', security: bearer, responses: { '200': { description: 'Extinguisher' }, '404': { $ref: '#/components/responses/NotFound' } } },
      patch: { tags: ['Extinguishers'], summary: 'Update extinguisher (admin/inspector)', security: bearer, responses: { '200': { description: 'Updated' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { $ref: '#/components/responses/NotFound' } } },
      delete: { tags: ['Extinguishers'], summary: 'Delete extinguisher (admin)', security: bearer, responses: { '200': { description: 'Deleted' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { $ref: '#/components/responses/NotFound' } } },
    },

    '/api/v1/inspections': {
      get: {
        tags: ['Inspections'],
        summary: 'List inspections (paginated)',
        security: bearer,
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'completed', 'overdue', 'cancelled'] } },
          { name: 'extinguisherId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Paginated inspections' }, '401': { $ref: '#/components/responses/Unauthorized' } },
      },
      post: {
        tags: ['Inspections'],
        summary: 'Schedule an inspection (any authenticated user)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['extinguisherId', 'scheduledDate'],
                properties: {
                  extinguisherId: { type: 'string', format: 'uuid' },
                  scheduledDate: { type: 'string', format: 'date' },
                  scheduledTime: { type: 'string', example: '09:30' },
                  remarks: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Scheduled' }, '400': { $ref: '#/components/responses/BadRequest' } },
      },
    },
    '/api/v1/inspections/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Inspections'], summary: 'Get inspection', security: bearer, responses: { '200': { description: 'Inspection' }, '404': { $ref: '#/components/responses/NotFound' } } },
      patch: {
        tags: ['Inspections'],
        summary: 'Update/assign/complete inspection (admin/inspector)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['scheduled', 'completed', 'overdue', 'cancelled'] },
                  inspectorId: { type: 'string', format: 'uuid', nullable: true },
                  remarks: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Updated' }, '403': { $ref: '#/components/responses/Forbidden' }, '404': { $ref: '#/components/responses/NotFound' } },
      },
    },

    '/api/v1/maintenance': {
      get: {
        tags: ['Maintenance'],
        summary: 'List maintenance records (paginated)',
        security: bearer,
        parameters: [
          { $ref: '#/components/parameters/Page' },
          { $ref: '#/components/parameters/Limit' },
          { name: 'extinguisherId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'inspectorId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { '200': { description: 'Paginated maintenance records' }, '401': { $ref: '#/components/responses/Unauthorized' } },
      },
      post: {
        tags: ['Maintenance'],
        summary: 'Log maintenance activity (admin/inspector)',
        security: bearer,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['extinguisherId', 'actionsTaken', 'maintenanceDate'],
                properties: {
                  extinguisherId: { type: 'string', format: 'uuid' },
                  actionsTaken: { type: 'string', example: 'Recharged and pressure-tested' },
                  maintenanceDate: { type: 'string', format: 'date' },
                  conditionsNoted: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Logged' }, '400': { $ref: '#/components/responses/BadRequest' }, '403': { $ref: '#/components/responses/Forbidden' } },
      },
    },
    '/api/v1/maintenance/{id}': {
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      get: { tags: ['Maintenance'], summary: 'Get maintenance record', security: bearer, responses: { '200': { description: 'Record' }, '404': { $ref: '#/components/responses/NotFound' } } },
    },

    '/api/v1/reports/stock': {
      get: {
        tags: ['Reports'],
        summary: 'Stock report (daily/monthly/yearly counts)',
        security: bearer,
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['daily', 'monthly', 'yearly'], default: 'monthly' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { '200': { description: 'Report (JSON, CSV, or PDF)' } },
      },
    },
    '/api/v1/reports/inspections': {
      get: {
        tags: ['Reports'],
        summary: 'Inspection report (completed/pending/overdue)',
        security: bearer,
        parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } }],
        responses: { '200': { description: 'Report (JSON, CSV, or PDF)' } },
      },
    },
    '/api/v1/reports/expired': {
      get: {
        tags: ['Reports'],
        summary: 'Expired extinguishers report',
        security: bearer,
        parameters: [{ name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } }],
        responses: { '200': { description: 'Report (JSON, CSV, or PDF)' } },
      },
    },
    '/api/v1/reports/maintenance': {
      get: {
        tags: ['Reports'],
        summary: 'Maintenance history report (per extinguisher or inspector)',
        security: bearer,
        parameters: [
          { name: 'by', in: 'query', schema: { type: 'string', enum: ['extinguisher', 'inspector'], default: 'extinguisher' } },
          { name: 'id', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv', 'pdf'] } },
        ],
        responses: { '200': { description: 'Report (JSON, CSV, or PDF)' } },
      },
    },
    '/api/v1/reports/dashboard': {
      get: { tags: ['Reports'], summary: 'Real-time dashboard analytics', security: bearer, responses: { '200': { description: 'Aggregate stats' } } },
    },
  },
} as const
