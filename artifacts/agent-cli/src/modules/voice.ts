/**
 * Voice Input Module
 * Speech to text using local Ollama
 */

export async function voiceInput(): Promise<{success: boolean; text?: string; error?: string}> {
  try {
    // Check for speech recognition support
    const hasSpeech = typeof window !== "undefined" && "SpeechRecognition" in window;

    if (!hasSpeech) {
      return {
        success: false,
        error: "Speech recognition not supported in this environment"
      };
    }

    return {
      success: true,
      text: "Voice input ready - speak now"
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function textToSpeech(text: string): Promise<{success: boolean; error?: string}> {
  try {
    if (typeof window !== "undefined") {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 1;
      speechSynthesis.speak(utterance);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function listenForCommand(): Promise<{success: boolean; command?: string; error?: string}> {
  return new Promise((resolve) => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        resolve({ success: false, error: "Speech recognition not supported" });
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript;
        resolve({ success: true, command });
      };

      recognition.onerror = (event: any) => {
        resolve({ success: false, error: event.error });
      };

      recognition.onend = () => {
        resolve({ success: true, command: "" });
      };

      // Start listening
      recognition.start();

      // Timeout after 10 seconds
      setTimeout(() => {
        recognition.stop();
        resolve({ success: true, command: "" });
      }, 10000);

    } catch (error: any) {
      resolve({ success: false, error: error.message });
    }
  });
}
