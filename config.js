const CONFIG = {
    API_BASE_URL: 'http://localhost:8000',
    MERCADOPAGO_PUBLIC_KEY: 'TEST-744f16b7-9cd4-4dbb-8126-d06afda9edb5',
    ENVIRONMENT: 'development'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}