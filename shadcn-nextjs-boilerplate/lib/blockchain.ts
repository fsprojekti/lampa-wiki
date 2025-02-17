import { ethers } from "ethers";
import contractABI from "./Formicarium.json"; // Import your contract ABI
import contractERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json"; // Import ERC20 ABI
import { useGlobalContext } from "@/contexts/GlobalContext";

// 🔥 Dynamic Network Configuration
const NETWORKS = {
    "base-testnet": {
        rpcUrl: "https://sepolia.base.org",
        contractAddress: "0xa68d23AfC79A9acF2773a2dDd24412eDdf6E13d7",
        erc20Address: "0x02BA94d06E5C9e6B7DB18eD80c475447939907b1",
    },
    "base-mainnet": {
        rpcUrl: "https://mainnet.base.org",
        contractAddress: "0xEa3D6D99DF5e7aEe6Bb4F723f9BEa19fFfF25d6B", // Replace with real Base Mainnet address
        erc20Address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    "arbitrum-sepolia": {
        rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
        contractAddress: "0xE2BBceBC540bEF2e1d76dD3154Bd94Bf1846b705", // Replace with real Arbitrum Sepolia contract
        erc20Address: "0x3207249ba95035b067D9700A5d221531A6eA3BcB",
    },
};

// 🔥 Get Provider (MetaMask or Fallback)
function getProvider() {
    return typeof window !== "undefined" && window.ethereum
        ? new ethers.BrowserProvider(window.ethereum)
        : new ethers.JsonRpcProvider(NETWORKS["base-testnet"].rpcUrl);
}

// 🔥 Get Contract
function getContract(networkKey: keyof typeof NETWORKS) {
    const provider = getProvider();
    return new ethers.Contract(
        NETWORKS[networkKey].contractAddress,
        contractABI.abi,
        provider
    );
}

// 🔥 Get ERC20 Contract
function getERC20Contract(networkKey: keyof typeof NETWORKS) {
    const provider = getProvider();
    return new ethers.Contract(
        NETWORKS[networkKey].erc20Address,
        contractERC20ABI.abi,
        provider
    );
}

// ✅ Fetch Contract Owner
export async function fetchContractOwner(networkKey: keyof typeof NETWORKS) {
    try {
        const contract = getContract(networkKey);
        return await contract.owner();
    } catch (error) {
        console.error("Error fetching contract owner:", error);
        return null;
    }
}

// ✅ Fetch Orders
export async function fetchOrders(networkKey: keyof typeof NETWORKS, address: string | null) {
    try {
        const contract = getContract(networkKey);
        return await contract.getYourOrders({ from: address });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return null;
    }
}

// ✅ Fetch Printers
export async function fetchPrinters(networkKey: keyof typeof NETWORKS) {
    try {
        const contract = getContract(networkKey);
        return await contract.getAllPrinters();
    } catch (error) {
        console.error("Error fetching printers:", error);
        return null;
    }
}

// ✅ Fetch ETH Balance
export async function fetchBalanceETH(networkKey: keyof typeof NETWORKS, address: string) {
    try {
        if (!address) return null;
        const provider = getProvider();
        const balanceWei = await provider.getBalance(address);
        return ethers.formatEther(balanceWei);
    } catch (error) {
        console.error("Error fetching ETH balance:", error);
        return null;
    }
}

// ✅ Fetch ERC20 Balance
export async function fetchBalanceERC20(networkKey: keyof typeof NETWORKS, address: string) {
    try {
        if (!address) return null;
        const contract = getERC20Contract(networkKey);
        const balance = await contract.balanceOf(address);
        return Number(ethers.formatEther(balance));
    } catch (error) {
        console.error("Error fetching ERC20 balance:", error);
        return null;
    }
}

// ✅ Place Order
export async function placeOrder(
    networkKey: keyof typeof NETWORKS,
    address: string,
    orderID: string,
    printerID: string,
    minPrice: number,
    actualPrice: number,
    duration: number
) {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contract = getContract(networkKey).connect(signer);
        const erc20Contract = getERC20Contract(networkKey).connect(signer);

        const minPriceWei = ethers.parseEther(minPrice.toString());
        const actualPriceWei = ethers.parseEther(actualPrice.toString());
        const durationSeconds = duration * 3600;

        // Approve ERC20 Spending
        const approveTx = await erc20Contract.approve(NETWORKS[networkKey].contractAddress, actualPriceWei);
        await approveTx.wait();

        console.log("Approved ERC20 Spending:", approveTx.hash);

        // Create Order
        const tx = await contract.createOrder(orderID, printerID, minPriceWei, actualPriceWei, durationSeconds);
        await tx.wait();

        console.log("Order Created, Transaction Hash:", tx.hash);
        return tx.hash;
    } catch (error) {
        console.error("Error placing order:", error);
        return null;
    }
}
