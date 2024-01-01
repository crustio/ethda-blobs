import { resolve } from 'path';
import { constants, ethers } from 'ethers';
import {
  blobToKzgCommitment,
  computeBlobKzgProof,
  loadTrustedSetup,
} from 'c-kzg';
import { Common } from '@ethereumjs/common';
import { BlobEIP4844Transaction, LegacyTransaction } from '@ethereumjs/tx';
import {
  commitmentsToVersionedHashes,
  delay,
  getBytes,
  parseBigintValue,
} from './utils';

import defaultAxios from 'axios';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { RLP } from '@ethereumjs/rlp';
import { ecsign } from '@ethereumjs/util';

const axios = defaultAxios.create({
  timeout: 30000,
});

export class BlobTransaction {
  private _jsonRpc: string;
  private _provider: ethers.providers.JsonRpcProvider;
  private _privateKey: string;
  private _wallet: ethers.Wallet;
  private _chainId: string;

  constructor(jsonRpc: string, privateKey: string) {
    this._jsonRpc = jsonRpc;
    this._provider = new ethers.providers.JsonRpcProvider(jsonRpc);
    this._privateKey = privateKey;
    this._wallet = new ethers.Wallet(privateKey, this._provider);

    const SETUP_FILE_PATH = resolve(__dirname, 'lib', 'trusted_setup.txt');
    console.log(SETUP_FILE_PATH);
    loadTrustedSetup(SETUP_FILE_PATH);
  }

  async sendRpcCall(method, parameters) {
    let response;
    try {
      response = await axios({
        method: 'POST',
        url: this._jsonRpc,
        data: {
          jsonrpc: '2.0',
          method: method,
          params: parameters,
          id: 67,
        },
      });
    } catch (error) {
      console.log('send error', error);
      return null;
    }

    console.log('send response', response.data);
    const returnedValue = response.data.result;
    if (returnedValue === '0x') {
      return null;
    }
    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return returnedValue;
  }

  async sendRawTransaction(param) {
    return await this.sendRpcCall('eth_sendRawTransaction', [param]);
  }

  async getChainId() {
    if (!this._chainId) {
      this._chainId = await this.sendRpcCall('eth_chainId', []);
    }
    return this._chainId;
  }

  async getNonce() {
    return await this._wallet.getTransactionCount('pending');
  }

  async getFee() {
    return await this._provider.getFeeData();
  }

  async suggestGasPrice() {
    return await this.sendRpcCall('eth_gasPrice', []);
  }

  async estimateGas(params) {
    return await this.sendRpcCall('eth_estimateGas', [params]);
  }

  async sanityCheck(tx) {
    const chain = await this.getChainId();

    let {
      chainId,
      nonce,
      to,
      value,
      data,
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit,
      maxFeePerBlobGas,
    } = tx;

    if (!chainId) {
      chainId = parseInt(chain, 16);
    } else {
      chainId = parseBigintValue(chainId);
      if (ethers.utils.isHexString(chainId)) {
        chainId = parseInt(chainId, 16);
      }
      if (chainId !== parseInt(chain, 16)) {
        throw Error('invalid network id');
      }
    }

    if (!nonce) {
      nonce = await this.getNonce();
    }

    value = !value ? '0x' : parseBigintValue(value);

    // if (!maxFeePerGas) {
    //   const params = { from: this._wallet.address, to, data, value };
    //   // gasLimit = await this.estimateGas(params);
    //   maxFeePerGas = await this.suggestGasPrice();
    //   if (!maxFeePerGas) {
    //     throw Error('estimateGas: execution reverted');
    //   }
    // } else {
    //   maxFeePerGas = parseBigintValue(maxFeePerGas);
    // }

    maxFeePerGas = 1000000000n;

    // TODO
    maxFeePerBlobGas = !maxFeePerBlobGas
      ? 2000_000_000_000
      : parseBigintValue(maxFeePerBlobGas);

    to = to ?? constants.AddressZero;

    gasLimit = 21000;

    data = data ?? '0x';

    maxPriorityFeePerGas = maxPriorityFeePerGas ?? 0;

    return {
      chainId,
      nonce,
      to,
      value,
      data,
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit,
      maxFeePerBlobGas,
    };
  }

  async sendTx(blobs, tx) {
    console.log('receive', tx);
    /* eslint-disable prefer-const */
    let {
      chainId,
      nonce,
      to,
      value,
      data,
      maxPriorityFeePerGas,
      maxFeePerGas,
      gasLimit,
      maxFeePerBlobGas,
    } = await this.sanityCheck(tx);

    // blobs
    const commitments = [];
    const proofs = [];
    const versionedHashes = [];
    for (let i = 0; i < blobs.length; i++) {
      commitments.push(blobToKzgCommitment(blobs[i]));
      proofs.push(computeBlobKzgProof(blobs[i], commitments[i]));
      versionedHashes.push(commitmentsToVersionedHashes(commitments[i]));
    }

    const common = Common.custom(
      {
        name: 'ethda',
        networkId: chainId,
        chainId: chainId,
      },
      {
        eips: [1559, 3860, 4844],
      }
    );
    console.log(chainId);

    const message = [
      nonce,
      maxFeePerGas,
      gasLimit,
      to,
      value,
      data,
      1001n,
      0,
      0,
    ];

    const signHash = keccak256(RLP.encode(message));
    const pk = getBytes('0x' + this._privateKey);

    let { v, r, s } = ecsign(signHash, pk);
    v = 2n * 1001n + 8n + v;
    console.log(
      message,
      nonce,
      v,
      Buffer.from(r).toString('hex'),
      Buffer.from(s).toString('hex')
    );
    const blobTx = new BlobEIP4844Transaction(
      {
        chainId,
        nonce,
        to,
        value,
        data,
        maxPriorityFeePerGas: maxFeePerGas,
        maxFeePerGas,
        gasLimit,
        maxFeePerBlobGas,
        blobVersionedHashes: versionedHashes,
        blobs,
        kzgCommitments: commitments,
        kzgProofs: proofs,
        v: v - 2n * 1001n - 35n,
        r: r,
        s: s,
      },
      { common }
    );
    console.log(blobTx);

    const rawData = blobTx.serializeNetworkWrapper();

    const hex = Buffer.from(rawData).toString('hex');
    return await this.sendRawTransaction('0x' + hex);
  }

  async isTransactionMined(transactionHash) {
    const txReceipt = await this._provider.getTransactionReceipt(
      transactionHash
    );
    if (txReceipt && txReceipt.blockNumber) {
      return txReceipt;
    }
    return null;
  }

  async getTxReceipt(transactionHash) {
    let txReceipt;
    while (!txReceipt) {
      txReceipt = await this.isTransactionMined(transactionHash);
      if (txReceipt) break;
      await delay(5000);
    }
    return txReceipt;
  }

  getBlobHash(blob) {
    const commit = blobToKzgCommitment(blob);
    const localHash = commitmentsToVersionedHashes(commit);
    const hash = new Uint8Array(32);
    hash.set(localHash.subarray(0, 32 - 8));
    return ethers.utils.hexlify(hash);
  }
}
