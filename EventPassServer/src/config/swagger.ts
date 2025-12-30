import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EventPass Open API',
            version: '1.0.0',
            description: 'EventPass Open API Documentation',
            contact: {
                name: 'EventPass Developer',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Local Development Server',
            },
            {
                url: 'http://10.0.2.2:3000',
                description: 'Android Emulator Loopback',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/models/*.ts'], // Path to the API docs
};

export const specs = swaggerJsdoc(options);
