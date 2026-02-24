import { useEffect, useState } from 'react';

function TypingText({
  phrases = [],
  typingSpeed = 120,
  deletingSpeed = 70,
  pauseTime = 1500,
  className = '',
}) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length) return;

    const currentPhrase = phrases[index % phrases.length];

    let timer;

    if (!isDeleting && text === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), pauseTime);
    } else if (isDeleting && text === '') {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % phrases.length);
      }, 0);
    } else {
      timer = setTimeout(
        () => {
          const nextLength = text.length + (isDeleting ? -1 : 1);
          setText(currentPhrase.slice(0, nextLength));
        },
        isDeleting ? deletingSpeed : typingSpeed
      );
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, phrases, typingSpeed, deletingSpeed, pauseTime]);

  if (!phrases.length) return null;

  return (
    <span className={`typing-caret ${className}`}>
      {text}
    </span>
  );
}

export default TypingText;

