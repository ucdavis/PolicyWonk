import confetti from 'canvas-confetti';

const defaults = {
  particleCount: 100,
  spread: 70,
};

export const throwConfetti = () => {
  try {
    confetti({
      ...defaults,
    });
  } catch (e) {
    // swallow any errors
  }
};

export const throwConfettiAt = (element: HTMLButtonElement | null) => {
  if (element) {
    const { left, top, width, height } = element.getBoundingClientRect();

    const x = left + width / 2;
    const y = top + height / 2;

    try {
      confetti({
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        ...defaults,
      });
    } catch (e) {
      // swallow any errors
    }
  }
};
