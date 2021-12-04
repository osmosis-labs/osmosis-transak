module.exports = {
    networks : {
        osmosis: {
            provider: 'https://rpc-osmosis.keplr.app/',
            // provider: 'https://osmosis-1--rpc--archive.datahub.figment.io/apikey/6ed2c50244e912f0b6a15407f7c3bbcb/',
            transactionLink : (hash) => `https://www.mintscan.io/osmosis/txs/${hash}`,
            walletLink : (address) => `https://www.mintscan.io/osmosis/account/${address}`,
            networkName: 'osmosis',
        }
    }
};