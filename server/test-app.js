(async () => {
    try {
        console.log('Loading app...');
        const app = require('./src/app');
        console.log('App loaded successfully');

        console.log('Loading email worker...');
        require('./src/workers/email.worker');
        console.log('Email worker loaded successfully');

        console.log('All checks passed');
        process.exit(0);
    } catch (error) {
        console.error('Error during initialization:');
        console.error(error);
        process.exit(1);
    }
})();
