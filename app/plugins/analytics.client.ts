// Ленивая загрузка Google Analytics после интерактивности
export default defineNuxtPlugin(() => {
  // Ждём, пока браузер завершит загрузку ресурсов
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      // Ещё небольшая задержка, чтобы не мешать LCP
      requestIdleCallback(() => {
        const config = useRuntimeConfig();

        // Google Analytics
        const gaId = config.public.googleAnalyticsId;
        if (gaId) {
          const script1 = document.createElement('script');
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          script1.async = true;
          document.head.appendChild(script1);

          const script2 = document.createElement('script');
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(script2);
        }
      });
    });
  }
});