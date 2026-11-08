
import { saveDebugLog } from "./debugLogger";

let initialized = false;

export const initializeConsoleLogger = () => {
  if (initialized) return;

  initialized = true;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  const formatArgs = (args: any[]) =>
    args.map((item) => {
      if (item instanceof Error) {
        return {
          name: item.name,
          message: item.message,
          stack: item.stack,
        };
      }

      if (typeof item === "string") return item;

      try {
        return JSON.parse(JSON.stringify(item));
      } catch {
        return String(item);
      }
    });

  console.log = (...args: any[]) => {
    originalLog(...args);
    void saveDebugLog("CONSOLE LOG", formatArgs(args), "LOG");
  };

  console.warn = (...args: any[]) => {
    originalWarn(...args);
    void saveDebugLog("CONSOLE WARN", formatArgs(args), "WARN");
  };

  console.error = (...args: any[]) => {
    originalError(...args);
    void saveDebugLog("CONSOLE ERROR", formatArgs(args), "ERROR");
  };
};
