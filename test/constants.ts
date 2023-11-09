import { Network } from './types';
import { configs } from './configs';

export const ERC20_TOKEN_DECIMAL = 18;

export const jsonRpc = (() => {
  switch (configs.network) {
    case Network.DencunDevnet11:
    default:
      return 'https://rpc.dencun-devnet-11.ethpandaops.io';
  }
})();
