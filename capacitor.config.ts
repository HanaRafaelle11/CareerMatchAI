import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.vocentro.app',
  appName: 'VoCentro',
  webDir: 'dist',
  server: {
    // Em produção, o app carrega os assets locais do bundle
    // Para desenvolvimento com hot-reload, descomente a linha abaixo:
    // url: 'http://SEU_IP_LOCAL:5173',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    // Habilita inspeção via Chrome DevTools em builds debug
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // true apenas em dev
  },
};

export default config;
