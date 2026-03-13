import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';

function QRScannerModal({ onClose, onScan }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    let qrScanner = null;

    const startScanner = async () => {
      try {
        if (!videoRef.current) return;

        console.log("🔍 Initialisiere QR-Scanner...");
        
        qrScanner = new QrScanner(
          videoRef.current,
          (result) => {
            // QR-Code erfolgreich gescannt
            console.log("✅ QR-Code gescannt:", result.data);
            
            // Verhindere mehrfache Scans
            if (hasScannedRef.current) {
              console.log("⚠️ Bereits gescannt, ignoriere...");
              return;
            }
            
            hasScannedRef.current = true;
            
            // Stoppe Scanner und führe Callback aus
            qrScanner.stop();
            console.log("📱 Rufe onScan auf mit:", result.data);
            onScan(result.data);
            onClose();
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment'
          }
        );

        scannerRef.current = qrScanner;
        
        // Starte Scanner
        await qrScanner.start();
        console.log("✅ Scanner gestartet");
        
      } catch (err) {
        console.error("❌ Fehler beim Starten des Scanners:", err);
        setError("Kamera konnte nicht gestartet werden. Bitte erlauben Sie den Kamera-Zugriff.");
      }
    };

    startScanner();

    // Cleanup
    return () => {
      if (scannerRef.current) {
        console.log("🧹 Cleanup: Stoppe Scanner");
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [onClose, onScan]);

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
    }
    onClose();
  };

  const handleManualInput = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
      scannerRef.current.destroy();
    }
    
    const qrCode = prompt('Bitte geben Sie Ihren QR-Code ein (mindestens 8 Zeichen):');
    if (qrCode) {
      onScan(qrCode);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">QR-Code scannen</h2>
        
        {error ? (
          <div className="mb-4">
            <p className="text-red-600 text-center mb-4">{error}</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-2 text-center">Halten Sie den QR-Code vor die Kamera</p>
            <p className="text-xs text-gray-500 mb-4 text-center">Der Code sollte mindestens 8 Zeichen haben</p>
          </>
        )}
        
        <div className="relative w-full rounded-lg overflow-hidden mb-4 bg-black" style={{ minHeight: '300px' }}>
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
            style={{ minHeight: '300px' }}
          ></video>
        </div>
        
        <div className="space-y-2">
          <button
            data-testid="manual-qr-input-btn"
            onClick={handleManualInput}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ⌨️ Code manuell eingeben
          </button>
          
          <button
            data-testid="close-qr-scanner-btn"
            onClick={handleClose}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRScannerModal;
