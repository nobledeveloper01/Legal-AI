import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Define toast types as a union type
type ToastType = "success" | "error" | undefined;

// Explicitly type the parameters and return type
export const showToast = (message: string, type?: ToastType): void => {
  switch (type) {
    case "success":
      toast.success(message);
      break;
    case "error":
      toast.error(message);
      break;
    default:
      toast(message);
  }
};