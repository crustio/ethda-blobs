import { ethers } from 'ethers';
import { Account, Network } from './types';
import { configs } from './configs';

export const ERC20_TOKEN_DECIMAL = 18;

export const provider = (() => {
  switch (configs.network) {
    case Network.DencunDevnet9:
    default:
      return new ethers.providers.JsonRpcProvider(
        'https://dencun-devnet-9.ethpandaops.io/'
      );
  }
})();

export const Alice: Account = {
  address: '0xB6Ec64c617f0C4BFb886eE993d80C6234673e845',
  signer: new ethers.Wallet(configs.accounts.aliceSecret, provider),
};

export const Bob: Account = {
  address: '0x64A1337cB99a170692f4Eaa3A42730cEF525ffc3',
  signer: new ethers.Wallet(configs.accounts.bobSecret, provider),
};
