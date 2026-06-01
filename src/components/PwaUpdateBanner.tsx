"use client";

import { useEffect, useState } from "react";

export function PwaUpdateBanner() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(installing);
            }
          });
        });

        await registration.update();

        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaiting(registration.waiting);
        }
      } catch {
        /* offline or blocked */
      }
    };

    void register();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="pwa-update-banner" role="status">
      <span>새 버전이 준비됐습니다.</span>
      <button
        type="button"
        className="primary-btn small"
        onClick={() => {
          waiting.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }}
      >
        새로고침
      </button>
    </div>
  );
}
