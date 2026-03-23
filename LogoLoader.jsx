import React, { useEffect, useState } from "react";

export default function LogoLoader() {
  const [fadeClass, setFadeClass] = useState("fade-in");

  useEffect(() => {
    // When component mounts, start with fade-in
    setFadeClass("fade-in");

    // When component is about to unmount trigger fade-out
    return () => setFadeClass("fade-out");
  }, []);

  return (
    <div className={`loader-overlay ${fadeClass}`}>
      <img src="/images/Logo.png" alt="Loading..." className="loader-logo" />
    </div>
  );
}
