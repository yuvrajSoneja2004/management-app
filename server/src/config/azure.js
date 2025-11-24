const { BlobServiceClient } = require('@azure/storage-blob');

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME || 'attachments';

let blobServiceClient;
let containerClient;

const initAzureStorage = async () => {
    try {
        if (!AZURE_STORAGE_CONNECTION_STRING) {
            console.warn('Azure Storage Connection String not found');
            return;
        }
        blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        // Create container if it doesn't exist
        await containerClient.createIfNotExists({
            access: 'blob' // Public read access for blobs
        });

        console.log('Azure Storage initialized');
    } catch (error) {
        console.error('Error initializing Azure Storage:', error.message);
    }
};

const uploadToAzure = async (file) => {
    if (!containerClient) await initAzureStorage();

    const blobName = `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }
    });

    return {
        name: file.originalname,
        url: blockBlobClient.url,
        type: file.mimetype
    };
};

module.exports = { initAzureStorage, uploadToAzure };
