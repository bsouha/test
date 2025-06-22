import { createConfig, http } from "wagmi"
import { mainnet, sepolia } from "wagmi/chains"
import { injected } from "wagmi/connectors"
import { defineChain } from "viem"

// Define Ganache chain with your correct port
const ganache = defineChain({
    id: 1337,
    name: "Ganache",
    network: "ganache",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: ["http://127.0.0.1:8545"], // Updated to your Ganache port
        },
        public: {
            http: ["http://127.0.0.1:8545"],
        },
    },
    blockExplorers: {
        default: {
            name: "Ganache",
            url: "http://127.0.0.1:8545",
        },
    },
})

export const config = createConfig({
    chains: [ganache, sepolia, mainnet], // Put Ganache first for development
    connectors: [
        injected({
            target: "metaMask",
        }),
    ],
    transports: {
        [ganache.id]: http("http://127.0.0.1:8545"), // Updated port
        [sepolia.id]: http(),
        [mainnet.id]: http(),
    },
})

declare module "wagmi" {
    interface Register {
        config: typeof config
    }
}
