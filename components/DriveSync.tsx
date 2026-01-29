import React, { useState, useEffect } from 'react';
import { Cloud, Upload, Download, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { Habit } from '../types';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

interface DriveSyncProps {
  user: string;
  currentHabits: Habit[];
  onRestore: (habits: Habit[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const BACKUP_FILENAME = 'orbit_habits_backup.json';

const DriveSync: React.FC<DriveSyncProps> = ({ user, currentHabits, onRestore, isOpen, onClose }) => {
  const [clientId, setClientId] = useState('');
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  // Load Client ID from local storage if available
  useEffect(() => {
    const savedId = localStorage.getItem('orbit_drive_client_id');
    if (savedId) setClientId(savedId);
  }, []);

  // Initialize GAPI
  useEffect(() => {
    if (!isOpen) return;
    
    const initGapi = async () => {
      if (window.gapi && !window.gapi.client.drive) {
        await new Promise((resolve) => window.gapi.load('client', resolve));
        await window.gapi.client.init({
          discoveryDocs: [DISCOVERY_DOC],
        });
      }
    };
    initGapi().catch(console.error);
  }, [isOpen]);

  const handleConnect = () => {
    if (!clientId.trim()) {
      setStatus({ type: 'error', msg: 'Please enter a Client ID' });
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) {
            setStatus({ type: 'error', msg: 'Authorization Failed' });
            throw (response);
          }
          setIsConnected(true);
          localStorage.setItem('orbit_drive_client_id', clientId);
          setStatus({ type: 'success', msg: 'Connected to Drive!' });
        },
      });
      setTokenClient(client);
      client.requestAccessToken();
    } catch (err) {
      setStatus({ type: 'error', msg: 'Failed to initialize Google Auth' });
    }
  };

  const findBackupFile = async () => {
    try {
      const response = await window.gapi.client.drive.files.list({
        q: `name = '${BACKUP_FILENAME}' and trashed = false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });
      const files = response.result.files;
      return files && files.length > 0 ? files[0] : null;
    } catch (err) {
        console.error(err);
        return null;
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    setStatus({ type: 'info', msg: 'Backing up...' });

    try {
      const fileContent = JSON.stringify({
        user,
        timestamp: new Date().toISOString(),
        habits: currentHabits
      });

      const file = new Blob([fileContent], { type: 'application/json' });
      const metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json',
      };

      const existingFile = await findBackupFile();

      const accessToken = window.gapi.client.getToken().access_token;
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      let method = 'POST';

      if (existingFile) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`;
        method = 'PATCH';
      }

      await fetch(url, {
        method,
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form,
      });

      setStatus({ type: 'success', msg: 'Backup saved successfully!' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Backup failed. See console.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsLoading(true);
    setStatus({ type: 'info', msg: 'Looking for backup...' });

    try {
      const existingFile = await findBackupFile();
      
      if (!existingFile) {
        setStatus({ type: 'error', msg: 'No backup file found.' });
        setIsLoading(false);
        return;
      }

      const response = await window.gapi.client.drive.files.get({
        fileId: existingFile.id,
        alt: 'media',
      });

      const data = response.result;
      if (data && data.habits) {
        // Validate user match optional, but good practice
        // if (data.user !== user) warning...
        
        onRestore(data.habits);
        setStatus({ type: 'success', msg: 'Data restored successfully!' });
      } else {
        setStatus({ type: 'error', msg: 'Invalid backup format.' });
      }

    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', msg: 'Restore failed. See console.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-canvas-card border border-canvas-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-canvas-border flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Cloud size={20} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Google Drive Sync</h2>
               <p className="text-xs text-gray-500">Backup your habits to the cloud</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scroll">
          
          {!isConnected ? (
            <div className="space-y-4">
               <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg text-sm text-blue-200">
                  <p className="mb-2 font-semibold">Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-400">
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-blue-400 hover:underline">Google Cloud Console</a>.</li>
                    <li>Create a Project and enable "Google Drive API".</li>
                    <li>Create OAuth Credentials (Web Application).</li>
                    <li>Add this URL to <strong>Authorized JavaScript origins</strong>:</li>
                  </ol>
                  <div className="mt-2 p-2 bg-black/30 rounded border border-blue-900/50 font-mono text-xs select-all text-white">
                    {window.location.origin}
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Client ID</label>
                 <input 
                   type="text" 
                   value={clientId}
                   onChange={(e) => setClientId(e.target.value)}
                   placeholder="12345...apps.googleusercontent.com"
                   className="w-full bg-canvas border border-canvas-border rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                 />
               </div>

               <button 
                 onClick={handleConnect}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
               >
                 Connect & Authorize
               </button>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-center justify-between bg-green-900/20 border border-green-800 p-3 rounded-lg">
                    <span className="text-green-400 text-sm flex items-center gap-2">
                        <Check size={16} /> Connected
                    </span>
                    <button onClick={() => setIsConnected(false)} className="text-xs text-gray-500 hover:text-white underline">
                        Disconnect
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleBackup}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-canvas border border-canvas-border rounded-xl hover:bg-canvas-card hover:border-gray-500 transition-all group disabled:opacity-50"
                    >
                        <div className="w-12 h-12 rounded-full bg-habit-3/10 text-habit-3 flex items-center justify-center group-hover:bg-habit-3 group-hover:text-white transition-colors">
                            {isLoading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
                        </div>
                        <div className="text-center">
                            <span className="block font-medium text-white">Backup</span>
                            <span className="text-xs text-gray-500">Save to Drive</span>
                        </div>
                    </button>

                    <button 
                        onClick={handleRestore}
                        disabled={isLoading}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-canvas border border-canvas-border rounded-xl hover:bg-canvas-card hover:border-gray-500 transition-all group disabled:opacity-50"
                    >
                         <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                             {isLoading ? <Loader2 className="animate-spin" /> : <Download size={24} />}
                        </div>
                        <div className="text-center">
                            <span className="block font-medium text-white">Restore</span>
                            <span className="text-xs text-gray-500">Load from Drive</span>
                        </div>
                    </button>
                </div>
            </div>
          )}

          {/* Status Message */}
          {status && (
            <div className={`mt-6 p-3 rounded-lg flex items-center gap-2 text-sm ${
                status.type === 'error' ? 'bg-red-900/20 text-red-400' : 
                status.type === 'success' ? 'bg-green-900/20 text-green-400' : 
                'bg-blue-900/20 text-blue-400'
            }`}>
                <AlertCircle size={16} />
                {status.msg}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DriveSync;