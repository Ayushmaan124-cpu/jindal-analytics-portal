import React, { useMemo, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { fmt } from "../utils/calculations.js";

function getHour(dateValue) {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function buildAnswer(question, data) {
  const q = question.toLowerCase();

  const totalTonnage = data.reduce((s, r) => s + Number(r.weight || 0), 0);
  const totalCoils = data.length;
  const avgWeight = totalCoils ? totalTonnage / totalCoils : 0;

  const hourly = {};
  data.forEach((row) => {
    const hour = getHour(row.production_date);
    if (!hourly[hour]) hourly[hour] = { hour, tonnage: 0, coils: 0 };
    hourly[hour].tonnage += Number(row.weight || 0);
    hourly[hour].coils += 1;
  });

  const hours = Object.values(hourly).filter((h) => h.hour !== "Unknown");

  const bestHour = [...hours].sort((a, b) => b.tonnage - a.tonnage)[0];
  const worstHour = [...hours].sort((a, b) => a.tonnage - b.tonnage)[0];

  if (q.includes("tph") || q.includes("hour")) {
    if (!hours.length) return "I could not calculate TPH because valid Product Time data is not available.";

    return `TPH analysis: Best production hour was ${bestHour.hour} with ${fmt(bestHour.tonnage, 0)} MT. Lowest production hour was ${worstHour.hour} with ${fmt(worstHour.tonnage, 0)} MT. A drop in TPH usually indicates lower rolled tonnage, fewer coils, higher time gap between coils, furnace waiting, mill delay, or operational stoppage.`;
  }

  if (q.includes("summary") || q.includes("summarize")) {
    return `Production summary: The selected data contains ${fmt(totalCoils)} coils with total rolled tonnage of ${fmt(totalTonnage, 0)} MT. Average coil weight is ${avgWeight.toFixed(2)} MT. ${bestHour ? `Highest hourly production was at ${bestHour.hour}.` : ""}`;
  }

  if (q.includes("best") || q.includes("highest")) {
    return bestHour
      ? `The best production hour was ${bestHour.hour}, with ${fmt(bestHour.tonnage, 0)} MT rolled across ${fmt(bestHour.coils)} coils.`
      : "I could not identify the best hour because valid time data is missing.";
  }

  if (q.includes("low") || q.includes("drop") || q.includes("delay")) {
    return worstHour
      ? `The lowest production hour was ${worstHour.hour}, with ${fmt(worstHour.tonnage, 0)} MT. Possible reasons may include lower coil count, lower average coil weight, waiting time, furnace delay, mill delay, or operational interruption. Exact delay reason requires a delay reason column from the database.`
      : "I could not identify a TPH drop because valid time data is missing.";
  }

  return `Based on the selected data: total coils are ${fmt(totalCoils)}, total tonnage is ${fmt(totalTonnage, 0)} MT, and average coil weight is ${avgWeight.toFixed(2)} MT. Ask me about TPH, best hour, lowest hour, delay, or production summary.`;
}

export default function AIAssistant({ data }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hello, I am your HSM AI Assistant. Ask me about TPH, production summary, best hour, lowest TPH, or possible delay reasons."
    }
  ]);
  const [thinking, setThinking] = useState(false);

  const autoSummary = useMemo(() => {
    return buildAnswer("summary", data);
  }, [data]);

  const askAI = () => {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: userQuestion }]);
    setThinking(true);

    setTimeout(() => {
      const answer = buildAnswer(userQuestion, data);
      setMessages((prev) => [...prev, { role: "ai", text: answer }]);
      setThinking(false);
    }, 700);
  };

  return (
    <div className="ai-assistant-card">
      <div className="ai-header">
        <div className="ai-orb">
          <Bot size={24} />
        </div>

        <div>
          <h2>HSM AI Production Assistant</h2>
          <p>Ask questions about TPH, production, delays, coils and performance.</p>
        </div>

        <Sparkles className="ai-sparkle" size={22} />
      </div>

      <div className="ai-summary-box">
        <b>Auto Summary</b>
        <p>{autoSummary}</p>
      </div>

      <div className="ai-chat-window">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "ai-msg user" : "ai-msg bot"}>
            {m.text}
          </div>
        ))}

        {thinking && (
          <div className="ai-msg bot typing">
            AI is analyzing production records...
          </div>
        )}
      </div>

      <div className="ai-input-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") askAI();
          }}
          placeholder="Ask: Why did TPH drop? Which hour was best?"
        />

        <button onClick={askAI}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}