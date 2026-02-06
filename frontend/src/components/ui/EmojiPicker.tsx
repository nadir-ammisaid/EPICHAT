"use client";

import { useState, useRef, useEffect } from "react";

// Emoji data with searchable keywords
const EMOJI_DATA: Record<string, { emoji: string; keywords: string[] }[]> = {
  Smileys: [
    { emoji: "😀", keywords: ["grinning", "smile", "happy", "face"] },
    { emoji: "😃", keywords: ["smiley", "smile", "happy", "joy"] },
    { emoji: "😄", keywords: ["grin", "smile", "happy", "laugh"] },
    { emoji: "😁", keywords: ["beaming", "smile", "happy", "grin"] },
    { emoji: "😆", keywords: ["laughing", "laugh", "happy", "lol"] },
    { emoji: "😅", keywords: ["sweat", "smile", "nervous", "relief"] },
    { emoji: "🤣", keywords: ["rofl", "laugh", "lol", "funny", "rolling"] },
    { emoji: "😂", keywords: ["joy", "laugh", "cry", "tears", "lol"] },
    { emoji: "🙂", keywords: ["slight", "smile", "ok", "fine"] },
    { emoji: "😊", keywords: ["blush", "smile", "happy", "shy"] },
    { emoji: "😇", keywords: ["angel", "innocent", "halo", "good"] },
    { emoji: "🥰", keywords: ["love", "hearts", "adore", "crush"] },
    { emoji: "😍", keywords: ["heart", "eyes", "love", "crush", "adore"] },
    { emoji: "🤩", keywords: ["star", "eyes", "excited", "wow", "amazing"] },
    { emoji: "😘", keywords: ["kiss", "love", "heart", "blow"] },
    { emoji: "😗", keywords: ["kiss", "whistle", "lips"] },
    { emoji: "😚", keywords: ["kiss", "blush", "love", "shy"] },
    {
      emoji: "😋",
      keywords: ["yummy", "delicious", "tasty", "tongue", "food"],
    },
    { emoji: "😛", keywords: ["tongue", "playful", "tease", "silly"] },
    { emoji: "😜", keywords: ["wink", "tongue", "crazy", "silly", "playful"] },
    { emoji: "🤪", keywords: ["zany", "crazy", "wild", "silly", "goofy"] },
    { emoji: "😝", keywords: ["tongue", "squint", "playful", "silly"] },
    { emoji: "🤑", keywords: ["money", "rich", "dollar", "cash"] },
    { emoji: "🤗", keywords: ["hug", "hugging", "embrace", "love"] },
    { emoji: "🤭", keywords: ["giggle", "shy", "cover", "oops"] },
    { emoji: "🤫", keywords: ["shush", "quiet", "secret", "silence"] },
    {
      emoji: "🤔",
      keywords: ["think", "thinking", "hmm", "wonder", "question"],
    },
    { emoji: "🤐", keywords: ["zipper", "quiet", "secret", "shut"] },
    {
      emoji: "🤨",
      keywords: ["raised", "eyebrow", "skeptic", "doubt", "suspicious"],
    },
    { emoji: "😐", keywords: ["neutral", "meh", "blank", "expressionless"] },
    { emoji: "😑", keywords: ["blank", "expressionless", "unamused"] },
    { emoji: "😶", keywords: ["mute", "silent", "speechless", "no words"] },
    { emoji: "😏", keywords: ["smirk", "smug", "sly", "flirt"] },
    { emoji: "😒", keywords: ["unamused", "annoyed", "meh", "bored"] },
    { emoji: "🙄", keywords: ["eye", "roll", "whatever", "annoyed", "bored"] },
    { emoji: "😬", keywords: ["grimace", "awkward", "nervous", "cringe"] },
    { emoji: "😌", keywords: ["relieved", "calm", "peaceful", "content"] },
    { emoji: "😔", keywords: ["sad", "pensive", "disappointed", "down"] },
    { emoji: "😪", keywords: ["sleepy", "tired", "sleep", "zzz"] },
    { emoji: "🤤", keywords: ["drool", "yummy", "hungry", "want"] },
    { emoji: "😴", keywords: ["sleep", "zzz", "tired", "sleeping"] },
    { emoji: "😷", keywords: ["mask", "sick", "ill", "covid", "flu"] },
    { emoji: "🤒", keywords: ["sick", "fever", "thermometer", "ill"] },
    { emoji: "🤕", keywords: ["hurt", "injured", "bandage", "head"] },
    { emoji: "🤢", keywords: ["nauseated", "sick", "green", "vomit"] },
    { emoji: "🤮", keywords: ["vomit", "sick", "puke", "throw up"] },
    { emoji: "🤧", keywords: ["sneeze", "sick", "cold", "tissue"] },
    { emoji: "🥵", keywords: ["hot", "heat", "sweating", "fever"] },
    { emoji: "🥶", keywords: ["cold", "freezing", "frozen", "ice"] },
    { emoji: "😱", keywords: ["scream", "fear", "scared", "shock", "horror"] },
    { emoji: "😭", keywords: ["cry", "crying", "sob", "sad", "tears"] },
    { emoji: "😤", keywords: ["angry", "frustrated", "huffing", "steam"] },
    { emoji: "😡", keywords: ["angry", "mad", "rage", "furious", "pouting"] },
    { emoji: "🤬", keywords: ["swearing", "cursing", "angry", "symbols"] },
  ],
  Gestures: [
    {
      emoji: "👍",
      keywords: ["thumbs", "up", "yes", "good", "ok", "like", "approve"],
    },
    {
      emoji: "👎",
      keywords: ["thumbs", "down", "no", "bad", "dislike", "disapprove"],
    },
    { emoji: "👌", keywords: ["ok", "perfect", "fine", "nice", "good"] },
    {
      emoji: "🤌",
      keywords: ["pinched", "italian", "chef", "kiss", "perfect"],
    },
    { emoji: "🤏", keywords: ["pinch", "small", "tiny", "little", "bit"] },
    { emoji: "✌️", keywords: ["peace", "victory", "two", "fingers", "v"] },
    { emoji: "🤞", keywords: ["crossed", "fingers", "luck", "hope", "wish"] },
    { emoji: "🤟", keywords: ["love", "you", "rock", "hand", "sign"] },
    { emoji: "🤘", keywords: ["rock", "metal", "horns", "devil"] },
    { emoji: "🤙", keywords: ["call", "me", "shaka", "hang", "loose"] },
    { emoji: "👈", keywords: ["point", "left", "direction", "there"] },
    { emoji: "👉", keywords: ["point", "right", "direction", "there"] },
    { emoji: "👆", keywords: ["point", "up", "direction", "above"] },
    { emoji: "👇", keywords: ["point", "down", "direction", "below"] },
    { emoji: "☝️", keywords: ["point", "up", "one", "wait", "attention"] },
    { emoji: "👋", keywords: ["wave", "hi", "hello", "bye", "goodbye"] },
    { emoji: "🤚", keywords: ["raised", "back", "hand", "stop", "high five"] },
    { emoji: "🖐️", keywords: ["hand", "fingers", "five", "high five", "stop"] },
    { emoji: "✋", keywords: ["hand", "stop", "high five", "raised"] },
    { emoji: "🖖", keywords: ["vulcan", "spock", "star trek", "live long"] },
    {
      emoji: "👏",
      keywords: ["clap", "applause", "bravo", "congrats", "hands"],
    },
    {
      emoji: "🙌",
      keywords: ["raised", "hands", "celebration", "hooray", "praise"],
    },
    {
      emoji: "🤝",
      keywords: ["handshake", "deal", "agreement", "partnership"],
    },
    {
      emoji: "🙏",
      keywords: ["pray", "please", "hope", "thanks", "namaste", "hands"],
    },
    {
      emoji: "💪",
      keywords: ["muscle", "strong", "flex", "bicep", "power", "strength"],
    },
    {
      emoji: "🦾",
      keywords: ["robot", "arm", "mechanical", "prosthetic", "strong"],
    },
    { emoji: "✍️", keywords: ["write", "writing", "pen", "hand", "sign"] },
    { emoji: "🤳", keywords: ["selfie", "phone", "camera", "photo"] },
  ],
  Hearts: [
    { emoji: "❤️", keywords: ["red", "heart", "love", "like", "romance"] },
    { emoji: "🧡", keywords: ["orange", "heart", "love", "like"] },
    {
      emoji: "💛",
      keywords: ["yellow", "heart", "love", "like", "friendship"],
    },
    { emoji: "💚", keywords: ["green", "heart", "love", "like", "jealous"] },
    { emoji: "💙", keywords: ["blue", "heart", "love", "like", "trust"] },
    { emoji: "💜", keywords: ["purple", "heart", "love", "like"] },
    { emoji: "🖤", keywords: ["black", "heart", "love", "dark", "emo"] },
    { emoji: "🤍", keywords: ["white", "heart", "love", "pure"] },
    { emoji: "🤎", keywords: ["brown", "heart", "love", "like"] },
    { emoji: "💔", keywords: ["broken", "heart", "sad", "breakup", "hurt"] },
    { emoji: "❤️‍🔥", keywords: ["fire", "heart", "passion", "love", "burning"] },
    { emoji: "❤️‍🩹", keywords: ["mending", "heart", "healing", "recovery"] },
    { emoji: "💕", keywords: ["two", "hearts", "love", "couple"] },
    { emoji: "💞", keywords: ["revolving", "hearts", "love", "circle"] },
    { emoji: "💓", keywords: ["beating", "heart", "love", "pulse"] },
    { emoji: "💗", keywords: ["growing", "heart", "love", "bigger"] },
    { emoji: "💖", keywords: ["sparkling", "heart", "love", "shine"] },
    { emoji: "💘", keywords: ["cupid", "arrow", "heart", "love", "valentine"] },
    { emoji: "💝", keywords: ["gift", "heart", "ribbon", "love", "present"] },
    { emoji: "💟", keywords: ["decoration", "heart", "love", "purple"] },
  ],
  Objects: [
    {
      emoji: "💻",
      keywords: ["laptop", "computer", "mac", "work", "code", "programming"],
    },
    {
      emoji: "🖥️",
      keywords: ["desktop", "computer", "monitor", "screen", "pc"],
    },
    {
      emoji: "📱",
      keywords: ["phone", "mobile", "iphone", "android", "smartphone"],
    },
    {
      emoji: "⌨️",
      keywords: ["keyboard", "type", "typing", "keys", "computer"],
    },
    { emoji: "🖱️", keywords: ["mouse", "computer", "click", "pointer"] },
    { emoji: "💡", keywords: ["light", "bulb", "idea", "bright", "lamp"] },
    { emoji: "🔧", keywords: ["wrench", "tool", "fix", "repair", "mechanic"] },
    { emoji: "🔨", keywords: ["hammer", "tool", "build", "construction"] },
    { emoji: "⚙️", keywords: ["gear", "settings", "cog", "config", "options"] },
    { emoji: "🔩", keywords: ["nut", "bolt", "screw", "hardware"] },
    { emoji: "📦", keywords: ["box", "package", "shipping", "delivery"] },
    { emoji: "📁", keywords: ["folder", "file", "directory", "documents"] },
    { emoji: "📂", keywords: ["folder", "open", "file", "directory"] },
    { emoji: "📄", keywords: ["document", "page", "file", "paper"] },
    { emoji: "📝", keywords: ["memo", "note", "write", "edit", "pencil"] },
    { emoji: "✏️", keywords: ["pencil", "write", "edit", "draw"] },
    { emoji: "📌", keywords: ["pin", "pushpin", "location", "mark", "note"] },
    { emoji: "📎", keywords: ["paperclip", "clip", "attach", "attachment"] },
    { emoji: "🔗", keywords: ["link", "chain", "url", "connection"] },
    { emoji: "📤", keywords: ["outbox", "send", "upload", "share"] },
    { emoji: "📥", keywords: ["inbox", "receive", "download", "mail"] },
    {
      emoji: "🎮",
      keywords: ["game", "controller", "video", "gaming", "play"],
    },
    {
      emoji: "🎧",
      keywords: ["headphones", "music", "audio", "listen", "earphones"],
    },
    {
      emoji: "🎬",
      keywords: ["movie", "film", "clapperboard", "action", "cinema"],
    },
    { emoji: "📷", keywords: ["camera", "photo", "picture", "photography"] },
  ],
  Symbols: [
    {
      emoji: "✅",
      keywords: ["check", "done", "complete", "yes", "correct", "approved"],
    },
    {
      emoji: "❌",
      keywords: ["cross", "no", "wrong", "delete", "cancel", "x"],
    },
    { emoji: "⭕", keywords: ["circle", "o", "zero", "ring"] },
    { emoji: "❗", keywords: ["exclamation", "important", "alert", "warning"] },
    { emoji: "❓", keywords: ["question", "what", "help", "confused"] },
    { emoji: "⚠️", keywords: ["warning", "alert", "caution", "danger"] },
    { emoji: "🔴", keywords: ["red", "circle", "stop", "record"] },
    { emoji: "🟢", keywords: ["green", "circle", "go", "online", "active"] },
    { emoji: "🔵", keywords: ["blue", "circle", "dot"] },
    { emoji: "⚪", keywords: ["white", "circle", "dot"] },
    { emoji: "🔶", keywords: ["orange", "diamond", "shape"] },
    { emoji: "🔷", keywords: ["blue", "diamond", "shape"] },
    {
      emoji: "💯",
      keywords: ["hundred", "100", "percent", "perfect", "score"],
    },
    { emoji: "✨", keywords: ["sparkles", "stars", "magic", "shine", "new"] },
    { emoji: "⭐", keywords: ["star", "favorite", "rating", "gold"] },
    { emoji: "🌟", keywords: ["glowing", "star", "shine", "bright"] },
    { emoji: "💫", keywords: ["dizzy", "star", "shooting", "sparkle"] },
    { emoji: "🔥", keywords: ["fire", "hot", "lit", "flame", "trending"] },
    { emoji: "💥", keywords: ["boom", "explosion", "collision", "impact"] },
    {
      emoji: "🎉",
      keywords: ["party", "celebration", "confetti", "tada", "congrats"],
    },
    { emoji: "🎊", keywords: ["confetti", "ball", "party", "celebration"] },
    {
      emoji: "🏆",
      keywords: ["trophy", "winner", "champion", "award", "prize"],
    },
    { emoji: "🥇", keywords: ["gold", "medal", "first", "winner", "champion"] },
    { emoji: "🥈", keywords: ["silver", "medal", "second", "runner up"] },
    { emoji: "🥉", keywords: ["bronze", "medal", "third", "place"] },
  ],
};

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function EmojiPicker({
  onEmojiSelect,
  isOpen,
  onClose,
}: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof EMOJI_DATA>("Smileys");
  const [searchQuery, setSearchQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  // Filter emojis by search
  const getFilteredEmojis = (): { emoji: string; keywords: string[] }[] => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return EMOJI_DATA[activeCategory];
    }

    // Search across all categories
    const results: { emoji: string; keywords: string[] }[] = [];
    Object.values(EMOJI_DATA).forEach((categoryEmojis) => {
      categoryEmojis.forEach((item) => {
        if (item.keywords.some((keyword) => keyword.includes(query))) {
          results.push(item);
        }
      });
    });

    return results;
  };

  const categories = Object.keys(EMOJI_DATA) as (keyof typeof EMOJI_DATA)[];
  const filteredEmojis = getFilteredEmojis();

  return (
    <div
      ref={pickerRef}
      className="bg-background border-border absolute bottom-full left-0 z-50 mb-2 w-80 rounded-lg border shadow-lg"
    >
      {/* Search */}
      <div className="border-border border-b p-2">
        <input
          type="text"
          placeholder="Rechercher un emoji..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-background border-border focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {/* Category tabs */}
      {!searchQuery && (
        <div className="border-border flex overflow-x-auto border-b">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? "text-primary border-primary border-b-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="h-48 overflow-y-auto p-2">
        {filteredEmojis.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            Aucun emoji trouve pour &quot;{searchQuery}&quot;
          </p>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {filteredEmojis.map((item, index) => (
              <button
                key={`${item.emoji}-${index}`}
                onClick={() => handleEmojiClick(item.emoji)}
                className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded text-xl transition-colors"
                title={item.keywords.join(", ")}
              >
                {item.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmojiPicker;
