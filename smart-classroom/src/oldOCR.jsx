import { useState, useEffect } from "react";
import {
  Lightbulb,
  Monitor,
  Wifi,
  BellRing,
} from "lucide-react";

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= OCR ================= */
  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "eng");
    formData.append("apikey", "K83793786488957");

    try {
      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      const text = data.ParsedResults?.[0]?.ParsedText || "";

      setOcrText(text);
      setRooms(parseSchedule(text));
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  /* ================= PARSING ================= */
  const parseSchedule = (text) => {
    const lines = text.split("\n");
    const data = [];

    lines.forEach((line, i) => {
      const clean = line.replace(/[^a-zA-Z0-9:\-\s]/g, "").trim();

      const match = clean.match(
        /(Room\s*\w+|\w+\d)\s*(\d{1,2}:\d{2})\s*[-to]+\s*(\d{1,2}:\d{2})\s*(.+)/i
      );

      if (match) {
        data.push({
          id: i,
          name: match[1].includes("Room")
            ? match[1]
            : "Room " + match[1],
          startTime: match[2],
          endTime: match[3],
          lecture: match[4],
          light: false,
          mode: "auto",
        });
      }
    });

    return data;
  };

  /* ================= AUTO LIGHT ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const current =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");

      setRooms((prev) =>
        prev.map((room) => {
          if (room.mode !== "auto") return room;

          if (room.startTime && room.endTime) {
            const isOn =
              current >= room.startTime &&
              current <= room.endTime;

            return { ...room, light: isOn };
          }

          return room;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ================= MANUAL ================= */
  const updateRoom = (id, mode) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === id
          ? {
              ...room,
              mode,
              light:
                mode === "manual_on"
                  ? true
                  : mode === "manual_off"
                  ? false
                  : room.light,
            }
          : room
      )
    );
  };

  const activeRooms = rooms.filter((room) => room.light).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between gap-6 mb-10">
        <div>
          <h1 className="sm:text-4xl md:text-5xl  font-bold flex items-center gap-3">
            <Monitor className="text-cyan-400" />
            Smart Classroom
          </h1>
          <p className="text-slate-400">IoT Real-Time Classroom Light Control Dashboard</p>
        </div>

        <div className="grid  sm:grid-cols-2 xl:grid-cols-2  gap-4">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 min-w-[180px]">
            Rooms: <b>{rooms.length}</b>
          </div>
          <div className="text-green-400 bg-white/5 border border-white/10 rounded-3xl p-5 min-w-[180px]">
            ON: <b>{activeRooms}</b>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-6">
        <input type="file" onChange={handleImage} />
        {loading && <p className="text-yellow-400">Processing...</p>}
      </div>

      {/* OCR Text */}
      {ocrText && (
        <pre className="text-xs text-gray-400 mb-6 max-h-40 overflow-auto">
          {ocrText}
        </pre>
      )}

      {/* Status */}
      <div className="flex justify-between mb-6">
        <div className="flex items-center gap-2 text-green-400">
          <Wifi /> Connected
        </div>

        <div className="flex items-center gap-2 text-cyan-400">
          <BellRing /> Live
        </div>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white/5 p-5 rounded-xl border border-white/10"
          >
            <h2 className="text-xl font-bold">{room.name}</h2>

            <p className="text-sm text-gray-400">
              {room.startTime} → {room.endTime}
            </p>

            <p className="mt-2">{room.lecture}</p>

            <p
              className={
                room.light
                  ? "text-green-400 mt-2"
                  : "text-red-400 mt-2"
              }
            >
              {room.light ? "ON" : "OFF"}
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => updateRoom(room.id, "manual_on")}
                className="bg-green-500 px-3 py-1 rounded"
              >
                ON
              </button>

              <button
                onClick={() => updateRoom(room.id, "manual_off")}
                className="bg-red-500 px-3 py-1 rounded"
              >
                OFF
              </button>

              <button
                onClick={() => updateRoom(room.id, "auto")}
                className="bg-blue-500 px-3 py-1 rounded"
              >
                AUTO
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}