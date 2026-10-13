// Technical design §9.3: the save file is named the-last-hold-YYYY-MM-DD.json
// (local date) and downloaded as plain JSON.
export const saveFileName = (at: Date): string => {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `the-last-hold-${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}.json`;
};

export const downloadText = (fileName: string, text: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
