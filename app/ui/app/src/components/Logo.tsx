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
            animation: float 3s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
