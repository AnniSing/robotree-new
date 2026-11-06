import {
  JsonUserRepository,
  JsonCertificateRepository,
  JsonCourseRepository,
  JsonTeamRepository,
  JsonEventRepository,
  JsonAuditRepository,
  JsonInquiryRepository,
  JsonProductRepository,
} from './json/JsonRepositories.js';

import {
  PostgresUserRepository,
  PostgresCertificateRepository,
  PostgresCourseRepository,
  PostgresTeamRepository,
  PostgresEventRepository,
  PostgresAuditRepository,
  PostgresInquiryRepository,
  PostgresProductRepository,
} from './postgres/PostgresRepositories.js';

import { IUserRepository } from './interfaces/IUserRepository.js';
import { ICertificateRepository } from './interfaces/ICertificateRepository.js';
import { ICourseRepository } from './interfaces/ICourseRepository.js';
import { ITeamRepository } from './interfaces/ITeamRepository.js';
import { IEventRepository } from './interfaces/IEventRepository.js';
import { IAuditRepository } from './interfaces/IAuditRepository.js';
import { IInquiryRepository } from './interfaces/IInquiryRepository.js';
import { IProductRepository } from './interfaces/IProductRepository.js';
import { env } from '../config/env.js';
import { Logger } from '../telemetry/logger.js';

export interface RepositoryContainer {
  users: IUserRepository;
  certificates: ICertificateRepository;
  courses: ICourseRepository;
  team: ITeamRepository;
  events: IEventRepository;
  audit: IAuditRepository;
  inquiries: IInquiryRepository;
  products: IProductRepository;
}

export function createRepositories(): RepositoryContainer {
  const usePostgres = (env.DB_PROVIDER === 'postgres' || env.DB_PROVIDER === 'supabase' || env.DB_PROVIDER === 'auto') && Boolean(env.DATABASE_URL);

  if (usePostgres) {
    Logger.info('Initializing Supabase / PostgreSQL database repositories...');
    return {
      users: new PostgresUserRepository(),
      certificates: new PostgresCertificateRepository(),
      courses: new PostgresCourseRepository(),
      team: new PostgresTeamRepository(),
      events: new PostgresEventRepository(),
      audit: new PostgresAuditRepository(),
      inquiries: new PostgresInquiryRepository(),
      products: new PostgresProductRepository(),
    };
  }

  // Default to hardened atomic JSON repositories
  Logger.info('Initializing local file-backed JSON repositories.');
  return {
    users: new JsonUserRepository(),
    certificates: new JsonCertificateRepository(),
    courses: new JsonCourseRepository(),
    team: new JsonTeamRepository(),
    events: new JsonEventRepository(),
    audit: new JsonAuditRepository(),
    inquiries: new JsonInquiryRepository(),
    products: new JsonProductRepository(),
  };
}

export const repositories = createRepositories();
