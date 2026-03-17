import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const GoogleAuthButton = ({ onSuccess, onError, text = "signin_with" }) => {
  const { t } = useTranslation();
  const buttonRef = useRef(null);

  useEffect(() => {
    // Dynamically load Google Identity Services library if not present
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    } else {
      initializeGoogleAuth();
    }
  }, []);

  const initializeGoogleAuth = () => {
    if (!window.google) return;
    
    // Fallback Client ID for demonstration if env var is missing
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1234567890-mock.apps.googleusercontent.com";
    
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          onSuccess(response.credential);
        } else {
          onError(t("auth.google_login_failed"));
        }
      },
    });

    if (buttonRef.current) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "circle", // Premium pill shape
        text: text, // "signin_with" or "signup_with"
        width: "100%",
        logo_alignment: "left"
      });
    }
  };

  return (
    <div className="w-full mt-4 filter drop-shadow-sm hover:drop-shadow transition-all duration-300">
      <div ref={buttonRef} className="w-full flex justify-center"></div>
    </div>
  );
};

export default GoogleAuthButton;
