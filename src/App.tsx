/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Language, DeckTheme } from './types';
import { ALL_LANGUAGES, INITIAL_DECKS } from './constants';
import Notification from './components/Notification';
import { useRef } from 'react';

export default function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.ENGLISH);
  const [unlockedDecks, setUnlockedDecks] = useState<DeckTheme[]>([DeckTheme.NONE]);
  const [playerPoints, setPlayerPoints] = useState<number>(0);
  const [playerId, setPlayerId] = useState<string>('test-player-1'); // Temporary player ID for testing
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [playerLocations, setPlayerLocations] = useState<PlayerLocation[]>([]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const playerResponse = await fetch(`/api/players/${playerId}`);
        if (playerResponse.ok) {
          const playerData = await playerResponse.json();
          setPlayerPoints(playerData.points);
        } else if (playerResponse.status === 404) {
          // Player not found, create a new one
          await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: playerId, name: 'Test Player', points: 0 }),
          });
          setPlayerPoints(0);
        }

        const decksResponse = await fetch(`/api/players/${playerId}/unlocked-decks`);
        if (decksResponse.ok) {
          const decksData: DeckTheme[] = await decksResponse.json();
          setUnlockedDecks([DeckTheme.NONE, ...decksData]);
        }
      } catch (error) {
        console.error('Error fetching initial player data:', error);
      }
    };
    fetchPlayerData();
  }, [playerId]);
  const [notification, setNotification] = useState<{ message: string; id: number } | null>(null);

  const backgroundMusicRef = useRef<HTMLAudioElement>(null);
  const clickSoundRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (hasInteracted && backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = 0.3;
      backgroundMusicRef.current.loop = true;
      backgroundMusicRef.current.play().catch(e => console.error("Error playing background music:", e));
    }
  }, [hasInteracted]);

  const playClickSound = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(e => console.error("Error playing click sound:", e));
    }
  };

  const showNotification = (message: string) => {
    setNotification({ message, id: Date.now() });
  };

  const handleUnlockDeck = async (theme: DeckTheme) => {
    const deckToUnlock = INITIAL_DECKS.find(deck => deck.theme === theme);
    if (!deckToUnlock) return;

    if (unlockedDecks.includes(theme)) {
      showNotification(`Deck '${deckToUnlock.name}' is already unlocked!`);
      return;
    }

    if (playerPoints < deckToUnlock.cost) {
      showNotification(`Not enough points to unlock '${deckToUnlock.name}'. You need ${deckToUnlock.cost - playerPoints} more points.`);
      return;
    }

    try {
      // Deduct points locally first for responsiveness
      setPlayerPoints(prevPoints => prevPoints - deckToUnlock.cost);
      setUnlockedDecks(prevDecks => [...prevDecks, theme]);

      // Update backend for player points
      await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, name: 'Test Player', points: playerPoints - deckToUnlock.cost }),
      });

      // Update backend for unlocked deck
      await fetch(`/api/players/${playerId}/unlocked-decks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: theme }),
      });

      showNotification(`Deck '${deckToUnlock.name}' Unlocked!`);
    } catch (error) {
      console.error('Error unlocking deck:', error);
      showNotification(`Failed to unlock deck '${deckToUnlock.name}'.`);
      // Revert local changes if API call fails (simple rollback)
      setPlayerPoints(prevPoints => prevPoints + deckToUnlock.cost);
      setUnlockedDecks(prevDecks => prevDecks.filter(d => d !== theme));
  };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-red-900 flex flex-col items-center justify-center p-8 font-sans">
      <motion.h1
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-8xl lg:text-9xl font-display font-black text-red-purple-outline text-3d-shadow text-neon-glow mb-12 text-center leading-tight"
      >
        Apples to Apricots
      </motion.h1>

      <audio ref={backgroundMusicRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" preload="auto" />
      <audio ref={clickSoundRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" preload="auto" />



      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-purple-800 bg-opacity-30 backdrop-blur-lg rounded-xl p-8 shadow-2xl w-full max-w-md text-center"
      >
        <h2 className="text-4xl font-bold text-red-purple-outline mb-6">Settings</h2>
        
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <label htmlFor="language-select" className="block text-red-purple-outline text-2xl font-bold mb-3">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Select Language:
            </motion.span>
            Select Language:
          </label>
          <select
            id="language-select"
            className="w-full p-4 rounded-lg bg-purple-900 bg-opacity-50 text-red-purple-outline text-xl font-bold border-2 border-purple-300 focus:outline-none focus:ring-2 focus:ring-red-300"
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value as Language);
              playClickSound();
            }}
          >
            {ALL_LANGUAGES.map((lang) => (
              <option key={lang} value={lang} className="bg-red-900 text-red-purple-outline">
                {lang}
              </option>
            ))}
          </select>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <h3 className="text-red-purple-outline text-2xl font-bold mb-3">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Your Points: {playerPoints}
            </motion.span>
          </h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
          className="mb-6"
        >
          <h3 className="text-red-purple-outline text-2xl font-bold mb-3">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Unlocked Decks:
            </motion.span>
          </h3>
          <ul className="text-red-purple-outline text-xl">
            {unlockedDecks.map((deckTheme) => (
              <li key={deckTheme}>{INITIAL_DECKS.find(d => d.theme === deckTheme)?.name || deckTheme}</li>
            ))}
          </ul>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
          onClick={playClickSound}
          className="bg-red-700 hover:bg-red-800 text-red-purple-outline text-3xl font-bold py-5 px-10 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
        >
          Start Game
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6, ease: "easeOut" }}
          className="mt-8 space-y-4"
        >
          <button
            onClick={async () => {
              playClickSound();
              const newPoints = playerPoints + 10;
              setPlayerPoints(newPoints);
              try {
                await fetch('/api/players', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: playerId, name: 'Test Player', points: newPoints }),
                });
                showNotification('Earned 10 points!');
              } catch (error) {
                console.error('Error earning points:', error);
                showNotification('Failed to earn points.');
                setPlayerPoints(playerPoints); // Revert on error
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-red-purple-outline text-xl font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 transform hover:scale-105"
          >
            Earn 10 Points (Test)
          </button>
          <h3 className="text-red-purple-outline text-2xl font-bold mb-3">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              Available Decks:
            </motion.span>
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {INITIAL_DECKS.filter(deck => deck.theme !== DeckTheme.NONE).map((deck) => (
              <button
                key={deck.theme}
                onClick={() => {
                  playClickSound();
                  handleUnlockDeck(deck.theme);
                }}
                className={`py-3 px-6 rounded-full text-red-purple-outline text-xl font-bold transition duration-300 transform hover:scale-105
                  ${unlockedDecks.includes(deck.theme)
                    ? 'bg-gray-700 cursor-not-allowed' // Darker gray for disabled
                    : 'bg-red-600 hover:bg-red-700'} // Red for available
                `}
                disabled={unlockedDecks.includes(deck.theme)}
              >
                {deck.name} - {deck.cost} Points
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
      {notification && (
        <Notification
          message={notification.message}
          onClose={() => setNotification(null)}
          key={notification.id}
        />
      )}
    </div>
  );
}
