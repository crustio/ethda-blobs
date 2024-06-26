import { describe, it } from '@jest/globals';
import { configs } from './configs';
import { BlobClient, EncodeBlobs, Network } from '../src';
import { RPC_URLS } from './constants';
import { ethers } from 'ethers';

describe('Blobs', () => {
  const provider = new ethers.providers.JsonRpcProvider(
    RPC_URLS[Network.EthDADevnet]
  );
  console.log(provider, RPC_URLS[Network.EthDADevnet]);
  const blobTrans = new BlobClient(
    new ethers.Wallet(configs.accounts.aliceSecret, provider)
  );
  it('Blob TX works', async () => {
    const longString = 'a';

    // for (let i = 0; i < 128 * 1024 *31 / 32 + 1; i++) {
    //   longString += 'a';
    // }

    const blobs = EncodeBlobs(Buffer.from(longString, 'utf-8'));
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
  it('Download blobs', async () => {
    try {
      const hash = await blobTrans.sendTx(
        EncodeBlobs(Buffer.from('ethda', 'utf-8')),
        {}
      );
      console.log(hash);
      const txReceipt = await blobTrans.getTxReceipt(hash);
      console.log(txReceipt);
      const blobs = await blobTrans.downloadBlobs(hash);
      console.log(blobs);
    } catch (e) {
      console.error(e);
    }
  }, 600000 /*10 minutes timeout*/);
});
