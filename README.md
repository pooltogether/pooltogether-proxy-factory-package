# pooltogether-proxy-factory-package

Typescript wrapper to use PoolTogether's Generic Minimal Proxy Factory for deploying contracts.

## How it works

Import this package into your repo using:
`yarn add -D @pooltogether-proxy-factory-package`

Import in the deployments script:
```javascript
import { factoryDeploy } from "@pooltogether-proxy-factory-package"
```
Pass the paramaters required:
```typescript
interface DeploySettings {
    implementationAddress: string
    contractName: string
    overWrite?: boolean
    signer?: any 
    initializeData?: any
    provider: any 
}
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