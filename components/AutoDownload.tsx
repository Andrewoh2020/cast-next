'use client';

import { useEffect } from 'react';

export default function AutoDownload({ url, filename }: { url: string; filename: string }) {
  useEffect(() => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }, [url, filename]);

  return null;
}
