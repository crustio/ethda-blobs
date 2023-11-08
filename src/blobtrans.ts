import { ethers } from 'ethers';
/* eslint-disable node/no-extraneous-import */
import { TypedDataSigner } from '@ethersproject/abstract-signer';

const BYTES_PER_FIELD_ELEMENT = 32;
const FIELD_ELEMENTS_PER_BLOB = 4096;
const BLOB_SIZE = BYTES_PER_FIELD_ELEMENT * FIELD_ELEMENTS_PER_BLOB; // 128 KB per Blob

const USEFUL_BYTES_PER_BLOB = 32 * FIELD_ELEMENTS_PER_BLOB;
const MAX_BLOBS_PER_TX = 2; // 2 Blobs per TX
const MAX_USEFUL_BYTES_PER_TX = USEFUL_BYTES_PER_BLOB * MAX_BLOBS_PER_TX - 1; // 255 KB per TX

export class BlobTransaction {
  private _provider: ethers.providers.JsonRpcProvider;
  private _signer: ethers.Signer & TypedDataSigner;

  constructor(
    provider: ethers.providers.JsonRpcProvider,
    signer?: ethers.Signer & TypedDataSigner
  ) {
    this._provider = provider;
    this._signer = signer;
  }

  /**
   * Ref: https://github.com/asn-d6/blobbers/blob/packing_benchmarks/src/packer_naive.rs
   *
   * @param data
   * @returns
   */
  public getBlobs(data: string) {
    const buffer = Buffer.from(data, 'binary');
    const len = Buffer.byteLength(buffer);
    if (len === 0) {
      throw Error('Empty data');
    }
    if (len > MAX_USEFUL_BYTES_PER_TX) {
      throw Error('Too large data for a Blob TX');
    }

    const blobs_len = Math.ceil(len / USEFUL_BYTES_PER_BLOB);
    const pdata = this._getPadded(buffer, blobs_len);

    const blobs = [];
    for (let i = 0; i < blobs_len; i++) {
      const chunk = pdata.subarray(
        i * USEFUL_BYTES_PER_BLOB,
        (i + 1) * USEFUL_BYTES_PER_BLOB
      );
      const blob = this._getBlob(chunk);
      blobs.push(blob);
    }

    return blobs;
  }

  public async send({
    data,
    accountAddress,
  }: {
    data: string;
    accountAddress: string;
  }) {
    const blobs = this.getBlobs(data);
    console.log('number of blobs is ' + blobs.length);

    const blobshex = blobs.map((x) => `0x${x.toString('hex')}`);
    const txData = {
      from: accountAddress,
      to: '0x',
      data: '0x',
      chainId: 0x1, // TODO:
      blobs: blobshex,
    };
    const gas = await this._provider.estimateGas(txData);
    console.log(`Estiamted Gas: ${gas}`);

    const signer = this._signer || this._provider.getSigner(accountAddress);
    console.log('Sending Blob TX');
    const tx = await signer.sendTransaction(txData);
    await tx.wait();
    console.log('Blob TX sent');
  }

  private _getBlob(data) {
    const blob = Buffer.alloc(BLOB_SIZE, 'binary');
    for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
      const chunk = Buffer.alloc(32, 'binary');
      chunk.fill(data.subarray(i * 31, (i + 1) * 31), 0, 31);
      blob.fill(chunk, i * 32, (i + 1) * 32);
    }

    return blob;
  }

  private _getPadded(data, blobs_len) {
    const pdata = Buffer.alloc(blobs_len * USEFUL_BYTES_PER_BLOB);
    const datalen = Buffer.byteLength(data);
    pdata.fill(data, 0, datalen);
    // TODO: if data already fits in a pad, then ka-boom
    pdata[datalen] = 0x80;
    return pdata;
  }
}
