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
      return Network.DencunDevnet12;
  }
};

export const configs = {
  network: getNetwork(),
  accounts: {
    aliceSecret:
      '0e9d91324bd432c21a2593ea904fa07bdbe747fa13a7ebc88d3bdd9ba2986c41',
    bobSecret: getEnv('BOB_SECRET', ''),
  },
};
