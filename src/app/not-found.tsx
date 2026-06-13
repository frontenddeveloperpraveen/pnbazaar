import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      maxWidth: "500px",
      margin: "100px auto",
      textAlign: "center",
      padding: "0 24px"
    }}>
      <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>Page Not Found</h1>
      <p style={{ color: "#666", lineHeight: 1.6, marginBottom: "28px" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" style={{
        display: "inline-block",
        backgroundColor: "#121212",
        color: "white",
        padding: "10px 28px",
        borderRadius: "100px",
        fontWeight: 600,
        textDecoration: "none"
      }}>
        Go Home
      </Link>
    </div>
  );
}
