import { useState } from 'react';

export default function OtaModal({ onClose }: { onClose: () => void }) {
  const [version, setVersion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version || !file) {
      setMessage('Please provide version and select a firmware .bin file');
      return;
    }
    try {
      setSubmitting(true);
      setMessage(null);
      const fd = new FormData();
      fd.append('version', version);
      fd.append('firmware', file);
      const res = await fetch('/api/ota/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const data = await res.json();
      setMessage(`Uploaded v${data.manifest?.version}. SHA256: ${data.manifest?.sha256.slice(0,8)}…`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">OTA Firmware Upload</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-600 hover:text-gray-900">✕</button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Version</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 1.0.3"
              className="w-full px-3 py-2 mt-1 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Firmware (.bin)</label>
            <input
              type="file"
              accept=".bin,application/octet-stream"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 mt-1 border rounded-lg"
              required
            />
          </div>
          {message && <div className="p-2 text-sm text-gray-800 bg-gray-100 rounded">{message}</div>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Close</button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >{submitting ? 'Uploading…' : 'Upload'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
