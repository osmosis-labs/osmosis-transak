import {
    StargateClient,
    SigningStargateClient,
    IndexedTx,
    BroadcastTxResponse,
} from '@cosmjs/stargate';

export type Network = {
    provider: string,
    transactionLink: (string) => string,
    walletLink: (string) => string,
    networkName: string,
    bech32Prefix: string,
    nativeDenom: string,
    defaultTxFee: number,
    defaultGas: number,
};

export type GetTransactionResult = {
    txData: IndexedTx,
    receipt: {
        amount: Number,
        date: Date,
        from: string,
        gasCostCryptoCurrency: string,
        gasCostInCrypto: Number,
        gasLimit: Number,
        gasPrice: Number,
        isPending: boolean,
        isExecuted: boolean,
        isSuccessful: boolean,
        isFailed: boolean,
        isInvalid: boolean,
        network: string,
        nonce: Number,
        to: string,
        transactionHash: string,
        transactionLink: string,
    }
};

export declare type SendTransactionResult = {
    txResponse: BroadcastTxResponse,
    receipt: {
        amount: Number,
        date: Date,
        from: string,
        gasCostCryptoCurrency: string,
        gasCostInCrypto: Number,
        gasLimit: Number,
        gasPrice: Number,
        network: string,
        nonce: Number,
        to: string,
        transactionHash: string,
        transactionLink: string,
    }
}