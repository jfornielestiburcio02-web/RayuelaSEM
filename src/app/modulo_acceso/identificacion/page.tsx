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

        .system-down p {
          font-size: 1.1rem;
          margin: 6px 0;
          color: #ff8a8a;
        }


        .system-down .signature {
          margin-top: 40px;
          font-size: 0.9rem;
          color: #ff0000;
          opacity: 0.8;

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
        <p>El personal técnico ha sido notificado.</p>

        <p className="signature">Att: doctor4446666</p>
      </div>
    </>
  );
}
