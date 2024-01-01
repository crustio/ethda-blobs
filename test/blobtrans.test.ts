import { describe, it } from '@jest/globals';
import { configs } from './configs';
import { BlobTransaction, EncodeBlobs, Network } from '../src';
import { RPC_URLS } from './constants';

describe('Blobs', () => {
  it('Blob TX works', async () => {
    const longString = 'a';

    // for (let i = 0; i < 128 * 1024 *31 / 32 + 1; i++) {
    //   longString += 'a';
    // }

    const blobs = EncodeBlobs(Buffer.from(longString, 'utf-8'));
    const blobTrans = new BlobTransaction(
      RPC_URLS[Network.EthDADevnet],
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
        const hash = await blobTrans.sendTx(blobArr, {
          // maxPriorityFeePerGas: 7000000000n,
          // value: 1000000000000000000n,
          // data: '0x4f2be91f',
          // chainId: 1001,
        });
        console.log(hash);
        const txReceipt = await blobTrans.getTxReceipt(hash);
        console.log(txReceipt);
      } catch (e) {
        console.error(e);
      }
    }
  }, 600000 /*10 minutes timeout*/);
});
