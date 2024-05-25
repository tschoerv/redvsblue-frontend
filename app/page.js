"use client";
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import Head from 'next/head';
import { Button, Input, Link } from "@nextui-org/react";
import '@rainbow-me/rainbowkit/styles.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWriteContract, useSwitchChain, useSimulateContract, useAccount, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { ethers } from "ethers";
import { useQueryClient } from '@tanstack/react-query'

import RedVsBlue_ABI from "./ABI/RedVsBlue_ABI.json";
import erc20_ABI from "./ABI/erc20_ABI.json"

export default function Home() {
  const [hasBet, setHasBet] = useState(false);
  const [hasBetTeam, setHasBetTeam] = useState(0);
  const [hasBetAmount, setHasBetAmount] = useState(0);
  const [hasAllowance, setHasAllowance] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalRedBets, setTotalRedBets] = useState(0);
  const [totalBlueBets, setTotalBlueBets] = useState(0);
  const [gameState, setGameState] = useState(0);
  const [betAmount, setBetAmount] = useState("");
  const [winningTeam, setWinningTeam] = useState(0);

  const RedVsBlue_contract_address = process.env.NEXT_PUBLIC_REDVSBLUE_CONTRACT_ADDRESS;
  const btc_contract_address = process.env.NEXT_PUBLIC_BTC_CONTRACT_ADDRESS;

  const queryClient = useQueryClient()

  const { address, isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const desiredNetworkId = 1;

  const handleSwitchChain = () => {
    switchChain({ chainId: desiredNetworkId });
  };

  const { data: readHasAllowance, isSuccess: isSuccessReadHasAllowance, queryKey: allowanceQueryKey } = useReadContract({
    address: btc_contract_address,
    abi: erc20_ABI,
    functionName: 'allowance',
    args: [address, RedVsBlue_contract_address],
  });

  useEffect(() => {
    if (isConnected && isSuccessReadHasAllowance && readHasAllowance !== undefined) {
      setHasAllowance(parseInt(readHasAllowance) > 0);
    }
  }, [readHasAllowance, isSuccessReadHasAllowance, isConnected]);

  const { data: readHasBet, isSuccess: isSuccessReadHasBet, queryKey: hasBetQueryKey } = useReadContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'bets',
    args: [address],
  });

  useEffect(() => {
    if (isConnected && isSuccessReadHasBet && readHasBet !== undefined) {
      setHasBet(parseInt(readHasBet) > 0);

      const scaledAmount = (Number(readHasBet[0]) / 10 ** 8);
      setHasBetAmount(scaledAmount)

      setHasBetTeam(readHasBet[1])
    }
  }, [readHasBet, isSuccessReadHasBet, isConnected]);

  const { data: readTotalRedBets, isSuccess: isSuccessReadTotalRedBets, queryKey: redBetsQueryKey } = useReadContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'totalRedBets'
  });

  useEffect(() => {
    if (isSuccessReadTotalRedBets && readTotalRedBets !== undefined) {
      const scaledBalance = (Number(readTotalRedBets) / 10 ** 8);
      setTotalRedBets(scaledBalance);
    }
  }, [readTotalRedBets, isSuccessReadTotalRedBets, isConnected]);

  const { data: readTotalBlueBets, isSuccess: isSuccessReadTotalBlueBets, queryKey: blueBetsQueryKey } = useReadContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'totalBlueBets'
  });

  useEffect(() => {
    if (isSuccessReadTotalBlueBets && readTotalBlueBets !== undefined) {
      const scaledBalance = (Number(readTotalBlueBets) / 10 ** 8);
      setTotalBlueBets(scaledBalance);
    }
  }, [readTotalBlueBets, isSuccessReadTotalBlueBets, isConnected]);

  const { data: readGameState, isSuccess: isSuccessReadGameState } = useReadContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'gameState'
  });

  useEffect(() => {
    if (isSuccessReadGameState && readGameState !== undefined) {
      setGameState(parseInt(readGameState));
    }
  }, [readGameState, isSuccessReadGameState, isConnected]);

  const { data: readWinningTeam, isSuccess: isSuccessReadWinningTeam } = useReadContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'winningTeam'
  });

  useEffect(() => {
    if (isSuccessReadWinningTeam && readWinningTeam !== undefined) {
      setWinningTeam(parseInt(readWinningTeam));
    }
  }, [readGameState, isSuccessReadGameState, isConnected]);



  const { data: readBalance, isSuccess: isSuccessReadBalance, queryKey: balanceQueryKey } = useReadContract({
    address: btc_contract_address,
    abi: erc20_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  useEffect(() => {
    if (isConnected && isSuccessReadHasAllowance && readHasAllowance !== undefined) {
      const scaledBalance = (Number(readBalance) / 10 ** 8).toFixed(2);
      const formattedBalance = new Intl.NumberFormat().format(scaledBalance);
      setBalance(formattedBalance);
    }
  }, [readBalance, isSuccessReadBalance, isConnected]);


  const { data: simulateApproveBtc } = useSimulateContract({
    address: btc_contract_address,
    abi: erc20_ABI,
    functionName: 'approve',
    args: [RedVsBlue_contract_address, 1000000000000],
    account: address,
  });

  const { writeContract: approveBtc, data: approveBtcHash } = useWriteContract();

  const { isSuccess: approveBtcConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveBtcHash,
    })

  const { data: simulatePlaceBetRed } = useSimulateContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'placeBet',
    args: betAmount ? ["1", ethers.parseUnits(betAmount, 8)] : undefined,
    account: address,
  });

  const { data: simulatePlaceBetBlue } = useSimulateContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'placeBet',
    args: betAmount ? ["2", ethers.parseUnits(betAmount, 8)] : undefined,
    account: address,
  });

  const { writeContract: placeBet, data: placeBetHash } = useWriteContract();

  const { isSuccess: placeBetConfirmed } =
    useWaitForTransactionReceipt({
      hash: placeBetHash,
    })

  const { data: simulateWithdraw } = useSimulateContract({
    address: RedVsBlue_contract_address,
    abi: RedVsBlue_ABI,
    functionName: 'withdraw',
    account: address,
  });

  const { writeContract: withdraw, data: withdrawHash } = useWriteContract();

  const { isSuccess: withdrawConfirmed } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    })

  useEffect(() => {
    queryClient.invalidateQueries({ allowanceQueryKey })
    queryClient.invalidateQueries({ balanceQueryKey })
    queryClient.invalidateQueries({ redBetsQueryKey })
    queryClient.invalidateQueries({ blueBetsQueryKey })
    queryClient.invalidateQueries({ hasBetQueryKey })

  }, [placeBetConfirmed, approveBtcConfirmed, withdrawConfirmed])

  function calculatePayout() {
    if (totalRedBets > 0 && totalBlueBets > 0 && winningTeam > 0 && hasBetAmount > 0) {
      const totalRedBetsNum = Number(totalRedBets);
      const totalBlueBetsNum = Number(totalBlueBets);
      const hasBetAmountNum = Number(hasBetAmount);

      const totalLosingBets = (winningTeam === 1) ? totalBlueBetsNum : totalRedBetsNum;
      const payout = hasBetAmountNum + (hasBetAmountNum * totalLosingBets / ((winningTeam === 1) ? totalRedBetsNum : totalBlueBetsNum));

      return payout.toFixed(2);
    } else {
      return 0;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Claim $btc</title>
      </Head>

      <div className='md:border-4 md:border-bitcoinorange md:rounded-lg md:px-10 md:pb-6 md:pt-6 flex flex-col items-center justify-center'>
      <div className="flex flex-row items-center justify-center mb-4 mt-4">
      <Link href={`https://x.com/btc_on_eth`} isExternal>
        <div className="w-40 h-40 md:w-48 md:h-48 bg-teamRedRed bg-X flex flex-col items-center justify-center text-white text-2xl font-bold relative">
          <div className="flex-grow flex items-center justify-center">Red</div>
          <p className="text-xs md:text-small absolute bottom-2">total bets: {new Intl.NumberFormat().format(totalRedBets.toFixed(0))} $btc</p>
        </div></Link>
        <div className="mx-2 md:mx-8 text-2xl font-bold underline">vs</div>
        <Link href={`https://x.com/BitcoinOnEarth`} isExternal>
        <div className="w-40 h-40 md:w-48 md:h-48 bg-teamBlueBlue flex flex-col items-center justify-center text-white text-2xl font-bold relative">
          <div className="flex-grow flex items-center justify-center">Blue</div>
          <p className="text-xs md:text-small absolute bottom-2">total bets: {new Intl.NumberFormat().format(totalBlueBets.toFixed(0))} $btc</p>
        </div></Link>
      </div>

      <div className="text-center mt-2 mb-4">
        {chain?.id !== desiredNetworkId && isConnected ? (
          <Button variant="solid" color="danger" onClick={handleSwitchChain}>
            Switch to Mainnet
          </Button>
        ) : (
          <ConnectButton chainStatus="none" showBalance={false} />
        )}
      </div>

      <div className="text-center w-80 bg-neutral-300 p-4 rounded-xl mb-4">
        {gameState === 0 && (
          <>
            <p className='text-small'>Bet on the winning team and claim a share of the losing pot proportional to your deposit!</p>
            <div className="w-72">
            <Input
              clearable
              variant="bordered"
              color="warning"
              size="lg"
              type="number"
              placeholder="Enter bet amount"
              min={50}
              max={10000}
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              label={`Balance: ${balance} $btc`}
              className="mb-4 mt-2 w-72"
              isDisabled={hasBet || !isConnected || !hasAllowance}
            />

            {hasBet && (
              <p className="mb-4">
                You&apos;ve already placed a {new Intl.NumberFormat().format(Number(hasBetAmount).toFixed(0))} $btc bet on Team {hasBetTeam == 1 ? 'Red' : 'Blue'}.
              </p>
            )}
            <div className="flex flex-col">
              {!hasAllowance && (
                <Button onClick={() => approveBtc(simulateApproveBtc?.request)} color="warning" auto className="mb-2" isDisabled={!isConnected}>
                  Approve $btc
                </Button>
              )}
              <div className="flex flex-row justify-between">
                <Button size="lg" color="danger" isDisabled={hasBet || !hasAllowance} onClick={() => placeBet(simulatePlaceBetRed?.request)} auto>
                  Bet on Red
                </Button>
                <Button size="lg" color="primary" isDisabled={hasBet || !hasAllowance} onClick={() => placeBet(simulatePlaceBetBlue?.request)} auto>
                  Bet on Blue
                </Button>
              </div>
            </div>
            </div>
          </>
        )}
        {gameState === 1 && (
          <>
            <p className="text-2xl font-bold mb-4">The Game has Ended.</p>
            {isConnected && (hasBet ?
              (winningTeam == hasBetTeam ? <p className='text-green-800'>You&apos;ve won {calculatePayout()} $btc!</p> : <p className='text-red-800'>You bet on the loosing team. Sorry.</p>) :
              (<p>You didn&apos;t bet on the game or have already withdraw</p>))}

            <Button className='mt-4 mb-2' size="lg" color="warning" isDisabled={!hasBet || winningTeam != hasBetTeam} onClick={() => withdraw(simulateWithdraw?.request)}>Withdraw</Button>
          </>
        )}
        {gameState === 2 && (
          <>
            <p className="text-2xl font-bold mb-4">The Game was Defaulted.</p>
            {isConnected && (hasBet ? (
              <p>Claim your {new Intl.NumberFormat().format(hasBetAmount.toFixed(0))} $btc deposit.</p>) :
              (<p>You didn&apos;t bet on the game or have already withdrawn</p>))}
            <Button className='mt-4 mb-2' size="lg" color="warning" isDisabled={!hasBet} onClick={() => withdraw(simulateWithdraw?.request)}>Withdraw</Button>
          </>
        )}
      </div>

      <Link href={`https://www.firsterc20memecoin.com/`} isExternal>
        <Image src="/bitcoin_logo.png" width={100} height={100} alt="bitcoin logo" />
      </Link>

      <div className="flex flex-row bg-bitcoinorange gap-5 p-3 pl-7 pr-7 rounded-xl mt-4">
        <Link href={`https://etherscan.io/address/${RedVsBlue_contract_address}`} isExternal>
          <Image src="/etherscan.png" width={29} height={29} alt="etherscan" />
        </Link>
        <Link href={`https://github.com/tschoerv/redvsblue-frontend`} isExternal>
          <Image src="/github.png" width={30} height={30} alt="github" />
        </Link>
        <Link href={`https://discord.com/invite/7pbcDYqY3a`} isExternal>
          <Image src="/discord.png" width={30} height={30} alt="discord" />
        </Link>
        <Link href={`https://twitter.com/FirstERC20meme`} isExternal>
          <Image src="/twitter.png" width={30} height={30} alt="x" />
        </Link>
      </div>

      <div className="flex flex-row mt-1 mb-4">
        <p>made by&nbsp;</p>
        <Link href={`https://twitter.com/tschoerv`} isExternal>
          tschoerv.eth
        </Link>
        <p>&nbsp;- donations welcome!</p>
      </div>
      </div>
    </main>
  );
}