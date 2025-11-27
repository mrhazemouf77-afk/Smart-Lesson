import React from 'react';

const GeneratingAnimation: React.FC = () => (
  <svg
    width="50"
    height="50"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <style>{`
      .dot {
        fill: #fff;
        animation: pulse 1.4s ease-in-out infinite;
      }
      .dot-1 { animation-delay: -0.3s; }
      .dot-2 { animation-delay: -0.15s; }
      .dot-3 { animation-delay: 0s; }
      @keyframes pulse {
        0%, 80%, 100% {
          transform: scale(0.8);
          opacity: 0.5;
        }
        40% {
          transform: scale(1.2);
          opacity: 1;
        }
      }
    `}</style>
    <circle className="dot dot-1" cx="25" cy="50" r="10" />
    <circle className="dot dot-2" cx="50" cy="50" r="10" />
    <circle className="dot dot-3" cx="75" cy="50" r="10" />
  </svg>
);

export default GeneratingAnimation;
