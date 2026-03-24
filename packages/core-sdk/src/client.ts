/**
 * @ancore/core-sdk - AncoreClient
 *
 * Main entry point that ties together stellar client, crypto, account-abstraction,
 * and types into a unified API. This is the single import for consumers
 * (extension wallet, mobile wallet) to interact with the full Ancore stack.
 */

import { Keypair, rpc } from '@stellar/stellar-sdk';
import type { Network, NetworkConfig, SmartAccount, SessionKey, SessionPermission } from '@ancore/types';
import { StellarClient, type Balance } from '@ancore/stellar';
import { AccountContract } from '@ancore/account-abstraction';
import { verifySignature } from '@ancore/crypto';
import { AccountTransactionBuilder, type AccountTransactionBuilderOptions } from './account-transaction-builder';
import { AncoreClientError, WalletCreationError, SessionKeyError, TransactionError } from './errors';

export interface AncoreClientConfig extends NetworkConfig {
  /** Custom RPC server instance (optional) */
  rpcServer?: rpc.Server;
}

export interface CreateAccountOptions {
  /** User-friendly name for the account */
  name?: string;
  /** Optional icon URL or data URI */
  icon?: string;
  /** Whether to fund the account with Friendbot (testnet only) */
  fundWithFriendbot?: boolean;
}

export interface ImportAccountOptions {
  /** The secret key to import */
  secretKey: string;
  /** User-friendly name for the account */
  name?: string;
  /** Optional icon URL or data URI */
  icon?: string;
  /** Contract ID if the account is already deployed */
  contractId?: string;
}

export interface AddSessionKeyOptions {
  /** G... address of the session key */
  publicKey: string;
  /** Permission enum values */
  permissions: SessionPermission[];
  /** Expiration timestamp (unix ms) */
  expiresAt: number;
  /** Optional label for the session key */
  label?: string;
}

/**
 * AncoreClient is the main orchestration layer that provides a unified API
 * for wallet creation, account management, session keys, and transaction execution.
 * 
 * @example
 * ```typescript
 * const client = new AncoreClient({ network: 'testnet' });
 * 
 * // Create a new account
 * const account = await client.createAccount({ name: 'My Wallet' });
 * 
 * // Get balances
 * const balances = await client.getBalances(account.publicKey);
 * 
 * // Add a session key
 * await client.addSessionKey(account, {
 *   publicKey: sessionKeyPair.publicKey(),
 *   permissions: [SessionPermission.SEND_PAYMENT],
 *   expiresAt: Date.now() + 86400000 // 24 hours
 * });
 * ```
 */
export class AncoreClient {
  private readonly stellarClient: StellarClient;
  private readonly rpcServer: rpc.Server;
  private readonly networkPassphrase: string;
  private readonly network: Network;

  constructor(config: AncoreClientConfig) {
    this.network = config.network;
    this.stellarClient = new StellarClient(config);
    this.networkPassphrase = this.stellarClient.getNetworkPassphrase();
    
    // Use provided RPC server or create default one
    if (config.rpcServer) {
      this.rpcServer = config.rpcServer;
    } else {
      const rpcUrl = config.rpcUrl ?? this.getDefaultRpcUrl(config.network);
      this.rpcServer = new rpc.Server(rpcUrl);
    }
  }

  // ---------------------------------------------------------------------------
  // Wallet Creation & Import
  // ---------------------------------------------------------------------------

  /**
   * Create a new smart account with a randomly generated keypair.
   * Optionally funds the account with Friendbot on testnet.
   * 
   * @param options - Account creation options
   * @returns The created smart account
   * @throws WalletCreationError if account creation fails
   */
  async createAccount(options: CreateAccountOptions = {}): Promise<SmartAccount> {
    try {
      // Generate a new keypair
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();

      // Fund with Friendbot if requested and on testnet
      if (options.fundWithFriendbot && this.network === 'testnet') {
        await this.stellarClient.fundWithFriendbot(publicKey);
      }

      // For now, we'll generate a placeholder contract ID
      // In a real implementation, this would deploy the account contract
      const contractId = `C${keypair.publicKey().slice(1)}`;

      const account: SmartAccount = {
        publicKey,
        contractId,
        nonce: 0,
        metadata: {
          name: options.name ?? 'Ancore Account',
          icon: options.icon,
          createdAt: Date.now(),
        },
      };

      return account;
    } catch (error) {
      throw new WalletCreationError(
        'Failed to create account',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Import an existing account using a secret key.
   * 
   * @param options - Import options including secret key
   * @returns The imported smart account
   * @throws WalletCreationError if import fails
   */
  async importAccount(options: ImportAccountOptions): Promise<SmartAccount> {
    try {
      const keypair = Keypair.fromSecret(options.secretKey);
      const publicKey = keypair.publicKey();

      // Verify the account exists on the network
      await this.stellarClient.getAccount(publicKey);

      // Use provided contract ID or generate placeholder
      const contractId = options.contractId ?? `C${publicKey.slice(1)}`;

      const account: SmartAccount = {
        publicKey,
        contractId,
        nonce: 0, // Will be fetched from contract in real implementation
        metadata: {
          name: options.name ?? 'Imported Account',
          icon: options.icon,
          createdAt: Date.now(),
        },
      };

      return account;
    } catch (error) {
      throw new WalletCreationError(
        'Failed to import account',
        error instanceof Error ? error : undefined
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Balance & Account Queries
  // ---------------------------------------------------------------------------

  /**
   * Get balances for an account.
   * 
   * @param publicKey - The public key of the account
   * @returns Array of balances including XLM and tokens
   */
  async getBalances(publicKey: string): Promise<Balance[]> {
    return this.stellarClient.getBalances(publicKey);
  }

  /**
   * Check if an account exists on the network.
   * 
   * @param publicKey - The public key to check
   * @returns True if the account exists
   */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      await this.stellarClient.getAccount(publicKey);
      return true;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Session Key Management
  // ---------------------------------------------------------------------------

  /**
   * Add a session key to a smart account.
   * 
   * @param account - The smart account to add the session key to
   * @param options - Session key options
   * @returns Transaction builder for the operation
   * @throws SessionKeyError if session key creation fails
   */
  async addSessionKey(
    account: SmartAccount,
    options: AddSessionKeyOptions
  ): Promise<AccountTransactionBuilder> {
    try {
      // Load the source account for transaction building
      const sourceAccount = await this.stellarClient.getAccount(account.publicKey);

      const builderOptions: AccountTransactionBuilderOptions = {
        server: this.rpcServer,
        accountContractId: account.contractId,
        networkPassphrase: this.networkPassphrase,
      };

      const builder = new AccountTransactionBuilder(sourceAccount, builderOptions);
      
      return builder.addSessionKey(
        options.publicKey,
        options.permissions,
        options.expiresAt
      );
    } catch (error) {
      throw new SessionKeyError(
        'Failed to add session key',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Revoke a session key from a smart account.
   * 
   * @param account - The smart account to revoke the session key from
   * @param sessionKeyPublicKey - The public key of the session key to revoke
   * @returns Transaction builder for the operation
   * @throws SessionKeyError if session key revocation fails
   */
  async revokeSessionKey(
    account: SmartAccount,
    sessionKeyPublicKey: string
  ): Promise<AccountTransactionBuilder> {
    try {
      const sourceAccount = await this.stellarClient.getAccount(account.publicKey);

      const builderOptions: AccountTransactionBuilderOptions = {
        server: this.rpcServer,
        accountContractId: account.contractId,
        networkPassphrase: this.networkPassphrase,
      };

      const builder = new AccountTransactionBuilder(sourceAccount, builderOptions);
      
      return builder.revokeSessionKey(sessionKeyPublicKey);
    } catch (error) {
      throw new SessionKeyError(
        'Failed to revoke session key',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get a session key from a smart account.
   * 
   * @param account - The smart account to query
   * @param sessionKeyPublicKey - The public key of the session key
   * @returns The session key if found, null otherwise
   */
  async getSessionKey(
    account: SmartAccount,
    sessionKeyPublicKey: string
  ): Promise<SessionKey | null> {
    try {
      const accountContract = new AccountContract(account.contractId);
      
      return await accountContract.getSessionKey(sessionKeyPublicKey, {
        server: this.rpcServer as any, // Type compatibility issue with RPC server interface
        sourceAccount: account.publicKey,
        networkPassphrase: this.networkPassphrase,
      });
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Transaction Execution
  // ---------------------------------------------------------------------------

  /**
   * Create a transaction builder for executing operations with a session key.
   * 
   * @param account - The smart account to execute operations for
   * @param sessionKeyPublicKey - The session key to use for authorization
   * @param operations - The operations to execute
   * @returns Transaction builder for the execution
   * @throws TransactionError if execution setup fails
   */
  async executeWithSessionKey(
    account: SmartAccount,
    sessionKeyPublicKey: string,
    operations: unknown[] // Will be xdr.Operation[] when dependencies are available
  ): Promise<AccountTransactionBuilder> {
    try {
      const sourceAccount = await this.stellarClient.getAccount(account.publicKey);

      const builderOptions: AccountTransactionBuilderOptions = {
        server: this.rpcServer,
        accountContractId: account.contractId,
        networkPassphrase: this.networkPassphrase,
      };

      const builder = new AccountTransactionBuilder(sourceAccount, builderOptions);
      
      return builder.execute(sessionKeyPublicKey, operations as any); // Type will be correct when xdr.Operation[] is available
    } catch (error) {
      throw new TransactionError(
        'Failed to setup execution',
        error instanceof Error ? error : undefined
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Network & Utility Methods
  // ---------------------------------------------------------------------------

  /**
   * Get the current network.
   */
  getNetwork(): Network {
    return this.network;
  }

  /**
   * Get the network passphrase.
   */
  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  /**
   * Check if the network is healthy.
   */
  async isNetworkHealthy(): Promise<boolean> {
    return this.stellarClient.isHealthy();
  }

  /**
   * Verify a signature using the crypto utilities.
   * 
   * @param message - The message that was signed
   * @param signature - The signature to verify
   * @param publicKey - The public key to verify against
   * @returns Promise that resolves to true if the signature is valid
   */
  async verifySignature(message: string, signature: string, publicKey: string): Promise<boolean> {
    return await verifySignature(message, signature, publicKey);
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private getDefaultRpcUrl(network: Network): string {
    switch (network) {
      case 'testnet':
        return 'https://soroban-testnet.stellar.org';
      case 'mainnet':
        return 'https://soroban.stellar.org';
      case 'local':
        return 'http://localhost:8000/soroban/rpc';
      default:
        throw new AncoreClientError(`Unknown network: ${network}`);
    }
  }
}