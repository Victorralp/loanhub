import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";

/**
 * Custom hook to handle admin navigation keyboard shortcut
 * Press Ctrl + Shift + A to navigate to admin login
 */
export const useAdminShortcut = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl + Shift + A
      if (
        (event.key === "a" || event.key === "A") &&
        event.ctrlKey &&
        event.shiftKey
      ) {
        event.preventDefault();
        
        // Show toast notification
        toast({
          title: "Admin Access",
          description: "Navigating to admin login...",
        });
        
        navigate("/admin/login");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, toast]);
};
