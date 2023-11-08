import { Network } from './types';

require('dotenv').config({ path: './test/.env' });

/* eslint-disable @typescript-eslint/no-explicit-any */
const getEnv = (value: string, defaultValue: any): any => {
  return process.env[value] || defaultValue;
};

const getNetwork = (): Network => {
  const network = getEnv('NETWORK', '');
  switch (network) {
    case 'decun-devnet-9':
    default:
      return Network.DencunDevnet9;
  }
};

export const configs = {
  network: getNetwork(),
  accounts: {
    aliceSecret: getEnv('ALICE_SECRET', ''),
    bobSecret: getEnv('BOB_SECRET', ''),
  },
};
