"use client";
import '@rainbow-me/rainbowkit/styles.css';
import { NextUIProvider } from '@nextui-org/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage, http, fallback} from 'wagmi'
import { useState, useEffect } from 'react'


export const config = getDefaultConfig({
  appName: 'Red-vs-Blue',
  projectId: '71bffa11dcde4c9ad42c56c6c9e29bab',
  chains: [ mainnet ],
  storage: createStorage({
    storage: cookieStorage
  }),
  transports: {
    [mainnet.id]: fallback([ 
      http(), 
      http("https://eth-mainnet.g.alchemy.com/v2/z8CNjlR0rdV3pgc3L3yn8m5r9qW3qT2t"),
      http("https://eth-mainnet.g.alchemy.com/v2/6mzUb6UiWpmAws95cbxBcF5-TXbMKk5U"),
      http("https://mainnet.infura.io/v3/b03d95399d18453d909a80f32e930afb"),
      http()
    ], { rank: false })
  },
});

const client = new QueryClient();

export function Providers({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <RainbowKitProvider>
        <NextUIProvider>
        {mounted && children}
        </NextUIProvider>
        </RainbowKitProvider>
        </QueryClientProvider>
    </WagmiProvider>
  );
}

