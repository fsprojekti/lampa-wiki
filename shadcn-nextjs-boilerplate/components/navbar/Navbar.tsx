"use client";

import { useGlobalContext } from "@/contexts/GlobalContext";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Syncopate } from "next/font/google";
import { ethers } from "ethers";
import { useEffect } from "react";

const syncopate = Syncopate({ weight: "700", subsets: ["latin"] });

// ✅ Corrected Network Configurations
const NETWORKS = {
    "base-testnet": {
        chainId: "0x14a34", // ✅ Corrected Hex for 84532 (Base Sepolia)
        chainName: "Base Sepolia Testnet",
        rpcUrls: ["https://sepolia.base.org"],
        blockExplorerUrls: ["https://sepolia.basescan.org"],
        nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
    },
    "base-mainnet": {
        chainId: "0x2105", // 8453 in decimal
        chainName: "Base Mainnet",
        rpcUrls: ["https://mainnet.base.org"],
        blockExplorerUrls: ["https://basescan.org"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    },
    "arbitrum-sepolia": {
        chainId: "0x66eee", // 421614 in decimal
        chainName: "Arbitrum Sepolia Testnet",
        rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
        blockExplorerUrls: ["https://sepolia.arbiscan.io"],
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    },
};

// ✅ Get network key from MetaMask chainId
const getNetworkKeyByChainId = (chainId: string) => {
    const normalizedChainId = ethers.toBeHex(parseInt(chainId, 16)); // Normalize Hex
    return Object.keys(NETWORKS).find(
        (key) => ethers.toBeHex(parseInt(NETWORKS[key as keyof typeof NETWORKS].chainId, 16)) === normalizedChainId
    ) as keyof typeof NETWORKS | undefined;
};

export default function Navbar(props: { brandText: string }) {
    const { walletAddress, setWalletAddress, selectedNetwork, setSelectedNetwork } = useGlobalContext();

    // ✅ Sync with MetaMask network on page load
    useEffect(() => {
        const fetchMetaMaskNetwork = async () => {
            if (typeof window.ethereum !== "undefined") {
                try {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const network = await provider.getNetwork();
                    const chainId = ethers.toBeHex(network.chainId);
                    const newNetworkKey = getNetworkKeyByChainId(chainId);

                    if (newNetworkKey && newNetworkKey !== selectedNetwork) {
                        setSelectedNetwork(newNetworkKey);
                        console.log(`✅ Synced with MetaMask: ${NETWORKS[newNetworkKey].chainName}`);
                    }
                } catch (error) {
                    console.error("❌ Error fetching MetaMask network:", error);
                }
            }
        };

        fetchMetaMaskNetwork();
    }, []);

    // ✅ Detect MetaMask network changes
    useEffect(() => {
        if (typeof window.ethereum !== "undefined") {
            const handleNetworkChange = (chainId: string) => {
                console.log(`🔄 Network changed in MetaMask: ${chainId}`);
                const newNetworkKey = getNetworkKeyByChainId(chainId);
                if (newNetworkKey) {
                    setSelectedNetwork(newNetworkKey);
                    console.log(`✅ Navbar switched to ${NETWORKS[newNetworkKey].chainName}`);
                } else {
                    console.warn(`⚠️ Unknown network detected: ${chainId}`);
                }
            };

            window.ethereum.on("chainChanged", handleNetworkChange);

            return () => {
                window.ethereum.removeListener("chainChanged", handleNetworkChange);
            };
        }
    }, [setSelectedNetwork]);

    const connectWallet = async () => {
        if (typeof window.ethereum !== "undefined") {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);

                console.log("✅ Wallet connected:", accounts[0]);

                // Get current network and update selectedNetwork
                const network = await provider.getNetwork();
                const chainId = ethers.toBeHex(network.chainId);
                const newNetworkKey = getNetworkKeyByChainId(chainId);
                if (newNetworkKey) {
                    setSelectedNetwork(newNetworkKey);
                }
            } catch (error) {
                console.error("❌ Error connecting wallet:", error);
            }
        } else {
            alert("MetaMask is not installed. Please install it to connect.");
        }
    };

    const switchNetwork = async (networkKey: keyof typeof NETWORKS) => {
        const network = NETWORKS[networkKey];

        try {
            console.log(`🔄 Switching MetaMask to ${network.chainName}...`);

            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: network.chainId }],
            });

            setSelectedNetwork(networkKey); // ✅ Update state AFTER switching

            console.log(`✅ MetaMask switched to ${network.chainName}`);
        } catch (switchError: any) {
            if (switchError.code === 4902) {
                try {
                    console.log(`🔄 Adding network: ${network.chainName}`);

                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [network],
                    });

                    setSelectedNetwork(networkKey);
                    console.log(`✅ Network added and switched to ${network.chainName}`);
                } catch (addError) {
                    console.error(`❌ Failed to add ${network.chainName}:`, addError);
                }
            } else {
                console.error(`❌ Failed to switch to ${network.chainName}:`, switchError);
            }
        }
    };

    return (
        <nav className="fixed left-0 right-0 z-50 flex items-center px-6 py-3 bg-white/0 backdrop-blur-md shadow-md dark:bg-black/50">
            <div className="flex items-center space-x-3">
                <Image src="/logo.png" alt="Logo" width={40} height={40} className="w-10 h-10 rounded-lg" />
                <Link href="/" className={`${syncopate.className} text-[#eab71a] text-center font-bold flex items-center`} style={{ fontSize: "13px" }}>
                    {props.brandText}
                </Link>
            </div>

            <div className="flex items-center space-x-6 ml-auto">
                <Link href="/dashboard/chat/" className="text-[#FDFFFE] hover:text-[#EAB71A] transition">Chat</Link>
                <Link href="/dashboard/production/" className="text-[#FDFFFE] hover:text-[#EAB71A] transition">Production</Link>
                <Link href="/dashboard/help/" className="text-[#FDFFFE] hover:text-[#EAB71A] transition">Help</Link>

                {/* Network Switcher Dropdown */}
                <div className="relative">
                    <select
                        className="bg-black text-white border border-white rounded-md px-3 py-2"
                        value={selectedNetwork}
                        onChange={(e) => switchNetwork(e.target.value as keyof typeof NETWORKS)}
                    >
                        <option value="base-testnet" className="text-[#eab71a]">Base Testnet</option>
                        <option value="base-mainnet" className="text-[#eab71a]">Base Mainnet</option>
                        <option value="arbitrum-sepolia" className="text-[#eab71a]">Arbitrum Sepolia</option>
                    </select>
                </div>

                {walletAddress ? (
                    <div className="flex items-center space-x-2">
                        <span className="text-[#eab71a] font-bold">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                    </div>
                ) : (
                    <Button
                        onClick={connectWallet}
                        className="bg-black text-white font-bold py-2 px-4 rounded-md shadow-md border border-white hover:bg-[#eab71a] hover:text-black transition duration-300"
                    >
                        Connect Wallet
                    </Button>
                )}
            </div>
        </nav>
    );
}
