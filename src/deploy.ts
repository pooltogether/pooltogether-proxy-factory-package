// exports a generic factoryDeploy using the generic minimal proxy factories
import chalk from 'chalk';
import { existsSync, writeFileSync } from 'fs';

import GenericProxyFactory from "@pooltogether/pooltogether-proxy-factory/abis/GenericProxyFactory.json"

import {getGenericProxyFactoryAddressForChainId} from "./helpers/getGenericProxyFactoryForNetwork"
import { ethers } from "ethers"

const displayLogs = !process.env.HIDE_DEPLOY_LOG;

function dim(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.dim(logMessage));
  }
}

function cyan(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.cyan(logMessage));
  }
}

function yellow(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.yellow(logMessage));
  }
}

function green(logMessage: string) {
  if (displayLogs) {
    console.log(chalk.green(logMessage));
  }
}


interface ProxyDeployment {
    address?: string
    abi?: any
    transactionHash?: string
    receipt?: any
    args?: any
    bytecode?: string
}

interface DeploySettings {
    implementationAddress: string
    contractName: string
    overWrite?: boolean
    signer?: any // replace with Signer type from ethers -- do we definitely need this? get from the provider?
    initializeData?: any // string?
    abi: any, // only if intialize is to be called
    provider: any // Provider type?
}

export async function factoryDeploy(deploySettings: DeploySettings){
    const provider = new ethers.providers.JsonRpcBatchProvider(deploySettings.provider)

    console.log("provider is ", provider)

    //get network name
    const networkName = await provider.getNetwork()

    // if is localhost we will need to deploy a local proxy factory instance?

    // get address of minimal proxy factory
    const genericProxyFactoryAddress = getGenericProxyFactoryAddressForChainId((await provider.getNetwork()).chainId)

    if(!genericProxyFactoryAddress){
        throw new Error(`No GenericProxyFactory deployed for this network ()`)
    }
    if(deploySettings.initializeData && !deploySettings.abi){
        throw new Error(`Initialize data provided but no ABI`)
    }

    if(deploySettings.overWrite && existsSync(`./deployments/${networkName}/${deploySettings.contractName}.json`)){
        cyan(`Using existing implementation for ${deploySettings.contractName}`)
        return
    }

    cyan(`GenericProxyFactory for network ${networkName} at address ${genericProxyFactoryAddress}`)

    // grab abi and create contract instance
    const genericProxyFactoryContract = new ethers.Contract(genericProxyFactoryAddress, GenericProxyFactory, deploySettings.signer)

    const createProxyResult = await genericProxyFactoryContract.create(deploySettings.implementationAddress, deploySettings.initializeData)

    await provider.waitForTransaction(createProxyResult.hash)

    const receipt = await provider.getTransactionReceipt(createProxyResult.hash);
  
    const createdEvent = genericProxyFactoryContract.interface.parseLog(receipt.logs[0]);
    green(`Proxy for ${deploySettings.contractName} created at ${createdEvent.args.created}`)

    const jsonObj: ProxyDeployment = {
        address: createdEvent.args.created,
        transactionHash: receipt.transactionHash,
        receipt: receipt,
        args: deploySettings?.initializeData,
        bytecode: `${await provider.getCode(createdEvent.args.created)}`
    }
    const pathFile = `./deployments/${networkName}/${deploySettings.contractName}.json`
    dim(`Deployments file saved at ${pathFile}`)
    writeFileSync(pathFile, JSON.stringify(jsonObj), {encoding:'utf8',flag:'w'})

    // now call intializer if applicable
    if(deploySettings.initializeData){
        dim(`calling passed function`)
        const instanceContract = new ethers.Contract(createdEvent.args.created, deploySettings.abi, deploySettings.signer)
        await instanceContract.initialize(deploySettings.initializeData) // will this always be intialize? 
    }

}
