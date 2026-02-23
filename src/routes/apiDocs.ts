import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openApiSpec } from '../openapi.js';

const router = Router();
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec as Parameters<typeof swaggerUi.setup>[0]));

export const apiDocsRouter = router;
