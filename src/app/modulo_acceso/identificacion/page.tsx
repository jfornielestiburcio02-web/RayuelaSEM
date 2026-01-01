// SystemHasCollectedErrors1.jsx
"use client"; // Esto indica a Next.js que todo dentro es Client Component

import React from "react";

export default function SystemHasCollectedErrors1() {
  const ejecutarAccion = () => {
    prepararAccesoAplicacion(`EJECUCIONERRORES`, "SEMac4");
  };

  return (
    <div style={{
      fontFamily: "Verdana",
      backgroundColor: "#f4f4f4",
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "10px",
        textAlign: "center",
        maxWidth: "500px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
      }}>
        <h1 style={{ color: "#f44336" }}>Imposibilidad de conectar de nuevo la app</h1>
        <p>SystemHasCollectedErrors1.js</p>
        <button
          onClick={ejecutarAccion} // ✅ Ahora permitido
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#2196F3",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
        </button>
      </div>
    </div>
  );
}
