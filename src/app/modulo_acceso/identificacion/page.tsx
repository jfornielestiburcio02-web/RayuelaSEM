import React from "react";

export default function SystemHasCollectedErrors1() {
  // Función que se ejecuta al pulsar el botón
  const ejecutarAccion = () => {
    try {
      // Llama a tu función de JS con los parámetros indicados
      prepararAccesoAplicacion(`EJECUCIONERRORES`, "SEMac4");
    } catch (error) {
      console.error("Error al ejecutar prepararAccesoAplicacion:", error);
      alert("No se pudo ejecutar la acción. Revisa la consola.");
    }
  };

  return (
    <div style={{
      fontFamily: "Verdana, sans-serif",
      backgroundColor: "#f4f4f4",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        textAlign: "center",
        maxWidth: "500px"
      }}>
        <h1 style={{ color: "#f44336" }}>Imposibilidad de conectar de nuevo la app</h1>
        <p>SystemHasCollectedErrors1.js</p>
        <button
          onClick={ejecutarAccion}
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
          Ejecutar Acción
        </button>
      </div>
    </div>
  );
}
