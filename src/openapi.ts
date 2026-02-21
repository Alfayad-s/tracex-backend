export const openApiSpec = {
  openapi: '3.0.3',
  info: { title: 'TraceX Expense API', version: '1.0.0' },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/auth/signup': {
      post: {
        summary: 'Register',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' }, 400: { description: 'Bad request' } },
      },
    },
    '/auth/signin': {
      post: {
        summary: 'Sign in',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Current user',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/expenses': {
      get: {
        summary: 'List expenses',
        tags: ['Expenses'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { enum: ['date', 'amount', 'createdAt'] } },
          { name: 'order', in: 'query', schema: { enum: ['asc', 'desc'] } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        summary: 'Create expense',
        tags: ['Expenses'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['date', 'amount', 'category'],
                properties: {
                  date: { type: 'string', format: 'date' },
                  amount: { type: 'number' },
                  category: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Created' }, 400: { description: 'Bad request' } },
      },
    },
    '/expenses/{id}': {
      get: { summary: 'Get expense', tags: ['Expenses'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      patch: { summary: 'Update expense', tags: ['Expenses'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      delete: { summary: 'Soft delete expense', tags: ['Expenses'], security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 204: { description: 'No content' }, 404: { description: 'Not found' } } },
    },
    '/expenses/summary': {
      get: {
        summary: 'Summary by period',
        tags: ['Expenses'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'groupBy', in: 'query', schema: { enum: ['day', 'week', 'month'] } },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/expenses/export': {
      get: {
        summary: 'Export CSV',
        tags: ['Expenses'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: { 200: { description: 'CSV file' } },
      },
    },
    '/categories': {
      get: { summary: 'List categories', tags: ['Categories'], security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
} as const;
