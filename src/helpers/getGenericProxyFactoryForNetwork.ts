import { readFileSync } from "fs";

export function getGenericProxyFactoryAddressForChainId(chainId: number) : any {
    switch (chainId) {
        case 1:
          return "0x14e09c3319244a84e7c1E7B52634f5220FA96623"
        case 4:
          return "0x594069c560D260F90C21Be25fD2C8684efbb5628"
        case 42:
          return  "0x713edC7728C4F0BCc135D48fF96282444d77E604"
        case 77:
          //lookupPathForNetwork =  lookupPathBase+'sokol'+jsonFileName;
          return ""
        case 99:
          //lookupPathForNetwork =  lookupPathBase+'poa'+jsonFileName;
          return ""
        case 100:
          //lookupPathForNetwork =  lookupPathBase+'xdai'+jsonFileName;
          return ""
        case 137:
          return "0xd1797D46C3E825fce5215a0259D3426a5c49455C"
        case 80001:
          return "0xd1797D46C3E825fce5215a0259D3426a5c49455C"
        default:
          return ""
    }
};