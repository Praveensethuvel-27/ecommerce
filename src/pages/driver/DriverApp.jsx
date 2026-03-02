import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, LogOut, ScanLine, CheckCircle2, XCircle,
  Package, Phone, MapPin, RefreshCw, Camera, CameraOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// ─── QR Scanner using jsQR via canvas ────────────────────────────────────────
function QRScanner({ onScan, onError }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  const [active, setActive]   = useState(false);
  const [camErr, setCamErr]   = useState('');

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    setActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCamErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setActive(true);
      }
    } catch (err) {
      setCamErr('Camera access denied. Please allow camera permission.');
      onError?.(err.message);
    }
  }, [onError]);

  // Scan loop — reads frames and decodes QR
  useEffect(() => {
    if (!active) return;

    let jsQR;
    import('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js').then((m) => {
      jsQR = m.default || window.jsQR;
    }).catch(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      script.onload = () => { jsQR = window.jsQR; };
      document.head.appendChild(script);
    });

    const tick = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext('2d');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const qrLib = jsQR || window.jsQR;
      if (qrLib) {
        const code = qrLib(imageData.data, imageData.width, imageData.height);
        if (code?.data) {
          stopCamera();
          onScan(code.data);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [active, onScan, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: '1/1' }}>
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {active && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-52 h-52">
              <div className="absolute left-0 right-0 h-0.5 bg-green-400 opacity-80"
                style={{ animation: 'scanLine 2s ease-in-out infinite', top: '50%' }} />
              {[
                'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-8 h-8 border-green-400 ${cls}`} />
              ))}
            </div>
          </div>
        )}

        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
            <Camera className="w-16 h-16 text-gray-600" />
            <p className="text-gray-400 text-sm text-center px-4">
              {camErr || 'Tap "Start Camera" to scan QR'}
            </p>
          </div>
        )}
      </div>

      {!active ? (
        <button onClick={startCamera}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{ background: 'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
          <Camera className="w-4 h-4" /> Start Camera
        </button>
      ) : (
        <button onClick={stopCamera}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border"
          style={{ color: '#6B7280', borderColor: '#E5E7EB' }}>
          <CameraOff className="w-4 h-4" /> Stop Camera
        </button>
      )}

      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-100px); opacity: 0.4; }
          50%  { opacity: 1; }
          100% { transform: translateY(100px); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ result, onReset }) {
  const isSuccess = result.ok;
  return (
    <div className={`rounded-2xl p-6 text-center border-2 ${
      isSuccess ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    }`}
      style={{ animation: 'fadeScaleIn 0.3s ease' }}>

      <div className="flex justify-center mb-4">
        {isSuccess
          ? <CheckCircle2 className="w-16 h-16 text-green-500" />
          : <XCircle className="w-16 h-16 text-red-500" />}
      </div>

      <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
        {isSuccess ? 'Order Shipped! ✅' : 'Scan Failed ❌'}
      </h3>

      {isSuccess ? (
        <div className="space-y-2 mt-4 text-left">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Package className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="font-semibold">{result.orderId}</span>
          </div>
          {result.customerName && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span>{result.customerName}</span>
            </div>
          )}
          {result.customerPhone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
              <a href={`tel:${result.customerPhone}`} className="text-blue-600 underline">
                {result.customerPhone}
              </a>
            </div>
          )}
          {result.address && (
            <div className="flex items-start gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{result.address}</span>
            </div>
          )}
          <div className="mt-3 px-3 py-2 rounded-xl text-xs font-semibold text-green-700 bg-green-100">
            Status updated to SHIPPED — customer notified!
          </div>
        </div>
      ) : (
        <p className="text-red-600 text-sm mt-2">{result.error}</p>
      )}

      <button onClick={onReset}
        className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white text-sm"
        style={{ background: isSuccess ? 'linear-gradient(135deg,#2B5A27,#3D7A38)' : 'linear-gradient(135deg,#DC2626,#EF4444)' }}>
        <RefreshCw className="w-4 h-4" /> Scan Another Order
      </button>
    </div>
  );
}

// ─── Main Driver App ──────────────────────────────────────────────────────────
export default function DriverApp() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [scanning, setScanning]     = useState(false);
  const [result, setResult]         = useState(null);
  const [processing, setProcessing] = useState(false);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders]   = useState(false);

  // Check auth — must be driver
  useEffect(() => {
    if (!token || !user || user.role !== 'driver') {
      navigate('/login', { replace: true });
    }
  }, [token, user, navigate]);

  // Load assigned orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res  = await fetch(`${API_BASE}/api/driver/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setAssignedOrders(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoadingOrders(false); }
  };

  useEffect(() => { if (token) loadOrders(); }, [token]);

  const handleScan = useCallback(async (qrData) => {
    setScanning(false);
    setProcessing(true);
    setResult(null);

    const orderId = qrData.trim();

    try {
      const res  = await fetch(`${API_BASE}/api/driver/scan/${encodeURIComponent(orderId)}`, {
        method:  'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setResult({ ok: true, ...data });
      loadOrders();
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setProcessing(false);
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen" style={{ background: '#F5F7F5' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm"
        style={{ background: 'linear-gradient(135deg,#2B5A27,#3D7A38)' }}>
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">{user?.name || 'Driver'}</p>
              <p className="text-green-200 text-xs mt-0.5">{user?.phone || ''}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {processing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-white rounded-2xl px-10 py-8 flex flex-col items-center gap-4">
              <div className="w-14 h-14 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-gray-700">Updating order…</p>
            </div>
          </div>
        )}

        {result && !scanning && (
          <ResultCard result={result} onReset={() => { setResult(null); setScanning(true); }} />
        )}

        {!result && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <ScanLine className="w-5 h-5" style={{ color: '#2B5A27' }} />
              <h2 className="font-bold text-gray-800">Scan Order QR Code</h2>
            </div>
            <QRScanner
              onScan={handleScan}
              onError={(msg) => setResult({ ok: false, error: msg })}
            />
            <p className="text-xs text-center text-gray-400 mt-3">
              Point your camera at the QR code on the shipping label
            </p>
          </div>
        )}

        {/* Assigned orders list */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" style={{ color: '#2B5A27' }} />
              <h2 className="font-bold text-gray-800">
                My Orders
                {assignedOrders.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                    style={{ background: '#2B5A27' }}>
                    {assignedOrders.length}
                  </span>
                )}
              </h2>
            </div>
            <button onClick={loadOrders}
              className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : assignedOrders.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No orders assigned yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedOrders.map((order) => (
                <div key={order.id}
                  className="flex items-start gap-3 p-3 rounded-xl border"
                  style={{ borderColor: '#E5E7EB', background: '#FAFAF8' }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#E8F0E8' }}>
                    <Package className="w-4 h-4" style={{ color: '#2B5A27' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800">{order.orderId}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{order.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{order.address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        order.status === 'shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500">{order.items} item{order.items !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm" style={{ color: '#2B5A27' }}>
                      ₹{order.total}
                    </p>
                    {order.customerPhone && (
                      <a href={`tel:${order.customerPhone}`}
                        className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity:0; transform:scale(0.95); }
          to   { opacity:1; transform:scale(1); }
        }
      `}</style>
    </div>
  );
}