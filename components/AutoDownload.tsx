'use client';

import { useEffect } from 'react';

interface DownloadFile {
  url: string;
  filename: string;
}

export default function AutoDownload({ files }: { files: DownloadFile[] }) {
  useEffect(() => {
    files.forEach(({ url, filename }, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }, i * 800);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
