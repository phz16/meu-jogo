import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Image, TouchableOpacity, Text, StyleSheet, TextInput, Modal, ScrollView, Keyboard } from 'react-native';
import Animated, { Easing, withTiming, useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Local images for the Main Slot
const icons = [
  require('./assets/tigre.png'),
  require('./assets/banana.png'),
  require('./assets/cereja.png'),
  require('./assets/diamante.png'),
];

// Images for the Coin Flip game
const caraImage = require('./assets/CARA.jpg');
const coroaImage = require('./assets/COROA.jpeg');

// Image for QR Code (for 'Milionário do Sonho' achievement)
const qrCodeImage = require('./assets/qrcode.png');

interface CustomAlertModalProps {
  isVisible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const CustomAlertModal = ({ isVisible, title, message, onClose }: CustomAlertModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Tutorial Component
interface TutorialModalProps {
  isVisible: boolean;
  onStartGame: () => void;
}

const TutorialModal = ({ isVisible, onStartGame }: TutorialModalProps) => {
  const mainObjective = "Seu objetivo principal é alcançar um saldo de R$ 1.000.000!";
  const howToPlaySlot = "No Jogo do Tigrinho: Escolha sua aposta e a Odd desejada. Clique em 'GIRAR' para tentar a sorte! Se os 3 símbolos forem iguais, você ganha o valor da aposta multiplicado pela Odd.";
  const howToPlayCoinFlip = "No Cara ou Coroa: Escolha o valor da sua aposta e o lado da moeda (Cara ou Coroa). Clique em 'VIRAR MOEDA' e torça para acertar o lado e ganhar o valor da aposta multiplicado pela Odd!";
  const howToPlayRoulette = "Na Roleta da Sorte: Escolha sua aposta (número, cor, par/ímpar, dúzias). Clique em 'GIRAR ROLETA' e veja onde a bolinha vai parar!";

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Bem-vindo ao O Sonho do Milhão!</Text>
          <ScrollView style={styles.tutorialContent}>
            <Text style={styles.tutorialHeading}>Objetivo Principal:</Text>
            <Text style={styles.tutorialText}>{mainObjective}</Text>
            <Text style={styles.tutorialHeading}>Como Jogar:</Text>
            <Text style={styles.tutorialText}>{howToPlaySlot}</Text>
            <Text style={styles.tutorialText}>{howToPlayCoinFlip}</Text>
            <Text style={styles.tutorialText}>{howToPlayRoulette}</Text>
            <Text style={styles.tutorialText}>Boa sorte!</Text>
          </ScrollView>
          <TouchableOpacity onPress={onStartGame} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Começar a Jogar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Game Over Component
interface GameOverModalProps {
  isVisible: boolean;
  onStartNewGame: () => void;
}

const GameOverModal = ({ isVisible, onStartNewGame }: GameOverModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Game Over!</Text>
          <Text style={styles.modalMessage}>Seu saldo chegou a zero. Tente novamente!</Text>
          <TouchableOpacity onPress={onStartNewGame} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Iniciar Novo Jogo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Winner Modal Component
interface WinnerModalProps {
  isVisible: boolean;
  onStartNewGame: () => void;
  qrCodeImage: any; // Type for image require
}

const WinnerModal = ({ isVisible, onStartNewGame, qrCodeImage }: WinnerModalProps) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Parabéns, Milionário!</Text>
          <Text style={styles.modalMessage}>
            🎉 Você alcançou o sonho de R$ 1.000.000! 🎉
            Muito obrigado por jogar "O Sonho do Milhão"! Sua jornada foi incrível.
            Se você gostou do jogo e quer apoiar o criador, sinta-se à vontade para fazer uma doação escaneando o QR Code abaixo.
            Todo apoio é muito apreciado!
          </Text>
          <Image source={qrCodeImage} style={styles.qrCodeImageModal} />
          <TouchableOpacity onPress={onStartNewGame} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Iniciar Novo Jogo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Developer Mode Modal Component (NEW)
interface DeveloperModalProps {
  isVisible: boolean;
  currentSaldo: number;
  setSaldo: React.Dispatch<React.SetStateAction<number>>;
  onClose: () => void;
  showAlert: (title: string, message: string, onCloseCallback?: () => void) => void;
  checkAchievements: (saldo: number, totalSpins: number, totalWins: number, winsOn10xOdd: number, totalCoinFlips: number, totalCoinWins: number, totalRouletteSpins: number, totalRouletteWins: number, unlockedAchievements: string[]) => void;
  // Pass other game stats needed for checkAchievements
  totalSpins: number;
  totalWins: number;
  winsOn10xOdd: number;
  totalCoinFlips: number;
  totalCoinWins: number;
  totalRouletteSpins: number;
  totalRouletteWins: number;
  unlockedAchievements: string[];
}

const DeveloperModal = ({
  isVisible,
  currentSaldo,
  setSaldo,
  onClose,
  showAlert,
  checkAchievements,
  totalSpins,
  totalWins,
  winsOn10xOdd,
  totalCoinFlips,
  totalCoinWins,
  totalRouletteSpins,
  totalRouletteWins,
  unlockedAchievements,
}: DeveloperModalProps) => {
  const [newSaldoInput, setNewSaldoInput] = useState(currentSaldo.toString());

  useEffect(() => {
    setNewSaldoInput(currentSaldo.toFixed(2)); // Update input when currentSaldo changes
  }, [currentSaldo]);

  const handleApplySaldo = () => {
    const parsedSaldo = parseFloat(newSaldoInput);
    if (isNaN(parsedSaldo) || parsedSaldo < 0) {
      showAlert('Erro', 'Por favor, insira um valor de saldo válido e positivo.');
      return;
    }
    setSaldo(parsedSaldo);
    showAlert('Sucesso', `Saldo alterado para R$${parsedSaldo.toFixed(2)}!`);

    // Re-check achievements after manual saldo change
    checkAchievements(
      parsedSaldo,
      totalSpins,
      totalWins,
      winsOn10xOdd,
      totalCoinFlips,
      totalCoinWins,
      totalRouletteSpins,
      totalRouletteWins,
      unlockedAchievements
    );
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Modo Desenvolvedor</Text>
          <Text style={styles.modalMessage}>Ajustar Saldo:</Text>
          <TextInput
            style={styles.input}
            value={newSaldoInput}
            onChangeText={setNewSaldoInput}
            keyboardType="numeric"
            placeholder="Novo Saldo"
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={handleApplySaldo} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Aplicar Saldo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[styles.modalButton, { marginTop: 10, backgroundColor: '#6c757d' }]}>
            <Text style={styles.modalButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


// Achievement Definitions
interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'slot' | 'coinFlip' | 'roulette' | 'general';
  reward: number;
  check: (gameState: { saldo: number; totalSpins: number; totalWins: number; winsOn10xOdd: number; totalCoinFlips: number; totalCoinWins: number; totalRouletteSpins: number; totalRouletteWins: number; }) => boolean;
}

const allAchievements: Achievement[] = [
  {
    id: 'first_win_slot',
    name: 'Primeira Vitória (Slot)!',
    description: 'Ganhe sua primeira rodada no Slot do Milhão.',
    type: 'slot',
    reward: 50,
    check: (gameState) => gameState.totalWins >= 1,
  },
  {
    id: 'rich_tycoon_500',
    name: 'Magnata Novato',
    description: 'Alcance R$ 500 de saldo.',
    type: 'general',
    reward: 100,
    check: (gameState) => gameState.saldo >= 500,
  },
  {
    id: 'spin_master_50',
    name: 'Mestre dos Giros (50)',
    description: 'Realize 50 giros no Slot.',
    type: 'slot',
    reward: 120,
    check: (gameState) => gameState.totalSpins >= 50,
  },
  {
    id: 'high_roller_win',
    name: 'Vitória de Alto Risco',
    description: 'Ganhe uma rodada com a Odd 10.0x no Slot.',
    type: 'slot',
    reward: 1000,
    check: (gameState) => gameState.winsOn10xOdd >= 1,
  },
  {
    id: 'five_wins_slot',
    name: 'Cinco Vitórias (Slot)!',
    description: 'Ganhe 5 rodadas no Slot no total.',
    type: 'slot',
    reward: 250,
    check: (gameState) => gameState.totalWins >= 5,
  },
  {
    id: 'rich_tycoon_1000',
    name: 'Magnata Experiente',
    description: 'Alcance R$ 1000 de saldo.',
    type: 'general',
    reward: 400,
    check: (gameState) => gameState.saldo >= 1000,
  },
  {
    id: 'spin_master_100',
    name: 'Mestre dos Giros (100)',
    description: 'Realize 100 giros no Slot.',
    type: 'slot',
    reward: 450,
    check: (gameState) => gameState.totalSpins >= 100,
  },
  {
    id: 'spin_master_250',
    name: 'Mestre dos Giros (250)',
    description: 'Realize 250 giros no Slot.',
    type: 'slot',
    reward: 600,
    check: (gameState) => gameState.totalSpins >= 250,
  },
  {
    id: 'rich_tycoon_5000',
    name: 'Magnata Consolidado',
    description: 'Alcance R$ 5.000 de saldo.',
    type: 'general',
    reward: 1000,
    check: (gameState) => gameState.saldo >= 5000,
  },
  {
    id: 'ten_wins_slot',
    name: 'Dez Vitórias (Slot)!',
    description: 'Ganhe 10 rodadas no Slot no total.',
    type: 'slot',
    reward: 500,
    check: (gameState) => gameState.totalWins >= 10,
  },
  {
    id: 'high_roller_triple',
    name: 'Triplo Alto Risco',
    description: 'Ganhe 3 rodadas com a Odd 10.0x no Slot.',
    type: 'slot',
    reward: 3000,
    check: (gameState) => gameState.winsOn10xOdd >= 3,
  },
  {
    id: 'spin_master_500',
    name: 'Mestre dos Giros (500)',
    description: 'Realize 500 giros no Slot.',
    type: 'slot',
    reward: 1000,
    check: (gameState) => gameState.totalSpins >= 500,
  },
  {
    id: 'million_saldo',
    name: 'Milionário do Sonho!',
    description: 'Alcance R$ 1.000.000 de saldo.',
    type: 'general',
    reward: 0,
    check: (gameState) => gameState.saldo >= 1000000,
  },
  {
    id: 'first_coin_flip_win',
    name: 'Primeira Vitória (Moeda)!',
    description: 'Ganhe sua primeira aposta em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 50,
    check: (gameState) => gameState.totalCoinWins >= 1,
  },
  {
    id: 'coin_flip_master_10',
    name: 'Mestre da Moeda (10)',
    description: 'Realize 10 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 100,
    check: (gameState) => gameState.totalCoinFlips >= 10,
  },
  {
    id: 'coin_flip_master_25',
    name: 'Mestre da Moeda (25)',
    description: 'Realize 25 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 150,
    check: (gameState) => gameState.totalCoinFlips >= 25,
  },
  {
    id: 'coin_flip_wins_5',
    name: 'Cinco Vitórias (Moeda)!',
    description: 'Ganhe 5 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 200,
    check: (gameState) => gameState.totalCoinWins >= 5,
  },
  {
    id: 'coin_flip_master_50',
    name: 'Mestre da Moeda (50)',
    description: 'Realize 50 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 300,
    check: (gameState) => gameState.totalCoinFlips >= 50,
  },
  {
    id: 'coin_flip_wins_10',
    name: 'Dez Vitórias (Moeda)!',
    description: 'Ganhe 10 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 400,
    check: (gameState) => gameState.totalCoinWins >= 10,
  },
  {
    id: 'coin_flip_guru_pro',
    name: 'Guru da Moeda',
    description: 'Realize 100 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 600,
    check: (gameState) => gameState.totalCoinFlips >= 100,
  },
  {
    id: 'rich_tycoon_10000',
    name: 'Magnata de Elite',
    description: 'Alcance R$ 10.000 de saldo.',
    type: 'general',
    reward: 2000,
    check: (gameState) => gameState.saldo >= 10000,
  },
  {
    id: 'spin_master_750',
    name: 'Mestre dos Giros (750)',
    description: 'Realize 750 giros no Slot.',
    type: 'slot',
    reward: 1500,
    check: (gameState) => gameState.totalSpins >= 750,
  },
  {
    id: 'coin_flip_wins_20',
    name: 'Vinte Vitórias (Moeda)!',
    description: 'Ganhe 20 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 500,
    check: (gameState) => gameState.totalCoinWins >= 20,
  },
  {
    id: 'coin_flip_master_200',
    name: 'Mestre da Moeda (200)',
    description: 'Realize 200 apostas em Cara ou Coroa.',
    type: 'coinFlip',
    reward: 800,
    check: (gameState) => gameState.totalCoinFlips >= 200,
  },
  {
    id: 'rich_tycoon_50000',
    name: 'Lenda Financeira',
    description: 'Alcance R$ 50.000 de saldo.',
    type: 'general',
    reward: 10000,
    check: (gameState) => gameState.saldo >= 50000,
  },
  {
    id: 'first_roulette_win',
    name: 'Primeira Vitória (Roleta)!',
    description: 'Ganhe sua primeira rodada na Roleta da Sorte.',
    type: 'roulette',
    reward: 60,
    check: (gameState) => gameState.totalRouletteWins >= 1,
  },
  {
    id: 'roulette_master_20',
    name: 'Mestre da Roleta (20)',
    description: 'Realize 20 giros na Roleta da Sorte.',
    type: 'roulette',
    reward: 140,
    check: (gameState) => gameState.totalRouletteSpins >= 20,
  },
  {
    id: 'roulette_wins_5',
    name: 'Cinco Vitórias (Roleta)!',
    description: 'Ganhe 5 rodadas na Roleta da Sorte no total.',
    type: 'roulette',
    reward: 300,
    check: (gameState) => gameState.totalRouletteWins >= 5,
  },
  {
    id: 'roulette_master_50',
    name: 'Mestre da Roleta (50)',
    description: 'Realize 50 giros na Roleta da Sorte.',
    type: 'roulette',
    reward: 500,
    check: (gameState) => gameState.totalRouletteSpins >= 50,
  },
];


// NEW COMPONENT: Coin Flip
interface CoinFlipGameProps {
  saldo: number;
  setSaldo: React.Dispatch<React.SetStateAction<number>>;
  onBackToGameSelection: () => void;
  // Props for achievement update
  totalSpins: number;
  setTotalSpins: React.Dispatch<React.SetStateAction<number>>;
  totalWins: number;
  setTotalWins: React.Dispatch<React.SetStateAction<number>>;
  winsOn10xOdd: number;
  setWinsOn10xOdd: React.Dispatch<React.SetStateAction<number>>;
  unlockedAchievements: string[];
  setUnlockedAchievements: React.Dispatch<React.SetStateAction<string[]>>;
  checkAchievements: (saldo: number, totalSpins: number, totalWins: number, winsOn10xOdd: number, totalCoinFlips: number, totalCoinWins: number, totalRouletteSpins: number, totalRouletteWins: number, unlockedAchievements: string[]) => void;
  totalCoinFlips: number;
  setTotalCoinFlips: React.Dispatch<React.SetStateAction<number>>;
  totalCoinWins: number;
  setTotalCoinWins: React.Dispatch<React.SetStateAction<number>>;
  showAlert: (title: string, message: string, onCloseCallback?: () => void) => void;
  coinFlipWinProbabilityBoost: number;
  maxCoinFlipBet: number;
  totalRouletteSpins: number;
  totalRouletteWins: number;
  setShowGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentGameMode: React.Dispatch<React.SetStateAction<'menu' | 'slotGame' | 'coinFlip' | 'rouletteGame' | 'achievements' | 'shop' | null>>;
}

const CoinFlipGame = ({
  saldo, setSaldo, onBackToGameSelection,
  totalSpins, setTotalSpins, totalWins, setTotalWins, winsOn10xOdd, setWinsOn10xOdd,
  unlockedAchievements, setUnlockedAchievements, checkAchievements,
  totalCoinFlips, setTotalCoinFlips, totalCoinWins, setTotalCoinWins,
  showAlert,
  coinFlipWinProbabilityBoost,
  maxCoinFlipBet,
  totalRouletteSpins,
  totalRouletteWins,
  setShowGameOver,
  setCurrentGameMode
}: CoinFlipGameProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedSide, setSelectedSide] = useState<'cara' | 'coroa' | null>(null);
  const [flipResult, setFlipResult] = useState<'cara' | 'coroa' | null>(null);
  const [message, setMessage] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [currentOdd, setCurrentOdd] = useState(1.1);

  const [displayCoinImage, setDisplayCoinImage] = useState(caraImage);
  const flipIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const flipSound = useRef<Audio.Sound | null>(null);
  const winSoundCoinFlip = useRef<Audio.Sound | null>(null);
  const loseSoundCoinFlip = useRef<Audio.Sound | null>(null);


  const oddOptions = [1.1, 1.5, 2.0];

  // Load coin flip, win and lose sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        console.log('CoinFlipGame: Trying to load coin.mp3');
        const { sound: loadedFlipSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/coin.mp3'),
          { shouldPlay: false, volume: 0.7 }
        );
        flipSound.current = loadedFlipSound;
        console.log('CoinFlipGame: Flip sound loaded.');

        console.log('CoinFlipGame: Trying to load win.mp3');
        const { sound: loadedWinSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/win.mp3'),
          { shouldPlay: false, volume: 0.8 }
        );
        winSoundCoinFlip.current = loadedWinSound;
        console.log('CoinFlipGame: Win sound loaded.');

        console.log('CoinFlipGame: Trying to load lose.mp3');
        const { sound: loadedLoseSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/lose.mp3'),
          { shouldPlay: false, volume: 0.7 }
        );
        loseSoundCoinFlip.current = loadedLoseSound;
        console.log('CoinFlipGame: Lose sound loaded.');

      } catch (error) {
        console.log('CoinFlipGame: Error loading coin or win/lose sound:', error);
      }
    };

    loadSounds();

    return () => {
      console.log('CoinFlipGame: Unloading sounds.');
      flipSound.current?.unloadAsync();
      winSoundCoinFlip.current?.unloadAsync();
      loseSoundCoinFlip.current?.unloadAsync();
    };
  }, []);

  // Effect to update the displayed image when the state changes (not flipping)
  useEffect(() => {
    if (!isFlipping) {
      if (flipResult) {
        setDisplayCoinImage(flipResult === 'cara' ? caraImage : coroaImage);
      } else if (selectedSide) {
        setDisplayCoinImage(selectedSide === 'cara' ? caraImage : coroaImage);
      } else {
        // Default when nothing is selected or result is cleared
        setDisplayCoinImage(caraImage);
      }
    }
  }, [isFlipping, flipResult, selectedSide]);

  const handleApostaCoinFlipChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setBetAmount(Math.min(numValue, saldo, maxCoinFlipBet));
    }
  };

  const handleFlip = async () => {
    if (isFlipping) return;
    // Validate bet based on balance and max bet
    if (betAmount <= 0 || betAmount > saldo || betAmount > maxCoinFlipBet) {
      showAlert('Aposta Inválida', `A aposta deve ser entre R$1 e R$${Math.min(saldo, maxCoinFlipBet).toFixed(2)}.`);
      return;
    }
    if (!selectedSide) {
      showAlert('Selecione um Lado', 'Por favor, selecione Cara ou Coroa!');
      return;
    }
    if (currentOdd < 1.1 || currentOdd > 10.0) {
      showAlert('Odd Inválida', 'A Odd deve estar entre 1.1x e 10.0x.');
      return;
    }

    setIsFlipping(true);
    const newSaldoAfterBet = saldo - betAmount;
    setSaldo(newSaldoAfterBet);
    setTotalCoinFlips(prev => prev + 1);

    setMessage('Virando a moeda...');
    setFlipResult(null);

    // Play coin flip sound
    try {
      if (flipSound.current) {
        await flipSound.current.stopAsync();
        await flipSound.current.setPositionAsync(0);
        await flipSound.current.playAsync();
        console.log('CoinFlipGame: Flip sound played.');
      }
    } catch (error) {
      console.log('CoinFlipGame: Error playing coin sound:', error);
    }

    // Start rapid image swapping
    flipIntervalRef.current = setInterval(() => {
      setDisplayCoinImage(Math.random() < 0.5 ? caraImage : coroaImage);
    }, 100);

    // Set a timeout to stop the animation and reveal the result
    setTimeout(() => {
      clearInterval(flipIntervalRef.current as NodeJS.Timeout);
      setIsFlipping(false);
      const result = Math.random() < 0.5 ? 'cara' : 'coroa'; // Determine the final result (50% chance)
      runOnJS(checkResult)(result, newSaldoAfterBet);
    }, 2000);
  };

  const checkResult = async (randomResult: 'cara' | 'coroa', saldoAfterBet: number) => {
    let winAmount = 0;
    let won = false;
    let newCalculatedTotalCoinWins = totalCoinWins;
    let finalSaldo = saldoAfterBet;

    // Base win probabilities for Coin Flip
    let targetWinProbability: number;
    switch (currentOdd) {
      case 1.1:
        targetWinProbability = 0.70;
        break;
      case 1.5:
        targetWinProbability = 0.60;
        break;
      case 2.0:
        targetWinProbability = 0.50;
        break;
      default:
        targetWinProbability = 0.50;
    }

    // Apply probability boost from the shop, ensuring it doesn't exceed 100%
    const adjustedWinProbability = Math.min(1.0, targetWinProbability + coinFlipWinProbabilityBoost);
    console.log(`CoinFlipGame: Adjusted win probability for Coin Flip: ${adjustedWinProbability.toFixed(4)}`);

    const shouldWin = Math.random() <= adjustedWinProbability;

    if (shouldWin) {
      won = true;
      winAmount = betAmount * currentOdd;
      finalSaldo = saldoAfterBet + winAmount;
      newCalculatedTotalCoinWins = totalCoinWins + 1;
      setFlipResult(selectedSide); // Set result to the selected side on win
    } else {
      // If lost, ensure the displayed result is the opposite of what was selected
      setFlipResult(selectedSide === 'cara' ? 'coroa' : 'cara');
    }

    setSaldo(finalSaldo);

    setTimeout(async () => {
      if (won) {
        showAlert('Parabéns!', `🎉 Você ganhou R$${winAmount.toFixed(2)}!`);
        try {
          if (winSoundCoinFlip.current) {
            await winSoundCoinFlip.current.stopAsync();
            await winSoundCoinFlip.current.setPositionAsync(0);
            await winSoundCoinFlip.current.playAsync();
            console.log('CoinFlipGame: Win sound played.');
          }
        } catch (error) {
          console.log('CoinFlipGame: Error playing win sound (Coin Flip):', error);
        }
      } else {
        showAlert('Que pena!', 'Você perdeu.', () => {
          if (finalSaldo <= 0) {
            setShowGameOver(true);
            setCurrentGameMode(null);
          }
        });
        try {
          if (loseSoundCoinFlip.current) {
            await loseSoundCoinFlip.current.stopAsync();
            await loseSoundCoinFlip.current.setPositionAsync(0);
            await loseSoundCoinFlip.current.playAsync();
            console.log('CoinFlipGame: Lose sound played.');
          }
        } catch (error) {
          console.log('CoinFlipGame: Error playing lose sound (Coin Flip):', error);
        }
      }

      checkAchievements(
        finalSaldo,
        totalSpins,
        totalWins,
        winsOn10xOdd,
        totalCoinFlips + 1,
        newCalculatedTotalCoinWins,
        totalRouletteSpins,
        totalRouletteWins,
        unlockedAchievements
      );
    }, 100);
  };

  return (
    <View style={styles.coinFlipContainer}>
      <Text style={styles.title}>Cara ou Coroa</Text>
      <Text style={styles.saldoText}>Saldo: R${saldo.toFixed(2)}</Text>

      <View style={styles.coinFlipControls}>
        <Text style={styles.label}>Aposta:</Text>
        <TextInput
          style={styles.input}
          value={betAmount.toString()}
          onChangeText={handleApostaCoinFlipChange}
          keyboardType="numeric"
          placeholder={`Máx: R$${Math.min(saldo, maxCoinFlipBet).toFixed(2)}`}
          placeholderTextColor="#888"
        />
        <Text style={styles.label}>Selecione a Odd:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oddOptionsScroll}>
          {oddOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.oddButton,
                currentOdd === option && styles.selectedOddButton,
              ]}
              onPress={() => setCurrentOdd(option)}
            >
              <Text style={[
                styles.oddButtonText,
                currentOdd === option && styles.selectedOddButtonText,
              ]}>
                {option.toFixed(1)}x
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.sideSelection}>
        <TouchableOpacity
          style={[styles.sideButton, selectedSide === 'cara' && styles.selectedSideButton]}
          onPress={() => setSelectedSide('cara')}
          disabled={isFlipping}
        >
          <Image source={caraImage} style={styles.coinSideImage} />
          <Text style={styles.sideButtonText}>CARA</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sideButton, selectedSide === 'coroa' && styles.selectedSideButton]}
          onPress={() => setSelectedSide('coroa')}
          disabled={isFlipping}
        >
          <Image source={coroaImage} style={styles.coinSideImage} />
          <Text style={styles.sideButtonText}>COROA</Text>
        </TouchableOpacity>
      </View>

      <Image source={displayCoinImage} style={styles.coinImage} />

      <TouchableOpacity onPress={handleFlip} style={styles.button} disabled={isFlipping}>
        <Text style={styles.buttonText}>{isFlipping ? 'VIRANDO...' : 'VIRAR MOEDA'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBackToGameSelection} style={[styles.button, styles.backToMainMenuButton]}>
        <Text style={styles.buttonText}>Voltar ao Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

// NEW COMPONENT: Roulette Game
interface RouletteGameProps {
  saldo: number;
  setSaldo: React.Dispatch<React.SetStateAction<number>>;
  onBackToGameSelection: () => void;
  showAlert: (title: string, message: string, onCloseCallback?: () => void) => void;
  totalSpins: number;
  setTotalSpins: React.Dispatch<React.SetStateAction<number>>;
  totalWins: number;
  setTotalWins: React.Dispatch<React.SetStateAction<number>>;
  winsOn10xOdd: number;
  setWinsOn10xOdd: React.Dispatch<React.SetStateAction<number>>;
  totalCoinFlips: number;
  setTotalCoinFlips: React.Dispatch<React.SetStateAction<number>>;
  totalCoinWins: number;
  setTotalCoinWins: React.Dispatch<React.SetStateAction<number>>;
  totalRouletteSpins: number;
  setTotalRouletteSpins: React.Dispatch<React.SetStateAction<number>>;
  totalRouletteWins: number;
  setTotalRouletteWins: React.Dispatch<React.SetStateAction<number>>;
  unlockedAchievements: string[];
  setUnlockedAchievements: React.Dispatch<React.SetStateAction<string[]>>;
  checkAchievements: (saldo: number, totalSpins: number, totalWins: number, winsOn10xOdd: number, totalCoinFlips: number, totalCoinWins: number, totalRouletteSpins: number, totalRouletteWins: number, unlockedAchievements: string[]) => void;
  maxRouletteBet: number;
  rouletteWinProbabilityBoost: number;
  setShowGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentGameMode: React.Dispatch<React.SetStateAction<'menu' | 'slotGame' | 'coinFlip' | 'rouletteGame' | 'achievements' | 'shop' | null>>;
}

const RouletteGame = ({
  saldo, setSaldo, onBackToGameSelection, showAlert,
  totalSpins, setTotalSpins, totalWins, setTotalWins, winsOn10xOdd, setWinsOn10xOdd,
  totalCoinFlips, setTotalCoinFlips, totalCoinWins, setTotalCoinWins,
  totalRouletteSpins, setTotalRouletteSpins, totalRouletteWins, setTotalRouletteWins,
  unlockedAchievements, setUnlockedAchievements, checkAchievements,
  maxRouletteBet, rouletteWinProbabilityBoost,
  setShowGameOver,
  setCurrentGameMode
}: RouletteGameProps) => {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBetType, setSelectedBetType] = useState<string | null>(null);
  const [selectedBetValue, setSelectedBetValue] = useState<string | number | null>(null);
  const [rouletteResult, setRouletteResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const rouletteSpinSound = useRef<Audio.Sound | null>(null);
  const rouletteWinSound = useRef<Audio.Sound | null>(null);
  const rouletteLoseSound = useRef<Audio.Sound | null>(null);

  // Define numbers by color for easy checking (0 to 35)
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: spinSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/roleta.mp3'),
          { shouldPlay: false, volume: 0.7 }
        );
        rouletteSpinSound.current = spinSound;

        const { sound: winSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/win.mp3'),
          { shouldPlay: false, volume: 0.8 }
        );
        rouletteWinSound.current = winSound;

        const { sound: loseSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/lose.mp3'),
          { shouldPlay: false, volume: 0.7 }
        );
        rouletteLoseSound.current = loseSound;
      } catch (error) {
        console.log('Error loading roulette sounds:', error);
      }
    };

    loadSounds();

    return () => {
      rouletteSpinSound.current?.unloadAsync();
      rouletteWinSound.current?.unloadAsync();
      rouletteLoseSound.current?.unloadAsync();
    };
  }, []);

  const handleBetAmountChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setBetAmount(Math.min(numValue, saldo, maxRouletteBet));
    }
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    if (redNumbers.includes(num)) return 'red';
    if (blackNumbers.includes(num)) return 'black';
    return 'gray';
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    if (betAmount <= 0 || betAmount > saldo || betAmount > maxRouletteBet) {
      showAlert('Aposta Inválida', `A aposta deve ser entre R$1 e R$${Math.min(saldo, maxRouletteBet).toFixed(2)}.`);
      return;
    }
    if (!selectedBetType || selectedBetValue === null) {
      showAlert('Selecione uma Aposta', 'Por favor, selecione o tipo e valor da sua aposta.');
      return;
    }

    setIsSpinning(true);
    const newSaldoAfterBet = saldo - betAmount;
    setSaldo(newSaldoAfterBet);
    setTotalRouletteSpins(prev => prev + 1);

    setRouletteResult(null);

    try {
      if (rouletteSpinSound.current) {
        await rouletteSpinSound.current.stopAsync();
        await rouletteSpinSound.current.setPositionAsync(0);
        await rouletteSpinSound.current.playAsync();
      }
    } catch (error) {
      console.log('Error playing roulette spin sound:', error);
    }

    setTimeout(() => {
      const resultNumber = Math.floor(Math.random() * 36);
      runOnJS(checkRouletteResult)(resultNumber, newSaldoAfterBet);
    }, 3000);
  };

  const checkRouletteResult = async (resultNumber: number, saldoAfterBet: number) => {
    setRouletteResult(resultNumber);
    setIsSpinning(false);

    let won = false;
    let winAmount = 0;
    let finalSaldo = saldoAfterBet;
    let payoutMultiplier = 0;

    let baseWinProbability = 0;
    switch (selectedBetType) {
      case 'number':
        baseWinProbability = 0.005;
        payoutMultiplier = 35;
        break;
      case 'color':
        baseWinProbability = 17 / 36;
        payoutMultiplier = 2;
        break;
      case 'parity':
        baseWinProbability = 17 / 36;
        payoutMultiplier = 2;
        break;
      case 'dozen':
        baseWinProbability = 12 / 36;
        payoutMultiplier = 1.5;
        break;
      case 'green_color':
        baseWinProbability = 0.01;
        payoutMultiplier = 20;
        break;
      default:
        baseWinProbability = 0;
    }

    const adjustedWinProbability = Math.min(1.0, baseWinProbability + rouletteWinProbabilityBoost);
    console.log(`RouletteGame: Adjusted win probability: ${adjustedWinProbability.toFixed(4)}`);

    const shouldWin = Math.random() <= adjustedWinProbability;

    if (shouldWin) {
      if (selectedBetType === 'number' && typeof selectedBetValue === 'number') {
        setRouletteResult(selectedBetValue);
      } else if (selectedBetType === 'color' && typeof selectedBetValue === 'string') {
        const targetColor = selectedBetValue;
        const possibleNumbers = targetColor === 'red' ? redNumbers : blackNumbers;
        setRouletteResult(possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)]);
      } else if (selectedBetType === 'parity' && typeof selectedBetValue === 'string') {
        const targetParity = selectedBetValue;
        const possibleNumbers = Array.from({ length: 36 }, (_, i) => i).filter(num => num !== 0 && (targetParity === 'odd' ? num % 2 !== 0 : num % 2 === 0));
        setRouletteResult(possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)]);
      } else if (selectedBetType === 'dozen' && typeof selectedBetValue === 'string') {
        const targetDozen = selectedBetValue;
        let possibleNumbers: number[] = [];
        if (targetDozen === '1-12') possibleNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
        else if (targetDozen === '13-24') possibleNumbers = Array.from({ length: 12 }, (_, i) => i + 13);
        else if (targetDozen === '25-35') possibleNumbers = Array.from({ length: 11 }, (_, i) => i + 25);
        setRouletteResult(possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)]);
      } else if (selectedBetType === 'green_color') {
        setRouletteResult(0);
      } else {
        setRouletteResult(Math.floor(Math.random() * 36));
      }

      won = true;
      winAmount = betAmount * payoutMultiplier;
      finalSaldo = saldoAfterBet + winAmount;
      setTotalRouletteWins(prev => prev + 1);
    } else {
      let losingResult: number;
      do {
        losingResult = Math.floor(Math.random() * 36);
      } while (checkWinCondition(losingResult, selectedBetType, selectedBetValue));

      setRouletteResult(losingResult);
    }

    setSaldo(finalSaldo);

    setTimeout(async () => {
      if (won) {
        showAlert('Parabéns!', `🎉 Você ganhou R$${winAmount.toFixed(2)}!`);
        try {
          if (rouletteWinSound.current) {
            await rouletteWinSound.current.stopAsync();
            await rouletteWinSound.current.setPositionAsync(0);
            await rouletteWinSound.current.playAsync();
          }
        } catch (error) {
          console.log('Error playing win sound (Roulette):', error);
        }
      } else {
        showAlert('Que pena!', 'Você perdeu.', () => {
          if (finalSaldo <= 0) {
            setShowGameOver(true);
            setCurrentGameMode(null);
          }
        });
        try {
          if (rouletteLoseSound.current) {
            await rouletteLoseSound.current.stopAsync();
            await rouletteLoseSound.current.setPositionAsync(0);
            await rouletteLoseSound.current.playAsync();
          }
        } catch (error) {
          console.log('Error playing lose sound (Roulette):', error);
        }
      }

      checkAchievements(
        finalSaldo,
        totalSpins,
        totalWins,
        winsOn10xOdd,
        totalCoinFlips,
        totalCoinWins,
        totalRouletteSpins + 1,
        won ? totalRouletteWins + 1 : totalRouletteWins,
        unlockedAchievements
      );
    }, 100);
  };

  const checkWinCondition = (result: number, type: string | null, value: string | number | null): boolean => {
    if (type === 'number' && typeof value === 'number') {
      return result === value;
    }
    if (type === 'color' && typeof value === 'string') {
      if (value === 'red') return redNumbers.includes(result);
      if (value === 'black') return blackNumbers.includes(result);
    }
    if (type === 'parity' && typeof value === 'string') {
      if (result === 0) return false;
      if (value === 'odd') return result % 2 !== 0;
      if (value === 'even') return result % 2 === 0;
    }
    if (type === 'dozen' && typeof value === 'string') {
      if (value === '1-12') return result >= 1 && result <= 12;
      if (value === '13-24') return result >= 13 && result <= 24;
      if (value === '25-35') return result >= 25 && result <= 35;
    }
    if (type === 'green_color' && value === 'green') {
      return result === 0;
    }
    return false;
  };

  const renderNumberButtons = () => {
    const numbers = Array.from({ length: 36 }, (_, i) => i);
    return (
      <View style={styles.numberGrid}>
        {numbers.map(num => (
          <TouchableOpacity
            key={num}
            style={[
              styles.numberButton,
              selectedBetType === 'number' && selectedBetValue === num && styles.selectedNumberButton,
              { backgroundColor: getNumberColor(num) === 'red' ? '#dc3545' : getNumberColor(num) === 'black' ? '#343a40' : getNumberColor(num) === 'green' ? '#28a745' : '#6c757d' }
            ]}
            onPress={() => { setSelectedBetType('number'); setSelectedBetValue(num); }}
            disabled={isSpinning}
          >
            <Text style={styles.numberButtonText}>{num}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.rouletteContainer}>
      <Text style={styles.title}>Roleta da Sorte</Text>
      <Text style={styles.saldoText}>Saldo: R${saldo.toFixed(2)}</Text>

      <View style={styles.rouletteControls}>
        <Text style={styles.label}>Aposta:</Text>
        <TextInput
          style={styles.input}
          value={betAmount.toString()}
          onChangeText={handleBetAmountChange}
          keyboardType="numeric"
          placeholder={`Máx: R$${maxRouletteBet.toFixed(2)}`}
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Selecione sua Aposta:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.betTypeScroll}>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'color' && selectedBetValue === 'red' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('color'); setSelectedBetValue('red'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>Vermelho</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'color' && selectedBetValue === 'black' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('color'); setSelectedBetValue('black'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>Preto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'green_color' && selectedBetValue === 'green' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('green_color'); setSelectedBetValue('green'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>Verde (20x)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'parity' && selectedBetValue === 'odd' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('parity'); setSelectedBetValue('odd'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>Ímpar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'parity' && selectedBetValue === 'even' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('parity'); setSelectedBetValue('even'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>Par</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'dozen' && selectedBetValue === '1-12' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('dozen'); setSelectedBetValue('1-12'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>1-12</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'dozen' && selectedBetValue === '13-24' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('dozen'); setSelectedBetValue('13-24'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>13-24</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.betTypeButton, selectedBetType === 'dozen' && selectedBetValue === '25-35' && styles.selectedBetTypeButton]}
            onPress={() => { setSelectedBetType('dozen'); setSelectedBetValue('25-35'); }}
            disabled={isSpinning}
          >
            <Text style={styles.betTypeButtonText}>25-35</Text>
          </TouchableOpacity>
        </ScrollView>
        <Text style={styles.label}>Ou escolha um número:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.numberScroll}>
          {renderNumberButtons()}
        </ScrollView>
      </View>

      <Text style={styles.rouletteResultText}>
        {isSpinning ? 'Girando...' : rouletteResult !== null ? `Resultado: ${rouletteResult} (${getNumberColor(rouletteResult).toUpperCase()})` : 'Aguardando giro...'}
      </Text>

      <TouchableOpacity onPress={handleSpin} style={styles.button} disabled={isSpinning}>
        <Text style={styles.buttonText}>{isSpinning ? 'GIRANDO...' : 'GIRAR ROLETA'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBackToGameSelection} style={[styles.button, styles.backToMainMenuButton]}>
        <Text style={styles.buttonText}>Voltar ao Menu</Text>
      </TouchableOpacity>
    </View>
  );
};


// NEW COMPONENT: Shop
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  effect: (
    setSaldo: React.Dispatch<React.SetStateAction<number>>,
    setMaxSlotBet: React.Dispatch<React.SetStateAction<number>>,
    setMaxCoinFlipBet: React.Dispatch<React.SetStateAction<number>>,
    setMaxRouletteBet: React.Dispatch<React.SetStateAction<number>>,
    setSlotWinProbabilityBoost: React.Dispatch<React.SetStateAction<number>>,
    setCoinFlipWinProbabilityBoost: React.Dispatch<React.SetStateAction<number>>,
    setRouletteWinProbabilityBoost: React.Dispatch<React.SetStateAction<number>>,
    showAlert: (title: string, message: string, onCloseCallback?: () => void) => void
  ) => void;
  isPurchased: boolean;
}

interface ShopGameProps {
  saldo: number;
  setSaldo: React.Dispatch<React.SetStateAction<number>>;
  onBackToGameSelection: () => void;
  showAlert: (title: string, message: string, onCloseCallback?: () => void) => void;
  maxSlotBet: number;
  setMaxSlotBet: React.Dispatch<React.SetStateAction<number>>;
  maxCoinFlipBet: number;
  setMaxCoinFlipBet: React.Dispatch<React.SetStateAction<number>>;
  maxRouletteBet: number;
  setMaxRouletteBet: React.Dispatch<React.SetStateAction<number>>;
  slotWinProbabilityBoost: number;
  setSlotWinProbabilityBoost: React.Dispatch<React.SetStateAction<number>>;
  coinFlipWinProbabilityBoost: number;
  setCoinFlipWinProbabilityBoost: React.Dispatch<React.SetStateAction<number>>;
  rouletteWinProbabilityBoost: number;
  setRouletteWinProbabilityBoost: React.Dispatch<React.SetStateAction<number>>;
}

const ShopGame = ({
  saldo, setSaldo, onBackToGameSelection, showAlert,
  maxSlotBet, setMaxSlotBet, maxCoinFlipBet, setMaxCoinFlipBet, maxRouletteBet, setMaxRouletteBet,
  slotWinProbabilityBoost, setSlotWinProbabilityBoost, coinFlipWinProbabilityBoost, setCoinFlipWinProbabilityBoost, rouletteWinProbabilityBoost, setRouletteWinProbabilityBoost
}: ShopGameProps) => {

  const generateShopItems = useCallback(() => {
    const items: ShopItem[] = [];

    // Max Bet Increase (Slot) - 10 levels
    for (let i = 1; i <= 10; i++) {
      items.push({
        id: `slot_bet_boost_${i}`,
        name: `Aumento de Aposta Máxima (Slot ${i})`,
        description: `Aumenta sua aposta máxima no Jogo do Tigrinho em R$${100 * i}.`,
        price: 500 * i,
        effect: (setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert) => {
          setMaxSlotBet(prev => prev + (100 * i));
          showAlert('Compra Realizada!', `Aposta máxima do Slot aumentada em R$${100 * i}!`);
        },
        isPurchased: false,
      });
    }

    // Max Bet Increase (Coin Flip) - 10 levels
    for (let i = 1; i <= 10; i++) {
      items.push({
        id: `coin_flip_bet_boost_${i}`,
        name: `Aumento de Aposta Máxima (Cara ou Coroa ${i})`,
        description: `Aumenta sua aposta máxima no Cara ou Coroa em R$${50 * i}.`,
        price: 250 * i,
        effect: (setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert) => {
          setMaxCoinFlipBet(prev => prev + (50 * i));
          showAlert('Compra Realizada!', `Aposta máxima do Cara ou Coroa aumentada em R$${50 * i}!`);
        },
        isPurchased: false,
      });
    }

    // Max Bet Increase (Roulette) - 10 levels
    for (let i = 1; i <= 10; i++) {
      items.push({
        id: `roulette_bet_boost_${i}`,
        name: `Aumento de Aposta Máxima (Roleta ${i})`,
        description: `Aumenta sua aposta máxima na Roleta da Sorte em R$${100 * i}.`,
        price: 600 * i,
        effect: (setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert) => {
          setMaxRouletteBet(prev => prev + (100 * i));
          showAlert('Compra Realizada!', `Aposta máxima da Roleta aumentada em R$${100 * i}!`);
        },
        isPurchased: false,
      });
    }

    // Luck Amulet (Slot) - 10 levels
    for (let i = 1; i <= 10; i++) {
      items.push({
        id: `slot_luck_amulet_${i}`,
        name: `Amuleto da Sorte (Slot ${i})`,
        description: `Aumenta permanentemente sua chance de vitória no Jogo do Tigrinho em ${i}% (0.0${i}).`,
        price: 1000 * i,
        effect: (setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert) => {
          setSlotWinProbabilityBoost(prev => prev + 0.01);
          showAlert('Compra Realizada!', `Chance de vitória do Slot aumentada em 1% (total: ${(slotWinProbabilityBoost + 0.01).toFixed(2)}%)!`);
        },
        isPurchased: false,
      });
    }

    // Fortune Coin (Coin Flip) - 10 levels
    for (let i = 1; i <= 10; i++) {
      items.push({
        id: `coin_flip_fortune_coin_${i}`,
        name: `Moeda da Fortuna (Cara ou Coroa ${i})`,
        description: `Aumenta permanentemente sua chance de vitória no Cara ou Coroa em ${i}% (0.0${i}).`,
        price: 750 * i,
        effect: (setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert) => {
          setCoinFlipWinProbabilityBoost(prev => prev + 0.01);
          showAlert('Compra Realizada!', `Chance de vitória do Cara ou Coroa aumentada em 1% (total: ${(coinFlipWinProbabilityBoost + 0.01).toFixed(2)}%)!`);
        },
        isPurchased: false,
      });
    }

    // Lucky Charm (Roulette) - 10 levels
    for (let i = 1; i <= 10; i++) {
      items.push({
        id: `roulette_lucky_charm_${i}`,
        name: `Amuleto da Sorte (Roleta ${i})`,
        description: `Aumenta permanentemente sua chance de vitória na Roleta da Sorte em ${i}% (0.0${i}).`,
        price: 1200 * i,
        effect: (setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert) => {
          setRouletteWinProbabilityBoost(prev => prev + 0.01);
          showAlert('Compra Realizada!', `Chance de vitória da Roleta aumentada em 1% (total: ${(rouletteWinProbabilityBoost + 0.01).toFixed(2)}%)!`);
        },
        isPurchased: false,
      });
    }

    return items;
  }, [slotWinProbabilityBoost, coinFlipWinProbabilityBoost, rouletteWinProbabilityBoost]);

  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  // Load shop items state on component mount
  useEffect(() => {
    const loadShopItems = async () => {
      try {
        const savedShopItems = await AsyncStorage.getItem('@tigrinhoGame:shopItems');
        const generatedItems = generateShopItems();

        if (savedShopItems !== null) {
          const parsedShopItems: { id: string; isPurchased: boolean }[] = JSON.parse(savedShopItems);
          
          const updatedItems = generatedItems.map(item => {
            const savedItem = parsedShopItems.find(sItem => sItem.id === item.id);
            return savedItem ? { ...item, isPurchased: savedItem.isPurchased } : item;
          });
          setShopItems(updatedItems);
          console.log('Shop: Items loaded:', updatedItems);
        } else {
          setShopItems(generatedItems);
        }
      } catch (error) {
        console.error('Shop: Error loading shop items:', error);
      }
    };
    loadShopItems();
  }, [generateShopItems]);

  // Save shop items state whenever they change
  useEffect(() => {
    const saveShopItems = async () => {
      try {
        const itemsToSave = shopItems.map(({ id, isPurchased }) => ({
          id,
          isPurchased,
        }));
        await AsyncStorage.setItem('@tigrinhoGame:shopItems', JSON.stringify(itemsToSave));
        console.log('Shop: Items saved:', itemsToSave);
      } catch (error) {
        console.error('Shop: Error saving shop items:', error);
      }
    };
    saveShopItems();
  }, [shopItems]);


  const handleBuyItem = (itemToBuy: ShopItem) => {
    if (saldo >= itemToBuy.price) {
      if (itemToBuy.isPurchased) {
        showAlert('Item Já Comprado', 'Você já comprou este item!');
        return;
      }

      setSaldo(prevSaldo => prevSaldo - itemToBuy.price);
      itemToBuy.effect(setSaldo, setMaxSlotBet, setMaxCoinFlipBet, setMaxRouletteBet, setSlotWinProbabilityBoost, setCoinFlipWinProbabilityBoost, setRouletteWinProbabilityBoost, showAlert);

      setShopItems(prevItems =>
        prevItems.map(item =>
          item.id === itemToBuy.id ? { ...item, isPurchased: true } : item
        )
      );
    } else {
      showAlert('Saldo Insuficiente', 'Você não tem saldo suficiente para comprar este item.');
    }
  };

  return (
    <View style={styles.shopContainer}>
      <Text style={styles.title}>Loja do Milhão</Text>
      <Text style={styles.saldoText}>Seu Saldo: R${saldo.toFixed(2)}</Text>

      <ScrollView style={styles.shopItemsList}>
        {shopItems.map((item) => (
          <View key={item.id} style={styles.shopItemCard}>
            <Text style={styles.shopItemName}>{item.name}</Text>
            <Text style={styles.shopItemDescription}>{item.description}</Text>
            <Text style={[
              styles.shopItemPrice,
              saldo < item.price ? styles.shopItemPriceInsufficient : styles.shopItemPriceSufficient
            ]}>
              Preço: R${item.price.toFixed(2)}
            </Text>
            <TouchableOpacity
              style={[
                styles.shopBuyButton,
                item.isPurchased && styles.shopBuyButtonDisabled,
              ]}
              onPress={() => handleBuyItem(item)}
              disabled={item.isPurchased || saldo < item.price}
            >
              <Text style={styles.shopBuyButtonText}>
                {item.isPurchased ? 'Comprado' : 'Comprar'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity onPress={onBackToGameSelection} style={[styles.button, styles.backToMainMenuButton]}>
        <Text style={styles.buttonText}>Voltar ao Menu</Text>
      </TouchableOpacity>
    </View>
  );
};


export default function App() {
  console.log('App: Main component rendered.');
  const [slots, setSlots] = useState<number[]>([0, 1, 2]);
  const [saldo, setSaldo] = useState<number>(100);
  const [aposta, setAposta] = useState<number>(10);
  const [odd, setOdd] = useState<number>(1.1);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const spinningIntervals = useRef<NodeJS.Timeout[]>([]);

  const [currentGameMode, setCurrentGameMode] = useState<'menu' | 'slotGame' | 'coinFlip' | 'rouletteGame' | 'achievements' | 'shop' | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(true);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [showWinnerScreen, setShowWinnerScreen] = useState<boolean>(false);

  // States for the achievement system
  const [totalSpins, setTotalSpins] = useState<number>(0);
  const [totalWins, setTotalWins] = useState<number>(0);
  const [winsOn10xOdd, setWinsOn10xOdd] = useState<number>(0);
  const [totalCoinFlips, setTotalCoinFlips] = useState<number>(0);
  const [totalCoinWins, setTotalCoinWins] = useState<number>(0);
  const [totalRouletteSpins, setTotalRouletteSpins] = useState<number>(0);
  const [totalRouletteWins, setTotalRouletteWins] = useState<number>(0);

  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [showAchievementsScreen, setShowAchievementsScreen] = useState<boolean>(false);
  const [achievementNotification, setAchievementNotification] = useState<string | null>(null);
  const notificationOpacity = useSharedValue(0);

  const oddOptions = [1.1, 1.5, 2.0, 3.0, 5.0, 10.0];

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const alertOnCloseCallback = useRef<(() => void) | null>(null);

  const animatedValue = useSharedValue(0);

  const isMounted = useRef(false);

  const spinSound = useRef<Audio.Sound | null>(null);
  const winSound = useRef<Audio.Sound | null>(null);
  const loseSound = useRef<Audio.Sound | null>(null);

  // New states for the shop
  const [maxSlotBet, setMaxSlotBet] = useState<number>(100);
  const [maxCoinFlipBet, setMaxCoinFlipBet] = useState<number>(25);
  const [maxRouletteBet, setMaxRouletteBet] = useState<number>(50);
  const [slotWinProbabilityBoost, setSlotWinProbabilityBoost] = useState<number>(0);
  const [coinFlipWinProbabilityBoost, setCoinFlipWinProbabilityBoost] = useState<number>(0);
  const [rouletteWinProbabilityBoost, setRouletteWinProbabilityBoost] = useState<number>(0);

  // New states for developer mode (NEW)
  const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState<boolean>(false);


  const showAlert = useCallback((title: string, message: string, onCloseCallback?: () => void) => {
    if (isMounted.current) {
      setModalTitle(title);
      setModalMessage(message);
      alertOnCloseCallback.current = onCloseCallback || null;
      setModalVisible(true);
    }
  }, []);

  const closeAlert = useCallback(() => {
    if (isMounted.current) {
      setModalVisible(false);
      if (alertOnCloseCallback.current) {
        alertOnCloseCallback.current();
        alertOnCloseCallback.current = null;
      }
    }
  }, []);

  // Function to check and unlock achievements
  const checkAchievements = useCallback((
    currentSaldo: number,
    currentTotalSpins: number,
    currentTotalWins: number,
    currentWinsOn10xOdd: number,
    currentTotalCoinFlips: number,
    currentTotalCoinWins: number,
    currentTotalRouletteSpins: number,
    currentTotalRouletteWins: number,
    currentUnlocked: string[]
  ) => {
    const newUnlocked: string[] = [...currentUnlocked];
    let newSaldo = currentSaldo;

    allAchievements.forEach(ach => {
      if (!currentUnlocked.includes(ach.id)) {
        const gameState = {
          saldo: currentSaldo,
          totalSpins: currentTotalSpins,
          totalWins: currentTotalWins,
          winsOn10xOdd: currentWinsOn10xOdd,
          totalCoinFlips: currentTotalCoinFlips,
          totalCoinWins: currentTotalCoinWins,
          totalRouletteSpins: currentTotalRouletteSpins,
          totalRouletteWins: currentTotalRouletteWins,
        };
        if (ach.check(gameState)) {
          newUnlocked.push(ach.id);
          // Special handling for 'million_saldo' achievement
          if (ach.id === 'million_saldo') {
            setShowWinnerScreen(true); // Show winner screen
            setCurrentGameMode(null); // Clear background content
            // Do not add reward to saldo for this specific achievement
            // Do not show general achievement notification for this one
          } else {
            newSaldo += ach.reward;
            setAchievementNotification(`${ach.name} (+R$${ach.reward.toFixed(2)})`);
            notificationOpacity.value = withTiming(1, { duration: 500 });
            setTimeout(() => {
              notificationOpacity.value = withTiming(0, { duration: 500 }, () => {
                runOnJS(setAchievementNotification)(null);
              });
            }, 2500);
          }
        }
      }
    });

    if (newUnlocked.length > currentUnlocked.length) {
      setUnlockedAchievements(newUnlocked);
      // Only update saldo if it's not the million_saldo achievement
      if (!newUnlocked.includes('million_saldo') || currentUnlocked.includes('million_saldo')) {
        setSaldo(newSaldo);
      }
    }
  }, [notificationOpacity, setSaldo]);

  // Function to save game state
  const saveGame = useCallback(async () => {
    try {
      const gameState = JSON.stringify({
        saldo: saldo,
        aposta: aposta,
        odd: odd,
        totalSpins: totalSpins,
        totalWins: totalWins,
        winsOn10xOdd: winsOn10xOdd,
        totalCoinFlips: totalCoinFlips,
        totalCoinWins: totalCoinWins,
        totalRouletteSpins: totalRouletteSpins,
        totalRouletteWins: totalRouletteWins,
        unlockedAchievements: unlockedAchievements,
        maxSlotBet: maxSlotBet,
        maxCoinFlipBet: maxCoinFlipBet,
        maxRouletteBet: maxRouletteBet,
        slotWinProbabilityBoost: slotWinProbabilityBoost,
        coinFlipWinProbabilityBoost: coinFlipWinProbabilityBoost,
        rouletteWinProbabilityBoost: rouletteWinProbabilityBoost,
      });
      await AsyncStorage.setItem('@tigrinhoGame:gameState', gameState);
      console.log('Game saved automatically:', gameState);

      checkAchievements(saldo, totalSpins, totalWins, winsOn10xOdd, totalCoinFlips, totalCoinWins, totalRouletteSpins, totalRouletteWins, unlockedAchievements);

    } catch (error) {
      console.error('Error saving game automatically:', error);
    }
  }, [saldo, aposta, odd, totalSpins, totalWins, winsOn10xOdd, totalCoinFlips, totalCoinWins, totalRouletteSpins, totalRouletteWins, unlockedAchievements, checkAchievements, maxSlotBet, maxCoinFlipBet, maxRouletteBet, slotWinProbabilityBoost, coinFlipWinProbabilityBoost, rouletteWinProbabilityBoost]);

  // Effect for auto-saving the game (with debounce)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (currentGameMode !== null) {
        saveGame();
      }
    }, 2000);

    return () => {
      clearTimeout(handler);
    };
  }, [saldo, aposta, odd, totalSpins, totalWins, winsOn10xOdd, totalCoinFlips, totalCoinWins, totalRouletteSpins, totalRouletteWins, unlockedAchievements, currentGameMode, saveGame, maxSlotBet, maxCoinFlipBet, maxRouletteBet, slotWinProbabilityBoost, coinFlipWinProbabilityBoost, rouletteWinProbabilityBoost]);


  // Function to load game state
  const loadGame = useCallback(async () => {
    try {
      const savedGameState = await AsyncStorage.getItem('@tigrinhoGame:gameState');
      
      let loadedSaldo = 100;
      let loadedAposta = 10;
      let loadedOdd = 1.1;
      let loadedTotalSpins = 0;
      let loadedTotalWins = 0;
      let loadedWinsOn10xOdd = 0;
      let loadedTotalCoinFlips = 0;
      let loadedTotalCoinWins = 0;
      let loadedTotalRouletteSpins = 0;
      let loadedTotalRouletteWins = 0;
      let loadedUnlockedAchievements: string[] = [];
      let loadedMaxSlotBet = 100;
      let loadedMaxCoinFlipBet = 25;
      let loadedMaxRouletteBet = 50;
      let loadedSlotWinProbabilityBoost = 0;
      let loadedCoinFlipWinProbabilityBoost = 0;
      let loadedRouletteWinProbabilityBoost = 0;


      if (savedGameState !== null) {
        const parsedState = JSON.parse(savedGameState);
        loadedSaldo = parsedState.saldo;
        loadedAposta = parsedState.aposta || 10;
        loadedOdd = parsedState.odd || 1.1;
        loadedTotalSpins = parsedState.totalSpins || 0;
        loadedTotalWins = parsedState.totalWins || 0;
        loadedWinsOn10xOdd = parsedState.winsOn10xOdd || 0;
        loadedTotalCoinFlips = parsedState.totalCoinFlips || 0;
        loadedTotalCoinWins = parsedState.totalCoinWins || 0;
        loadedTotalRouletteSpins = parsedState.totalRouletteSpins || 0;
        loadedTotalRouletteWins = parsedState.totalRouletteWins || 0;
        loadedUnlockedAchievements = parsedState.unlockedAchievements || [];
        loadedMaxSlotBet = parsedState.maxSlotBet || 100;
        loadedMaxCoinFlipBet = parsedState.maxCoinFlipBet || 25;
        loadedMaxRouletteBet = parsedState.maxRouletteBet || 50;
        loadedSlotWinProbabilityBoost = parsedState.slotWinProbabilityBoost || 0;
        loadedCoinFlipWinProbabilityBoost = parsedState.coinFlipWinProbabilityBoost || 0;
        loadedRouletteWinProbabilityBoost = parsedState.rouletteWinProbabilityBoost || 0;

        showAlert('Jogo Carregado!', 'Seu progresso foi carregado com sucesso.');
        console.log('Game loaded:', parsedState);
      } else {
        showAlert('Nenhum Jogo Salvo', 'Não há dados de jogo salvos. Iniciando um novo jogo.');
      }

      setSaldo(loadedSaldo);
      setAposta(loadedAposta);
      setOdd(loadedOdd);
      setTotalSpins(loadedTotalSpins);
      setTotalWins(loadedTotalWins);
      setWinsOn10xOdd(loadedWinsOn10xOdd);
      setTotalCoinFlips(loadedTotalCoinFlips);
      setTotalCoinWins(loadedTotalCoinWins);
      setTotalRouletteSpins(loadedTotalRouletteSpins);
      setTotalRouletteWins(loadedTotalRouletteWins);
      setUnlockedAchievements(loadedUnlockedAchievements);
      setMaxSlotBet(loadedMaxSlotBet);
      setMaxCoinFlipBet(loadedMaxCoinFlipBet);
      setMaxRouletteBet(loadedMaxRouletteBet);
      setSlotWinProbabilityBoost(loadedSlotWinProbabilityBoost);
      setCoinFlipWinProbabilityBoost(loadedCoinFlipWinProbabilityBoost);
      setRouletteWinProbabilityBoost(loadedRouletteWinProbabilityBoost);


      setCurrentGameMode('menu');

      checkAchievements(
        loadedSaldo,
        loadedTotalSpins,
        loadedTotalWins,
        loadedWinsOn10xOdd,
        loadedTotalCoinFlips,
        loadedTotalCoinWins,
        loadedTotalRouletteSpins,
        loadedTotalRouletteWins,
        loadedUnlockedAchievements
      );
    } catch (error) {
      showAlert('Erro ao Carregar', 'Não foi possível carregar o jogo. Iniciando um novo.');
      console.error('Error loading game:', error);
      setSaldo(100);
      setAposta(10);
      setOdd(1.1);
      setSlots([0, 1, 2]);
      setTotalSpins(0);
      setTotalWins(0);
      setWinsOn10xOdd(0);
      setTotalCoinFlips(0);
      setTotalCoinWins(0);
      setTotalRouletteSpins(0);
      setTotalRouletteWins(0);
      setUnlockedAchievements([]);
      setMaxSlotBet(100);
      setMaxCoinFlipBet(25);
      setMaxRouletteBet(50);
      setSlotWinProbabilityBoost(0);
      setCoinFlipWinProbabilityBoost(0);
      setRouletteWinProbabilityBoost(0);
      setCurrentGameMode('menu');
    } finally {
      setIsLoadingGame(false);
    }
  }, [showAlert, checkAchievements]);

  // Effect to load sounds and then handle initial screen
  useEffect(() => {
    isMounted.current = true;
    console.log('App: Sound initialization useEffect.');
    const initializeApp = async () => {
      try {
        console.log('App: Trying to load spin.mp3');
        const { sound: loadedSpinSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/spin.mp3'),
          { shouldPlay: false, volume: 0.5, isLooping: true }
        );
        spinSound.current = loadedSpinSound;
        console.log('App: Spin sound loaded successfully.');

        console.log('App: Trying to load win.mp3');
        const { sound: loadedWinSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/win.mp3'),
          { shouldPlay: false, volume: 0.8 }
        );
        winSound.current = loadedWinSound;
        console.log('App: Win sound loaded successfully.');

        console.log('App: Trying to load lose.mp3');
        const { sound: loadedLoseSound } = await Audio.Sound.createAsync(
          require('./assets/sounds/lose.mp3'),
          { shouldPlay: false, volume: 0.7 }
        );
        loseSound.current = loadedLoseSound;
        console.log('App: Lose sound loaded successfully.');

      } catch (error) {
        console.log('App: Failed to load one or more sounds:', error);
      } finally {
        setIsLoadingGame(false);
      }
    };

    initializeApp();

    return () => {
      isMounted.current = false;
      console.log('App: Releasing audio resources.');
      spinSound.current?.unloadAsync();
      winSound.current?.unloadAsync();
      loseSound.current?.unloadAsync();
    };
  }, []);

  // Keyboard shortcut for developer mode (NEW)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault(); // Prevent browser default for this shortcut
        setIsDeveloperMode(prevMode => {
          const newMode = !prevMode;
          if (newMode) {
            showAlert('Modo Desenvolvedor Ativado!', 'Você pode agora ajustar o saldo através do menu.');
            setShowDeveloperModal(true); // Open the modal immediately
          } else {
            showAlert('Modo Desenvolvedor Desativado!', 'O acesso ao saldo foi desabilitado.');
            setShowDeveloperModal(false); // Close the modal if open
          }
          return newMode;
        });
      }
    };

    // Add event listener to the window object
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup the event listener on component unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [showAlert]);


  const handleApostaChange = (value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setAposta(Math.min(numValue, saldo, maxSlotBet));
    }
  };

  // FUNCTION THAT STARTS THE TUTORIAL WHEN CLICKING "NEW GAME"
  const handleNewGameClick = () => {
    setShowTutorial(true);
  };

  // FUNCTION CALLED BY THE TUTORIAL TO ACTUALLY START A NEW GAME (Slot)
  const startNewGameFromTutorial = () => {
    setSaldo(100);
    setAposta(10);
    setOdd(1.1);
    setSlots([0, 1, 2]);
    setTotalSpins(0);
    setTotalWins(0);
    setWinsOn10xOdd(0);
    setTotalCoinFlips(0);
    setTotalCoinWins(0);
    setTotalRouletteSpins(0);
    setTotalRouletteWins(0);
    setUnlockedAchievements([]);
    setMaxSlotBet(100);
    setMaxCoinFlipBet(25);
    setMaxRouletteBet(50);
    setSlotWinProbabilityBoost(0);
    setCoinFlipWinProbabilityBoost(0);
    setRouletteWinProbabilityBoost(0);
    setShowTutorial(false);
    setShowGameOver(false);
    setShowWinnerScreen(false); // Reset winner screen state
    setIsDeveloperMode(false); // Reset developer mode
    setShowDeveloperModal(false); // Close developer modal
    setCurrentGameMode('menu');
    console.log('App: New game (Slot) started after tutorial.');
  };

  const handleLoadGamePress = () => {
    loadGame();
    setShowGameOver(false);
    setShowWinnerScreen(false); // Reset winner screen state
    setIsDeveloperMode(false); // Reset developer mode
    setShowDeveloperModal(false); // Close developer modal
  };

  // FUNCTION: Start Coin Flip game
  const handleStartCoinFlipGame = () => {
    setCurrentGameMode('coinFlip');
    console.log('App: Starting Coin Flip game.');
  };

  // FUNCTION: Start Roulette game
  const handleStartRouletteGame = () => {
    setCurrentGameMode('rouletteGame');
    console.log('App: Starting Roulette game.');
  };

  // FUNCTION: Start Slot Game
  const handleStartSlotGame = () => {
    setCurrentGameMode('slotGame');
    console.log('App: Starting Slot Game.');
  };

  // FUNCTION: Go back to Main Menu (resets all states to initial screen)
  const handleBackToMainMenu = () => {
    setCurrentGameMode(null);
    setSaldo(100);
    setAposta(10);
    setOdd(1.1);
    setSlots([0, 1, 2]);
    setTotalSpins(0);
    setTotalWins(0);
    setWinsOn10xOdd(0);
    setTotalCoinFlips(0);
    setTotalCoinWins(0);
    setTotalRouletteSpins(0);
    setTotalRouletteWins(0);
    setUnlockedAchievements([]);
    setMaxSlotBet(100);
    setMaxCoinFlipBet(25);
    setMaxRouletteBet(50);
    setSlotWinProbabilityBoost(0);
    setCoinFlipWinProbabilityBoost(0);
    setRouletteWinProbabilityBoost(0);
    setShowGameOver(false);
    setShowWinnerScreen(false); // Reset winner screen state
    setIsDeveloperMode(false); // Reset developer mode
    setShowDeveloperModal(false); // Close developer modal
    console.log('App: Returning to main menu.');
  };

  // FUNCTION: Go back to game selection screen (keeps balance and progress)
  const handleBackToGameSelection = () => {
    setCurrentGameMode('menu');
    console.log('App: Returning to game selection.');
  };

  // FUNCTION: Go to shop
  const handleGoToShop = () => {
    setCurrentGameMode('shop');
    console.log('App: Going to shop.');
  };

  const handleStartGame = async () => {
    console.log('App: handleStartGame (Slot) called.');
    if (isSpinning) return;

    if (aposta <= 0 || aposta > saldo || aposta > maxSlotBet) {
      showAlert('Erro', `Aposta inválida! A aposta deve ser entre R$1 e R$${Math.min(saldo, maxSlotBet).toFixed(2)}.`);
      return;
    }
    if (odd < 1.1 || odd > 10) {
      showAlert('Erro', 'Por favor, selecione uma Odd válida!');
      return;
    }

    setIsSpinning(true);
    const saldoAntesAposta = saldo;
    setSaldo(prevSaldo => prevSaldo - aposta);
    setTotalSpins(prev => prev + 1);

    try {
      if (spinSound.current) {
        await spinSound.current.playAsync();
        console.log('App: Spin sound started.');
      }
    } catch (error) {
      console.log('App: Error playing spin sound:', error);
    }

    setSlots([0, 0, 0]);

    animatedValue.value = 0;
    animatedValue.value = withTiming(1, {
      duration: 5000,
      easing: Easing.linear,
    });

    spinningIntervals.current = slots.map((_, index) => {
      return setInterval(() => {
        setSlots(prevSlots => {
          const newSlots = [...prevSlots];
          newSlots[index] = Math.floor(Math.random() * icons.length);
          return newSlots;
        });
      }, 100);
    });

    setTimeout(async () => {
      console.log('App: End of spin timeout.');
      try {
        if (spinSound.current) {
          await spinSound.current.stopAsync();
          await spinSound.current.setPositionAsync(0);
          console.log('App: Som de giro parado e resetado.');
        }
      } catch (error) {
        console.log('App: Erro ao parar/resetar som de giro:', error);
      }

      spinningIntervals.current.forEach(clearInterval);
      spinningIntervals.current = [];

      checkOddResult(saldoAntesAposta - aposta);

      setIsSpinning(false);
      animatedValue.value = 0;
    }, 5000);
  };

  const checkOddResult = async (saldoAfterBet: number) => {
    console.log('App: checkOddResult (Slot) called.');
    
    let targetWinProbability: number;
    switch (odd) {
      case 1.1:
        targetWinProbability = 0.70;
        break;
      case 1.5:
        targetWinProbability = 0.60;
        break;
      case 2.0:
        targetWinProbability = 0.50;
        break;
      case 3.0:
        targetWinProbability = 0.40;
        break;
      case 5.0:
        targetWinProbability = 0.20;
        break;
      case 10.0:
        targetWinProbability = 0.05;
        break;
      default:
        targetWinProbability = 0.2;
    }

    const adjustedWinProbability = Math.min(1.0, targetWinProbability + slotWinProbabilityBoost);
    console.log(`App: Adjusted win probability for Slot: ${adjustedWinProbability.toFixed(4)}`);

    const shouldWin = Math.random() <= adjustedWinProbability;

    let finalSaldo = saldoAfterBet;
    let newCalculatedTotalWins = totalWins;
    let newCalculatedWinsOn10xOdd = winsOn10xOdd;

    if (shouldWin) {
      const winningIcon = Math.floor(Math.random() * icons.length);
      const actualFinalSlots = [winningIcon, winningIcon, winningIcon];
      setSlots(actualFinalSlots);
      const ganho = aposta * odd;
      finalSaldo = saldoAfterBet + ganho;
      setSaldo(finalSaldo);
      try {
        if (winSound.current) {
          await winSound.current.playAsync();
          console.log('App: Win sound played.');
        }
      } catch (error) {
        console.log('App: Error playing win sound:', error);
      }
      showAlert('Parabéns!', `🎉 JACKPOT! 🎉 Você ganhou! Seu saldo agora é: R$${finalSaldo.toFixed(2)}`);
      newCalculatedTotalWins = totalWins + 1;
      if (odd === 10.0) {
        newCalculatedWinsOn10xOdd = winsOn10xOdd + 1;
      }
      checkAchievements(finalSaldo, totalSpins, newCalculatedTotalWins, newCalculatedWinsOn10xOdd, totalCoinFlips, totalCoinWins, totalRouletteSpins, totalRouletteWins, unlockedAchievements);

    } else {
      let tempSlots: number[];
      do {
        tempSlots = [
          Math.floor(Math.random() * icons.length),
          Math.floor(Math.random() * icons.length),
          Math.floor(Math.random() * icons.length),
        ];
      } while (tempSlots[0] === tempSlots[1] && tempSlots[1] === tempSlots[2]);

      setSlots(tempSlots);
      try {
        if (loseSound.current) {
          await loseSound.current.playAsync();
          console.log('App: Lose sound played.');
        }
      } catch (error) {
        console.log('App: Error playing lose sound:', error);
      }
      showAlert('Que pena!', 'Você perdeu.', () => {
        if (finalSaldo <= 0) {
          setShowGameOver(true);
          setCurrentGameMode(null);
        }
      });
      checkAchievements(finalSaldo, totalSpins, totalWins, winsOn10xOdd, totalCoinFlips, totalCoinWins, totalRouletteSpins, totalRouletteWins, unlockedAchievements);
    }
  };

  // Slot animation
  const animatedStyle = useAnimatedStyle(() => {
    const progress = animatedValue.value;

    const rotationDuringSpin = progress * 360 * 5;
    const verticalWave = Math.sin(progress * Math.PI * 10) * 15 * (1 - progress);

    return {
      transform: [
        { translateY: verticalWave },
        { rotateZ: `${rotationDuringSpin}deg` },
      ],
    };
  });

  const displayJackpot = slots.every((val) => val === slots[0]) && !isSpinning;

  if (isLoadingGame) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Carregando Jogo...</Text>
        <Text style={styles.loadingText}>Preparando os sons e assets...</Text>
      </SafeAreaView>
    );
  }

  // Se a tela de Game Over estiver visível, renderiza apenas o modal de Game Over
  if (showGameOver) {
    return (
      <SafeAreaView style={styles.container}>
        <GameOverModal
          isVisible={showGameOver}
          onStartNewGame={startNewGameFromTutorial}
        />
      </SafeAreaView>
    );
  }

  // Se a tela de Vencedor estiver visível, renderiza apenas o modal de Vencedor
  if (showWinnerScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <WinnerModal
          isVisible={showWinnerScreen}
          onStartNewGame={startNewGameFromTutorial}
          qrCodeImage={qrCodeImage}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {!currentGameMode ? ( // Initial screen: New Game and Load Game
        <View style={styles.initialScreenContainer}>
          <Text style={styles.title}>Bem-vindo ao O Sonho do Milhão!</Text>
          <TouchableOpacity onPress={handleNewGameClick} style={styles.button}>
            <Text style={styles.buttonText}>Novo Jogo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLoadGamePress} style={[styles.button, styles.loadGameButton]}>
            <Text style={styles.buttonText}>Carregar Jogo</Text>
          </TouchableOpacity>
        </View>
      ) : currentGameMode === 'menu' ? ( // Menu Screen
        <View style={styles.initialScreenContainer}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity onPress={handleStartSlotGame} style={styles.button}>
            <Text style={styles.buttonText}>Jogo do Tigrinho</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStartCoinFlipGame} style={[styles.button, styles.coinFlipButton]}>
            <Text style={styles.buttonText}>Cara ou Coroa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleStartRouletteGame} style={[styles.button, styles.rouletteButton]}>
            <Text style={styles.buttonText}>Roleta da Sorte</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGoToShop} style={[styles.button, styles.shopButton]}>
            <Text style={styles.buttonText}>Loja</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentGameMode('achievements')} style={[styles.button, styles.achievementsButton]}>
            <Text style={styles.buttonText}>Conquistas</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBackToMainMenu} style={[styles.button, styles.backToMainMenuButton]}>
            <Text style={styles.buttonText}>Voltar ao Menu Principal</Text>
          </TouchableOpacity>
        </View>
      ) : currentGameMode === 'achievements' ? ( // Achievements Screen
        <View style={styles.achievementsScreen}>
          <Text style={styles.achievementsTitle}>Suas Conquistas em O Sonho do Milhão</Text>
          
          <ScrollView style={styles.achievementsScrollView}>
            <Text style={styles.achievementCategoryTitle}>Conquistas do Jogo do Tigrinho</Text>
            {allAchievements.filter(ach => ach.type === 'slot').map(ach => (
              <View key={ach.id} style={styles.achievementItem}>
                <Text style={styles.achievementName}>{ach.name} {ach.id !== 'million_saldo' && <Text style={styles.achievementRewardText}>(+R${ach.reward.toFixed(2)})</Text>}</Text>
                <Text style={styles.achievementDescription}>{ach.description}</Text>
                {unlockedAchievements.includes(ach.id) ? (
                  <Text style={styles.achievementStatusUnlocked}>Desbloqueada!</Text>
                ) : (
                  <Text style={styles.achievementStatusLocked}>Bloqueada</Text>
                )}
              </View>
            ))}

            <Text style={styles.achievementCategoryTitle}>Conquistas do Cara ou Coroa</Text>
            {allAchievements.filter(ach => ach.type === 'coinFlip').map(ach => (
              <View key={ach.id} style={styles.achievementItem}>
                <Text style={styles.achievementName}>{ach.name} <Text style={styles.achievementRewardText}>(+R${ach.reward.toFixed(2)})</Text></Text>
                <Text style={styles.achievementDescription}>{ach.description}</Text>
                {unlockedAchievements.includes(ach.id) ? (
                  <Text style={styles.achievementStatusUnlocked}>Desbloqueada!</Text>
                ) : (
                  <Text style={styles.achievementStatusLocked}>Bloqueada</Text>
                )}
              </View>
            ))}

            <Text style={styles.achievementCategoryTitle}>Conquistas da Roleta</Text>
            {allAchievements.filter(ach => ach.type === 'roulette').map(ach => (
              <View key={ach.id} style={styles.achievementItem}>
                <Text style={styles.achievementName}>{ach.name} <Text style={styles.achievementRewardText}>(+R${ach.reward.toFixed(2)})</Text></Text>
                <Text style={styles.achievementDescription}>{ach.description}</Text>
                {unlockedAchievements.includes(ach.id) ? (
                  <Text style={styles.achievementStatusUnlocked}>Desbloqueada!</Text>
                ) : (
                  <Text style={styles.achievementStatusLocked}>Bloqueada</Text>
                )}
              </View>
            ))}

            <Text style={styles.achievementCategoryTitle}>Conquistas Gerais</Text>
            {allAchievements.filter(ach => ach.type === 'general').map(ach => (
              <View key={ach.id} style={styles.achievementItem}>
                <Text style={styles.achievementName}>{ach.name} {ach.id !== 'million_saldo' && <Text style={styles.achievementRewardText}>(+R${ach.reward.toFixed(2)})</Text>}</Text>
                <Text style={styles.achievementDescription}>{ach.description}</Text>
                {unlockedAchievements.includes(ach.id) ? (
                  <Text style={styles.achievementStatusUnlocked}>Desbloqueada!</Text>
                ) : (
                  <Text style={styles.achievementStatusLocked}>Bloqueada</Text>
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={() => setCurrentGameMode('menu')} style={[styles.button, styles.backButton]}>
            <Text style={styles.buttonText}>Voltar ao Menu</Text>
          </TouchableOpacity>
        </View>
      ) : currentGameMode === 'coinFlip' ? (
        <CoinFlipGame
          saldo={saldo}
          setSaldo={setSaldo}
          onBackToGameSelection={handleBackToGameSelection}
          totalSpins={totalSpins}
          setTotalSpins={setTotalSpins}
          totalWins={totalWins}
          setTotalWins={setTotalWins}
          winsOn10xOdd={winsOn10xOdd}
          setWinsOn10xOdd={setWinsOn10xOdd}
          unlockedAchievements={unlockedAchievements}
          setUnlockedAchievements={setUnlockedAchievements}
          checkAchievements={checkAchievements}
          totalCoinFlips={totalCoinFlips}
          setTotalCoinFlips={setTotalCoinFlips}
          totalCoinWins={totalCoinWins}
          setTotalCoinWins={setTotalCoinWins}
          showAlert={showAlert}
          coinFlipWinProbabilityBoost={coinFlipWinProbabilityBoost}
          maxCoinFlipBet={maxCoinFlipBet}
          totalRouletteSpins={totalRouletteSpins}
          totalRouletteWins={totalRouletteWins}
          setShowGameOver={setShowGameOver}
          setCurrentGameMode={setCurrentGameMode}
        />
      ) : currentGameMode === 'rouletteGame' ? (
        <RouletteGame
          saldo={saldo}
          setSaldo={setSaldo}
          onBackToGameSelection={handleBackToGameSelection}
          showAlert={showAlert}
          totalSpins={totalSpins}
          setTotalSpins={setTotalSpins}
          totalWins={totalWins}
          setTotalWins={setTotalWins}
          winsOn10xOdd={winsOn10xOdd}
          setWinsOn10xOdd={setWinsOn10xOdd}
          totalCoinFlips={totalCoinFlips}
          setTotalCoinFlips={setTotalCoinFlips}
          totalCoinWins={totalCoinWins}
          setTotalCoinWins={setTotalCoinWins}
          totalRouletteSpins={totalRouletteSpins}
          setTotalRouletteSpins={setTotalRouletteSpins}
          totalRouletteWins={totalRouletteWins}
          setTotalRouletteWins={setTotalRouletteWins}
          unlockedAchievements={unlockedAchievements}
          setUnlockedAchievements={setUnlockedAchievements}
          checkAchievements={checkAchievements}
          maxRouletteBet={maxRouletteBet}
          rouletteWinProbabilityBoost={rouletteWinProbabilityBoost}
          setShowGameOver={setShowGameOver}
          setCurrentGameMode={setCurrentGameMode}
        />
      ) : currentGameMode === 'shop' ? (
        <ShopGame
          saldo={saldo}
          setSaldo={setSaldo}
          onBackToGameSelection={handleBackToGameSelection}
          showAlert={showAlert}
          maxSlotBet={maxSlotBet}
          setMaxSlotBet={setMaxSlotBet}
          maxCoinFlipBet={maxCoinFlipBet}
          setMaxCoinFlipBet={setMaxCoinFlipBet}
          maxRouletteBet={maxRouletteBet}
          setMaxRouletteBet={setMaxRouletteBet}
          slotWinProbabilityBoost={slotWinProbabilityBoost}
          setSlotWinProbabilityBoost={setSlotWinProbabilityBoost}
          coinFlipWinProbabilityBoost={coinFlipWinProbabilityBoost}
          setCoinFlipWinProbabilityBoost={setCoinFlipWinProbabilityBoost}
          rouletteWinProbabilityBoost={rouletteWinProbabilityBoost}
          setRouletteWinProbabilityBoost={setRouletteWinProbabilityBoost}
        />
      ) : ( // Main Game (Slots) - Jogo do Tigrinho
        <>
          <Text style={styles.title}>🎰 Jogo do Tigrinho 🎰</Text>
          <Text style={styles.saldoText}>Saldo: R${saldo.toFixed(2)}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Aposta:</Text>
            <TextInput
              style={styles.input}
              value={aposta.toString()}
              onChangeText={handleApostaChange}
              keyboardType="numeric"
              placeholder={`Máx: R$${Math.min(saldo, maxSlotBet).toFixed(2)}`}
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.oddSelectionContainer}>
            <Text style={styles.label}>Selecione a Odd:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oddOptionsScroll}>
              {oddOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.oddButton,
                    odd === option && styles.selectedOddButton,
                  ]}
                  onPress={() => setOdd(option)}
                >
                  <Text style={[
                    styles.oddButtonText,
                    odd === option && styles.selectedOddButtonText,
                  ]}>
                    {option.toFixed(1)}x
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.slots}>
            {slots.map((iconIndex, i) => (
              <Animated.View key={i} style={[styles.icon, animatedStyle]}>
                <Image source={icons[iconIndex]} style={{ width: 80, height: 80 }} />
              </Animated.View>
            ))}
          </View>

          <TouchableOpacity onPress={handleStartGame} style={styles.button} disabled={isSpinning}>
            <Text style={styles.buttonText}>{isSpinning ? 'GIRANDO...' : 'GIRAR'}</Text>
          </TouchableOpacity>

          {displayJackpot && <Text style={styles.jackpot}>🎉 JACKPOT! 🎉</Text>}

          <TouchableOpacity onPress={handleBackToGameSelection} style={[styles.button, styles.backToMainMenuButton]}>
            <Text style={styles.buttonText}>Voltar ao Menu</Text>
          </TouchableOpacity>

        </>
      )}

      {achievementNotification && (
        <Animated.View style={[styles.achievementNotification, { opacity: notificationOpacity }]}>
          <Text style={styles.achievementNotificationText}>🏆 Conquista: {achievementNotification} 🏆</Text>
        </Animated.View>
      )}

      <TutorialModal
        isVisible={showTutorial}
        onStartGame={startNewGameFromTutorial}
      />
      <CustomAlertModal
        isVisible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={closeAlert}
      />
      {isDeveloperMode && ( // Render DeveloperModal only if developer mode is active
        <DeveloperModal
          isVisible={showDeveloperModal}
          currentSaldo={saldo}
          setSaldo={setSaldo}
          onClose={() => setShowDeveloperModal(false)}
          showAlert={showAlert}
          checkAchievements={checkAchievements}
          totalSpins={totalSpins}
          totalWins={totalWins}
          winsOn10xOdd={winsOn10xOdd}
          totalCoinFlips={totalCoinFlips}
          totalCoinWins={totalCoinWins}
          totalRouletteSpins={totalRouletteSpins}
          totalRouletteWins={totalRouletteWins}
          unlockedAchievements={unlockedAchievements}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#ff9900',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  initialScreenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#222222',
    borderRadius: 15,
    paddingVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#ff9900',
  },
  input: {
    backgroundColor: '#333333',
    color: '#fff',
    fontSize: 18,
    padding: 12,
    marginVertical: 10,
    borderRadius: 10,
    width: 220,
    textAlign: 'center',
    borderWidth: 2,
    borderColor: '#ff9900',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  inputContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#ffcc00',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    marginTop: 25,
    borderWidth: 3,
    borderColor: '#ff9900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadGameButton: {
    backgroundColor: '#007bff',
    borderColor: '#0056b3',
    marginTop: 15,
  },
  coinFlipButton: {
    backgroundColor: '#17a2b8',
    borderColor: '#138496',
    marginTop: 15,
  },
  rouletteButton: {
    backgroundColor: '#6f42c1',
    borderColor: '#563d7c',
    marginTop: 15,
  },
  shopButton: {
    backgroundColor: '#8a2be2',
    borderColor: '#6a0dad',
    marginTop: 15,
  },
  backToMainMenuButton: {
    backgroundColor: '#dc3545',
    borderColor: '#c82333',
    marginTop: 15,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#333333',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  saldoText: {
    fontSize: 26,
    color: '#ff9900',
    marginTop: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  jackpot: {
    marginTop: 30,
    fontSize: 32,
    color: '#00ff00',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  slots: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#333333',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 15,
  },
  icon: {
    marginHorizontal: 12,
    backgroundColor: '#444444',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffcc00',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  label: {
    fontSize: 20,
    color: '#ffcc00',
    marginBottom: 15,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#222222',
    padding: 35,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 3,
    borderColor: '#ff9900',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffcc00',
    marginBottom: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  modalMessage: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 28,
  },
  modalButton: {
    backgroundColor: '#ff9900',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalButtonText: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  oddSelectionContainer: {
    marginBottom: 25,
    alignItems: 'center',
    width: '100%',
  },
  oddOptionsScroll: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  oddButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#555555',
  },
  selectedOddButton: {
    backgroundColor: '#ffcc00',
    borderColor: '#ff9900',
    borderWidth: 2,
  },
  oddButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedOddButtonText: {
    color: '#333333',
  },
  loadingText: {
    fontSize: 20,
    color: '#fff',
    marginTop: 20,
  },
  // Styles for the achievements screen
  achievementsButton: {
    backgroundColor: '#6a0dad',
    borderColor: '#4a007a',
    marginTop: 15,
  },
  achievementsScreen: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 99,
    width: '100%',
  },
  achievementsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffcc00',
    marginBottom: 30,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  achievementCategoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    width: '90%',
  },
  achievementsScrollView: {
    width: '95%',
    flex: 1,
    paddingHorizontal: 10,
  },
  achievementItem: {
    backgroundColor: '#222222',
    borderRadius: 15,
    padding: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#555555',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  achievementName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 22,
  },
  achievementStatusUnlocked: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  achievementStatusLocked: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff0000',
  },
  achievementRewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00ff00',
  },
  backButton: {
    backgroundColor: '#ff9900',
    borderColor: '#ff6600',
    marginTop: 30,
    marginBottom: 10,
  },
  // Styles for achievement notification
  achievementNotification: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 128, 0, 0.8)',
    padding: 10,
    borderRadius: 10,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },
  achievementNotificationText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  // Styles for Tutorial Modal
  tutorialContent: {
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  tutorialHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffcc00',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  tutorialText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 25,
  },
  // Styles for Coin Flip
  coinFlipContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  coinFlipControls: {
    marginBottom: 25,
    alignItems: 'center',
    width: '100%',
  },
  sideSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginBottom: 30,
  },
  sideButton: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#555555',
    alignItems: 'center',
    width: '45%',
  },
  selectedSideButton: {
    backgroundColor: '#ffcc00',
    borderColor: '#ff9900',
  },
  coinSideImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  sideButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#ffcc00',
  },
  finalCoinImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  messageText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Styles for the Shop
  shopContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  shopItemsList: {
    width: '90%',
    flex: 1,
    paddingVertical: 10,
  },
  shopItemCard: {
    backgroundColor: '#222222',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#ff9900',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  shopItemName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffcc00',
    marginBottom: 5,
  },
  shopItemDescription: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  shopItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  shopItemPriceInsufficient: {
    color: '#dc3545',
  },
  shopItemPriceSufficient: {
    color: '#00ff00',
  },
  shopBuyButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#218838',
  },
  shopBuyButtonDisabled: {
    backgroundColor: '#6c757d',
    borderColor: '#5a6268',
  },
  shopBuyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Styles for Roulette Game
  rouletteContainer: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    width: '100%',
  },
  rouletteControls: {
    marginBottom: 25,
    alignItems: 'center',
    width: '100%',
  },
  betTypeScroll: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  betTypeButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#555555',
  },
  selectedBetTypeButton: {
    backgroundColor: '#ffcc00',
    borderColor: '#ff9900',
    borderWidth: 2,
  },
  betTypeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  numberScroll: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  numberButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#555555',
  },
  selectedNumberButton: {
    borderColor: '#ff9900',
    borderWidth: 2,
  },
  numberButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  rouletteResultText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  qrCodeImageModal: { // New style for QR code in WinnerModal
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff9900',
  },
});
