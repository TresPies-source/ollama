export default function Logo() {
  return (
    <div className="flex mb-8 justify-center select-none">
      <div className="relative select-none">
        <img
          src="/favicon.png"
          alt="Dojo Genesis"
          width="64"
          height="64"
          className="select-none rounded-full shadow-lg animate-float"
        />
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
