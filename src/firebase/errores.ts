const mensajes: Record<string, string> = {
  "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
  "auth/invalid-credential": "El correo o la contraseña no son correctos.",
  "auth/invalid-email": "Escribe un correo válido.",
  "auth/network-request-failed": "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
  "auth/operation-not-allowed": "Este método de acceso aún no está habilitado en Firebase.",
  "auth/popup-closed-by-user": "Se cerró la ventana de Google antes de terminar.",
  "auth/popup-blocked":
    "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.",
  "auth/too-many-requests": "Hubo muchos intentos. Espera un momento y vuelve a probar.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase Authentication.",
  "auth/weak-password": "La contraseña no cumple los requisitos.",
  "auth/password-does-not-meet-requirements":
    "La contraseña debe tener al menos 6 caracteres, una mayúscula, un número y un carácter especial.",
};

export function mensajeDeError(error: unknown) {
  const codigo = (error as { code?: string })?.code;
  return (
    mensajes[codigo ?? ""] ??
    `No se pudo completar la acción. Inténtalo de nuevo. (${codigo ?? "error desconocido"})`
  );
}
