const { ethers } = require("ethers");
const axios = require("axios");

const supportedTokens = {
    ARBITRUM: [
        "0xa1886085e77c8c2239327C5EDb3A432268e5831",
        "0xff970a6140b1ca14834a43f5de4533ebddb5cc8"
    ],
    BASE: [
        "0x833589fCDeDbE06f4c7C32D4f71b54bdA02913",
        "0xd9aaec860b65d86fa75b1b0c42ffa531710b6ca"
    ],
    OPTIMISM: [
        "0x7f5c764cbc14f969f9b8837ca1490cca17c31607"
    ],
    POLYGON: [
        "0x2791Bca1f2de4661ED88A30C9947a94949a84174",
        "0x30489c542cef5e3811e1192ce70d8cc034503359"
    ],
    ETHEREUM: [
        "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    ]
};

const evmChains = {
    ARBITRUM: "https://arb1.arbitrum.io/rpc",
    BASE: "https://mainnet.base.org",
    OPTIMISM: "https://mainnet.optimism.io",
    POLYGON: "https://polygon-rpc.com",
    ETHEREUM: "https://rpc.ankr.com/eth"
};

async function getAccountAddresses() {
    const response = await axios.get("https://api.app.infinex.xyz/public/accounts");
    return response.data;
}

async function getEVMChainTVL(chain, rpcUrl, accounts) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    let totalTVL = ethers.BigNumber.from(0);

    for (const token of supportedTokens[chain]) {
        const tokenContract = new ethers.Contract(token, [
            "function balanceOf(address owner) view returns (uint256)"
        ], provider);

        for (const account of accounts) {
            if (account.evm) {
                const balance = await tokenContract.balanceOf(account.evm);
                totalTVL = totalTVL.add(balance);
            }
        }
    }

    return totalTVL;
}

async function getSolanaTVL(accounts) {
    //https://gist.github.com/yaminfinex/1b353f5c90aef5b20dfad074ef3883
    // Placeholder for actual Solana balance retrieval
    let totalTVL = 0;
    for (const account of accounts) {
        if (account.solana) {
            totalTVL += await getSolanaBalance(account.solana); // Replace with actual implementation
        }
    }
    return totalTVL;
}

// Placeholder function for getting Solana balance, replace with actual implementation
async function getSolanaBalance(address) {
    //https://gist.github.com/yaminfinex/1b353f5c90aef5b20dfad074ef3883
    // Implement this function based on Solana API you are using
    return 0;
}

async function calculateTVL() {
    const accounts = await getAccountAddresses();
    let totalTVL = ethers.BigNumber.from(0);

    for (const chain in evmChains) {
        const chainTVL = await getEVMChainTVL(chain, evmChains[chain], accounts);
        totalTVL = totalTVL.add(chainTVL);
    }

    const solanaTVL = await getSolanaTVL(accounts);
    totalTVL = totalTVL.add(ethers.BigNumber.from(solanaTVL));

    return {
        total: totalTVL.toString()
    };
}

module.exports = {
    calculateTVL
};
