'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

interface EmojiItem {
  emoji: string
  keywords: string
}

const EMOJI_CATEGORIES: { name: string; icon: string; emojis: EmojiItem[] }[] = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      { emoji: '😀', keywords: 'grinning happy smile' },
      { emoji: '😃', keywords: 'smiley happy joy' },
      { emoji: '😄', keywords: 'smile happy laugh' },
      { emoji: '😁', keywords: 'grin happy teeth' },
      { emoji: '😆', keywords: 'laughing happy xd' },
      { emoji: '😅', keywords: 'sweat smile nervous' },
      { emoji: '🤣', keywords: 'rofl laughing rolling' },
      { emoji: '😂', keywords: 'joy tears laughing lol' },
      { emoji: '🙂', keywords: 'slightly smiling' },
      { emoji: '🙃', keywords: 'upside down silly' },
      { emoji: '😉', keywords: 'wink flirt' },
      { emoji: '😊', keywords: 'blush happy shy' },
      { emoji: '😇', keywords: 'angel innocent halo' },
      { emoji: '🥰', keywords: 'love hearts smiling' },
      { emoji: '😍', keywords: 'heart eyes love' },
      { emoji: '🤩', keywords: 'star struck excited wow' },
      { emoji: '😘', keywords: 'kiss blowing love' },
      { emoji: '😗', keywords: 'kissing' },
      { emoji: '😚', keywords: 'kissing closed eyes' },
      { emoji: '😙', keywords: 'kissing smiling' },
      { emoji: '🥲', keywords: 'smiling tear sad happy' },
      { emoji: '😋', keywords: 'yummy delicious food' },
      { emoji: '😛', keywords: 'tongue playful' },
      { emoji: '😜', keywords: 'wink tongue crazy' },
      { emoji: '🤪', keywords: 'zany crazy wild' },
      { emoji: '😝', keywords: 'tongue squinting' },
      { emoji: '🤑', keywords: 'money rich dollar' },
      { emoji: '🤗', keywords: 'hugging hug' },
      { emoji: '🤭', keywords: 'hand over mouth oops' },
      { emoji: '🤫', keywords: 'shush quiet secret' },
      { emoji: '🤔', keywords: 'thinking hmm wonder' },
      { emoji: '🫡', keywords: 'salute respect' },
      { emoji: '🤐', keywords: 'zipper mouth quiet' },
      { emoji: '🤨', keywords: 'raised eyebrow suspicious' },
      { emoji: '😐', keywords: 'neutral face blank' },
      { emoji: '😑', keywords: 'expressionless blank' },
      { emoji: '😶', keywords: 'no mouth silent' },
      { emoji: '😏', keywords: 'smirk sly' },
      { emoji: '😒', keywords: 'unamused bored annoyed' },
      { emoji: '🙄', keywords: 'eye roll whatever' },
      { emoji: '😬', keywords: 'grimace awkward cringe' },
      { emoji: '😌', keywords: 'relieved calm peaceful' },
      { emoji: '😔', keywords: 'pensive sad thoughtful' },
      { emoji: '😪', keywords: 'sleepy tired' },
      { emoji: '🤤', keywords: 'drooling yummy' },
      { emoji: '😴', keywords: 'sleeping zzz tired' },
      { emoji: '😷', keywords: 'mask sick covid' },
      { emoji: '🤒', keywords: 'sick thermometer fever' },
      { emoji: '🤕', keywords: 'hurt bandage injured' },
      { emoji: '🤢', keywords: 'nauseous sick green' },
      { emoji: '🤮', keywords: 'vomit puke sick' },
      { emoji: '🥵', keywords: 'hot sweating heat' },
      { emoji: '🥶', keywords: 'cold freezing ice' },
      { emoji: '🥴', keywords: 'woozy drunk dizzy' },
      { emoji: '😵', keywords: 'dizzy knocked out' },
      { emoji: '🤯', keywords: 'exploding head mind blown wow' },
      { emoji: '🤠', keywords: 'cowboy hat yeehaw' },
      { emoji: '🥳', keywords: 'party celebration birthday' },
      { emoji: '🥸', keywords: 'disguise glasses' },
      { emoji: '😎', keywords: 'cool sunglasses' },
      { emoji: '🤓', keywords: 'nerd glasses smart' },
      { emoji: '🧐', keywords: 'monocle curious' },
      { emoji: '😕', keywords: 'confused' },
      { emoji: '😟', keywords: 'worried concerned' },
      { emoji: '🙁', keywords: 'slightly frowning sad' },
      { emoji: '😮', keywords: 'open mouth surprised' },
      { emoji: '😯', keywords: 'hushed surprised' },
      { emoji: '😲', keywords: 'astonished shocked wow' },
      { emoji: '😳', keywords: 'flushed embarrassed' },
      { emoji: '🥺', keywords: 'pleading puppy eyes please' },
      { emoji: '🥹', keywords: 'holding back tears emotional' },
      { emoji: '😨', keywords: 'fearful scared afraid' },
      { emoji: '😰', keywords: 'anxious sweat nervous' },
      { emoji: '😥', keywords: 'sad relieved disappointed' },
      { emoji: '😢', keywords: 'crying sad tear' },
      { emoji: '😭', keywords: 'sobbing crying loud' },
      { emoji: '😱', keywords: 'screaming scared horror' },
      { emoji: '😖', keywords: 'confounded frustrated' },
      { emoji: '😣', keywords: 'persevering struggling' },
      { emoji: '😞', keywords: 'disappointed sad' },
      { emoji: '😩', keywords: 'weary tired exhausted' },
      { emoji: '😫', keywords: 'tired exhausted' },
      { emoji: '🥱', keywords: 'yawning tired bored' },
      { emoji: '😤', keywords: 'angry steam triumph' },
      { emoji: '😡', keywords: 'angry pouting mad' },
      { emoji: '😠', keywords: 'angry mad' },
      { emoji: '🤬', keywords: 'cursing swearing angry' },
      { emoji: '😈', keywords: 'devil evil smiling' },
      { emoji: '👿', keywords: 'devil angry evil' },
      { emoji: '💀', keywords: 'skull dead death' },
      { emoji: '💩', keywords: 'poop poo' },
      { emoji: '🤡', keywords: 'clown' },
      { emoji: '👻', keywords: 'ghost boo' },
      { emoji: '👽', keywords: 'alien ufo' },
      { emoji: '👾', keywords: 'alien monster game' },
      { emoji: '🤖', keywords: 'robot bot' },
    ],
  },
  {
    name: 'Gestures',
    icon: '👋',
    emojis: [
      { emoji: '👋', keywords: 'wave hello hi bye' },
      { emoji: '🤚', keywords: 'raised back hand stop' },
      { emoji: '🖐️', keywords: 'hand fingers spread' },
      { emoji: '✋', keywords: 'raised hand stop high five' },
      { emoji: '👌', keywords: 'ok okay perfect' },
      { emoji: '🤌', keywords: 'pinched fingers italian' },
      { emoji: '🤏', keywords: 'pinching small tiny' },
      { emoji: '✌️', keywords: 'victory peace two' },
      { emoji: '🤞', keywords: 'crossed fingers luck hope' },
      { emoji: '🤟', keywords: 'love you gesture rock' },
      { emoji: '🤘', keywords: 'rock on metal horns' },
      { emoji: '🤙', keywords: 'call me shaka hang loose' },
      { emoji: '👈', keywords: 'pointing left' },
      { emoji: '👉', keywords: 'pointing right' },
      { emoji: '👆', keywords: 'pointing up' },
      { emoji: '👇', keywords: 'pointing down' },
      { emoji: '☝️', keywords: 'point up one' },
      { emoji: '👍', keywords: 'thumbs up like good yes approve' },
      { emoji: '👎', keywords: 'thumbs down dislike bad no' },
      { emoji: '✊', keywords: 'fist bump raised' },
      { emoji: '👊', keywords: 'fist punch' },
      { emoji: '🤛', keywords: 'left fist bump' },
      { emoji: '🤜', keywords: 'right fist bump' },
      { emoji: '👏', keywords: 'clap applause bravo' },
      { emoji: '🙌', keywords: 'raised hands celebrate' },
      { emoji: '🫶', keywords: 'heart hands love' },
      { emoji: '👐', keywords: 'open hands' },
      { emoji: '🤲', keywords: 'palms up together' },
      { emoji: '🤝', keywords: 'handshake deal agreement' },
      { emoji: '🙏', keywords: 'pray please thanks folded hands' },
      { emoji: '💪', keywords: 'muscle strong bicep flex' },
      { emoji: '👀', keywords: 'eyes looking see watch' },
      { emoji: '👅', keywords: 'tongue lick' },
      { emoji: '💋', keywords: 'kiss lips' },
      { emoji: '💅', keywords: 'nail polish sassy' },
      { emoji: '💃', keywords: 'dancing woman' },
      { emoji: '🕺', keywords: 'dancing man' },
    ],
  },
  {
    name: 'Hearts',
    icon: '❤️',
    emojis: [
      { emoji: '❤️', keywords: 'red heart love' },
      { emoji: '🧡', keywords: 'orange heart' },
      { emoji: '💛', keywords: 'yellow heart' },
      { emoji: '💚', keywords: 'green heart' },
      { emoji: '💙', keywords: 'blue heart' },
      { emoji: '💜', keywords: 'purple heart' },
      { emoji: '🖤', keywords: 'black heart' },
      { emoji: '🤍', keywords: 'white heart' },
      { emoji: '🤎', keywords: 'brown heart' },
      { emoji: '💔', keywords: 'broken heart sad' },
      { emoji: '❣️', keywords: 'heart exclamation' },
      { emoji: '💕', keywords: 'two hearts love' },
      { emoji: '💞', keywords: 'revolving hearts' },
      { emoji: '💓', keywords: 'beating heart' },
      { emoji: '💗', keywords: 'growing heart' },
      { emoji: '💖', keywords: 'sparkling heart' },
      { emoji: '💘', keywords: 'cupid arrow heart love' },
      { emoji: '💝', keywords: 'gift heart ribbon' },
      { emoji: '❤️‍🔥', keywords: 'heart fire burning love' },
      { emoji: '❤️‍🩹', keywords: 'mending heart healing' },
    ],
  },
  {
    name: 'Animals',
    icon: '🐶',
    emojis: [
      { emoji: '🐶', keywords: 'dog puppy' },
      { emoji: '🐱', keywords: 'cat kitten' },
      { emoji: '🐭', keywords: 'mouse' },
      { emoji: '🐹', keywords: 'hamster' },
      { emoji: '🐰', keywords: 'rabbit bunny' },
      { emoji: '🦊', keywords: 'fox' },
      { emoji: '🐻', keywords: 'bear' },
      { emoji: '🐼', keywords: 'panda' },
      { emoji: '🐨', keywords: 'koala' },
      { emoji: '🐯', keywords: 'tiger' },
      { emoji: '🦁', keywords: 'lion king' },
      { emoji: '🐮', keywords: 'cow' },
      { emoji: '🐷', keywords: 'pig' },
      { emoji: '🐸', keywords: 'frog' },
      { emoji: '🐵', keywords: 'monkey' },
      { emoji: '🙈', keywords: 'see no evil monkey' },
      { emoji: '🙉', keywords: 'hear no evil monkey' },
      { emoji: '🙊', keywords: 'speak no evil monkey' },
      { emoji: '🐔', keywords: 'chicken' },
      { emoji: '🐧', keywords: 'penguin' },
      { emoji: '🐦', keywords: 'bird' },
      { emoji: '🦆', keywords: 'duck' },
      { emoji: '🦅', keywords: 'eagle' },
      { emoji: '🦉', keywords: 'owl' },
      { emoji: '🐺', keywords: 'wolf' },
      { emoji: '🐴', keywords: 'horse' },
      { emoji: '🦄', keywords: 'unicorn magic' },
      { emoji: '🐝', keywords: 'bee honey' },
      { emoji: '🦋', keywords: 'butterfly' },
      { emoji: '🐌', keywords: 'snail slow' },
      { emoji: '🐞', keywords: 'ladybug' },
      { emoji: '🐢', keywords: 'turtle slow' },
      { emoji: '🐍', keywords: 'snake' },
      { emoji: '🐙', keywords: 'octopus' },
      { emoji: '🐬', keywords: 'dolphin' },
      { emoji: '🐳', keywords: 'whale' },
      { emoji: '🦈', keywords: 'shark' },
      { emoji: '🐊', keywords: 'crocodile' },
      { emoji: '🐘', keywords: 'elephant' },
      { emoji: '🦒', keywords: 'giraffe' },
    ],
  },
  {
    name: 'Food',
    icon: '🍕',
    emojis: [
      { emoji: '🍎', keywords: 'apple red fruit' },
      { emoji: '🍌', keywords: 'banana fruit' },
      { emoji: '🍉', keywords: 'watermelon fruit' },
      { emoji: '🍇', keywords: 'grapes fruit' },
      { emoji: '🍓', keywords: 'strawberry fruit' },
      { emoji: '🍑', keywords: 'peach fruit' },
      { emoji: '🍍', keywords: 'pineapple fruit' },
      { emoji: '🥭', keywords: 'mango fruit' },
      { emoji: '🍅', keywords: 'tomato' },
      { emoji: '🥑', keywords: 'avocado' },
      { emoji: '🌶️', keywords: 'pepper hot spicy' },
      { emoji: '🌽', keywords: 'corn' },
      { emoji: '🥕', keywords: 'carrot' },
      { emoji: '🍞', keywords: 'bread' },
      { emoji: '🧀', keywords: 'cheese' },
      { emoji: '🍳', keywords: 'egg cooking' },
      { emoji: '🥓', keywords: 'bacon' },
      { emoji: '🍔', keywords: 'burger hamburger' },
      { emoji: '🍟', keywords: 'fries french' },
      { emoji: '🍕', keywords: 'pizza' },
      { emoji: '🌭', keywords: 'hotdog' },
      { emoji: '🥪', keywords: 'sandwich' },
      { emoji: '🌮', keywords: 'taco mexican' },
      { emoji: '🌯', keywords: 'burrito wrap' },
      { emoji: '🍝', keywords: 'pasta spaghetti' },
      { emoji: '🍜', keywords: 'noodles ramen' },
      { emoji: '🍣', keywords: 'sushi japanese' },
      { emoji: '🍤', keywords: 'shrimp prawn' },
      { emoji: '🍦', keywords: 'ice cream' },
      { emoji: '🍩', keywords: 'donut doughnut' },
      { emoji: '🍪', keywords: 'cookie' },
      { emoji: '🎂', keywords: 'birthday cake' },
      { emoji: '🍰', keywords: 'cake slice' },
      { emoji: '🧁', keywords: 'cupcake' },
      { emoji: '🍫', keywords: 'chocolate' },
      { emoji: '🍬', keywords: 'candy sweet' },
      { emoji: '🍭', keywords: 'lollipop' },
      { emoji: '☕', keywords: 'coffee hot drink' },
      { emoji: '🍵', keywords: 'tea green' },
      { emoji: '🧋', keywords: 'boba bubble tea' },
      { emoji: '🍺', keywords: 'beer' },
      { emoji: '🍷', keywords: 'wine' },
      { emoji: '🥤', keywords: 'cup straw drink soda' },
    ],
  },
  {
    name: 'Symbols',
    icon: '⭐',
    emojis: [
      { emoji: '🔥', keywords: 'fire hot lit' },
      { emoji: '✨', keywords: 'sparkles shine magic' },
      { emoji: '⭐', keywords: 'star' },
      { emoji: '💯', keywords: 'hundred perfect score' },
      { emoji: '🚀', keywords: 'rocket launch fast' },
      { emoji: '🎉', keywords: 'party tada celebration confetti' },
      { emoji: '🎊', keywords: 'confetti ball celebration' },
      { emoji: '🎯', keywords: 'target bullseye direct hit' },
      { emoji: '💡', keywords: 'light bulb idea' },
      { emoji: '✅', keywords: 'check mark done yes' },
      { emoji: '❌', keywords: 'cross mark no wrong' },
      { emoji: '⚡', keywords: 'lightning bolt energy zap' },
      { emoji: '💎', keywords: 'gem diamond jewel' },
      { emoji: '🏆', keywords: 'trophy winner champion' },
      { emoji: '🥇', keywords: 'gold medal first' },
      { emoji: '🥈', keywords: 'silver medal second' },
      { emoji: '🥉', keywords: 'bronze medal third' },
      { emoji: '🔴', keywords: 'red circle' },
      { emoji: '🟠', keywords: 'orange circle' },
      { emoji: '🟡', keywords: 'yellow circle' },
      { emoji: '🟢', keywords: 'green circle' },
      { emoji: '🔵', keywords: 'blue circle' },
      { emoji: '🟣', keywords: 'purple circle' },
      { emoji: '⚫', keywords: 'black circle' },
      { emoji: '⚪', keywords: 'white circle' },
      { emoji: '🎵', keywords: 'music note' },
      { emoji: '🎶', keywords: 'music notes' },
      { emoji: '🎮', keywords: 'game controller gaming' },
      { emoji: '🏀', keywords: 'basketball sport' },
      { emoji: '⚽', keywords: 'soccer football sport' },
      { emoji: '🎾', keywords: 'tennis sport' },
      { emoji: '🏈', keywords: 'football american sport' },
      { emoji: '♻️', keywords: 'recycle green environment' },
      { emoji: '💤', keywords: 'sleep zzz tired' },
      { emoji: '🔔', keywords: 'bell notification' },
      { emoji: '🔕', keywords: 'no bell mute silent' },
      { emoji: '📌', keywords: 'pin pushpin location' },
      { emoji: '🔗', keywords: 'link chain url' },
      { emoji: '💬', keywords: 'speech bubble message chat' },
      { emoji: '💭', keywords: 'thought bubble thinking' },
      { emoji: '👑', keywords: 'crown king queen royal' },
      { emoji: '🎁', keywords: 'gift present wrapped' },
      { emoji: '🪄', keywords: 'magic wand' },
      { emoji: '🧲', keywords: 'magnet' },
      { emoji: '⚠️', keywords: 'warning caution' },
      { emoji: '🚫', keywords: 'prohibited forbidden no' },
      { emoji: '💰', keywords: 'money bag dollar rich' },
      { emoji: '📈', keywords: 'chart up trending growth' },
      { emoji: '📉', keywords: 'chart down trending loss' },
    ],
  },
]

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
  openUpward?: boolean
}

export function EmojiPicker({ onSelect, onClose, openUpward = true }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 150)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const allEmojis = useMemo(() => EMOJI_CATEGORIES.flatMap(c => c.emojis), [])

  const filteredEmojis = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return allEmojis.filter(e => e.keywords.includes(q) || e.emoji.includes(q))
  }, [search, allEmojis])

  const posClass = openUpward ? 'bottom-full mb-2' : 'top-full mt-2'

  return (
    <div
      ref={ref}
      className={`absolute ${posClass} right-0 bg-[#2a2540] rounded-2xl shadow-2xl border border-white/[0.1] z-[100] w-[320px] sm:w-[360px] animate-scale-in overflow-hidden`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Search */}
      <div className="p-2.5 pb-1.5">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis... (happy, fire, heart)"
            className="w-full pl-8 pr-3 py-2 bg-white/[0.06] rounded-lg text-[12px] text-white/70 placeholder:text-white/20 border border-white/[0.06] focus:border-violet-500/30 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex px-2 gap-0.5 border-b border-white/[0.06] pb-1.5">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-1.5 text-center rounded-lg transition-colors ${
                activeTab === i
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
              }`}
              title={cat.name}
            >
              <span className="text-[14px]">{cat.icon}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 h-[220px] overflow-y-auto scrollbar-dark">
        {search && filteredEmojis !== null ? (
          <>
            <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest px-1 mb-1.5">
              {filteredEmojis.length} results
            </p>
            {filteredEmojis.length === 0 ? (
              <p className="text-white/20 text-[12px] text-center py-6">No emojis found</p>
            ) : (
              <div className="grid grid-cols-8 gap-0.5">
                {filteredEmojis.map((item, i) => (
                  <button
                    key={`${item.emoji}-${i}`}
                    onClick={() => onSelect(item.emoji)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.1] active:scale-90 transition-all text-xl"
                    title={item.keywords}
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest px-1 mb-1.5">
              {EMOJI_CATEGORIES[activeTab].name}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJI_CATEGORIES[activeTab].emojis.map((item, i) => (
                <button
                  key={`${item.emoji}-${i}`}
                  onClick={() => onSelect(item.emoji)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.1] active:scale-90 transition-all text-xl"
                  title={item.keywords}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
