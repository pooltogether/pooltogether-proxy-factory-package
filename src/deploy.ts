// exports a generic factoryDeploy using the generic minimal proxy factories
import chalk from 'chalk';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

import GenericProxyFactory from "../abis/GenericProxyFactory.json"

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
    provider: any // Provider type?
}

export async function factoryDeploy(deploySettings: DeploySettings){

    const provider = deploySettings.provider
    let networkName = (await provider.getNetwork()).name

    let initializeData
    if(!deploySettings.initializeData){
      initializeData = "0x"
    }
    else {
      initializeData = deploySettings.initializeData
    }

    let overWrite
    if(deploySettings.overWrite === undefined){
      overWrite = false
    }
    else{
      overWrite = true
    }
    if(overWrite && existsSync(`./deployments/${networkName}/${deploySettings.contractName}.json`)){
      cyan(`Using existing implementation for ${deploySettings.contractName}`)
      return
    }

  
        // get address of minimal proxy factory
    const chainId = (await provider.getNetwork()).chainId
    
    dim(`factoryDeploy for chainId ${chainId}`)

    let genericProxyFactoryAddress: string = ""
    if(chainId === 31337 || chainId === 1337){  // if is localhost we will need to deploy a local proxy factory instance
      dim(`Test network detected.. deploying GenericPorxyFactory`)
      const genericProxyFactoryInterface = new ethers.utils.Interface(GenericProxyFactory.abi)
      const genericProxyFactoryContractFactory = new ethers.ContractFactory(genericProxyFactoryInterface, GenericProxyFactory.bytecode, deploySettings.signer)
      const genericProxyFacoryContract = await genericProxyFactoryContractFactory.deploy()
      await genericProxyFacoryContract.deployTransaction.wait()
      genericProxyFactoryAddress = genericProxyFacoryContract.address

      networkName = "localhost"

    }
    else{
      genericProxyFactoryAddress = getGenericProxyFactoryAddressForChainId(chainId)
    }

  
    if(!genericProxyFactoryAddress){
        throw new Error(`No GenericProxyFactory deployed for this network ()`)
    }

    cyan(`GenericProxyFactory for network ${networkName} at address ${genericProxyFactoryAddress}`)

    // grab abi and connect to contract instance
    const genericProxyFactoryContract = new ethers.Contract(genericProxyFactoryAddress, GenericProxyFactory.abi, deploySettings.signer)
    dim(`Creating Proxy...`)
    const createProxyResult = await genericProxyFactoryContract.create(deploySettings.implementationAddress, initializeData)

    dim(`Awaiting transaction confirmation...`)
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
    const pathFileBase = `./deployments/${networkName}`
    const pathFile = `${pathFileBase}/${deploySettings.contractName}.json`

    mkdirSync(pathFileBase, { recursive: true });

    writeFileSync(pathFile, JSON.stringify(jsonObj), {encoding:'utf8',flag:'w'})
    dim(`Deployments file saved at ${pathFile}`)
}
