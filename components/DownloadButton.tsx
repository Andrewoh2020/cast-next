'use client';

import { useState } from 'react';

interface DownloadFile {
  url: string;
  filename: string;
}

interface Props {
  files: DownloadFile[];
  label?: string;
  className?: string;
}

export default function DownloadButton({ files, label = 'Download', className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    files.forEach(({ url, filename }, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }, i * 800);
    });
    setTimeout(() => setLoading(false), files.length * 800 + 2000);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Downloading…
        </span>
      ) : (
        label
      )}
    </button>
  );
}
