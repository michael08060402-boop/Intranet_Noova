import "@/src/components/auth/EmailVerification.css";

interface EmailVerificationProps {
  correo: string;
  aviso: string;
  error: string;
  onReenviar: () => void;
  onRevisar: () => void;
  onSalir: () => void;
}

export default function EmailVerification({
  correo,
  aviso,
  error,
  onReenviar,
  onRevisar,
  onSalir,
}: EmailVerificationProps) {
  return (
    <main className="verification-page">
      <section className="verification-card" aria-labelledby="verification-title">
        <span className="auth-eyebrow">VERIFICA TU CORREO</span>
        <h1 id="verification-title">Confirma tu cuenta</h1>
        <p>
          Enviamos un enlace de verificación a <strong>{correo}</strong>. Abre
          ese mensaje y confirma tu correo para continuar.
        </p>
        {error && <p className="auth-message auth-message--error" role="alert">{error}</p>}
        {aviso && <p className="auth-message auth-message--success" role="status">{aviso}</p>}
        <div className="verification-actions">
          <button className="auth-submit" type="button" onClick={onRevisar}>
            Ya verifiqué mi correo
          </button>
          <button className="verification-secondary" type="button" onClick={onReenviar}>
            Reenviar correo
          </button>
          <button className="verification-link" type="button" onClick={onSalir}>
            Cerrar sesión
          </button>
        </div>
      </section>
    </main>
  );
}
