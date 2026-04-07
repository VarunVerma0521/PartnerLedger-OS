const configuration = () => ({
  app: {
    name: process.env.APP_NAME ?? 'PartnerLedger OS Backend',
    port: Number(process.env.APP_PORT ?? 4000),
    globalPrefix: process.env.APP_GLOBAL_PREFIX ?? 'api',
    frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
    directUrl: process.env.DIRECT_URL ?? '',
  },
  auth: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  },
  websocket: {
    corsOrigin:
      process.env.WS_CORS_ORIGIN ??
      process.env.FRONTEND_ORIGIN ??
      'http://localhost:3000',
  },
});

export default configuration;
