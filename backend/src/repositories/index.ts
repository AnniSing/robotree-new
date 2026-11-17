import {
  JsonUserRepository,
  JsonCertificateRepository,
  JsonCourseRepository,
  JsonTeamRepository,
  JsonEventRepository,
  JsonAuditRepository,
  JsonInquiryRepository,
  JsonProductRepository,
  JsonShowcaseRepository,
  JsonInstituteRepository,
  JsonSettingsRepository,
  JsonHistoryRepository,
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

import {
  MongoUserRepository,
  MongoCertificateRepository,
  MongoCourseRepository,
  MongoTeamRepository,
  MongoEventRepository,
  MongoAuditRepository,
  MongoInquiryRepository,
  MongoProductRepository,
  MongoShowcaseRepository,
  MongoInstituteRepository,
  MongoSettingsRepository,
  MongoHistoryRepository,
} from './mongodb/MongoRepositories.js';

import { isValidMongoUri, MongoConnection } from '../persistence/MongoConnection.js';
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
  showcase: any;
  institutes: any;
  settings: any;
  history: any;
}

function hasValidPostgresUrl(url?: string): boolean {
  if (!url || !url.trim()) return false;
  if (url.includes('[YOUR_PASSWORD]') || url.includes('your_password')) return false;
  return /^postgres(ql)?:\/\//i.test(url.trim());
}

export function createRepositories(): RepositoryContainer {
  if (process.env.NODE_ENV === 'test' || env.NODE_ENV === 'test') {
    Logger.info('Initializing test mode file-backed JSON repositories in isolated test directory.');
    return {
      users: new JsonUserRepository(),
      certificates: new JsonCertificateRepository(),
      courses: new JsonCourseRepository(),
      team: new JsonTeamRepository(),
      events: new JsonEventRepository(),
      audit: new JsonAuditRepository(),
      inquiries: new JsonInquiryRepository(),
      products: new JsonProductRepository(),
      showcase: JsonShowcaseRepository,
      institutes: JsonInstituteRepository,
      settings: JsonSettingsRepository,
      history: JsonHistoryRepository,
    };
  }

  const useMongo =
    (env.DB_PROVIDER === 'mongodb' || env.DB_PROVIDER === 'auto') &&
    isValidMongoUri(env.MONGODB_URI);

  if (useMongo) {
    Logger.info('Initializing MongoDB Atlas database repositories...');
    return {
      users: new MongoUserRepository(),
      certificates: new MongoCertificateRepository(),
      courses: new MongoCourseRepository(),
      team: new MongoTeamRepository(),
      events: new MongoEventRepository(),
      audit: new MongoAuditRepository(),
      inquiries: new MongoInquiryRepository(),
      products: new MongoProductRepository(),
      showcase: MongoShowcaseRepository,
      institutes: MongoInstituteRepository,
      settings: MongoSettingsRepository,
      history: MongoHistoryRepository,
    };
  }

  const usePostgres =
    (env.DB_PROVIDER === 'postgres' || env.DB_PROVIDER === 'supabase' || env.DB_PROVIDER === 'auto') &&
    hasValidPostgresUrl(env.DATABASE_URL);

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
      showcase: JsonShowcaseRepository,
      institutes: JsonInstituteRepository,
      settings: JsonSettingsRepository,
      history: JsonHistoryRepository,
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
    showcase: JsonShowcaseRepository,
    institutes: JsonInstituteRepository,
    settings: JsonSettingsRepository,
    history: JsonHistoryRepository,
  };
}

export const repositories = createRepositories();
