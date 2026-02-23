export const openApiSpec = {
  openapi: '3.0.3',
  info: { title: 'TraceX API', version: '1.0.0', description: 'Personal expense management API' },
  servers: [{ url: '/', description: 'API root' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { status: {}, timestamp: {} } } } } } },
      },
    },
    '/api/v1/auth/signup': {
      post: {
        summary: 'Register',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } } } } } },
        responses: { 201: { description: 'Created' }, 400: { description: 'Validation or email exists' } },
      },
    },
    '/api/v1/auth/signin': {
      post: {
        summary: 'Sign in',
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['email', 'password'], properties: { email: {}, password: {} } } } } },
        responses: { 200: { description: 'OK' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/v1/auth/me': {
      get: {
        summary: 'Current user',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/api/v1/categories': {
      get: { summary: 'List categories', security: [{ bearerAuth: [] }], responses: { 200: {} } },
      post: { summary: 'Create category', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: {}, color: {}, icon: {} } } } } }, responses: { 201: {} } },
    },
    '/api/v1/categories/{id}': {
      get: { summary: 'Get category', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      patch: { summary: 'Update category', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 403: {}, 404: {} } },
      delete: { summary: 'Delete category', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 204: {}, 403: {}, 404: {} } },
    },
    '/api/v1/expenses': {
      get: {
        summary: 'List expenses',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'sort', in: 'query', schema: { type: 'string', enum: ['date', 'amount', 'category', 'createdAt'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: {} },
      },
      post: {
        summary: 'Create expense',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['date', 'amount', 'category'], properties: { date: { type: 'string', format: 'date' }, amount: { type: 'number' }, category: { type: 'string' }, description: { type: 'string' } } } } } },
        responses: { 201: {} },
      },
    },
    '/api/v1/expenses/bulk': {
      post: { summary: 'Bulk create expenses', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['expenses'], properties: { expenses: { type: 'array', items: { type: 'object' }, maxItems: 100 } } } } } }, responses: { 201: {} } },
    },
    '/api/v1/expenses/summary': {
      get: { summary: 'Expense summary', security: [{ bearerAuth: [] }], parameters: [{ name: 'from', in: 'query' }, { name: 'to', in: 'query' }, { name: 'groupBy', in: 'query', schema: { enum: ['day', 'week', 'month'] } }], responses: { 200: {} } },
    },
    '/api/v1/expenses/summary/by-category': {
      get: { summary: 'Summary by category', security: [{ bearerAuth: [] }], parameters: [{ name: 'from', in: 'query' }, { name: 'to', in: 'query' }], responses: { 200: {} } },
    },
    '/api/v1/expenses/export': {
      get: { summary: 'Export CSV', security: [{ bearerAuth: [] }], parameters: [{ name: 'format', in: 'query', required: true, schema: { type: 'string', enum: ['csv'] } }, { name: 'from', in: 'query' }, { name: 'to', in: 'query' }], responses: { 200: { description: 'CSV file' } } },
    },
    '/api/v1/expenses/{id}': {
      get: { summary: 'Get expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      patch: { summary: 'Update expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      delete: { summary: 'Soft delete expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 204: {}, 404: {} } },
    },
    '/api/v1/expenses/{id}/restore': {
      post: { summary: 'Restore expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
    },
    '/api/v1/budgets': {
      get: { summary: 'List budgets', security: [{ bearerAuth: [] }], responses: { 200: {} } },
      post: { summary: 'Create budget', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['year', 'limit'], properties: { category: {}, year: {}, month: {}, limit: {} } } } } }, responses: { 201: {} } },
    },
    '/api/v1/budgets/{id}': {
      get: { summary: 'Get budget', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      patch: { summary: 'Update budget', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      delete: { summary: 'Delete budget', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 204: {}, 404: {} } },
    },
    '/api/v1/budgets/{id}/compare': {
      get: { summary: 'Budget vs spending', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
    },
    '/api/v1/recurring': {
      get: { summary: 'List recurring expenses', security: [{ bearerAuth: [] }], responses: { 200: {} } },
      post: { summary: 'Create recurring expense', security: [{ bearerAuth: [] }], requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['category', 'amount', 'frequency', 'startDate'], properties: { category: {}, amount: {}, description: {}, frequency: { enum: ['day', 'week', 'month'] }, startDate: {} } } } } }, responses: { 201: {} } },
    },
    '/api/v1/recurring/run': {
      post: { summary: 'Create expenses from due recurring items', security: [{ bearerAuth: [] }], responses: { 200: {} } },
    },
    '/api/v1/recurring/{id}': {
      get: { summary: 'Get recurring expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      patch: { summary: 'Update recurring expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 200: {}, 404: {} } },
      delete: { summary: 'Delete recurring expense', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }], responses: { 204: {}, 404: {} } },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
} as const;
