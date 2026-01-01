export default function SystemDown() {
  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .system-down {
          min-height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at center, #1a0000 0%, #000 75%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-family: Verdana, Geneva, sans-serif;
          color: #ff3b3b;
          overflow: hidden;
        }

        .system-down h1 {
          font-size: 3rem;
          letter-spacing: 4px;
          margin-bottom: 25px;
          text-transform: uppercase;
          animation: flicker 2s infinite;
          text-shadow:
            0 0 5px #ff0000,
            0 0 15px #ff0000,
            0 0 30px #ff1a1a;
        }

        .system-down p {
          font-size: 1.1rem;
          margin: 6px 0;
          color: #ff8a8a;
        }

        .system-down .critical {
          color: #ffffff;
          font-weight: bold;
          margin-top: 15px;
          text-shadow: 0 0 8px #ff0000;
        }

        .system-down .signature {
          margin-top: 40px;
          font-size: 0.9rem;
          color: #ff0000;
          opacity: 0.8;
        }

        @keyframes flicker {
          0% { opacity: 1; }
          5% { opacity: 0.6; }
          10% { opacity: 1; }
          15% { opacity: 0.3; }
          20% { opacity: 1; }
          100% { opacity: 1; }
        }

        .scanlines::before {
          content: "";
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.03),
            rgba(255,255,255,0.03) 1px,
            transparent 1px,
            transparent 3px
          );
          pointer-events: none;
        }
      `}</style>

      <div className="system-down scanlines">
        <h1>SISTEMA HA CAÍDO</h1>

        <p>Se ha detectado un fallo crítico en la infraestructura.</p>
        <p className="critical">Todos los servicios están inoperativos.</p>
        <p>No intente reiniciar el sistema.</p>

      </div>
    </>
  );
}
