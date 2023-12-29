import { configs } from './configs';
import { jsonRpc } from './constants';
import { BlobTransaction, EncodeBlobs } from '../src';
import {ethers} from "ethers";

describe('Blobs', () => {
  it('Blob TX works', async () => {
    let longString = 'a';

    // for (let i = 0; i < 128 * 1024 *31 / 32 + 1; i++) {
    //   longString += 'a';
    // }

    const blobs = EncodeBlobs(Buffer.from(longString, 'utf-8'));
    console.log(blobs);
    console.log(blobs.length);
    let iface = new ethers.utils.Interface(["function add()"])
    const data = iface.encodeFunctionData("add")
    console.log("input", data)
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
        const hash = await blobTrans.sendTx(blobArr, {
          maxPriorityFeePerGas: 7000000000n,
          maxFeePerGas: 7000000020n,
          value: 100000000000000000n,
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
