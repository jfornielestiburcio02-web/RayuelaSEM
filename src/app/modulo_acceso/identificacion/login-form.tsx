// MaintenancePage.jsx
import React from "react";

export default function MaintenancePage() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🚧 Página en Mantenimiento 🚧</h1>
      <p style={styles.info}><strong>Encargado:</strong> Juan Matamoros</p>
      <p style={styles.info}><strong>Tiempo Estimado:</strong> 24-48h</p>
      <p style={styles.info}><strong>Motivo:</strong> Error de seguridad fatal.</p>
      <p style={styles.note}>Estamos trabajando para resolverlo lo antes posible. Gracias por tu paciencia.</p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    fontFamily: "Tahoma, sans-serif",
    textAlign: "center",
    padding: "20px",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "20px",
  },
  info: {
    fontSize: "1.2rem",
    margin: "5px 0",
  },
  note: {
    marginTop: "20px",
    fontSize: "1rem",
    fontStyle: "italic",
  },
};
