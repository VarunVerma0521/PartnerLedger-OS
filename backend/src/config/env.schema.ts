import * as Joi from 'joi';

const postgresUrlPattern = /^postgres(?:ql)?:\/\/.+$/i;

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  APP_NAME: Joi.string().default('PartnerLedger OS Backend'),
  APP_PORT: Joi.number().port().default(4000),
  APP_GLOBAL_PREFIX: Joi.string().default('api'),
  FRONTEND_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  WS_CORS_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
  DATABASE_URL: Joi.string().pattern(postgresUrlPattern).required(),
  DIRECT_URL: Joi.string().pattern(postgresUrlPattern).required(),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(10),
});
