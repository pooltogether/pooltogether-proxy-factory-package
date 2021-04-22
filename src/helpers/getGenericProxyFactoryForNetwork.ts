import { readFileSync } from "fs";

const lookupPathBase  = `./node_modules/@pooltogether/pooltogether-proxy-factory/deployments/`
const jsonFileName = `GenericProxyFactory.json`

export function getGenericProxyFactoryAddressForChainId(chainId: number) : any {
    let lookupPathForNetwork
    switch (chainId) {
        case 1:
          lookupPathForNetwork =  lookupPathBase+"mainnet"+jsonFileName;
        case 3:
          lookupPathForNetwork =  lookupPathBase+'ropsten'+jsonFileName;
        case 4:
          lookupPathForNetwork =  lookupPathBase+'rinkeby'+jsonFileName;
        case 5:
          lookupPathForNetwork =  lookupPathBase+'goerli'+jsonFileName;
        case 42:
          lookupPathForNetwork =  lookupPathBase+'kovan'+jsonFileName;
        case 77:
          lookupPathForNetwork =  lookupPathBase+'sokol'+jsonFileName;
        case 99:
          lookupPathForNetwork =  lookupPathBase+'poa'+jsonFileName;
        case 100:
          lookupPathForNetwork =  lookupPathBase+'xdai'+jsonFileName;
        case 137:
          lookupPathForNetwork =  lookupPathBase+'matic'+jsonFileName;
        case 31337:
          lookupPathForNetwork =  lookupPathBase+'HardhatEVM'+jsonFileName;
        case 80001:
          lookupPathForNetwork =  lookupPathBase+'mumbai'+jsonFileName;
            
          //throw new Error(`No GenericProxyFactory deployment file found for chainId ${chainId}`)
    }
    console.log(`searching for ${lookupPathForNetwork}`)
    return readDeploymentFile(lookupPathForNetwork)
};



function readDeploymentFile(path: any){
    return (JSON.parse(readFileSync(path, { encoding: "utf-8"}))).address
}