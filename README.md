# pooltogether-proxy-factory-package

Typescript wrapper to use PoolTogether's Generic Minimal Proxy Factory for deploying contracts.

## How it works

Import this package into your repo using:
`yarn add -D @pooltogether/pooltogether-proxy-factory-package`


Import in the deployments script:
```typescript
import { factoryDeploy } from "@pooltogether/pooltogether-proxy-factory-package"
```
or
```javascript
const { factoryDeploy } = require("@pooltogether/pooltogether-proxy-factory-package")
```

Add the genericProxyFactory deployment ([addresses](https://github.com/pooltogether/pooltogether-proxy-factory/tree/master/deployments)) to `namedAccounts` in `hardhat.config.ts`:

```javascript
...
namedAccounts: {
    ...
    genericProxyFactory: {
        1: "0x14e09c3319244a84e7c1E7B52634f5220FA96623"
        4: "0x594069c560D260F90C21Be25fD2C8684efbb5628",
        42: "0x713edC7728C4F0BCc135D48fF96282444d77E604",
        137: "0xd1797D46C3E825fce5215a0259D3426a5c49455C",
        80001: "0xd1797D46C3E825fce5215a0259D3426a5c49455C"
    }
```


Pass the paramaters required:
```typescript
interface DeploySettings {
    implementationAddress: string
    contractName: string
    overWrite?: boolean // defaults to false
    signer?: Signer
    initializeData?: string 
    provider: Provider 
}
```

The initialization data can be encoded as such:
```typescript
const contractInterface = new ethers.utils.Interface(contractAbi)

const constructorArgs: string = contractInterface.encodeFunctionData(contractInterface.getFunction("functionName"),
    [
        arg1,
        arg2
    ]
)
```



# Installation
Install the repo and dependencies by running:
`yarn`


# Testing
Run the unit tests locally with:
`yarn test`

## Coverage
Generate the test coverage report with:
`yarn coverage`

Todo:
- use peerDependency for pooltgoether-proxy-factory
- Write script that extracts deployed generic proxy factory addresses automatically
- update tpes for DeploySettings interface
- do we need both the signer and the provider
- prublish non beta version