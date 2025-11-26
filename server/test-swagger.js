try {
    console.log('Loading swagger config...');
    const swaggerSpec = require('./src/config/swagger');
    console.log('Swagger config loaded successfully');
    console.log('Spec info:', swaggerSpec.info);
} catch (error) {
    console.error('Error loading swagger config:');
    console.error(error);
}
