import { resolve } from 'path';
import { ethers } from 'ethers';
import {
  loadTrustedSetup,
  blobToKzgCommitment,
  computeBlobKzgProof,
} from 'c-kzg';
import { Common } from '@ethereumjs/common';
import { BlobEIP4844Transaction } from '@ethereumjs/tx';
import {
  delay,
  commitmentsToVersionedHashes,
  parseBigintValue,
  getBytes,
} from './utils';

import defaultAxios from "axios";
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
    if (this._chainId == null) {
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

  async estimateGas(params) {
    return await this.sendRpcCall('eth_estimateGas', [params]);
  }

  async sendTx(blobs, tx) {
    const chain = await this.getChainId();

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
    } = tx;
    if (chainId == null) {
      chainId = chain;
    } else {
      chainId = parseBigintValue(chainId);
      if (ethers.utils.isHexString(chainId)) {
        chainId = parseInt(chainId, 16);
      }
      if (chainId !== parseInt(chain, 16)) {
        throw Error('invalid network id');
      }
    }

    if (nonce == null) {
      nonce = await this.getNonce();
    }

    value = value == null ? '0x0' : parseBigintValue(value);

    if (gasLimit == null) {
      const params = { from: this._wallet.address, to, data, value };
      gasLimit = await this.estimateGas(params);
      if (gasLimit == null) {
        throw Error('estimateGas: execution reverted');
      }
    } else {
      gasLimit = parseBigintValue(gasLimit);
    }

    if (maxFeePerGas == null) {
      const fee = await this.getFee();
      maxPriorityFeePerGas = fee.maxPriorityFeePerGas.toHexString();
      maxFeePerGas = fee.maxFeePerGas.toHexString();
      console.log(
        fee.maxFeePerGas.toString(),
        fee.maxPriorityFeePerGas.toString()
      );
    } else {
      maxFeePerGas = parseBigintValue(maxFeePerGas);
      maxPriorityFeePerGas = parseBigintValue(maxPriorityFeePerGas);
    }

    // TODO
    maxFeePerBlobGas =
      maxFeePerBlobGas == null
        ? 2000_000_000_000
        : parseBigintValue(maxFeePerBlobGas);

    // blobs
    const commitments = [];
    const proofs = [];
    const versionedHashes = [];
    for (let i = 0; i < blobs.length; i++) {
      commitments.push(blobToKzgCommitment(blobs[i]));
      proofs.push(computeBlobKzgProof(blobs[i], commitments[i]));
      versionedHashes.push(commitmentsToVersionedHashes(commitments[i]));
    }

    // send
    const common = Common.custom(
      {
        name: 'custom-chain',
        networkId: chainId,
        chainId: chainId,
      },
      {
        baseChain: 1,
        eips: [1559, 3860, 4844],
      }
    );
    const unsignedTx = new BlobEIP4844Transaction(
      {
        chainId,
        nonce: nonce,
        to,
        value,
        data,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit: gasLimit,
        maxFeePerBlobGas,
        blobVersionedHashes: versionedHashes,
        blobs,
        kzgCommitments: commitments,
        kzgProofs: proofs,
      },
      { common }
    );

    const pk = getBytes('0x' + this._privateKey);
    const signedTx = unsignedTx.sign(pk);

    const rawData = signedTx.serializeNetworkWrapper();

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
