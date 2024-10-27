"use client";
import { useState } from "react";

export default function Home() {
    const [topic, setTopic] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/askQuestion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ topic }),
            });

            if (!res.ok) {
                throw new Error("Failed to fetch response");
            }

            const data = await res.json();
            setResponse(data.response);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h1>AI Legal Expert</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter a topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    style={{ color: "black" }}  
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Generating..." : "Get Response"}
                </button>
            </form>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {response && (
                <div>
                    <h2>Response:</h2>
                    <p>{response}</p>
                </div>
            )}
        </div>
    );
}
