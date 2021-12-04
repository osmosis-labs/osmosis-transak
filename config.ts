import { Network } from './types';

export const networks: Record<string, Network> = {
    osmosis: {
        provider: 'https://rpc-osmosis.keplr.app/',
        transactionLink: (hash) => `https://www.mintscan.io/osmosis/txs/${hash}`,
        walletLink: (address) => `https://www.mintscan.io/osmosis/account/${address}`,
        networkName: 'osmosis',
        bech32Prefix: "osmo",
        nativeDenom: "uosmo",
        defaultTxFee: 0,
        defaultGas: 200000,
    }
}

module.exports = { networks };