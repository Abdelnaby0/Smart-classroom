import { useState, useEffect } from "react";
import { set, ref, onValue, update } from "firebase/database";
import { db } from "./firebase";
import Login from "./Login";
import {
  Lightbulb,
  School,
  Cpu,
  Power,
  Settings,
  Monitor,
  Wifi,
  BellRing,
  Upload
} from "lucide-react";

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("auth") === "true"
  );
  /* ================= DEFAULT DATA ================= */
  const defaultRooms = {
    Room1: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" },
    Room2: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" },
    Room3: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" },
    Room4: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" }
  };

  /* ================= INIT FIREBASE ================= */
  const initializeFirebase = async () => {
    const initRef = ref(db, "initialized");

    onValue(initRef, async (snapshot) => {
      const initialized = snapshot.val();

      if (!initialized) {
        console.log("First time setup...");

        await set(ref(db, "rooms"), defaultRooms);
        await set(ref(db, "initialized"), true);
      }
    }, { onlyOnce: true });
  };

  /* ================= TIME PARSER ================= */
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return null;

    const match = timeStr.trim().toUpperCase().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
    if (!match) return null;

    let h = parseInt(match[1]);
    let m = parseInt(match[2]);
    const period = match[3];

    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;

    return h * 60 + m;
  };

  /* ================= OCR ================= */
  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "eng");
    formData.append("apikey", "K83793786488957");
    formData.append("isOverlayRequired", "false");

    try {
      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.IsErroredOnProcessing) {
        console.log("OCR ERROR:", data.ErrorMessage);
        setLoading(false);
        return;
      }

      const text = data.ParsedResults?.[0]?.ParsedText || "";

      const parsed = parseSchedule(text);

      await syncWithFirebase(parsed);

      setHasData(true);
      console.log(data);


    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  /* ================= PARSE ================= */
  const parseSchedule = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && l !== "O" && l !== "0");

    let mode = "";
    const rooms = [];
    const startTimes = [];
    const endTimes = [];
    const subjects = [];

    const fixTime = (t) => {
      if (!t.match(/AM|PM/i)) return t + " PM";
      return t.toUpperCase();
    };

    lines.forEach((line) => {

      const lower = line.toLowerCase();

      if (lower.includes("room")) return (mode = "room");
      if (lower.includes("start")) return (mode = "start");
      if (lower.includes("end")) return (mode = "end");
      if (lower.includes("subject")) return (mode = "subject");

      line = line.replace(/^[0o]\s*/i, "");
      line = line.replace(/(AM|PM)(\d)/i, "$1 $2");


      if (mode === "room" && /^[A-Z]\d$/i.test(line)) {
        rooms.push(line.toUpperCase());
      }

      else if (mode === "start" && /\d{1,2}:\d{2}/.test(line)) {
        startTimes.push(fixTime(line));
      }

      else if (mode === "end" && /\d{1,2}:\d{2}/.test(line)) {
        endTimes.push(fixTime(line));
      }

      else if (mode === "subject") {
        subjects.push(line);
      }

    });

    const maxLen = Math.max(
      rooms.length,
      startTimes.length,
      endTimes.length,
      subjects.length
    );

    const result = [];

    for (let i = 0; i < maxLen; i++) {
      result.push({
        room: rooms[i] || `Room${i + 1}`,
        startTime: startTimes[i] || "",
        endTime: endTimes[i] || "",
        lecture: subjects[i] || ""
      });
    }

    return result;
  };

  /* ================= FIREBASE SYNC ================= */
  const syncWithFirebase = async (roomsArray) => {
    const updates = {};

    roomsArray.forEach((roomData, index) => {
      const key = `Room${index + 1}`;

      updates[key] = {
        manual: false,
        schedule: true,
        startTime: roomData.startTime,
        endTime: roomData.endTime,
        lecture: roomData.lecture,
      };
    });

    await update(ref(db, "rooms"), updates);
  };

  /* ================= REALTIME ================= */
  useEffect(() => {
    initializeFirebase();

    const roomsRef = ref(db, "rooms");

    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const formatted = Object.keys(data).map((key) => ({
        id: key,
        name: key,
        ...data[key],
      }));

      setRooms(formatted);

      const hasScheduleData = formatted.some(
        (room) =>
          room.startTime !== "" ||
          room.endTime !== "" ||
          room.lecture !== "" ||
          room.schedule === true
      );

      setHasData(hasScheduleData);
    });

    return () => unsub();
  }, []);

  /* ================= AUTO LIGHT ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      rooms.forEach((room) => {

        if (room.manual === true) return;

        const start = parseTimeToMinutes(room.startTime);
        const end = parseTimeToMinutes(room.endTime);

        if (start === null || end === null) return;

        // eslint-disable-next-line no-useless-assignment
        let isOn = false;

        if (start <= end) {
          isOn = currentMinutes >= start && currentMinutes < end;
        } else {
          isOn = currentMinutes >= start || currentMinutes < end;
        }

        if (room.light !== isOn) {
          update(ref(db, `rooms/${room.id}`), {
            light: isOn
          });
        }

      });

    }, 1000);

    return () => clearInterval(interval);
  }, [rooms]);

  /* ================= MANUAL CONTROL ================= */
  const updateRoom = (id, mode) => {
    const roomRef = ref(db, `rooms/${id}`);

    if (mode === "manual_on") {
      update(roomRef, { manual: true, schedule: false, light: true });
    }

    if (mode === "manual_off") {
      update(roomRef, { manual: true, schedule: false, light: false });
    }

    if (mode === "auto") {
      update(roomRef, { manual: false, schedule: true });
    }
  };
  //==================== RESET BUTTON ====================//
  const resetSchedule = async () => {
    const cleanRooms = {
      Room1: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" },
      Room2: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" },
      Room3: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" },
      Room4: { manual: false, schedule: false, light: false, startTime: "", endTime: "", lecture: "" }
    };

    await set(ref(db, "rooms"), cleanRooms);
  };
  const activeRooms = rooms.filter((r) => r.light).length;
  const logout = () => {
    localStorage.removeItem("auth");
    window.location.reload();
  };

  if (!isAuth) {
    return <Login onLogin={setIsAuth} />;
  }
  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 sm:-70 md:w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full"></div>
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-10">

          {/* TOP ROW ) */}
          <div className="w-full md:w-2/3 flex items-center justify-between lg:justify-start">

            {/* TITLE */}
            <div>
              <h1 className="text-xl md:text-4xl xlg:text-5xl font-bold flex items-center gap-3">
                <Monitor size={36} className="text-cyan-400" />
                Smart Classroom
              </h1>
              <p className="text-slate-400 mt-2 hidden sm:block text-base">
                IoT Real-Time Classroom Light Control Dashboard
              </p>
            </div>

            {/*  Logout Button */}
            <button
              onClick={logout}
              className="lg:hidden bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-xl hover:bg-red-500 hover:text-white transition text-sm font-semibold"
            >
              Logout
            </button>
          </div>

          {/* RIGHT SECTION */}
          <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-around">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 w-full">

              {/* Total */}
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl overflow-hidden w-full">
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl opacity-30"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs sm:text-sm">Total</p>
                    <Monitor size={16} className="text-cyan-400" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold mt-1">
                    {rooms.length}
                  </h2>

                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 w-full"></div>
                  </div>
                </div>
              </div>

              {/* Active */}
              <div className="relative bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl overflow-hidden w-full">
                <div className="absolute inset-0 bg-green-500/10 blur-xl opacity-30"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400 text-xs sm:text-sm">Active</p>
                    <Lightbulb size={16} className="text-green-400" />
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold mt-1 text-green-400">
                    {activeRooms}
                  </h2>

                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-green-400 transition-all duration-500"
                      style={{
                        width: `${rooms.length ? (activeRooms / rooms.length) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>

            {/*  Logout Desktop */}
            <button
              onClick={logout}
              className="hidden lg:block bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition font-semibold"
            >
              Logout
            </button>

          </div>

        </div>


        {/* OCR UPLOAD */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <label className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl cursor-pointer flex items-center gap-2 transition-colors duration-200">
              <span>Upload Schedule</span>
              <Upload size={20} />
              <input type="file" onChange={handleImage} className="hidden" />
            </label>
            <div className="w-full md:w-1/2 flex justify-center md:justify-end">
              {hasData && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset all schedules?")) {
                      resetSchedule();
                    }
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
                >
                  Reset Schedule
                </button>
              )}
            </div>
          </div>

          {loading && (
            <p className="text-yellow-400 mt-2">Processing OCR...</p>
          )}
        </div>

        {/* BEFORE DATA */}
        {
          !hasData ? (
            <div className="text-gray-400 mt-10">
              Upload schedule image to load rooms...
            </div>
          ) : (
            <>
              {/* STATUS */}
              {/* System Status */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-8 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Wifi className="text-green-400" />
                  <span className="text-md xl:text-lg">System Connected</span>
                </div>

                <div className="flex items-center gap-2 text-cyan-400">
                  <BellRing size={18} />
                  <span >Live Monitoring</span>
                </div>
              </div>

              {/* ROOMS */}
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="group bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl hover:border-cyan-400/40 hover:scale-105 transition duration-300 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold">{room.name}</h2>
                        <p className="text-slate-400 text-sm">Classroom</p>
                      </div>
                      <div
                        className={`p-4 rounded-2xl transition ${room.light
                          ? "bg-yellow-400/20 text-yellow-300"
                          : "bg-slate-700 text-slate-400"
                          }`}
                      >
                        <Lightbulb size={28} />
                      </div>

                    </div>
                    <p className="text-sm text-gray-400 pb-1">
                      {room.startTime || "--"} → {room.endTime || "--"}
                    </p>

                    <div className="flex items-center gap-2 text-slate-300 pb-2">
                      <School size={18} />
                      <span>{room.lecture}</span>
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Power
                        size={18}
                        className={
                          room.light ? "text-green-400" : "text-red-400"
                        }
                      />
                      <span
                        className={`font-semibold ${room.light ? "text-green-400" : "text-red-400"
                          }`}
                      >
                        {room.light ? "LIGHT ON" : "LIGHT OFF"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-cyan-400 pb-3">
                      <Cpu size={18} />
                      <p className="font-semibold text-cyan-400 uppercase">
                        {room.manual ? "MANUAL" : "AUTO"}
                      </p>
                    </div>
                    {/* Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => updateRoom(room.id, "manual_on")}
                        className="bg-green-500 hover:bg-green-600 py-2 rounded-xl text-sm font-semibold transition-colors duration-200"
                      >
                        ON
                      </button>

                      <button
                        onClick={() => updateRoom(room.id, "manual_off")}
                        className="bg-red-500 hover:bg-red-600 py-2 rounded-xl text-sm font-semibold transition-colors duration-200"
                      >
                        OFF
                      </button>

                      <button
                        onClick={() => updateRoom(room.id, "auto")}
                        className="bg-cyan-500 hover:bg-cyan-600 py-2 rounded-xl text-sm font-semibold flex justify-center items-center gap-1 transition-colors duration-200"
                      >
                        <Settings size={15} />
                        AUTO
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </>
          )
        }
      </div>
    </div >
  );
}