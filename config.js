const AppConfig = {
    // WhatsApp Number for the Bot (without +)
    botNumber: '558894391768',

    // Website URL (for redirects or links)
    websiteUrl: 'https://danstrem2.github.io/pizzaria-teste/index.html',
    adminUrl: 'https://danstrem2.github.io/pizzaria-teste/admin.html',

    // API URL for Direct Orders (Automático)
    // Use 'http://localhost:3001' se testando localmente.
    // Se usar VPS com HTTPS, coloque o domínio aqui (ex: 'https://api.meusite.com')
    apiBaseUrl: 'http://localhost:3001',

    storeName: 'Pizzaria Habibs'
};

// Expose to window
window.AppConfig = AppConfig;
