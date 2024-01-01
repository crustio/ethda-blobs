import { BlobTransaction, EncodeBlobs } from '@ethda/blobs';

const content = 'abc....';
const blobs = EncodeBlobs(Buffer.from(content, 'utf-8'));
const blobTrans = new BlobTransaction(
  'https://rpc.ethda.io',
  process.env['KEY']
);
blobTrans
  .sendTx(blobs, {
    value: 1000000000000000000n,
  })
  .then((hash) => {
    blobTrans
      .getTxReceipt(hash)
      .then((r) => {
        console.log('receipt', r);
      })
      .catch((e) => console.error(e));
  })
  .catch((e) => console.error(e));
