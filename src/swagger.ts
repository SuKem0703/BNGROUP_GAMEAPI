import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8')
) as any;

export const swaggerSpec = swaggerDocument;
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
  },
};