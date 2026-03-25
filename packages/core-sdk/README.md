# @ancore/core-sdk

Core SDK for building on Ancore - the main entry point that ties together stellar client, crypto, account-abstraction, and types into a unified AncoreClient API.

## Overview

The `@ancore/core-sdk` package serves as the orchestration layer for the Ancore stack. It provides a single, unified API that consumers (extension wallet, mobile wallet) can use to interact with the full Ancore ecosystem without needing to manage multiple packages directly.

## Key Features

- **Unified API**: Single import for all Ancore functionality
- **Account Management**: Create and import smart accounts
- **Session Keys**: Add, revoke, and query session keys
- **Transaction Execution**: Execute operations with session key authorization
- **Network Abstraction**: Support for testnet, mainnet, and local networks
- **Error Handling**: Comprehensive error types with actionable messages

## Installation

```bash
npm install @ancore/core-sdk
```

## Usage

### Basic Setup

```typescript
import { AncoreClient, SessionPermission } from '@ancore/core-sdk';

const client = new AncoreClient({ network: 'testnet' });
```

### Create a New Account

```typescript
const account = await client.createAccount({
  name: 'My Wallet',
  fundWithFriendbot: true, // testnet only
});

console.log('Account created:', account.publicKey);
```

### Import an Existing Account

```typescript
const account = await client.importAccount({
  secretKey: 'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4',
  name: 'Imported Wallet',
});
```

### Get Account Balances

```typescript
const balances = await client.getBalances(account.publicKey);
console.log('Balances:', balances);
```

### Session Key Management

```typescript
import { SessionPermission } from '@ancore/core-sdk';

// Add a session key
const builder = await client.addSessionKey(account, {
  publicKey: sessionKeyPair.publicKey(),
  permissions: [SessionPermission.SEND_PAYMENT],
  expiresAt: Date.now() + 86400000, // 24 hours
  label: 'Mobile App Session',
});

// Build and submit the transaction
const transaction = await builder.build();
// ... sign and submit transaction

// Query session key
const sessionKey = await client.getSessionKey(account, sessionKeyPair.publicKey());
```

### Execute Operations with Session Key

```typescript
const builder = await client.executeWithSessionKey(account, sessionKeyPair.publicKey(), operations);

const transaction = await builder.build();
// ... sign and submit transaction
```

## Architecture

The Core SDK acts as the orchestration layer that wires together:

- **@ancore/stellar**: Network client for Stellar blockchain interactions
- **@ancore/crypto**: Cryptographic utilities for signing and verification
- **@ancore/account-abstraction**: Smart contract account abstraction layer
- **@ancore/types**: Shared TypeScript types and interfaces

## API Reference

### AncoreClient

The main client class that provides the unified API.

#### Constructor

```typescript
new AncoreClient(config: AncoreClientConfig)
```

#### Methods

- `createAccount(options?)`: Create a new smart account
- `importAccount(options)`: Import an existing account
- `getBalances(publicKey)`: Get account balances
- `accountExists(publicKey)`: Check if account exists
- `addSessionKey(account, options)`: Add a session key
- `revokeSessionKey(account, publicKey)`: Revoke a session key
- `getSessionKey(account, publicKey)`: Query a session key
- `executeWithSessionKey(account, sessionKey, operations)`: Execute operations
- `getNetwork()`: Get current network
- `getNetworkPassphrase()`: Get network passphrase
- `isNetworkHealthy()`: Check network health
- `verifySignature(message, signature, publicKey)`: Verify a signature

### Error Types

The SDK provides comprehensive error types for different failure scenarios:

- `AncoreClientError`: General client errors
- `WalletCreationError`: Account creation/import failures
- `SessionKeyError`: Session key operation failures
- `TransactionError`: Transaction execution failures
- `SimulationFailedError`: Soroban simulation failures
- `BuilderValidationError`: Transaction builder validation errors

## Development

### Running Tests

```bash
pnpm test
```

### Building

```bash
pnpm build
```

## Dependencies

This package depends on the following Ancore packages:

- `@ancore/types`: Shared types and interfaces
- `@ancore/stellar`: Stellar network client
- `@ancore/crypto`: Cryptographic utilities
- `@ancore/account-abstraction`: Account abstraction layer

## License

Apache-2.0
