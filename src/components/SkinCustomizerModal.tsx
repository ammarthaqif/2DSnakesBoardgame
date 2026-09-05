import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Lock, Sparkles, ShieldAlert } from 'lucide-react';
import { SNAKE_SKINS } from '../data/gameConstants';
import { SnakeSkin } from '../types';
import { SnakeSkinAvatar } from './SnakeSkinAvatar';
import { sounds } from '../utils/soundEffects';

interface SkinCustomizerModalProps {
  currentSkinId: string;
  userTrophies: number;
  onSelectSkin: (skinId: string) => void;
  onClose: () => void;
}

export const SkinCustomizerModal: React.FC<SkinCustomizerModalProps> = ({
  currentSkinId,
  userTrophies,
  onSelectSkin,
  onClose,
}) => {
  const [selectedSkin, setSelectedSkin] = useState<SnakeSkin>(
    () => SNAKE_SKINS.find((s) => s.id === currentSkinId) || SNAKE_SKINS[0]
  );
  const [filterRarity, setFilterRarity] = useState<string>('All');

  const filteredSkins = SNAKE_SKINS.filter((skin) => {
    if (filterRarity === 'All') return true;
    return skin.rarity === filterRarity;
  });

  const isUnlocked = selectedSkin.unlockedByDefault || userTrophies >= selectedSkin.requiredTrophies;

  const handleSkinClick = (skin: SnakeSkin) => {
    setSelectedSkin(skin);
    sounds.playDiceRoll();
  };

  const handleEquip = () => {
    if (!isUnlocked) return;
    onSelectSkin(selectedSkin.id);
    sounds.playCorrect();
    onClose();
  };

  return (
    <div
      id="skin-customizer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-sm"
    >
      <motion.div
        id="skin-customizer-card"
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <div>
              <h2 className="text-base font-bold text-slate-100">Serpent Skin Armory</h2>
              <p className="text-xs text-slate-400">Customize your boardgame snake avatar & token</p>
            </div>
          </div>
          <button
            id="close-skins-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Skin Interactive Preview Stage */}
        <div
          id="skin-preview-stage"
          className="my-3 p-4 rounded-2xl border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center text-center select-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${selectedSkin.headColor}25, #020617 80%)`,
          }}
        >
          {/* Rarity Pill */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-950/80 border border-slate-700 text-slate-200">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{selectedSkin.rarity}</span>
          </div>

          {/* Large Slithering Snake Body Preview */}
          <div className="my-2 flex items-center justify-center gap-1.5">
            {/* Tail to Head segments */}
            {[0.4, 0.6, 0.8].map((op, idx) => (
              <motion.div
                key={idx}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: idx * 0.2 }}
                className="w-5 h-5 rounded-full shadow-md"
                style={{
                  background: selectedSkin.bodyGradient[idx % selectedSkin.bodyGradient.length],
                  opacity: op,
                }}
              />
            ))}
            {/* Animated Head Avatar */}
            <motion.div
              animate={{ y: [-2, 3, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <SnakeSkinAvatar skinId={selectedSkin.id} size="xl" showCrown={selectedSkin.rarity === 'Mythic'} />
            </motion.div>
          </div>

          <h3 className="text-lg font-black text-slate-100 tracking-wide mt-1">
            {selectedSkin.name}
          </h3>
          <p className="text-xs text-slate-400 italic max-w-xs">{selectedSkin.flavorText}</p>

          {/* Unlock Requirement info */}
          {!isUnlocked && (
            <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Requires {selectedSkin.requiredTrophies} Trophies (You have {userTrophies})</span>
            </div>
          )}
        </div>

        {/* Rarity Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {['All', 'Common', 'Rare', 'Epic', 'Legendary', 'Mythic'].map((cat) => (
            <button
              key={cat}
              id={`filter-rarity-${cat.toLowerCase()}`}
              onClick={() => setFilterRarity(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterRarity === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Skin Grid Selection */}
        <div className="grid grid-cols-4 gap-2.5 overflow-y-auto max-h-[160px] p-1">
          {filteredSkins.map((skin) => {
            const isEquipped = currentSkinId === skin.id;
            const isCurrentSelected = selectedSkin.id === skin.id;
            const skinUnlocked = skin.unlockedByDefault || userTrophies >= skin.requiredTrophies;

            return (
              <button
                key={skin.id}
                id={`skin-card-${skin.id}`}
                onClick={() => handleSkinClick(skin)}
                className={`relative flex flex-col items-center p-2 rounded-2xl border text-center transition-all ${
                  isCurrentSelected
                    ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="relative mb-1">
                  <SnakeSkinAvatar skinId={skin.id} size="md" />
                  {!skinUnlocked && (
                    <div className="absolute inset-0 bg-slate-950/80 rounded-full flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  {isEquipped && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold text-slate-200 truncate w-full">
                  {skin.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Equip Action */}
        <div className="pt-3 mt-2 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {currentSkinId === selectedSkin.id ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Equipped in game
              </span>
            ) : isUnlocked ? (
              <span className="text-cyan-300 font-medium">Ready to equip</span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Locked
              </span>
            )}
          </div>

          <button
            id="equip-skin-action-btn"
            disabled={!isUnlocked || currentSkinId === selectedSkin.id}
            onClick={handleEquip}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              currentSkinId === selectedSkin.id
                ? 'bg-slate-800 text-slate-500 cursor-default'
                : isUnlocked
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-cyan-500/20 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {currentSkinId === selectedSkin.id ? 'Equipped' : 'Equip Skin'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
