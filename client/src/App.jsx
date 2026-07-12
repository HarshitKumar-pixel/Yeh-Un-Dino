import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import "./App.css";

const TITLE = "Yeh Un Dino Ki Baat Hai...";
const TYPE_SPEED = 90; // ms per character

const YEAR_FLICKER = [1998, 2002, 2007, 2011, 1994, 2005, 2013, 2000, 2009];
const SEARCH_MESSAGES = [
  "Finding someone who remembers...",
  "Looking through old photo albums...",
  "Dusting off forgotten memories...",
  "Opening the diary...",
];
const LOADING_DURATION = 5000; // ms
const HANDOFF_DELAY = 1500; // ms — pause on "Memory Found." before entering chat
const socket = io("http://localhost:3001");

const NOSTALGIA_PROMPTS = [
  "Remember rushing home to watch your favourite cartoon?",
  "Do you remember your first bicycle?",
  "What was the first song you knew all the words to?",
  "Remember writing letters and waiting weeks for a reply?",
  "What did your school lunchbox look like?",
  "Remember the sound of a dial-up modem connecting?",
];





/* ===================================================================
   LANDING PAGE (unchanged design)
=================================================================== */
function LandingPage({ onOpenCapsule, onFeelingNostalgic }) {
  const [typed, setTyped] = useState("");
  const [doneTyping, setDoneTyping] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTyped(TITLE.slice(0, i));
      if (i >= TITLE.length) {
        clearInterval(interval);
        setDoneTyping(true);
      }
    }, TYPE_SPEED);
    return () => clearInterval(interval);
  }, []);

  const dust = Array.from({ length: 18 });

  return (
    <div className="landing">
      {/* wooden desk backdrop */}
      <div className="desk" aria-hidden="true" />

      {/* CRT glow sitting behind the diary page */}
      <div className="crt-glow" aria-hidden="true" />

      {/* floating dust particles */}
      <div className="dust-layer" aria-hidden="true">
        {dust.map((_, idx) => (
          <span
            key={idx}
            className="dust-mote"
            style={{
              left: `${(idx * 53.7) % 100}%`,
              animationDelay: `${(idx * 1.7) % 12}s`,
              animationDuration: `${14 + (idx % 6) * 2}s`,
              opacity: 0.15 + (idx % 5) * 0.06,
            }}
          />
        ))}
      </div>

      {/* film grain overlay */}
      <div className="film-grain" aria-hidden="true" />

      {/* ===== decorative polaroids ===== */}
      <motion.div
        className="polaroid polaroid--left"
        initial={{ opacity: 0, y: 40, rotate: -18 }}
        animate={{ opacity: 1, y: 0, rotate: -9 }}
        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
      >
        <div className="polaroid__photo polaroid__photo--sunset" />
        <p className="polaroid__caption">summer, '99</p>
      </motion.div>

      <motion.div
        className="polaroid polaroid--right"
        initial={{ opacity: 0, y: 40, rotate: 16 }}
        animate={{ opacity: 1, y: 0, rotate: 8 }}
        transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
      >
        <div className="polaroid__photo polaroid__photo--field" />
        <p className="polaroid__caption">us, before</p>
      </motion.div>

      <motion.div
        className="polaroid polaroid--bottom"
        initial={{ opacity: 0, y: 50, rotate: 6 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
      >
        <div className="polaroid__photo polaroid__photo--dusk" />
        <p className="polaroid__caption">that evening</p>
      </motion.div>

      {/* ===== cassette tape illustration ===== */}
      <motion.div
        className="cassette"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.9, ease: "easeOut" }}
        aria-hidden="true"
      >
        <div className="cassette__body">
          <div className="cassette__label">
            <span>mixtape / side A</span>
          </div>
          <div className="cassette__reels">
            <div className="cassette__reel" />
            <div className="cassette__reel" />
          </div>
          <div className="cassette__screws">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </motion.div>

      {/* ===== main diary page ===== */}
      <main className="diary-page">
        <div className="diary-page__stain diary-page__stain--one" aria-hidden="true" />
        <div className="diary-page__stain diary-page__stain--two" aria-hidden="true" />
        <div className="diary-page__stain diary-page__stain--three" aria-hidden="true" />

        <span className="diary-page__eyebrow">a memory exchange</span>

        <h1 className="title">
          {typed}
          <span className={`caret ${doneTyping ? "caret--blink" : ""}`}>|</span>
        </h1>

        <motion.p
          className="subtitle"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: doneTyping ? 1 : 0, y: doneTyping ? 0 : 12 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          Meet strangers through memories.
        </motion.p>

        <motion.div
          className="cta-group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: doneTyping ? 1 : 0, y: doneTyping ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <button
            type="button"
            className="btn btn--primary"
            onClick={onOpenCapsule}
          >
            <span className="btn__seal" aria-hidden="true" />
            Open the Time Capsule
          </button>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={onFeelingNostalgic}
          >
            I'm Feeling Nostalgic 🎲
          </button>
        </motion.div>

        <div className="diary-page__stitching" aria-hidden="true" />
      </main>
    </div>
  );
}

/* ===================================================================
   TIME CAPSULE LOADING SCREEN (unchanged design; now hands off to chat)
=================================================================== */
function TimeCapsuleLoading({ onComplete }) {
  const [yearIndex, setYearIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [finalYear, setFinalYear] = useState(null);
  const [found, setFound] = useState(false);

  useEffect(() => {
    const yearTimer = setInterval(() => {
      setYearIndex((i) => (i + 1) % YEAR_FLICKER.length);
    }, 420);

    const messageTimer = setInterval(() => {
      setMessageIndex((i) => (i + 1) % SEARCH_MESSAGES.length);
    }, 1100);

    const settleTimer = setTimeout(() => {
      clearInterval(yearTimer);
      clearInterval(messageTimer);
      const randomYear = Math.floor(Math.random() * (2016 - 1988 + 1)) + 1988;
      setFinalYear(randomYear);
      setFound(true);

      const handoffTimer = setTimeout(() => {
        if (onComplete) onComplete(randomYear);
      }, HANDOFF_DELAY);

      return () => clearTimeout(handoffTimer);
    }, LOADING_DURATION);

    return () => {
      clearInterval(yearTimer);
      clearInterval(messageTimer);
      clearTimeout(settleTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dust = Array.from({ length: 14 });
  const displayedYear = found ? finalYear : YEAR_FLICKER[yearIndex];

  return (
    <motion.div
      className="loading-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="desk" aria-hidden="true" />
      <div className="crt-glow crt-glow--loading" aria-hidden="true" />

      <div className="dust-layer" aria-hidden="true">
        {dust.map((_, idx) => (
          <span
            key={idx}
            className="dust-mote"
            style={{
              left: `${(idx * 61.3) % 100}%`,
              animationDelay: `${(idx * 1.4) % 10}s`,
              animationDuration: `${13 + (idx % 5) * 2}s`,
              opacity: 0.15 + (idx % 5) * 0.05,
            }}
          />
        ))}
      </div>

      <div className="film-grain" aria-hidden="true" />

      <div className="loading-content">
        <p className="loading-heading">Searching for memories...</p>

        <div className="year-window">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={found ? `final-${finalYear}` : `y-${yearIndex}`}
              className={`year-number ${found ? "year-number--found" : ""}`}
              initial={{ y: found ? 24 : -18, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: found ? -24 : 18, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: found ? 0.5 : 0.22, ease: "easeOut" }}
            >
              {displayedYear}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="loading-message-slot">
          <AnimatePresence mode="wait">
            {!found ? (
              <motion.p
                key={messageIndex}
                className="loading-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                {SEARCH_MESSAGES[messageIndex]}
              </motion.p>
            ) : (
              <motion.p
                key="found"
                className="memory-found"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                Memory Found.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="loading-dots" aria-hidden="true">
          <span className={found ? "loading-dots__paused" : ""} />
          <span className={found ? "loading-dots__paused" : ""} />
          <span className={found ? "loading-dots__paused" : ""} />
        </div>
      </div>
    </motion.div>
  );
}

/* ===================================================================
   CHAT SCREEN
=================================================================== */
function ChatScreen({ year, roomId, memoryMatch, onCloseDiary }) {
  
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState(
  NOSTALGIA_PROMPTS[Math.floor(Math.random() * NOSTALGIA_PROMPTS.length)]
);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => {
socket.on("receiveMessage", ({ message, senderId }) => {
  if (senderId === socket.id) return;

  setMessages((prev) => [
    ...prev,
    {
      id: `r-${Date.now()}`,
      sender: "stranger",
      text: message,
    },
  ]);
});
socket.on("promptUpdated", ({ prompt }) => {
  setPrompt(prompt);
});

  return () => {
    socket.off("receiveMessage");
    socket.off("promptUpdated");
  };
}, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  

  

  const handleSend = (e) => {
  e.preventDefault();

  const trimmed = draft.trim();

  if (!trimmed) return;

  setMessages((prev) => [
  ...prev,
  {
    id: `y-${Date.now()}`,
    sender: "you",
    text: trimmed,
  },
]);

  socket.emit("sendMessage", {
    roomId,
    message: trimmed,
  });

  setDraft("");
};

  const handleNewPrompt = () => {
  socket.emit("newPrompt", { roomId });
};

  const handleShareMemory = () => {
    alert("Share Memory — coming soon");
  };

  return (
    <motion.div
      className="chat-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className="desk" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />

      <div className="chat-shell">
        <header className="chat-header">
          <div className="chat-header__top">
            <span className="chat-header__year">📼 Year: {year}</span>
            <button
              type="button"
              className="chat-header__close"
              onClick={onCloseDiary}
              aria-label="Close Diary"
            >
              🚪
            </button>
          </div>
          <div className="memory-match">
    ✨ Memory Match: {memoryMatch}%
  </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={prompt}
              className="chat-header__prompt"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              "{prompt}"
            </motion.p>
          </AnimatePresence>
        </header>

        <div className="chat-window" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              className={`bubble-row bubble-row--${msg.sender}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {msg.sender === "stranger" && (
                <span className="bubble-label">Stranger</span>
              )}
              <div
                className={`bubble bubble--${msg.sender}`}
                style={{ "--tilt": `${((idx % 5) - 2) * 0.6}deg` }}
              >
                {msg.text}
              </div>
              {msg.sender === "you" && <span className="bubble-label bubble-label--right">You</span>}
            </motion.div>
          ))}

          <AnimatePresence>
            {isTyping && (
              <motion.div
                className="bubble-row bubble-row--stranger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <span className="bubble-label">Stranger</span>
                <div className="bubble bubble--stranger bubble--typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="chat-toolbar">
          <button type="button" className="chat-pill" onClick={handleShareMemory}>
            📷 Share Memory
          </button>
          <button type="button" className="chat-pill" onClick={handleNewPrompt}>
            🎲 New Prompt
          </button>
          <button type="button" className="chat-pill chat-pill--close" onClick={onCloseDiary}>
            🚪 Close Diary
          </button>
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            placeholder="Write your reply here..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="chat-send" aria-label="Send">
            ✒️
          </button>
        </form>
      </div>
    </motion.div>
  );
}

/* ===================================================================
   APP (screen router — no react-router)
=================================================================== */
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [year, setYear] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [memoryMatch, setMemoryMatch] = useState(null);

  const handleOpenCapsule = () => setScreen("loading");
  const handleFeelingNostalgic = () => {
    alert("Random nostalgia coming soon");
  };
const handleLoadingComplete = (foundYear) => {
  console.log("handleLoadingComplete fired");
  setYear(foundYear);

  socket.emit("joinQueue");


};
  const handleCloseDiary = () => {
  if (roomId) {
    socket.emit("leaveRoom", { roomId });
  }

  setRoomId(null);
  setYear(null);
  setScreen("landing");
};
useEffect(() => {
  socket.on("matched", ({ roomId, year, memoryMatch }) => {
  console.log("Matched!", roomId);

  setRoomId(roomId);
  setYear(year);
  setMemoryMatch(memoryMatch);

  setScreen("chat");
});
  socket.on("partnerLeft", () => {
  alert("📖 This chapter has ended.");

  setRoomId(null);
  setYear(null);
  setScreen("landing");
});

  return () => {
    socket.off("matched");
  };
}, []);
  return (
    <AnimatePresence mode="wait">
      {screen === "landing" && (
        <motion.div
          key="landing"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <LandingPage
            onOpenCapsule={handleOpenCapsule}
            onFeelingNostalgic={handleFeelingNostalgic}
          />
        </motion.div>
      )}

      {screen === "loading" && (
        <TimeCapsuleLoading key="loading" onComplete={handleLoadingComplete} />
      )}

      {screen === "chat" && (
        <ChatScreen
  key="chat"
  year={year}
  roomId={roomId}
  memoryMatch={memoryMatch}
  onCloseDiary={handleCloseDiary}
/>
      )}
    </AnimatePresence>
  );
}