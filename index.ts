import { networks } from './config'
import { Network, GetTransactionResult, SendTransactionResult } from './types'
import { StargateClient, SigningStargateClient, isAminoMsgSend, AminoTypes, isMsgSendEncodeObject } from '@cosmjs/stargate';
import { DirectSecp256k1HdWallet, decodeTxRaw, Registry, DecodeObject, EncodeObject } from '@cosmjs/proto-signing';
import { AminoMsg, StdFee } from '@cosmjs/amino';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx';
import { Coin } from 'cosmjs-types/cosmos/base/v1beta1/coin';

const validWallet = /osmo1[a-z0-9]{38}/g;

const getNetwork = (network_name: string) => networks[network_name] as Network;
const isValidWalletAddress = (address: string) => validWallet.test(address) as boolean;
const getTransactionLink = (txId: string, network_name: string) => getNetwork(network_name).transactionLink(txId) as string;
const getWalletLink = (walletAddress: string, network_name: string) => getNetwork(network_name).walletLink(walletAddress) as string;

const getDefaultGasPrice = (network_name: string) => (getNetwork(network_name).defaultTxFee / getNetwork(network_name).defaultGas) as Number
function getDefaultStdFee(network_name: string): StdFee {
    const net = getNetwork(network_name)
    return {
        amount: [
            {
              amount: net.defaultTxFee.toString(),
              denom: net.nativeDenom,
            },
          ],
          gas: net.defaultGas.toString(),
    }
}

async function getOsmosisClient(network_name, signer = null): Promise<StargateClient> {
    const net = getNetwork(network_name)
    return await StargateClient.connect(net.provider)
}

async function getSigningOsmosisClient(network_name, signer): Promise<SigningStargateClient> {
    const net = getNetwork(network_name)
    return await SigningStargateClient.connectWithSigner(net.provider, signer, {prefix: net.bech32Prefix})
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
            gasCostCryptoCurrency: rawTx.authInfo.fee.amount[0].denom ?? getNetwork(network).nativeDenom,
            gasCostInCrypto: gasCostInCrypto,
            gasLimit: indexedTx.gasWanted,
            gasPrice: gasCostInCrypto/indexedTx.gasWanted,
            isPending: false,
            isExecuted: true,
            isSuccessful: indexedTx.code == 0,
            isFailed: indexedTx.code != 0,
            isInvalid: indexedTx.code != 0,
            network: network,
            nonce: rawTx.authInfo.signerInfos[0].sequence.toNumber(),
            to: msgSend.toAddress ?? "",
            transactionHash: indexedTx.hash,
            transactionLink: getTransactionLink(indexedTx.hash, network),
        },
    };
}

async function getBalance(address, network): Promise<Number> {
    const client = await getOsmosisClient(network)
    const balance = await client.getBalance(address, getNetwork(network).nativeDenom)
    return Number(balance.amount)
}


async function sendTransaction ({ to, amount, network, mnemonic, denom = 'uosmo' }): Promise<SendTransactionResult> {
    const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {prefix: getNetwork(network).bech32Prefix})
    const signingClient = await getSigningOsmosisClient(network, signer)

    const accs = await signer.getAccounts()

    const sendAmt: Coin[] = [{ denom: denom, amount: amount.toString() }]

    const fee = getDefaultStdFee(network)
    const broadcastTxResponse = await signingClient.sendTokens(accs[0].address, to, sendAmt, fee)

    return {
        txResponse: broadcastTxResponse,
        receipt: {
            amount: amount,
            date: new Date(Date.parse((await signingClient.getBlock(broadcastTxResponse.height)).header.time)),
            from: accs[0].address,
            gasCostCryptoCurrency: fee.amount[0].denom,
            gasCostInCrypto: Number(fee.amount[0].amount),
            gasLimit: Number(fee.gas),
            gasPrice: getDefaultGasPrice(network),
            network: network,
            nonce: (await signingClient.getSequence(accs[0].address)).sequence - 1,
            to: to,
            transactionHash: broadcastTxResponse.transactionHash,
            transactionLink: getTransactionLink(broadcastTxResponse.transactionHash, network),
        }
    }
}

function getMsgSend(message: any, network_name="osmosis"): MsgSend {
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
                const encodeObj = new AminoTypes({prefix: getNetwork(network_name).bech32Prefix}).fromAmino(aminoMsg);
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
