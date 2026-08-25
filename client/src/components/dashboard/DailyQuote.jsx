import { motion } from "framer-motion";
import {
  Quote,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useState } from "react";

const quotes = [
  {
    text: "You do not have to have everything figured out to take one kind step forward.",
    author: "UNWIND Reflection"
  },
  {
    text: "Rest is not a reward for finishing everything. It is part of being human.",
    author: "UNWIND Reflection"
  },
  {
    text: "Some days, simply staying present is enough progress.",
    author: "UNWIND Reflection"
  },
  {
    text: "Your feelings deserve attention, not judgement.",
    author: "UNWIND Reflection"
  },
  {
    text: "Small moments of calm can slowly change the shape of a difficult day.",
    author: "UNWIND Reflection"
  },
  {
    text: "You are allowed to move through life at a pace that feels safe for you.",
    author: "UNWIND Reflection"
  },
  {
    text: "Being gentle with yourself is also a form of strength.",
    author: "UNWIND Reflection"
  }
];

function getDailyQuoteIndex() {
  const today = new Date();

  const dateNumber =
    today.getFullYear() * 1000 +
    today.getMonth() * 40 +
    today.getDate();

  return dateNumber % quotes.length;
}

function DailyQuote() {
  const [quoteIndex, setQuoteIndex] = useState(
    getDailyQuoteIndex
  );

  const quote = quotes[quoteIndex];

  const showAnotherQuote = () => {
    setQuoteIndex(
      (currentIndex) =>
        (currentIndex + 1) % quotes.length
    );
  };

  return (
    <motion.article
      className="dashboard-widget daily-quote"
      initial={{
        opacity: 0,
        y: 24
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.5,
        delay: 0.12
      }}
    >
      <div className="daily-quote__decoration daily-quote__decoration--one" />
      <div className="daily-quote__decoration daily-quote__decoration--two" />

      <div className="daily-quote__header">
        <span>
          <Sparkles size={14} />
          A thought for today
        </span>

        <button
          type="button"
          onClick={showAnotherQuote}
          aria-label="Show another quote"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <motion.div
        key={quoteIndex}
        className="daily-quote__content"
        initial={{
          opacity: 0,
          y: 10
        }}
        animate={{
          opacity: 1,
          y: 0
        }}
      >
        <Quote size={32} />

        <blockquote>
          “{quote.text}”
        </blockquote>

        <p>{quote.author}</p>
      </motion.div>
    </motion.article>
  );
}

export default DailyQuote;