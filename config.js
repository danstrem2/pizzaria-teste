const AppConfig = {
    // WhatsApp Number for the Bot (without +)
    botNumber: '558894391768',

    // Website URL (for redirects or links)
    websiteUrl: 'https://danstrem2.github.io/pizzaria-teste/index.html',
    adminUrl: 'https://danstrem2.github.io/pizzaria-teste/admin.html',

    // API URL for Direct Orders (Automático)
    // Use 'http://192.168.1.70:3001' para testes no celular (mesmo Wi-Fi)
    // Se usar VPS com HTTPS, coloque o domínio aqui (ex: 'https://api.meusite.com')
    apiBaseUrl: 'http://192.168.1.70:3001',

    storeName: 'Pizzaria Habibs'
};

// Expose to window
window.AppConfig = AppConfig;
