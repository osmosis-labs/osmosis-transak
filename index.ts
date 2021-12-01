import config from './config.js';

import { StargateClient, SigningStargateClient, IndexedTx, BroadcastTxResponse, setupBankExtension, isAminoMsgSend, AminoTypes } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, decodeTxRaw } from '@cosmjs/proto-signing';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';

const bech32_prefix = "osmo";
const validWallet = /osmo1[a-z0-9]{38}/g;

// const std_fee = {
//         amount: readonly Coin[];
//         readonly gas: string;
//     }

export type GetTransactionResult = {
    txData: IndexedTx,
    receipt: {
        amount,
        date,
        from,
        gasCostCryptoCurrency,
        gasCostInCrypto,
        gasLimit,
        gasPrice,
        isPending,
        isExecuted,
        isSuccessful,
        isFailed,
        isInvalid,
        network,
        nonce,
        to,
        transactionHash,
        transactionLink,
    }
};

declare type SendTransactionResult = {
    txResponse: BroadcastTxResponse,
    receipt: {
        amount,
        date,
        from,
        gasCostCryptoCurrency,
        gasCostInCrypto,
        gasLimit,
        gasPrice,
        network,
        nonce,
        to,
        transactionHash,
        transactionLink,
    }
}

// const getTerra = (network) => new ({
//     URL: config.networks[network].provider,
//     chainID: config.networks[network].networkName,
//     gasPrices: [new Coin('uluna', '0.15')],
//     gasAdjustment: '1.5',
//     gas: 10000000,
// });

async function getOsmosisClient(network) {
    return await StargateClient.connect(network.URL)
}

async function getSigningOsmosisClient(network, signer) {
    return await SigningStargateClient.connectWithSigner(network.URL, signer)
}

const getTransactionLink = (txId, network) => config.networks[network].transactionLink(txId);
const getWalletLink = (walletAddress, network) => config.networks[network].walletLink(walletAddress);

async function getTransaction(txId, network) {
    const client = await getOsmosisClient(config.networks[network])
    const indexedTx = await client.getTx(txId)

    const rawTx = decodeTxRaw(indexedTx.tx)

    const msgSend: MsgSend = null

    try {
       const aminoMsg = new AminoTypes({prefix=bech32_prefix}).toAmino(rawTx.body.messages[0])
       if aminoMsg != 
    } catch (error) {
        
    }

    if isAminoMsgSend(rawTx.body.messages[0])

    const filteredMsgs = rawTx.body.messages.filter((msg) => {
      if (!isMsgSendEncodeObject(msg)) return false;
      const decoded = registry.decode(msg);
      return decoded.fromAddress === sendSuccessful?.sender;
    });

    const getTxRes: GetTransactionResult = {
        txData: indexedTx,
        receipt: {
            amount,
            date,
            from,
            gasCostCryptoCurrency,
            gasCostInCrypto,
            gasLimit,
            gasPrice,
            isPending,
            isExecuted,
            isSuccessful,
            isFailed,
            isInvalid,
            network: config.networks[network].networkName,
            nonce: rawTx.authInfo.signerInfos[0].sequence,
            to,
            transactionHash: indexedTx.hash,
            transactionLink: getTransactionLink(indexedTx.hash, network),
        },
      };
}

async function getBalance(address, network) {
    const client = await getOsmosisClient(network)

    client.
    setupBankExtension()
    return await client.getAllBalances(address)
}

// const getTransaction = async(txId, network) => getOsmosisClient(network).tx.txInfo(txId);
// const getBalance = async(address, network) => getOsmosisClient(network).bank.balance(address);

const isValidWalletAddress = (address) => validWallet.test(address);

async function sendTransaction ({ to, amount, network, mnemonic, denom = 'uosmo' }) {

    const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic)

    const signingClient = await getSigningOsmosisClient(network, signer)

    const accs = await signer.getAccounts()

    

    const broadcastTxResponse = signingClient.sendTokens(accs[0].address, to, amount)

    const res =  SendTransactionResult{}

    // const mk = new MnemonicKey({
    //     mnemonic,
    // });

    // const wallet = terra.wallet(mk);

    // const send = new MsgSend(
    //     wallet.key.accAddress,
    //     to,
    //     { [denom]: amount }
    // );

    // return new Promise((resolve) => {
    //     wallet
    //     .createAndSignTx({
    //         msgs: [send],
    //     })
    //     .then(tx => terra.tx.broadcast(tx))
    //     .then(result => {
    //         resolve(result);
    //     });
    // });
}

const main = async () => {
    const realWallet = 'terra1z75w0td9urxkh254jwqd5m8pd6ulqjfdjsxpj5';
    const fakeWallet = 'terra1z75w0td9urxkh254jwqd5m8pd6ulqjfdjsxpj';

    const isRealWalletLegit = isValidWalletAddress(realWallet);
    const isFakeWalletLegit = isValidWalletAddress(fakeWallet);

    console.log(`isRealWalletLegit: ${isRealWalletLegit}`);
    console.log(`isFakeWalletLegit: ${isFakeWalletLegit}`);

    // Transfer 0.1 Luna.
    const sendResponse = await sendTransaction({ 
        to: realWallet,
        amount: 100000,
        network: 'testnet',
        mnemonic: process.env.KEY
    });

    console.log(getTransactionLink(sendResponse.txhash, 'testnet'));

    const terra = getTerra('testnet');
    const mk = new MnemonicKey({
        mnemonic: process.env.KEY,
    });

    const wallet = terra.wallet(mk);

    console.log(await getBalance(wallet.key.accAddress, 'testnet'));
}

main();