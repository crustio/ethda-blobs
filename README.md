# Usage

## Install
```bash
npm install @ethda/blobs
```

## Demo
```typescript
import { BlobTransaction, EncodeBlobs } from '@ethda/blobs';

const content = 'abc....';
const blobs = EncodeBlobs(Buffer.from(content, 'utf-8'));
const blobTrans = new BlobTransaction('https://rpc.ethda.io', '<private_key>');
const hash = await blobTrans.sendTx(blobs)
const receipt = await blobTrans.getTxReceipt(hash)
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
