import { default as config } from './config'
import { GetTransactionResult, SendTransactionResult } from './types'
import { StargateClient, SigningStargateClient, isAminoMsgSend, AminoTypes, isMsgSendEncodeObject } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, decodeTxRaw, Registry, DecodeObject, EncodeObject } from '@cosmjs/proto-signing';
import { AminoMsg, StdFee } from '@cosmjs/amino';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

const bech32_prefix = "osmo";
const native_denom = "uosmo";
const native_denom_decimals = 6;
const validWallet = /osmo1[a-z0-9]{38}/g;

const default_txfee = 0
const default_gas = 200000
const std_fee: StdFee = {
    amount: [
      {
        amount: default_txfee.toString(),
        denom: native_denom,
      },
    ],
    gas: default_gas.toString(),
};


const isValidWalletAddress = (address) => validWallet.test(address);
const getTransactionLink = (txId, network) => config.networks[network].transactionLink(txId);
const getWalletLink = (walletAddress, network) => config.networks[network].walletLink(walletAddress);

async function getOsmosisClient(network, signer = null): Promise<StargateClient> {
    return await StargateClient.connect(config.networks[network].provider)
}

async function getSigningOsmosisClient(network, signer): Promise<SigningStargateClient> {
    return await SigningStargateClient.connectWithSigner(config.networks[network].provider, signer, {prefix: bech32_prefix})
}


async function getTransaction(txId, network): Promise<GetTransactionResult> {
    const client = await getOsmosisClient(network)
    const indexedTx = await client.getTx(txId)

    const rawTx = decodeTxRaw(indexedTx.tx)
    
    if (rawTx == null) {
        return null
    }

    var msgSend: MsgSend = getMsgSend(rawTx.body.messages[0])

    const gasCostInCrypto = Number(rawTx.authInfo.fee.amount[0].amount) ?? 0

    return {
        txData: indexedTx,
        receipt: {
            amount: Number(msgSend.amount[0].amount) ?? 0,
            date: new Date(Date.parse((await client.getBlock(indexedTx.height)).header.time)),
            from: msgSend.fromAddress ?? "",
            gasCostCryptoCurrency: rawTx.authInfo.fee.amount[0].denom ?? native_denom,
            gasCostInCrypto: gasCostInCrypto,
            gasLimit: indexedTx.gasWanted,
            gasPrice: gasCostInCrypto/indexedTx.gasWanted,
            isPending: false,
            isExecuted: true,
            isSuccessful: indexedTx.code == 0,
            isFailed: indexedTx.code != 0,
            isInvalid: indexedTx.code != 0,
            network: config.networks[network].networkName,
            nonce: rawTx.authInfo.signerInfos[0].sequence.toNumber(),
            to: msgSend.toAddress ?? "",
            transactionHash: indexedTx.hash,
            transactionLink: getTransactionLink(indexedTx.hash, network),
        },
    };
}

async function getBalance(address, network): Promise<Number> {
    const client = await getOsmosisClient(network)
    const balance = await client.getBalance(address, native_denom)
    return Number(balance.amount)
}


async function sendTransaction ({ to, amount, network, mnemonic, denom = 'uosmo' }): Promise<SendTransactionResult> {

    const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {prefix: bech32_prefix})

    const signingClient = await getSigningOsmosisClient(network, signer)

    const accs = await signer.getAccounts()

    const sendAmt: Coin[] = [{ denom: denom, amount: amount.toString() }]
    const broadcastTxResponse = await signingClient.sendTokens(accs[0].address, to, sendAmt, std_fee)

    return {
        txResponse: broadcastTxResponse,
        receipt: {
            amount: amount,
            date: new Date(Date.parse((await signingClient.getBlock(broadcastTxResponse.height)).header.time)),
            from: accs[0].address,
            gasCostCryptoCurrency: std_fee.amount[0].denom ?? native_denom,
            gasCostInCrypto: Number(std_fee.amount[0].amount) ?? 0,
            gasLimit: Number(std_fee.gas),
            gasPrice: default_txfee/default_gas,
            network: network,
            nonce: (await signingClient.getSequence(accs[0].address)).sequence - 1,
            to: to,
            transactionHash: broadcastTxResponse.transactionHash,
            transactionLink: getTransactionLink(broadcastTxResponse.transactionHash, network),
        }
    }
}

function getMsgSend(message: any): MsgSend {
    var msgSend: MsgSend = null

    try {
        // check if a proto-encoded message
        const encodeObj: EncodeObject = message as unknown as EncodeObject;
        // check if it a MsgSend
        if (isMsgSendEncodeObject(encodeObj)) {
            msgSend  =   new Registry().decode(encodeObj as DecodeObject)
        }
    }
    catch (error) {
        try {
            // otherwise, check if it is an amino-encoded message
            const aminoMsg: AminoMsg = message as unknown as AminoMsg;
            // check if it a MsgSend
            if (isAminoMsgSend(aminoMsg)){
                const encodeObj = new AminoTypes({prefix: bech32_prefix}).fromAmino(aminoMsg);
                if (isMsgSendEncodeObject(encodeObj)) {
                    msgSend = new Registry().decode(encodeObj as DecodeObject)
                }
            }
        } catch (error){}
    }   

    return msgSend
}

module.exports = {
    getTransactionLink,
    getWalletLink,
    getTransaction,
    isValidWalletAddress,
    sendTransaction,
    getBalance,
};
