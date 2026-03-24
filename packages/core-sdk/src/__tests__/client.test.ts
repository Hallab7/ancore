/**
 * @ancore/core-sdk - Core SDK Tests
 *
 * Basic tests for the core SDK structure and error handling.
 * These tests focus on what can be tested without workspace dependencies.
 */

import {
  AncoreSdkError,
  AncoreClientError,
  WalletCreationError,
  SessionKeyError,
  TransactionError,
  SimulationFailedError,
  SimulationExpiredError,
  BuilderValidationError,
  TransactionSubmissionError,
} from '../errors';

import { AccountTransactionBuilder } from '../account-transaction-builder';

import {
  toScAddress,
  toScU64,
  toScU32,
  toScPermissionsVec,
  toScOperationsVec,
} from '../contract-params';

describe('Core SDK Error Classes', () => {
  describe('AncoreSdkError', () => {
    it('should create error with code and message', () => {
      const error = new AncoreSdkError('TEST_CODE', 'Test message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AncoreSdkError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
    });

    it('should maintain proper prototype chain', () => {
      const error = new AncoreSdkError('TEST_CODE', 'Test message');
      expect(error instanceof AncoreSdkError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('AncoreClientError', () => {
    it('should create client error', () => {
      const error = new AncoreClientError('Client error message');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('AncoreClientError');
      expect(error.code).toBe('CLIENT_ERROR');
      expect(error.message).toBe('Client error message');
    });

    it('should include cause in stack trace', () => {
      const cause = new Error('Original error');
      const error = new AncoreClientError('Wrapper error', cause);
      
      expect(error.stack).toContain('Caused by:');
    });
  });

  describe('WalletCreationError', () => {
    it('should create wallet creation error', () => {
      const error = new WalletCreationError('Wallet creation failed');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('WalletCreationError');
      expect(error.code).toBe('WALLET_CREATION_FAILED');
      expect(error.message).toBe('Wallet creation failed');
    });
  });

  describe('SessionKeyError', () => {
    it('should create session key error', () => {
      const error = new SessionKeyError('Session key operation failed');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('SessionKeyError');
      expect(error.code).toBe('SESSION_KEY_ERROR');
      expect(error.message).toBe('Session key operation failed');
    });
  });

  describe('TransactionError', () => {
    it('should create transaction error', () => {
      const error = new TransactionError('Transaction failed');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('TransactionError');
      expect(error.code).toBe('TRANSACTION_ERROR');
      expect(error.message).toBe('Transaction failed');
    });
  });

  describe('SimulationFailedError', () => {
    it('should create simulation failed error', () => {
      const error = new SimulationFailedError('Simulation diagnostic');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('SimulationFailedError');
      expect(error.code).toBe('SIMULATION_FAILED');
      expect(error.diagnosticMessage).toBe('Simulation diagnostic');
    });
  });

  describe('SimulationExpiredError', () => {
    it('should create simulation expired error', () => {
      const error = new SimulationExpiredError();
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('SimulationExpiredError');
      expect(error.code).toBe('SIMULATION_EXPIRED');
    });
  });

  describe('BuilderValidationError', () => {
    it('should create builder validation error', () => {
      const error = new BuilderValidationError('Validation failed');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('BuilderValidationError');
      expect(error.code).toBe('BUILDER_VALIDATION');
    });
  });

  describe('TransactionSubmissionError', () => {
    it('should create transaction submission error', () => {
      const error = new TransactionSubmissionError('Submission failed', 'result-xdr');
      
      expect(error).toBeInstanceOf(AncoreSdkError);
      expect(error.name).toBe('TransactionSubmissionError');
      expect(error.code).toBe('SUBMISSION_FAILED');
      expect(error.resultXdr).toBe('result-xdr');
    });
  });
});

describe('Core SDK Components', () => {
  describe('AccountTransactionBuilder', () => {
    it('should be defined and exportable', () => {
      expect(AccountTransactionBuilder).toBeDefined();
      expect(typeof AccountTransactionBuilder).toBe('function');
    });
  });

  describe('Contract Parameter Helpers', () => {
    it('should export parameter conversion functions', () => {
      expect(typeof toScAddress).toBe('function');
      expect(typeof toScU64).toBe('function');
      expect(typeof toScU32).toBe('function');
      expect(typeof toScPermissionsVec).toBe('function');
      expect(typeof toScOperationsVec).toBe('function');
    });
  });
});

// Smoke test for the orchestration layer concept
describe('Core SDK Orchestration Layer Concept', () => {
  it('should provide error handling infrastructure', () => {
    // Test that the error hierarchy is properly set up for the orchestration layer
    const clientError = new AncoreClientError('test');
    const walletError = new WalletCreationError('test');
    const sessionError = new SessionKeyError('test');
    const txError = new TransactionError('test');

    // All should inherit from the base SDK error
    expect(clientError).toBeInstanceOf(AncoreSdkError);
    expect(walletError).toBeInstanceOf(AncoreSdkError);
    expect(sessionError).toBeInstanceOf(AncoreSdkError);
    expect(txError).toBeInstanceOf(AncoreSdkError);

    // All should have proper error codes for programmatic handling
    expect(clientError.code).toBe('CLIENT_ERROR');
    expect(walletError.code).toBe('WALLET_CREATION_FAILED');
    expect(sessionError.code).toBe('SESSION_KEY_ERROR');
    expect(txError.code).toBe('TRANSACTION_ERROR');
  });

  it('should provide building blocks for the unified API', () => {
    // Test that the core components needed for orchestration are available
    expect(AccountTransactionBuilder).toBeDefined();
    expect(toScAddress).toBeDefined();
    expect(AncoreSdkError).toBeDefined();
    
    // These are the building blocks that AncoreClient will use to orchestrate
    // the stellar client, crypto, account-abstraction, and types modules
  });

  it('should define the expected error surface for consumers', () => {
    // Extension wallet and mobile wallet will need to handle these error types
    const expectedErrorTypes = [
      AncoreSdkError,
      AncoreClientError,
      WalletCreationError,
      SessionKeyError,
      TransactionError,
      SimulationFailedError,
      SimulationExpiredError,
      BuilderValidationError,
      TransactionSubmissionError,
    ];

    expectedErrorTypes.forEach(ErrorType => {
      expect(ErrorType).toBeDefined();
      expect(typeof ErrorType).toBe('function');
      
      const instance = new ErrorType('test message');
      expect(instance).toBeInstanceOf(Error);
      expect(instance).toBeInstanceOf(AncoreSdkError);
    });
  });
});