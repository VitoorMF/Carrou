import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "./lib/firebase";

export default function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function gerar() {
    setLoading(true);
    const fn = httpsCallable(functions, "generate");
    const res = await fn({ input: text });
    setResult(res.data);
    setLoading(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2>Carrosselize 🚀</h2>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cole um texto grande aqui"
        style={{ width: "100%", height: 160 }}
      />

      <button onClick={gerar} disabled={loading}>
        {loading ? "Gerando..." : "Gerar carrossel"}
      </button>

      {result && (
        <pre style={{ marginTop: 16 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
