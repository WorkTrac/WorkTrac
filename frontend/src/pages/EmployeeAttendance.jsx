import { useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { getISTDate } from "../utils/dateUtils";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

function EmployeeAttendance() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [history, setHistory] = useState([]);
    const [todayStatus, setTodayStatus] = useState(null);
    const [deviceId, setDeviceId] = useState("");

    // ✅ Generate device fingerprint using FingerprintJS
    const generateDeviceId = async () => {
        try {
            const fp = await FingerprintJS.load();
            const result = await fp.get();
            const visitorId = result.visitorId;
            localStorage.setItem('worktrac_device_id', visitorId);
            return visitorId;
        } catch (error) {
            console.error("Fingerprint error:", error);
            let fallbackId = localStorage.getItem('worktrac_device_id');
            if (!fallbackId) {
                fallbackId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
                localStorage.setItem('worktrac_device_id', fallbackId);
            }
            return fallbackId;
        }
    };

    // ✅ Initialize device ID on component mount
    useEffect(() => {
        const initDeviceId = async () => {
            let cachedId = localStorage.getItem('worktrac_device_id');
            if (cachedId) {
                setDeviceId(cachedId);
            } else {
                const id = await generateDeviceId();
                setDeviceId(id);
            }
        };
        initDeviceId();
    }, []);

    // Get location
    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }),
                    () => reject(new Error("Unable to get location. Please enable GPS."))
                );
            }
        });
    };

    const loadHistory = async () => {
        try {
            const data = await apiRequest("/attendance/history");
            setHistory(data.attendance || []);
            const today = getISTDate();
            const todayRecord = data.attendance?.find(r => r.date === today);
            if (todayRecord) {
                setTodayStatus(todayRecord.signOutTime ? "completed" : "signed-in");
            } else {
                setTodayStatus("absent");
            }
        } catch (err) {
            console.error("History error:", err);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleSignIn = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const location = await getLocation();

            const data = await apiRequest("/attendance/signin", {
                method: "POST",
                body: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    deviceId: deviceId
                }
            });

            setSuccess(`✅ Signed in successfully! Distance: ${data.distance}m`);
            loadHistory();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const location = await getLocation();

            const data = await apiRequest("/attendance/signout", {
                method: "POST",
                body: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    deviceId: deviceId
                }
            });

            setSuccess(`✅ Signed out successfully! Working hours: ${data.workingHours}`);
            loadHistory();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="employee-attendance-page">
            <h1>Mark Attendance</h1>
            <p>Sign in and out with GPS verification</p>

            {/* TODAY'S ATTENDANCE CARD */}
            <div className="employee-attendance-card">
                <h2>Today's Attendance</h2>
                {todayStatus === "signed-in" && (
                    <div className="employee-attendance-status employee-status-present">
                        ✅ Currently signed in
                    </div>
                )}
                {todayStatus === "completed" && (
                    <div className="employee-attendance-status employee-status-present">
                        ✅ Attendance completed for today
                    </div>
                )}
                {todayStatus === "absent" && (
                    <div className="employee-attendance-status employee-status-absent">
                        ❌ Not signed in today
                    </div>
                )}

                {error && <div className="employee-form-error">{error}</div>}
                {success && <div className="employee-success-message">{success}</div>}

                {todayStatus === "absent" && (
                    <button
                        className="employee-btn-primary employee-btn-success"
                        onClick={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "📍 Sign In"}
                    </button>
                )}

                {todayStatus === "signed-in" && (
                    <button
                        className="employee-btn-primary employee-btn-danger"
                        onClick={handleSignOut}
                        disabled={loading}
                    >
                        {loading ? "Signing out..." : "🚪 Sign Out"}
                    </button>
                )}

                <div className="employee-gps-info">
                    <strong>📍 GPS Required</strong><br />
                    Your location will be verified within the factory geofence.
                </div>
            </div>

            {/* 📱 DEVICE ID CARD - Shows FingerprintJS ID */}
            <div className="employee-attendance-card" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                <h2>📱 Your Device ID</h2>
                <p style={{ fontSize: "14px", wordBreak: "break-all", fontFamily: "monospace" }}>
                    {deviceId || "Loading..."}
                </p>
                <small style={{ color: "#64748b" }}>
                    This ID is unique to your device. Each device gets a different ID.
                </small>
            </div>

            {/* RECENT HISTORY CARD */}
            <div className="employee-attendance-card">
                <h2>Recent History</h2>
                {history.length === 0 ? (
                    <p>No attendance records yet.</p>
                ) : (
                    history.slice(0, 5).map((record) => (
                        <div key={record.id} className="employee-leave-card" style={{ padding: "12px 15px", marginBottom: "8px" }}>
                            <strong>{record.date}</strong>
                            <span style={{ float: "right" }}>
                                {record.signInTime ? "✅" : "❌"}
                            </span>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>
                                {record.signInTime && `In: ${new Date(record.signInTime).toLocaleTimeString()}`}
                                {record.signOutTime && ` | Out: ${new Date(record.signOutTime).toLocaleTimeString()}`}
                                {record.workingHours && ` | 🕒 ${record.workingHours}`}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default EmployeeAttendance;
