export default {
    networks : {
        mainnet: {
            provider: 'https://lcd-osmosis.keplr.app/',
            transactionLink : (hash) => `https://www.mintscan.io/osmosis/txs/${hash}`,
            walletLink : (address) => `https://www.mintscan.io/osmosis/account/${address}`,
            networkName: 'osmosis-1',
        }
    }
  };