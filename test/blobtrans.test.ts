import { configs } from './configs';
import { jsonRpc } from './constants';
import { BlobTransaction, EncodeBlobs } from '../src';

describe('Blobs', () => {
  it('Blob TX works', async () => {
    const blobs = EncodeBlobs(Buffer.from('Hello World', 'utf-8'));

    const blobTrans = new BlobTransaction(
      jsonRpc,
      configs.accounts.aliceSecret
    );
    const blobLength = blobs.length;
    for (let i = 0; i < blobLength; i += 2) {
      let blobArr: Uint8Array[] = [];
      if (i + 1 < blobLength) {
        blobArr = [blobs[i], blobs[i + 1]];
      } else {
        blobArr = [blobs[i]];
      }

      try {
        const hash = await blobTrans.sendTx(blobArr, { nonce: 3 });
        console.log(hash);
        const txReceipt = await blobTrans.getTxReceipt(hash);
        console.log(txReceipt);
      } catch (e) {
        console.error(e);
      }
    }
  }, 600000 /*10 minutes timeout*/);
});
