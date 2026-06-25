import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignIn({ buttonText = 'Continue with Google' }) {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const googleLogin = useAuthStore((s) => s.googleLogin);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initializeGSI = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            await googleLogin(response.credential);
            toast.success('Signed in with Google!');
            navigate('/');
          } catch (error) {
            toast.error(error.response?.data?.message || 'Google sign-in failed');
          }
        },
        cancel_on_tap_outside: false,
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          shape: 'rectangular',
          theme: 'outline',
          text: 'continue_with',
          size: 'large',
          width: buttonRef.current.parentElement?.offsetWidth || 320,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initializeGSI();
    } else {
      const checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initializeGSI();
        }
      }, 200);

      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel();
      }
    };
  }, [googleLogin, navigate]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-500">or</span>
        </div>
      </div>
      <div ref={buttonRef} className="flex justify-center w-full min-h-[40px]" />
    </div>
  );
}
