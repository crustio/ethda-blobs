# Usage

```typescript
const content = "abc...."
const blobs = EncodeBlobs(Buffer.from(content, 'utf-8'));
try {
    const hash = await blobTrans.sendTx(blobArr, {
        // value: 100000000000000000n,
    });
    const txReceipt = await blobTrans.getTxReceipt(hash);
} catch (e) {
    console.error(e);
}
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
