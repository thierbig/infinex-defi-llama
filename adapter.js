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

const accountFactoryAddress = "0x665766368Ee511Ebd3CD5F9300520dac915e941c";

async function getEVMChainTVL(chain, rpcUrl) {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(accountFactoryAddress, [
        "event AccountCreated(address indexed account)"
    ], provider);

    const logs = await provider.getLogs({
        fromBlock: 0,
        toBlock: "latest",
        address: accountFactoryAddress,
        topics: [ethers.utils.id("AccountCreated(address)")]
    });

    const accountAddresses = logs.map(log => ethers.utils.defaultAbiCoder.decode(["address"], log.topics[1])[0]);

    let totalTVL = ethers.BigNumber.from(0);

    for (const token of supportedTokens[chain]) {
        const tokenContract = new ethers.Contract(token, [
            "function balanceOf(address owner) view returns (uint256)"
        ], provider);

        for (const account of accountAddresses) {
            const balance = await tokenContract.balanceOf(account);
            totalTVL = totalTVL.add(balance);
        }
    }

    return totalTVL;
}

async function getSolanaTVL() {
    const response = await axios.get("https://gist.github.com/yaminfinex/1b353f5c90aef5b20dfad074ef3883");
    return response.data; // This needs to be adjusted based on the actual data returned
}

async function calculateTVL() {
    const evmChains = {
        ARBITRUM: "https://arb1.arbitrum.io/rpc",
        BASE: "https://mainnet.base.org",
        OPTIMISM: "https://mainnet.optimism.io",
        POLYGON: "https://polygon-rpc.com",
        ETHEREUM: "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
    };

    let totalTVL = ethers.BigNumber.from(0);

    for (const chain in evmChains) {
        const chainTVL = await getEVMChainTVL(chain, evmChains[chain]);
        totalTVL = totalTVL.add(chainTVL);
    }

    const solanaTVL = await getSolanaTVL();
    totalTVL = totalTVL.add(ethers.BigNumber.from(solanaTVL)); // Adjust based on data type from Solana

    return totalTVL.toString();
}

module.exports = {
    calculateTVL
};
