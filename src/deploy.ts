// exports a generic factoryDeploy using the generic minimal proxy factories
import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

import GenericProxyFactory from "../abis/GenericProxyFactory.json"

import {getGenericProxyFactoryAddressForChainId} from "./helpers/getGenericProxyFactoryForNetwork"
import { ethers, Signer, providers } from "ethers"



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

export interface FactoryDeploySettings {
    implementationAddress: string
    contractName: string
    provider: providers.Provider 
    skipIfAlreadyDeployed?: boolean // defaults to false
    signer?: Signer // do we definitely need this? get from the provider?
    initializeData?: string
}

interface Deployment {
  abi?: any;
  address: string;
  receipt?: any;
  transactionHash?: string;
  // history?: Deployment[];
  implementation?: string;
  args?: any[];
  // linkedData?: any;
  // solcInputHash?: string;
  // metadata?: string;
  // bytecode?: string;
  // deployedBytecode?: string;
  // libraries?: Libraries;
  // userdoc?: any;
  // devdoc?: any;
  // methodIdentifiers?: any;
  // diamondCut?: FacetCut[];
  // facets?: FacetCut[];
  // storageLayout?: any;
  // gasEstimates?: any;
}

export interface DeployResult extends Deployment {
  newlyDeployed: boolean;
}


export async function factoryDeploy(deploySettings: FactoryDeploySettings): Promise<DeployResult>{

    const provider = deploySettings.provider
    let networkName = (await provider.getNetwork()).name

    let initializeData
    if(!deploySettings.initializeData){
      initializeData = "0x"
    }
    else {
      initializeData = deploySettings.initializeData
    }

    let skipIfAlreadyDeployed
    if(deploySettings.skipIfAlreadyDeployed === undefined){
      skipIfAlreadyDeployed = false
    }
    else{
      skipIfAlreadyDeployed = true
    }
    if(skipIfAlreadyDeployed && existsSync(`./deployments/${networkName}/${deploySettings.contractName}.json`)){
      cyan(`Using existing implementation for ${deploySettings.contractName}`)
      // contract already exists -- read info for return object
      const previouslyDeployedContract = JSON.parse(await readFileSync(`./deployments/${networkName}/${deploySettings.contractName}.json`,{encoding:"utf-8"}))
      return {
        newlyDeployed: false,
        address: previouslyDeployedContract.address,
        transactionHash: previouslyDeployedContract.transactionHash,
        receipt: previouslyDeployedContract.receipt,
      }
    }

  
        // get address of minimal proxy factory
    const chainId = (await provider.getNetwork()).chainId
    
    if(chainId === 31337 || chainId === 1337){ // network name "unknown" for the test networks
      networkName = "localhost"
    }
    
    let genericProxyFactoryAddress: string = getGenericProxyFactoryAddressForChainId(chainId)

    // if no generic proxy factory -- create one
    if(genericProxyFactoryAddress == ""){  
      dim(`No GenericProxyFactory deployment found. Deploying a new GenericProxyFactory`)
      const genericProxyFactoryInterface = new ethers.utils.Interface(GenericProxyFactory.abi)
      const genericProxyFactoryContractFactory = new ethers.ContractFactory(genericProxyFactoryInterface, GenericProxyFactory.bytecode, deploySettings.signer)
      const genericProxyFacoryContract = await genericProxyFactoryContractFactory.deploy()
      await genericProxyFacoryContract.deployTransaction.wait()
      genericProxyFactoryAddress = genericProxyFacoryContract.address
      green(`Deployed GenericProxyFactory for ${networkName} at ${genericProxyFactoryAddress}`)
      dim(`If this is not a test network, consider adding to the generic proxy factory repo constants`)
    }

  
    if(!genericProxyFactoryAddress){
        throw new Error(`No GenericProxyFactory deployed for this network ()`)
    }

    cyan(`GenericProxyFactory for network ${networkName} at address ${genericProxyFactoryAddress}`)

    // grab abi and connect to contract instance
    const genericProxyFactoryContract = new ethers.Contract(genericProxyFactoryAddress, GenericProxyFactory.abi, deploySettings.signer)
    dim(`Creating Proxy...implementationAddress: ${deploySettings.implementationAddress}, initializeData: ${initializeData}`)
    const createProxyResult = await genericProxyFactoryContract.create(deploySettings.implementationAddress, initializeData)

    dim(`Awaiting transaction confirmation...`)
    await provider.waitForTransaction(createProxyResult.hash)

    const receipt = await provider.getTransactionReceipt(createProxyResult.hash);
  
    const createdEvent = genericProxyFactoryContract.interface.parseLog(receipt.logs[0]);
    green(`Proxy for ${deploySettings.contractName} created at ${createdEvent.args.created}`)

    const bytecode = await provider.getCode(createdEvent.args.created)

    const jsonObj: ProxyDeployment = {
        address: createdEvent.args.created,
        transactionHash: receipt.transactionHash,
        receipt: receipt,
        args: deploySettings?.initializeData,
        bytecode: bytecode
    }
    const pathFileBase = `./deployments/${networkName}`
    const pathFile = `${pathFileBase}/${deploySettings.contractName}.json`

    mkdirSync(pathFileBase, { recursive: true });

    writeFileSync(pathFile, JSON.stringify(jsonObj, null, 3), {encoding:'utf8',flag:'w'})
    dim(`Deployments file saved at ${pathFile}`)

    return {
      newlyDeployed: true,
      address: createdEvent.args.created,
      transactionHash: createProxyResult.hash,
      receipt: receipt,
    }
  
}
