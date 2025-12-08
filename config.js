const AppConfig = {
    // WhatsApp Number for the Bot (without +)
    botNumber: '558894391768',

    // Website URL (for redirects or links)
    websiteUrl: 'https://danstrem2.github.io/pizzaria-teste/index.html',
    adminUrl: 'https://danstrem2.github.io/pizzaria-teste/admin.html',

    // API URL for Direct Orders (Automático)
    // URL Pública Temporária (Tunnel): Funciona em 4G/5G
    apiBaseUrl: 'https://chilly-files-drive.loca.lt',

    // apiBaseUrl: 'http://localhost:3001', // Local (Backup)

    storeName: 'Pizzaria Habibs'
};

// Expose to window
window.AppConfig = AppConfig;
