/**
 * @ancore/core-sdk
 * Core SDK for Ancore wallet integration
 */

export const SDK_VERSION = '0.1.0';

// Re-export types from @ancore/types for convenience
export type { SessionPermission } from '@ancore/types';

// Main client API
export { AncoreClient } from './client';
export type {
  AncoreClientConfig,
  CreateAccountOptions,
  CreateAccountResult,
  ImportAccountOptions,
  AddSessionKeyOptions,
} from './client';

// Account transaction builder (wrapper around Stellar SDK's TransactionBuilder)
export {
  AccountTransactionBuilder,
  type AccountTransactionBuilderOptions,
} from './account-transaction-builder';

// Contract parameter encoding helpers
export {
  toScAddress,
  toScU64,
  toScU32,
  toScPermissionsVec,
  toScOperationsVec,
} from './contract-params';

// Error types
export {
  AncoreSdkError,
  SimulationFailedError,
  SimulationExpiredError,
  BuilderValidationError,
  TransactionSubmissionError,
  AncoreClientError,
  WalletCreationError,
  SessionKeyError,
  TransactionError,
} from './errors';

// Secure Storage
export { SecureStorageManager } from './storage/secure-storage-manager';
export type {
  EncryptedPayload,
  StorageAdapter,
  AccountData,
  SessionKeysData,
} from './storage/types';
