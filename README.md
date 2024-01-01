# Usage

## Install
```bash
npm install @ethda/blobs
```

## Upload blobs
```typescript
import { BlobTransaction, EncodeBlobs } from '@ethda/blobs';

const content = 'abc....';
const blobs = EncodeBlobs(Buffer.from(content, 'utf-8'));
const blobTrans = new BlobTransaction('https://rpc.ethda.io', '<private_key>');
const hash = await blobTrans.sendTx(blobs)
const receipt = await blobTrans.getTxReceipt(hash)
```

## Download blobs
```typescript
import { BlobTransaction, EncodeBlobs } from '@ethda/blobs';

const txHash = '...';
const blobTrans = new BlobTransaction('https://rpc.ethda.io', '<private_key>');
const result = await blobTrans.downloadBlobs(txHash)
/**
**  result: {
 blob_hashes: ['0x01853e6b060f5b155f406a7ca3f912df5f93873d9df56ad31904db846565dbd2'],
 sidecar: { blobs: [ [Array] ], commitments: [ [Array] ], proofs: [ [Array] ] }}
 **
*/
```

# Publish to npmjs

```sh
$ npm login --registry=https://registry.npmjs.org
$ npm whoami
# Publish package via `np` command (Version number in package.json will be auto updated and committed).
$ yarn np [1.0.0]
```

# Development

## Install Dependencies

```sh
$ yarn
```

## Build

### Lint

```sh
$ yarn lint
```

### Auto fix lint errors

```sh
$ yarn fix
```
