import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => { setInstalled(true); setInstallPrompt(null); setShowGuide(false); };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setShowGuide(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  };

  const isAppleMobile = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

  return <>
    <button onClick={() => void install()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/20" aria-label={installed ? 'Ver instrucciones para abrir Inglés en otros dispositivos' : 'Instalar Inglés en este dispositivo'}>
      <span aria-hidden="true">{installed ? '✓' : '📲'}</span>{installed ? 'Aplicación instalada' : 'Instalar en este dispositivo'}
    </button>
    {showGuide && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" onClick={() => setShowGuide(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" onClick={event => event.stopPropagation()} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Acceso desde tus dispositivos</p><h2 id="pwa-install-title" className="mt-1 text-xl font-bold">Instalar Inglés</h2></div><button onClick={() => setShowGuide(false)} aria-label="Cerrar" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">✕</button></div>
        <p className="mt-3 text-sm leading-6 text-slate-700">Puedes añadir esta aplicación a la pantalla de inicio o instalarla desde el navegador. La opción aparece cuando el sitio se publica con HTTPS.</p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-5 text-slate-700">
          {isAppleMobile
            ? <><li>Abre el sitio en Safari.</li><li>Toca <strong>Compartir</strong>.</li><li>Elige <strong>Añadir a pantalla de inicio</strong>.</li></>
            : /Android/i.test(navigator.userAgent)
              ? <><li>Abre el sitio en Chrome.</li><li>Toca el menú de tres puntos.</li><li>Elige <strong>Instalar aplicación</strong> o <strong>Añadir a pantalla de inicio</strong>.</li></>
              : <><li>Abre el sitio en Chrome o Microsoft Edge.</li><li>Usa el icono de instalación de la barra de direcciones o el menú del navegador.</li><li>Confirma <strong>Instalar</strong>.</li></>}
        </ol>
        <button onClick={() => setShowGuide(false)} className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Entendido</button>
      </section>
    </div>}
  </>;
}
